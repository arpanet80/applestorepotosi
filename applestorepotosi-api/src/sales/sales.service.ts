import {Injectable,NotFoundException,BadRequestException,InternalServerErrorException, ConflictException,} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sale, SaleDocument, SaleStatus } from './schemas/sale.schema';
import { SaleItem, SaleItemDocument } from './schemas/sale-item.schema';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleQueryDto } from './dto/sale-query.dto';
import { SaleItemDto } from './dto/sale-item.dto';
import { ProductsService } from 'src/products/products.service';
import { StockMovementsService } from 'src/stock_movements/stock-movements.service';
import { UpdateSaleDto } from './dto/update-sale.dto';

// Placeholder: cargar desde configuración
const TAX_RATE = 0.16;

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(SaleItem.name) private saleItemModel: Model<SaleItemDocument>,
    private readonly productsService: ProductsService,
    private readonly stockMovementsService: StockMovementsService,
  ) {}

  private async generateSaleNumber(): Promise<string> {
    const date = new Date();
    const base = `VTA-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const last = await this.saleModel.findOne({ saleNumber: new RegExp(`^${base}`) }).sort({ saleNumber: -1 });
    const seq = last ? parseInt(last.saleNumber.split('-').pop() || '0') + 1 : 1;
    return `${base}-${String(seq).padStart(4, '0')}`;
  }

  private calculateTotals(items: SaleItemDto[]) {
    const subtotal = items.reduce((sum, item) => {
      const itemSub = item.quantity * item.unitPrice - (item.discount || 0);
      return sum + itemSub;
    }, 0);
    const taxAmount = subtotal * TAX_RATE;
    const discountAmount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
    return { subtotal, taxAmount, discountAmount, totalAmount: subtotal + taxAmount };
  }

  private async validateItems(items: SaleItemDto[]) {
    for (const item of items) {
      const product = await this.productsService.findOne(item.productId);
      if (!product) throw new NotFoundException(`Producto ${item.productId} no encontrado`);
      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(`Stock insuficiente para producto ${product.name}`);
      }
      if (item.unitPrice < item.unitCost) {
        throw new BadRequestException(`El precio de venta no puede ser menor al costo para producto ${product.name}`);
      }
    }
  }

  async create(createSaleDto: CreateSaleDto, salesPersonId: string): Promise<SaleDocument> {
    const session = await this.saleModel.db.startSession();
    session.startTransaction();

    try {
      /* 0. Recalcular totales y validar contra el payload */
      const calculated = this.calculateTotals(createSaleDto.items);
      const { subtotal, taxAmount, discountAmount, totalAmount } = calculated;
      const payloadTotals = createSaleDto.totals;

      if (
        Math.abs(payloadTotals.subtotal - subtotal) > 0.01 ||
        Math.abs(payloadTotals.taxAmount - taxAmount) > 0.01 ||
        Math.abs(payloadTotals.discountAmount - discountAmount) > 0.01 ||
        Math.abs(payloadTotals.totalAmount - totalAmount) > 0.01
      ) {
        throw new BadRequestException('Los totales no coinciden con los valores calculados');
      }

      /* 1. Validar stock con control de concurrencia */
      for (const item of createSaleDto.items) {
        const product = await this.productsService.findOne(item.productId);
        if (!product) throw new NotFoundException(`Producto ${item.productId} no encontrado`);
        if (item.unitPrice < item.unitCost) {
          throw new BadRequestException(`El precio de venta no puede ser menor al costo para producto ${product.name}`);
        }

        /* Decrementar stock solo si hay suficiente (atomically) */
        const updated = await this.productsService.decrementStockIfAvailable(
          item.productId,
          item.quantity,
          session,
        );
        if (!updated) {
          throw new BadRequestException(`Stock insuficiente para producto ${product.name}`);
        }
      }

      /* 2. Generar número único de venta */
      const saleNumber = await this.generateSaleNumber();

      /* 3. Crear la venta */
      const saleData = {
        ...createSaleDto,
        saleNumber,
        salesPersonId: new Types.ObjectId(salesPersonId),
        customerId: new Types.ObjectId(createSaleDto.customerId),
        saleDate: new Date(createSaleDto.saleDate),
      };
      const [sale] = await this.saleModel.create([saleData], { session });

      if (!sale) {
        await session.abortTransaction();
        throw new InternalServerErrorException('No se pudo crear la venta');
      }
      const saleDoc = sale as SaleDocument;
      const saleId = saleDoc._id as Types.ObjectId;

      /* 4. Crear items */
      const items = createSaleDto.items.map(item => ({
        saleId: saleId,
        productId: new Types.ObjectId(item.productId),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost,
        discount: item.discount || 0,
        subtotal: item.quantity * item.unitPrice - (item.discount || 0),
      }));
      await this.saleItemModel.insertMany(items, { session });

      /* 5. Registrar movimientos de salida */
      for (const item of createSaleDto.items) {
        const product = await this.productsService.findOne(item.productId);
        await this.stockMovementsService.create({
          productId: item.productId,
          type: 'out',
          quantity: item.quantity,
          reason: 'sale',
          previousStock: product.stockQuantity,
          newStock: product.stockQuantity - item.quantity,
          userId: salesPersonId,
          reference: saleId.toString(),
          referenceModel: 'Sale',
          reservedAtMovement: product.reservedQuantity,
          unitCostAtMovement: product.costPrice,
        });
      }

      /* 6. Confirmar y retornar */
      await session.commitTransaction();
      return this.findOne(saleId.toString());
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException('Error creando la venta: ' + error.message);
    } finally {
      session.endSession();
    }
  }

  async createQuickSale(dto: Omit<CreateSaleDto, 'saleNumber'>, salesPersonId: string): Promise<SaleDocument> {
    return this.create(dto, salesPersonId);
  }

  async findAll(query: SaleQueryDto) {
    const { status, paymentStatus, paymentMethod, customerId, salesPersonId, isReturn, startDate, endDate, minAmount, maxAmount, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (status) filter.status = status;
    if (paymentStatus) filter['payment.status'] = paymentStatus;
    if (paymentMethod) filter['payment.method'] = paymentMethod;
    if (customerId) filter.customerId = new Types.ObjectId(customerId);
    if (salesPersonId) filter.salesPersonId = new Types.ObjectId(salesPersonId);
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

  async findOne(id: string): Promise<SaleDocument> {
    const sale = await this.saleModel.findById(id)
      .populate('customerId', 'fullName email phone address')
      .populate('salesPersonId', 'displayName email')
      .exec();
    if (!sale) throw new NotFoundException('Venta no encontrada');

    const items = await this.saleItemModel.find({ saleId: sale._id });
    const profit = items.reduce((sum, item) => sum + (item.unitPrice - item.unitCost) * item.quantity, 0);
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
    const filter = { salesPersonId: new Types.ObjectId(salesPersonId), isReturn: false };
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
    return this.saleModel.find({ saleDate: { $gte: today, $lt: tomorrow }, isReturn: false })
      .populate('customerId', 'fullName email phone')
      .populate('salesPersonId', 'displayName email')
      .sort({ saleDate: -1 })
      .exec();
  }

  async cancelSale(id: string, userId: string, notes?: string): Promise<SaleDocument> {
    const sale = await this.findOne(id);   // ya lanza si no existe

    if (sale.status === SaleStatus.CONFIRMED) {
      const items = await this.saleItemModel.find({ saleId: sale._id });
      for (const item of items) {
        const product = await this.productsService.findOne(item.productId.toString());
        await this.stockMovementsService.create({
          productId: item.productId.toString(),
          type: 'in',
          quantity: item.quantity,
          reason: 'return',
          previousStock: product.stockQuantity,
          newStock: product.stockQuantity + item.quantity,
          userId,
          reference: id,
          referenceModel: 'Sale',
          reservedAtMovement: product.reservedQuantity,
          unitCostAtMovement: product.costPrice,
        });
        await this.productsService.incrementStock(item.productId.toString(), item.quantity);
      }
    }

    /* Update con retorno tipado */
    const updated = await this.saleModel
      .findByIdAndUpdate(
        id,
        {
          status: SaleStatus.CANCELLED,
          notes: notes || 'Venta cancelada',
          cancelledBy: new Types.ObjectId(userId),
          cancelledAt: new Date(),
        },
        { new: true, runValidators: true },
      )
      .exec();

    /* Garantizamos que el update no devolvió null */
    if (!updated) {
      throw new InternalServerErrorException('Error al cancelar la venta');
    }

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

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de venta inválido');

    const session = await this.saleModel.db.startSession();
    session.startTransaction();

    try {
      await this.saleItemModel.deleteMany({ saleId: id }).session(session);
      const result = await this.saleModel.deleteOne({ _id: id }).session(session);

      if (result.deletedCount === 0) throw new NotFoundException('Venta no encontrada');

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}