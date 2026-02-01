import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Sale, SaleDocument, SaleStatus } from './schemas/sale.schema';
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
    private readonly productsService: ProductsService,
    private readonly stockMovementsService: StockMovementsService,
    private readonly configService: ConfigService,
  ) {
    this.TAX_RATE = parseFloat(
      this.configService.get<string>('TAX_RATE') ?? '0.16',
    );
  }

  /* ----------  private helpers  ---------- */

  private async generateSaleNumber(): Promise<string> {
    const date = new Date();
    const base = `VTA-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const last = await this.saleModel
      .findOne({ saleNumber: new RegExp(`^${base}`) })
      .sort({ saleNumber: -1 });
    const seq = last ? parseInt(last.saleNumber.split('-').pop() || '0') + 1 : 1;
    return `${base}-${String(seq).padStart(4, '0')}`;
  }

  private calculateTotals(items: SaleItemDto[]) {
    const subtotal = items.reduce((sum, item) => {
      const itemSub = item.quantity * item.unitPrice - (item.discount || 0);
      return sum + itemSub;
    }, 0);
    const taxAmount = subtotal * this.TAX_RATE;
    const discountAmount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
    return { subtotal, taxAmount, discountAmount, totalAmount: subtotal + taxAmount };
  }

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

  /* 🔒  CONCURRENCIA: descontar stock con operación atómica  */
  private async decrementStockAtomic(items: SaleItemDto[]): Promise<void> {
    for (const it of items) {
      const updated = await this.productsService.decrementStockIfAvailable(
        it.productId,
        it.quantity,
      );
      if (!updated)
        throw new BadRequestException(`Stock insuficiente para producto ${it.productId}`);
    }
  }

  /* 🔄  RESTAURAR STOCK (para cancelación / eliminación)  */
  private async restoreStock(saleId: string, userId: string): Promise<void> {
    const items = await this.saleItemModel.find({ saleId });
    for (const it of items) {
      const prev = await this.productsService.findOne(it.productId.toString());
      await this.stockMovementsService.create({
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
      });
      await this.productsService.incrementStock(it.productId.toString(), it.quantity);
    }
  }

  /* ----------  public methods  ---------- */

  async create(createSaleDto: CreateSaleDto,salesPersonId: string,session?: ClientSession,): Promise<SaleDocument> {
    /* 1.  Validaciones previas (sin tocar BD) */
    await this.validateItemsPreTx(createSaleDto.items);
    const calculated = this.calculateTotals(createSaleDto.items);

    if (!Types.ObjectId.isValid(createSaleDto.customerId)) {
      throw new BadRequestException('customerId no es un ObjectId válido');
    }

    /* 2.  Descontar stock (con rollback si no hay) */
    await Promise.all(
      createSaleDto.items.map(it =>
        this.productsService.decrementStockIfAvailable(
          it.productId,
          it.quantity,
          session,
        ),
      ),
    );

    /* 3.  Crear venta */
    const saleNumber = await this.generateSaleNumber();
    const sale = await this.saleModel.create(
      [
        {
          ...createSaleDto,
          saleNumber,
          salesPersonId,
          customerId: new Types.ObjectId(createSaleDto.customerId),
          saleDate: new Date(createSaleDto.saleDate),
          totals: calculated,
        },
      ],
      { session },
    ).then(res => res[0]);

    const saleId = sale._id;

    /* 4.  Crear ítems */
    const itemsToInsert = await Promise.all(
      createSaleDto.items.map(async it => {
        const product = await this.productsService.findOne(it.productId);
        return {
          saleId,
          productId: new Types.ObjectId(it.productId),
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          unitCost: product.costPrice,
          discount: it.discount || 0,
          subtotal: it.quantity * it.unitPrice - (it.discount || 0),
        };
      }),
    );
    await this.saleItemModel.insertMany(itemsToInsert, { session });

    /* 5.  Movimientos de salida */
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

    /* 6.  Devolver venta poblada */
    return sale;
  }

  async createQuickSale(dto: Omit<CreateSaleDto, 'saleNumber'>, salesPersonId: string): Promise<SaleDocument> {
    return this.create(dto, salesPersonId);
  }

  /*  resto de métodos (sin cambios esenciales)  */
  async findAll(query: SaleQueryDto) {
    const { status, paymentStatus, paymentMethod, customerId, salesPersonId, isReturn, startDate, endDate, minAmount, maxAmount, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (status) filter.status = status;
    if (paymentStatus) filter['payment.status'] = paymentStatus;
    if (paymentMethod) filter['payment.method'] = paymentMethod;
    if (customerId) filter.customerId = new Types.ObjectId(customerId);
    if (salesPersonId) filter.salesPersonId = salesPersonId;  
    if (isReturn !== undefined) filter.isReturn = isReturn;
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate);
    }
    if (minAmount !== undefined || maxAmount !== undefined) {
      filter['totals.totalAmount'] = {};
      if (minAmount !== undefined) filter['totals.totalAmount'].$gte = minAmount;
      if (maxAmount !== undefined) filter['totals.totalAmount'].$lte = maxAmount;
    }
    if (search) filter.saleNumber = { $regex: search, $options: 'i' };

    const [sales, total] = await Promise.all([
      this.saleModel.find(filter)
        .populate('customerId', 'fullName email phone')
        .populate('salesPersonId', 'displayName email')
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
      .populate('salesPersonId', 'displayName email')
      .lean();

    if (!sale) throw new NotFoundException('Venta no encontrada');

    const items = await this.saleItemModel
      .find({ saleId: sale._id })
      .populate('productId', 'name sku')
      .lean();

    (sale as any).items = items;
    const profit = items.reduce((sum, it) => sum + (it.unitPrice - it.unitCost) * it.quantity, 0);
    (sale as any).__profit = profit;

    return sale;
  }

  async findByCustomer(customerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const filter = { customerId: new Types.ObjectId(customerId), isReturn: false };
    const [sales, total] = await Promise.all([
      this.saleModel.find(filter)
        .populate('customerId', 'fullName email phone')
        .populate('salesPersonId', 'displayName email')
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
    const filter = { salesPersonId, isReturn: false };               // << string
    const [sales, total] = await Promise.all([
      this.saleModel.find(filter)
        .populate('customerId', 'fullName email phone')
        .populate('salesPersonId', 'displayName email')
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
      .populate('salesPersonId', 'displayName email')
      .sort({ saleDate: -1 })
      .exec();
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalSales,
      totalRevenue,
      byStatus,
      byPaymentMethod,
      byPaymentStatus,
      todayStats,
      todayReturns,
      avgTicket,
      topCustomers,
      topProducts,
    ] = await Promise.all([
      this.saleModel.countDocuments({ isReturn: false }),
      this.saleModel.aggregate([
        { $match: { isReturn: false } },
        { $group: { _id: null, total: { $sum: '$totals.totalAmount' } } },
      ]).then((r) => r[0]?.total || 0),

      this.saleModel.aggregate([
        { $match: { isReturn: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]).then((arr) => Object.fromEntries(arr.map((x) => [x._id, x.count]))),

      this.saleModel.aggregate([
        { $match: { isReturn: false } },
        { $group: { _id: '$payment.method', count: { $sum: 1 } } },
      ]).then((arr) => Object.fromEntries(arr.map((x) => [x._id, x.count]))),

      this.saleModel.aggregate([
        { $match: { isReturn: false } },
        { $group: { _id: '$payment.status', count: { $sum: 1 } } },
      ]).then((arr) => Object.fromEntries(arr.map((x) => [x._id, x.count]))),

      this.saleModel.aggregate([
        { $match: { saleDate: { $gte: today, $lt: tomorrow }, isReturn: false } },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totals.totalAmount' },
            count: { $sum: 1 },
          },
        },
      ]).then((r) => r[0] || { revenue: 0, count: 0 }),

      this.saleModel.aggregate([
        { $match: { saleDate: { $gte: today, $lt: tomorrow }, isReturn: true } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            amount: { $sum: '$totals.totalAmount' },
          },
        },
      ]).then((r) => r[0] || { count: 0, amount: 0 }),

      this.saleModel.aggregate([
        { $match: { isReturn: false } },
        { $group: { _id: null, avg: { $avg: '$totals.totalAmount' } } },
      ]).then((r) => r[0]?.avg || 0),

      this.saleModel.aggregate([
        { $match: { isReturn: false } },
        {
          $group: {
            _id: '$customerId',
            totalSpent: { $sum: '$totals.totalAmount' },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'customers',
            localField: '_id',
            foreignField: '_id',
            as: 'customer',
          },
        },
        { $unwind: '$customer' },
        {
          $project: {
            customer: { fullName: '$customer.fullName', email: '$customer.email' },
            totalSpent: 1,
          },
        },
      ]),

      this.saleItemModel.aggregate([
        { $match: {} },
        {
          $group: {
            _id: '$productId',
            unitsSold: { $sum: '$quantity' },
            revenue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $project: {
            product: { name: '$product.name', sku: '$product.sku' },
            unitsSold: 1,
            revenue: 1,
          },
        },
      ]),
    ]);

    return {
      totalSales,
      totalRevenue,
      byStatus,
      byPaymentMethod,
      byPaymentStatus,
      todayRevenue: todayStats.revenue,
      todayCount: todayStats.count,
      todayReturns: { count: todayReturns.count, amount: todayReturns.amount },
      avgTicket,
      topCustomers,
      topProducts,
    };
  }

  async cancelSale(id: string, userId: string, notes?: string): Promise<SaleDocument> {
    const sale = await this.findOne(id);
    if (sale.status === SaleStatus.CONFIRMED) {
      // ya tenemos los ítems en (sale as any).items
      await this.restoreStock(id, userId);
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
        { new: true, runValidators: true },
      )
      .exec();
    if (!updated) throw new InternalServerErrorException('Error al cancelar la venta');
    return updated;
  }

  async saleNumberExists(saleNumber: string, excludeId?: string): Promise<boolean> {
    const query: any = { saleNumber };
    if (excludeId) query._id = { $ne: excludeId };
    const count = await this.saleModel.countDocuments(query).exec();
    return count > 0;
  }

  async update(id: string, updateSaleDto: UpdateSaleDto): Promise<SaleDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de venta inválido');
    const updateData = {
      ...updateSaleDto,
      ...(updateSaleDto.customerId && { customerId: new Types.ObjectId(updateSaleDto.customerId) }),
    };
    const sale = await this.saleModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('customerId', 'fullName email phone')
      .populate('salesPersonId', 'displayName email')
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

    // restaurar stock antes de borrar
    await this.restoreStock(id, userId);

    await this.saleItemModel.deleteMany({ saleId: id });
    const result = await this.saleModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException('Venta no encontrada');
  }
}