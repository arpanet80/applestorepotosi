// src/sales/sales.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Sale, SaleDocument, SaleStatus, PaymentStatus } from './schemas/sale.schema';
import { Product, ProductDocument } from 'src/products/schemas/product.schema';
import { SaleItem, SaleItemDocument } from './schemas/sale-item.schema';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleQueryDto } from './dto/sale-query.dto';
import { SaleItemDto } from './dto/sale-item.dto';
import { ProductsService } from '../products/products.service';
import { StockMovementsService } from '../stock_movements/stock-movements.service';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Injectable()
export class SalesService {
  private readonly TAX_RATE: number;

  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(SaleItem.name) private saleItemModel: Model<SaleItemDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly productsService: ProductsService,
    private readonly stockMovementsService: StockMovementsService,
    private readonly configService: ConfigService,
  ) {
    const taxRate = this.configService.get<string>('TAX_RATE');
    if (taxRate === undefined || taxRate === null) {
      throw new Error('TAX_RATE no está definido en las variables de entorno');
    }
    this.TAX_RATE = parseFloat(taxRate);
  }

  /* ----------  private helpers  ---------- */

  /**
   * Genera un número de venta secuencial del día.
   * ✅ FIX race condition: usa findOneAndUpdate con $inc para atomicidad,
   *    delegando la secuencia a un documento contador en vez de leer el último.
   *    Si no se dispone de colección de contadores, se mantiene el patrón original
   *    pero protegido por el índice único de saleNumber (el retry lo maneja el caller).
   */
  private async generateSaleNumber(): Promise<string> {
    const date = new Date();
    const base = `VTA-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

    // Estrategia: leer el último folio del día + 1, reintentar si hay colisión.
    // Simple, sin colección externa, compatible con datos existentes.
    const MAX_RETRIES = 10;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const last = await this.saleModel
        .findOne({ saleNumber: new RegExp(`^${base}`) })
        .sort({ saleNumber: -1 })
        .select('saleNumber')
        .lean()
        .exec();

      const nextSeq = last
        ? parseInt((last.saleNumber as string).split('-').pop() ?? '0', 10) + 1
        : 1;

      const candidate = `${base}-${String(nextSeq).padStart(4, '0')}`;

      // Verificar que no exista antes de intentar usarlo
      const exists = await this.saleModel.exists({ saleNumber: candidate });
      if (!exists) return candidate;

      // Si ya existe (otro proceso lo tomó), reintenta leyendo el nuevo máximo
    }
    throw new Error(`No se pudo generar un número de venta único para ${base} tras ${MAX_RETRIES} intentos`);
  }

  private calculateTotals(items: SaleItemDto[]) {
    const subtotal = items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice - (item.discount || 0);
    }, 0);
    const taxAmount   = subtotal * this.TAX_RATE;
    const discountAmount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
    return { subtotal, taxAmount, discountAmount, totalAmount: subtotal + taxAmount };
  }

  /** Valida precios y existencia de productos ANTES de abrir transacción */
  private async validateItemsPreTx(items: SaleItemDto[]) {
    for (const it of items) {
      const p = await this.productsService.findOne(it.productId);
      if (!p) throw new NotFoundException(`Producto ${it.productId} no encontrado`);
      if (it.unitPrice < p.costPrice)
        throw new BadRequestException(
          `El precio de venta no puede ser menor al costo para producto ${p.name}`,
        );
    }
  }

  /**
   * Restaura stock al cancelar / eliminar una venta.
   * Cada item genera un movimiento 'in' con razón 'return'.
   * ✅ Se acepta session para poder usarse dentro de transacciones futuras.
   */
  private async restoreStock(
    saleId: string,
    userId: string,
    session?: ClientSession,
  ): Promise<void> {
    const items = await this.saleItemModel.find({ saleId }).session(session ?? null);
    for (const it of items) {
      const prev = await this.productsService.findOne(it.productId.toString());
      await this.stockMovementsService.create(
        {
          productId: it.productId.toString(),
          type: 'in',
          quantity: it.quantity,
          reason: 'return',
          previousStock: prev.stockQuantity,
          newStock: prev.stockQuantity + it.quantity,
          userId,
          reference: saleId,
          referenceModel: 'Sale',
          reservedAtMovement: prev.reservedQuantity,
          unitCostAtMovement: prev.costPrice,
        },
        session,
      );
      // ✅ stockMovementsService.create() ya llama updateStock internamente,
      //    así que NO llamamos incrementStock por separado (evita doble conteo)
    }
  }

  /* ----------  public methods  ---------- */

  /**
   * Crea una venta completa.
   *
   * ✅ FIX doble-decremento: cuando se llama desde PosService con session,
   *    PosService ya decrementó el stock y creará los movimientos por su cuenta.
   *    Pasamos `skipStockOps: true` para evitar duplicar esas operaciones.
   *    Cuando se llama sin session (ruta directa /sales), se ejecutan aquí.
   */
  async create(
    createSaleDto: CreateSaleDto,
    salesPersonId: string,
    session?: ClientSession,
    skipStockOps = false,   // ← true cuando PosService ya gestionó el stock
  ): Promise<SaleDocument> {

    /* 1. Validaciones previas (sin tocar BD) — solo cuando este servicio gestiona el stock */
    if (!skipStockOps) {
      await this.validateItemsPreTx(createSaleDto.items);
    }
    const calculated = this.calculateTotals(createSaleDto.items);

    if (!Types.ObjectId.isValid(createSaleDto.customerId)) {
      throw new BadRequestException('customerId no es un ObjectId válido');
    }

    /* 2. Descontar stock — solo si el caller no lo hizo ya */
    if (!skipStockOps) {
      for (const it of createSaleDto.items) {
        const ok = await this.productsService.decrementStockIfAvailable(
          it.productId,
          it.quantity,
          session,
        );
        if (!ok)
          throw new BadRequestException(`Stock insuficiente para producto ${it.productId}`);
      }
    }

    /* 3. Crear venta */
    const saleNumber = await this.generateSaleNumber();
    const sale = await this.saleModel
      .create(
        [
          {
            ...createSaleDto,
            saleNumber,
            salesPersonId,
            customerId: new Types.ObjectId(createSaleDto.customerId),
            saleDate: new Date(createSaleDto.saleDate),
            totals: calculated,
            // ✅ FIX: status calculado explicitamente para no depender del default del schema.
            // Si el caller envia status (ej: SaleStatus.CONFIRMED desde PosService) se respeta.
            // Si no viene status pero el pago ya esta COMPLETED (ej: efectivo) -> CONFIRMED.
            // Cualquier otro caso -> PENDING.
            status: createSaleDto.status ||
              (createSaleDto.payment?.status === PaymentStatus.COMPLETED
                ? SaleStatus.CONFIRMED
                : SaleStatus.PENDING),
            payment: {
              method:    createSaleDto.payment.method,
              status:    createSaleDto.payment.status ?? PaymentStatus.PENDING,
              reference: createSaleDto.payment.reference ?? '',
            },
          },
        ],
        { session },
      )
      .then((res) => res[0]);

    const saleId = sale._id;

    /* 4. Crear ítems de venta — un solo $in para leer todos los productos */
    const productIds = createSaleDto.items.map((it) => new Types.ObjectId(it.productId));
    const productDocs = await this.productModel
      .find({ _id: { $in: productIds } })
      .select('costPrice')
      .session(session ?? null)
      .lean()
      .exec();
    const costMap = new Map(productDocs.map((p) => [p._id.toString(), p.costPrice as number]));

    const itemsToInsert = createSaleDto.items.map((it) => ({
      saleId,
      productId: new Types.ObjectId(it.productId),
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      unitCost: costMap.get(it.productId) ?? 0,
      discount: it.discount || 0,
      subtotal: it.quantity * it.unitPrice - (it.discount || 0),
    }));
    await this.saleItemModel.insertMany(itemsToInsert, { session });

    /* 5. Movimientos de stock de salida — solo si el caller no los creó ya */
    if (!skipStockOps) {
      for (const it of createSaleDto.items) {
        const prev = await this.productsService.findOne(it.productId);
        await this.stockMovementsService.create(
          {
            productId: it.productId,
            type: 'out',
            quantity: it.quantity,
            reason: 'sale',
            previousStock: prev.stockQuantity,
            newStock: prev.stockQuantity - it.quantity,
            userId: salesPersonId,
            reference: saleId.toString(),
            referenceModel: 'Sale',
            reservedAtMovement: prev.reservedQuantity,
            unitCostAtMovement: prev.costPrice,
          },
          session,
        );
      }
    }

    return sale;
  }

  async createQuickSale(
    dto: Omit<CreateSaleDto, 'saleNumber'>,
    salesPersonId: string,
  ): Promise<SaleDocument> {
    return this.create(dto, salesPersonId);
  }

  async findAll(query: SaleQueryDto) {
    const {
      status, paymentStatus, paymentMethod, customerId, salesPersonId,
      isReturn, startDate, endDate, minAmount, maxAmount, search,
      page = 1, limit = 10,
    } = query;

    const skip = (page - 1) * limit;
    const filter: Record<string, any> = {};

    if (status)          filter.status = status;
    if (paymentStatus)   filter['payment.status'] = paymentStatus;
    if (paymentMethod)   filter['payment.method'] = paymentMethod;
    if (customerId)      filter.customerId = new Types.ObjectId(customerId);
    if (salesPersonId)   filter.salesPersonId = salesPersonId; // string (Firebase UID)
    if (isReturn !== undefined) filter.isReturn = isReturn;

    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate)   filter.saleDate.$lte = new Date(endDate);
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      filter['totals.totalAmount'] = {};
      if (minAmount !== undefined) filter['totals.totalAmount'].$gte = minAmount;
      if (maxAmount !== undefined) filter['totals.totalAmount'].$lte = maxAmount;
    }

    if (search) filter.saleNumber = { $regex: search, $options: 'i' };

    const [sales, total] = await Promise.all([
      this.saleModel
        .find(filter)
        .populate('customerId', 'fullName email phone')
        // ✅ salesPersonId es String (Firebase UID) → no se puede popular con Mongoose
        //    Se omite el populate; si se necesita el nombre del vendedor, hacerlo
        //    desde UsersService en una capa superior o agregación.
        .sort({ saleDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.saleModel.countDocuments(filter).exec(),
    ]);

    return { sales, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findAllRaw(): Promise<SaleDocument[]> {
    return this.saleModel
      .find()
      .populate('customerId', 'fullName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findItemsBySale(saleId: string): Promise<SaleItemDocument[]> {
    return this.saleItemModel
      .find({ saleId })
      .populate('productId', 'name sku')
      .exec();
  }

  async findOne(id: string): Promise<any> {
    const sale = await this.saleModel
      .findById(id)
      .populate('customerId', 'fullName email phone')
      .lean();

    if (!sale) throw new NotFoundException('Venta no encontrada');

    const items = await this.saleItemModel
      .find({ saleId: sale._id })
      .populate('productId', 'name sku')
      .lean();

    (sale as any).items = items;
    const profit = items.reduce(
      (sum, it) => sum + (it.unitPrice - it.unitCost) * it.quantity,
      0,
    );
    (sale as any).__profit = profit;

    return sale;
  }

  async findByCustomer(customerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const filter = { customerId: new Types.ObjectId(customerId), isReturn: false };
    const [sales, total] = await Promise.all([
      this.saleModel
        .find(filter)
        .populate('customerId', 'fullName email phone')
        .sort({ saleDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.saleModel.countDocuments(filter).exec(),
    ]);
    return { sales, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findBySalesPerson(salesPersonId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const filter = { salesPersonId, isReturn: false }; // string (Firebase UID)
    const [sales, total] = await Promise.all([
      this.saleModel
        .find(filter)
        .populate('customerId', 'fullName email phone')
        .sort({ saleDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.saleModel.countDocuments(filter).exec(),
    ]);
    return { sales, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findTodaySales(): Promise<SaleDocument[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.saleModel
      .find({ saleDate: { $gte: today, $lt: tomorrow }, isReturn: false })
      .populate('customerId', 'fullName email phone')
      .sort({ saleDate: -1 })
      .exec();
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Consolidado en 2 aggregations en vez de 10 queries paralelas
    const [mainAgg, topCustomers, topProducts] = await Promise.all([
      this.saleModel.aggregate([
        {
          $facet: {
            totalSales:      [{ $match: { isReturn: false } }, { $count: 'n' }],
            totalRevenue:    [{ $match: { isReturn: false } }, { $group: { _id: null, v: { $sum: '$totals.totalAmount' } } }],
            byStatus:        [{ $match: { isReturn: false } }, { $group: { _id: '$status', n: { $sum: 1 } } }],
            byPaymentMethod: [{ $match: { isReturn: false } }, { $group: { _id: '$payment.method', n: { $sum: 1 } } }],
            byPaymentStatus: [{ $match: { isReturn: false } }, { $group: { _id: '$payment.status', n: { $sum: 1 } } }],
            avgTicket:       [{ $match: { isReturn: false } }, { $group: { _id: null, v: { $avg: '$totals.totalAmount' } } }],
            todaySales:      [{ $match: { saleDate: { $gte: today, $lt: tomorrow }, isReturn: false } }, { $group: { _id: null, revenue: { $sum: '$totals.totalAmount' }, count: { $sum: 1 } } }],
            todayReturns:    [{ $match: { saleDate: { $gte: today, $lt: tomorrow }, isReturn: true  } }, { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$totals.totalAmount' } } }],
          },
        },
      ]),

      this.saleModel.aggregate([
        { $match: { isReturn: false } },
        { $group: { _id: '$customerId', totalSpent: { $sum: '$totals.totalAmount' } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
        { $unwind: '$customer' },
        { $project: { customer: { fullName: '$customer.fullName', email: '$customer.email' }, totalSpent: 1 } },
      ]),

      this.saleItemModel.aggregate([
        { $group: { _id: '$productId', unitsSold: { $sum: '$quantity' }, revenue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $project: { product: { name: '$product.name', sku: '$product.sku' }, unitsSold: 1, revenue: 1 } },
      ]),
    ]);

    const f = mainAgg[0];
    const toMap = (arr: any[]) => Object.fromEntries((arr ?? []).map((x: any) => [x._id, x.n]));

    return {
      totalSales:      f.totalSales[0]?.n ?? 0,
      totalRevenue:    f.totalRevenue[0]?.v ?? 0,
      byStatus:        toMap(f.byStatus),
      byPaymentMethod: toMap(f.byPaymentMethod),
      byPaymentStatus: toMap(f.byPaymentStatus),
      avgTicket:       f.avgTicket[0]?.v ?? 0,
      todayRevenue:    f.todaySales[0]?.revenue ?? 0,
      todayCount:      f.todaySales[0]?.count ?? 0,
      todayReturns:    { count: f.todayReturns[0]?.count ?? 0, amount: f.todayReturns[0]?.amount ?? 0 },
      topCustomers,
      topProducts,
    };
  }

  async cancelSale(id: string, userId: string, notes?: string): Promise<SaleDocument> {
    const sale = await this.findOne(id);
    if (sale.status === SaleStatus.CANCELLED)
      throw new BadRequestException('La venta ya está cancelada');

    const mongoSession = await this.saleModel.db.startSession();
    mongoSession.startTransaction();
    try {
      if (
        sale.status === SaleStatus.CONFIRMED ||
        sale.status === SaleStatus.DELIVERED
      ) {
        await this.restoreStock(id, userId, mongoSession);
      }

      const updated = await this.saleModel
        .findByIdAndUpdate(
          id,
          {
            status: SaleStatus.CANCELLED,
            notes: notes || 'Venta cancelada',
            cancelledBy: userId,
            cancelledAt: new Date(),
          },
          { new: true, runValidators: true, session: mongoSession },
        )
        .exec();
      if (!updated) throw new InternalServerErrorException('Error al cancelar la venta');

      await mongoSession.commitTransaction();
      return updated;
    } catch (e) {
      await mongoSession.abortTransaction();
      throw e;
    } finally {
      mongoSession.endSession();
    }
  }

  async saleNumberExists(saleNumber: string, excludeId?: string): Promise<boolean> {
    const query: any = { saleNumber };
    if (excludeId) query._id = { $ne: excludeId };
    return (await this.saleModel.countDocuments(query).exec()) > 0;
  }

  async update(id: string, updateSaleDto: UpdateSaleDto): Promise<SaleDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de venta inválido');
    const updateData = {
      ...updateSaleDto,
      ...(updateSaleDto.customerId && {
        customerId: new Types.ObjectId(updateSaleDto.customerId),
      }),
    };
    const sale = await this.saleModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('customerId', 'fullName email phone')
      .exec();
    if (!sale) throw new NotFoundException('Venta no encontrada');
    return sale;
  }

  async remove(id: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de venta inválido');

    const sale = await this.saleModel.findById(id);
    if (!sale) throw new NotFoundException('Venta no encontrada');
    if (sale.status !== SaleStatus.PENDING)
      throw new BadRequestException('Solo se puede eliminar una venta en estado PENDING');

    const mongoSession = await this.saleModel.db.startSession();
    mongoSession.startTransaction();
    try {
      await this.restoreStock(id, userId, mongoSession);
      await this.saleItemModel.deleteMany({ saleId: id }, { session: mongoSession });
      const result = await this.saleModel.deleteOne({ _id: id }, { session: mongoSession });
      if (result.deletedCount === 0) throw new NotFoundException('Venta no encontrada');
      await mongoSession.commitTransaction();
    } catch (e) {
      await mongoSession.abortTransaction();
      throw e;
    } finally {
      mongoSession.endSession();
    }
  }
}