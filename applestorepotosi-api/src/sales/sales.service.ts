// src/sales/sales.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sale, SaleDocument, SaleStatus, PaymentStatus } from './schemas/sale.schema';
import { SaleItem, SaleItemDocument } from './schemas/sale-item.schema';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SaleQueryDto } from './dto/sale-query.dto';
import { UpdateSaleStatusDto } from './dto/update-sale-status.dto';
import { CreateSaleItemDto, SaleItemDto, UpdateSaleItemDto } from './dto/sale-item.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name) 
    private saleModel: Model<SaleDocument>,
    @InjectModel(SaleItem.name)
    private saleItemModel: Model<SaleItemDocument>
  ) {}

  /**
   * Generar número de venta único
   */
  private async generateSaleNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const baseNumber = `VTA-${year}${month}${day}`;
    
    // Buscar el último número del día
    const lastSale = await this.saleModel
      .findOne({ saleNumber: new RegExp(`^${baseNumber}`) })
      .sort({ saleNumber: -1 })
      .exec();

    if (!lastSale) {
      return `${baseNumber}-0001`;
    }

    const lastNumber = parseInt(lastSale.saleNumber.split('-').pop() || '0');
    const newNumber = (lastNumber + 1).toString().padStart(4, '0');
    
    return `${baseNumber}-${newNumber}`;
  }

  /**
   * Calcular totales de la venta
   */
  private calculateTotals(items: any[]): { subtotal: number; taxAmount: number; discountAmount: number; totalAmount: number } {
    const subtotal = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = item.discount || 0;
      return sum + (itemSubtotal - itemDiscount);
    }, 0);

    // Por simplicidad, asumimos un 16% de IVA
    const taxRate = 0.16;
    const taxAmount = subtotal * taxRate;
    const discountAmount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const totalAmount = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount
    };
  }

  /**
   * Crear nueva venta
   */
  async create(createSaleDto: CreateSaleDto, salesPersonId: string): Promise<SaleDocument> {
    // Verificar si ya existe una venta con el mismo número
    const existingSale = await this.saleModel.findOne({ 
      saleNumber: createSaleDto.saleNumber 
    }).exec();

    if (existingSale) {
      throw new ConflictException('Ya existe una venta con este número');
    }

    // Verificar que el cliente existe
    // Esto requeriría inyectar CustomersService
    // Por ahora solo validamos el formato del ID

    // Verificar stock de productos
    for (const item of createSaleDto.items) {
      // Aquí deberías verificar el stock disponible del producto
      // Esto requeriría inyectar ProductsService
    }

    const saleData = {
      ...createSaleDto,
      salesPersonId: new Types.ObjectId(salesPersonId),
      customerId: new Types.ObjectId(createSaleDto.customerId),
      saleDate: new Date(createSaleDto.saleDate)
    };

    const session = await this.saleModel.db.startSession();
    session.startTransaction();

    try {
      const sale = new this.saleModel(saleData);
      const savedSale = await sale.save({ session });

      // Crear items de la venta
      const saleItems = createSaleDto.items.map(item => ({
        saleId: savedSale._id,
        productId: new Types.ObjectId(item.productId),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        subtotal: (item.quantity * item.unitPrice) - (item.discount || 0)
      }));

      await this.saleItemModel.insertMany(saleItems, { session });

      // Actualizar stock de productos
      for (const item of createSaleDto.items) {
        // Aquí deberías actualizar el stock de cada producto
        // await this.productsService.decrementStock(item.productId, item.quantity);
      }

      await session.commitTransaction();

      return this.findOne((savedSale._id as Types.ObjectId).toString());
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException('Error creando la venta: ' + error.message);
    } finally {
      session.endSession();
    }
  }

  /**
   * Crear venta rápida (con número automático)
   */
  async createQuickSale(createSaleDto: Omit<CreateSaleDto, 'saleNumber'>, salesPersonId: string): Promise<SaleDocument> {
    const saleNumber = await this.generateSaleNumber();
    
    const completeSaleDto: CreateSaleDto = {
      ...createSaleDto,
      saleNumber
    };

    return this.create(completeSaleDto, salesPersonId);
  }

  /**
   * Obtener todas las ventas con filtros
   */
  async findAll(query: SaleQueryDto): Promise<{
    sales: SaleDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { 
      status, 
      paymentStatus, 
      paymentMethod, 
      customerId, 
      salesPersonId,
      isReturn,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      page = 1, 
      limit = 10 
    } = query;

    const skip = (page - 1) * limit;
    const filter: any = {};

    // Filtrar por estado
    if (status) {
      filter.status = status;
    }

    // Filtrar por estado de pago
    if (paymentStatus) {
      filter['payment.status'] = paymentStatus;
    }

    // Filtrar por método de pago
    if (paymentMethod) {
      filter['payment.method'] = paymentMethod;
    }

    // Filtrar por cliente
    if (customerId) {
      if (!Types.ObjectId.isValid(customerId)) {
        throw new BadRequestException('ID de cliente inválido');
      }
      filter.customerId = new Types.ObjectId(customerId);
    }

    // Filtrar por vendedor
    if (salesPersonId) {
      if (!Types.ObjectId.isValid(salesPersonId)) {
        throw new BadRequestException('ID de vendedor inválido');
      }
      filter.salesPersonId = new Types.ObjectId(salesPersonId);
    }

    // Filtrar por devoluciones
    if (isReturn !== undefined) {
      filter.isReturn = isReturn;
    }

    // Filtrar por fecha
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate);
    }

    // Filtrar por monto
    if (minAmount !== undefined || maxAmount !== undefined) {
      filter['totals.totalAmount'] = {};
      if (minAmount !== undefined) filter['totals.totalAmount'].$gte = minAmount;
      if (maxAmount !== undefined) filter['totals.totalAmount'].$lte = maxAmount;
    }

    // Búsqueda por número de venta
    if (search) {
      filter.saleNumber = { $regex: search, $options: 'i' };
    }

    const [sales, total] = await Promise.all([
      this.saleModel
        .find(filter)
        .populate('customerId', 'fullName email phone')
        .populate('salesPersonId', 'displayName email')
        .sort({ saleDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.saleModel.countDocuments(filter).exec()
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      sales,
      total,
      page,
      totalPages
    };
  }

  /**
   * Obtener venta por ID
   */
  async findOne(id: string): Promise<SaleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de venta inválido');
    }

    const sale = await this.saleModel
      .findById(id)
      .populate('customerId', 'fullName email phone address')
      .populate('salesPersonId', 'displayName email')
      .exec();

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    return sale;
  }

  /**
   * Obtener venta por número
   */
  async findBySaleNumber(saleNumber: string): Promise<SaleDocument> {
    const sale = await this.saleModel
      .findOne({ saleNumber })
      .populate('customerId', 'fullName email phone')
      .populate('salesPersonId', 'displayName email')
      .exec();

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    return sale;
  }

  /**
   * Obtener items de una venta
   */
  async findSaleItems(saleId: string): Promise<SaleItemDocument[]> {
    if (!Types.ObjectId.isValid(saleId)) {
      throw new BadRequestException('ID de venta inválido');
    }

    return this.saleItemModel
      .find({ saleId: new Types.ObjectId(saleId) })
      .populate('productId', 'name sku salePrice')
      .exec();
  }

  /**
   * Obtener venta completa con items
   */
  async findSaleWithItems(id: string): Promise<any> {
    const sale = await this.findOne(id);
    const items = await this.findSaleItems(id);

    return {
      ...sale.toObject(),
      items
    };
  }

  /**
   * Actualizar venta
   */
  async update(id: string, updateSaleDto: UpdateSaleDto): Promise<SaleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de venta inválido');
    }

    // Verificar si ya existe otra venta con el mismo número
    if (updateSaleDto.saleNumber) {
      const existingSale = await this.saleModel.findOne({ 
        saleNumber: updateSaleDto.saleNumber,
        _id: { $ne: id }
      }).exec();

      if (existingSale) {
        throw new ConflictException('Ya existe otra venta con este número');
      }
    }

    const updateData = {
      ...updateSaleDto,
      ...(updateSaleDto.customerId && { 
        customerId: new Types.ObjectId(updateSaleDto.customerId) 
      })
    };

    const sale = await this.saleModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('customerId', 'fullName email phone')
      .populate('salesPersonId', 'displayName email')
      .exec();

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    return sale;
  }

  /**
   * Actualizar estado de venta
   */
  async updateStatus(id: string, updateStatusDto: UpdateSaleStatusDto): Promise<SaleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de venta inválido');
    }

    const updateData: any = {};
    if (updateStatusDto.status) updateData.status = updateStatusDto.status;
    if (updateStatusDto.paymentStatus) updateData['payment.status'] = updateStatusDto.paymentStatus;
    if (updateStatusDto.notes) updateData.notes = updateStatusDto.notes;

    const sale = await this.saleModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('customerId', 'fullName email phone')
      .populate('salesPersonId', 'displayName email')
      .exec();

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    return sale;
  }

  /**
   * Confirmar venta
   */
  async confirmSale(id: string): Promise<SaleDocument> {
    return this.updateStatus(id, { status: SaleStatus.CONFIRMED });
  }

  /**
   * Cancelar venta
   */
  async cancelSale(id: string, notes?: string): Promise<SaleDocument> {
    const sale = await this.saleModel.findById(id).exec();
    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    // Si la venta ya estaba confirmada, restaurar stock
    if (sale.status === SaleStatus.CONFIRMED) {
      const items = await this.findSaleItems(id);
      for (const item of items) {
        // Restaurar stock de productos
        // await this.productsService.incrementStock(item.productId.toString(), item.quantity);
      }
    }

    return this.updateStatus(id, { 
      status: SaleStatus.CANCELLED,
      notes: notes || 'Venta cancelada'
    });
  }

  /**
   * Marcar venta como entregada
   */
  async markAsDelivered(id: string): Promise<SaleDocument> {
    return this.updateStatus(id, { status: SaleStatus.DELIVERED });
  }

  /**
   * Completar pago
   */
  async completePayment(id: string, reference?: string): Promise<SaleDocument> {
    const updateData: any = {
      'payment.status': PaymentStatus.COMPLETED
    };
    
    if (reference) {
      updateData['payment.reference'] = reference;
    }

    const sale = await this.saleModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('customerId', 'fullName email phone')
      .populate('salesPersonId', 'displayName email')
      .exec();

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    return sale;
  }

  /**
   * Eliminar venta
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de venta inválido');
    }

    const session = await this.saleModel.db.startSession();
    session.startTransaction();

    try {
      // Eliminar items primero
      await this.saleItemModel.deleteMany({ saleId: id }).session(session);
      
      // Eliminar venta
      const result = await this.saleModel.deleteOne({ _id: id }).session(session);
      
      if (result.deletedCount === 0) {
        throw new NotFoundException('Venta no encontrada');
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Obtener ventas por cliente
   */
  async findByCustomer(customerId: string): Promise<SaleDocument[]> {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('ID de cliente inválido');
    }

    return this.saleModel
      .find({ 
        customerId: new Types.ObjectId(customerId),
        isReturn: false 
      })
      .populate('customerId', 'fullName email phone')
      .populate('salesPersonId', 'displayName email')
      .sort({ saleDate: -1 })
      .exec();
  }

  /**
   * Obtener ventas por vendedor
   */
  async findBySalesPerson(salesPersonId: string): Promise<SaleDocument[]> {
    if (!Types.ObjectId.isValid(salesPersonId)) {
      throw new BadRequestException('ID de vendedor inválido');
    }

    return this.saleModel
      .find({ 
        salesPersonId: new Types.ObjectId(salesPersonId),
        isReturn: false 
      })
      .populate('customerId', 'fullName email phone')
      .populate('salesPersonId', 'displayName email')
      .sort({ saleDate: -1 })
      .exec();
  }

  /**
   * Obtener ventas del día
   */
  async findTodaySales(): Promise<SaleDocument[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.saleModel
      .find({
        saleDate: {
          $gte: today,
          $lt: tomorrow
        },
        isReturn: false
      })
      .populate('customerId', 'fullName email phone')
      .populate('salesPersonId', 'displayName email')
      .sort({ saleDate: -1 })
      .exec();
  }

  /**
   * Obtener estadísticas de ventas
   */
  async getStats(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<{
    totalSales: number;
    totalAmount: number;
    averageSale: number;
    salesByStatus: Record<string, number>;
    salesByPaymentMethod: Record<string, number>;
    topCustomers: Array<{ customer: any; totalSpent: number; salesCount: number }>;
    topProducts: Array<{ product: any; quantitySold: number; totalAmount: number }>;
  }> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const [
      totalSales,
      totalAmountResult,
      salesByStatus,
      salesByPaymentMethod,
      topCustomers,
      topProducts
    ] = await Promise.all([
      this.saleModel.countDocuments({
        saleDate: { $gte: startDate },
        isReturn: false
      }),
      this.saleModel.aggregate([
        {
          $match: {
            saleDate: { $gte: startDate },
            isReturn: false
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totals.totalAmount' },
            count: { $sum: 1 }
          }
        }
      ]),
      this.saleModel.aggregate([
        {
          $match: {
            saleDate: { $gte: startDate },
            isReturn: false
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      this.saleModel.aggregate([
        {
          $match: {
            saleDate: { $gte: startDate },
            isReturn: false
          }
        },
        {
          $group: {
            _id: '$payment.method',
            count: { $sum: 1 }
          }
        }
      ]),
      this.saleModel.aggregate([
        {
          $match: {
            saleDate: { $gte: startDate },
            isReturn: false
          }
        },
        {
          $group: {
            _id: '$customerId',
            totalSpent: { $sum: '$totals.totalAmount' },
            salesCount: { $sum: 1 }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'customers',
            localField: '_id',
            foreignField: '_id',
            as: 'customer'
          }
        },
        { $unwind: '$customer' }
      ]),
      this.saleItemModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $lookup: {
            from: 'sales',
            localField: 'saleId',
            foreignField: '_id',
            as: 'sale'
          }
        },
        { $unwind: '$sale' },
        { $match: { 'sale.isReturn': false } },
        {
          $group: {
            _id: '$productId',
            quantitySold: { $sum: '$quantity' },
            totalAmount: { $sum: '$subtotal' }
          }
        },
        { $sort: { quantitySold: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' }
      ])
    ]);

    const totalAmount = totalAmountResult[0]?.totalAmount || 0;
    const averageSale = totalAmountResult[0]?.count ? totalAmount / totalAmountResult[0].count : 0;

    const statsByStatus: Record<string, number> = {};
    salesByStatus.forEach(stat => {
      statsByStatus[stat._id] = stat.count;
    });

    const statsByPaymentMethod: Record<string, number> = {};
    salesByPaymentMethod.forEach(stat => {
      statsByPaymentMethod[stat._id] = stat.count;
    });

    return {
      totalSales,
      totalAmount,
      averageSale,
      salesByStatus: statsByStatus,
      salesByPaymentMethod: statsByPaymentMethod,
      topCustomers: topCustomers.map(c => ({
        customer: c.customer,
        totalSpent: c.totalSpent,
        salesCount: c.salesCount
      })),
      topProducts: topProducts.map(p => ({
        product: p.product,
        quantitySold: p.quantitySold,
        totalAmount: p.totalAmount
      }))
    };
  }

  /**
   * Obtener ingresos por período
   */
  async getRevenueByPeriod(period: 'day' | 'week' | 'month' | 'year'): Promise<any[]> {
    let groupFormat: string;
    let startDate: Date = new Date();

    switch (period) {
      case 'day':
        groupFormat = '%Y-%m-%d %H:00';
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        groupFormat = '%Y-%m-%d';
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        groupFormat = '%Y-%m-%d';
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        groupFormat = '%Y-%m';
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        groupFormat = '%Y-%m-%d';
        startDate.setDate(startDate.getDate() - 7);
    }

    return this.saleModel.aggregate([
      {
        $match: {
          saleDate: { $gte: startDate },
          isReturn: false,
          'payment.status': PaymentStatus.COMPLETED
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: '$saleDate'
            }
          },
          revenue: { $sum: '$totals.totalAmount' },
          salesCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  /**
   * Verificar si existe venta por número
   */
  async saleNumberExists(saleNumber: string, excludeId?: string): Promise<boolean> {
    const query: any = { 
      saleNumber 
    };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const count = await this.saleModel.countDocuments(query).exec();
    return count > 0;
  }

  // ========== MÉTODOS PARA ITEMS DE VENTA ==========

  /**
   * Agregar item a venta
   */
  async addSaleItem(createItemDto: CreateSaleItemDto): Promise<SaleItemDocument> {
    if (!Types.ObjectId.isValid(createItemDto.saleId)) {
      throw new BadRequestException('ID de venta inválido');
    }

    // Verificar que la venta existe
    const sale = await this.saleModel.findById(createItemDto.saleId).exec();
    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    // Verificar que el producto existe y tiene stock
    // Esto requeriría inyectar ProductsService

    const item = new this.saleItemModel({
      ...createItemDto,
      saleId: new Types.ObjectId(createItemDto.saleId),
      productId: new Types.ObjectId(createItemDto.productId),
      subtotal: (createItemDto.quantity * createItemDto.unitPrice) - (createItemDto.discount || 0)
    });

    return item.save();
  }

  /**
   * Actualizar item de venta
   */
  async updateSaleItem(id: string, updateItemDto: UpdateSaleItemDto): Promise<SaleItemDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de item inválido');
    }

    const item = await this.saleItemModel
      .findByIdAndUpdate(id, {
        ...updateItemDto,
        productId: new Types.ObjectId(updateItemDto.productId),
        subtotal: (updateItemDto.quantity * updateItemDto.unitPrice) - (updateItemDto.discount || 0)
      }, { new: true, runValidators: true })
      .populate('productId', 'name sku salePrice')
      .exec();

    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    return item;
  }

  /**
   * Eliminar item de venta
   */
  async removeSaleItem(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de item inválido');
    }

    const result = await this.saleItemModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Item no encontrado');
    }
  }

  /**
   * Crear nota de crédito (devolución)
   */
  async createReturn(originalSaleId: string, returnItems: SaleItemDto[], notes?: string): Promise<SaleDocument> {
    const originalSale = await this.findOne(originalSaleId);
    if (!originalSale) {
      throw new NotFoundException('Venta original no encontrada');
    }

    const returnNumber = await this.generateSaleNumber();
    const returnSaleData: CreateSaleDto = {
      saleNumber: `DEV-${returnNumber}`,
      customerId: originalSale.customerId.toString(),
      saleDate: new Date(),
      payment: {
        method: originalSale.payment.method,
        status: PaymentStatus.COMPLETED,
        reference: `Devolución de ${originalSale.saleNumber}`
      },
      totals: this.calculateTotals(returnItems),
      status: SaleStatus.CONFIRMED,
      isReturn: true,
      notes: notes || `Devolución de venta ${originalSale.saleNumber}`,
      items: returnItems
    };

    // Usar el mismo vendedor o el usuario actual
    const salesPersonId = originalSale.salesPersonId.toString();

    return this.create(returnSaleData, salesPersonId);
  }
}