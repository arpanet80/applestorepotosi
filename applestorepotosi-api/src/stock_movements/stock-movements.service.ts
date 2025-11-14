// src/stock-movements/stock-movements.service.ts
import {Injectable,NotFoundException,BadRequestException,ConflictException,Inject,forwardRef,} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {StockMovement,StockMovementDocument,} from './schemas/stock-movement.schema';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateStockMovementDto } from './dto/update-stock-movement.dto';
import { StockMovementQueryDto } from './dto/stock-movement-query.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class StockMovementsService {
  constructor(
    @InjectModel(StockMovement.name)
    private stockMovementModel: Model<StockMovementDocument>,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
  ) {}

  /**
   * Crear nuevo movimiento de stock
   */
  async create(createStockMovementDto: CreateStockMovementDto): Promise<StockMovementDocument> {
    this.validateStockMovement(createStockMovementDto);

    const product = await this.productsService.findOne(createStockMovementDto.productId);
    const reservedAtMovement = product.reservedQuantity;
    const unitCostAtMovement = product.costPrice;

    const stockMovementData = {
      ...createStockMovementDto,
      productId: new Types.ObjectId(createStockMovementDto.productId),
      userId: new Types.ObjectId(createStockMovementDto.userId),
      timestamp: createStockMovementDto.timestamp || new Date(),
      reservedAtMovement,
      unitCostAtMovement,
      ...(createStockMovementDto.reference && {
        reference: new Types.ObjectId(createStockMovementDto.reference),
      }),
    };

    const stockMovement = new this.stockMovementModel(stockMovementData);
    await stockMovement.save();

    // Actualizar stock del producto
    await this.productsService.updateStock(createStockMovementDto.productId, {
      quantity: createStockMovementDto.newStock,
    });

    return stockMovement;
  }

  /**
   * Obtener todos los movimientos de stock con filtros y paginación
   */
  async findAll(query: StockMovementQueryDto): Promise<{
    stockMovements: StockMovementDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      productId,
      type,
      reason,
      reference,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = query;

    const skip = (page - 1) * limit;
    const filter: any = {};

    if (productId && Types.ObjectId.isValid(productId)) {
      filter.productId = new Types.ObjectId(productId);
    }
    if (type) filter.type = type;
    if (reason) filter.reason = reason;
    if (reference && Types.ObjectId.isValid(reference)) {
      filter.reference = new Types.ObjectId(reference);
    }
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const [stockMovements, total] = await Promise.all([
      this.stockMovementModel
        .find(filter)
        .populate('productId', 'name sku barcode salePrice costPrice')
        .populate('userId', 'profile.firstName profile.lastName email')
        .populate('reference')
        .sort({ timestamp: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.stockMovementModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      stockMovements,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Obtener movimiento por ID
   */
  async findOne(id: string): Promise<StockMovementDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de movimiento de stock inválido');
    }

    const stockMovement = await this.stockMovementModel
      .findById(id)
      .populate('productId', 'name sku barcode salePrice costPrice stockQuantity')
      .populate('userId', 'profile.firstName profile.lastName email')
      .populate('reference')
      .exec();

    if (!stockMovement) {
      throw new NotFoundException('Movimiento de stock no encontrado');
    }

    return stockMovement;
  }

  /**
   * Actualizar movimiento (solo sin referencia)
   */
  async update(
    id: string,
    updateStockMovementDto: UpdateStockMovementDto,
  ): Promise<StockMovementDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de movimiento de stock inválido');
    }

    const existing = await this.stockMovementModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException('Movimiento de stock no encontrado');
    }
    if (existing.reference) {
      throw new ConflictException('No se puede editar un movimiento con referencia');
    }

    const updateData: any = { ...updateStockMovementDto };

    if (updateStockMovementDto.productId) {
      updateData.productId = new Types.ObjectId(updateStockMovementDto.productId);
    }
    if (updateStockMovementDto.userId) {
      updateData.userId = new Types.ObjectId(updateStockMovementDto.userId);
    }
    if (updateStockMovementDto.reference) {
      updateData.reference = new Types.ObjectId(updateStockMovementDto.reference);
    }

    const updated = await this.stockMovementModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('productId', 'name sku barcode salePrice costPrice')
      .populate('userId', 'profile.firstName profile.lastName email')
      .populate('reference')
      .exec();

    if (!updated) {
      throw new NotFoundException('Movimiento no encontrado tras actualización');
    }

    return updated;
  }

  /**
   * Eliminar movimiento (solo sin referencia)
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de movimiento de stock inválido');
    }

    const movement = await this.stockMovementModel.findById(id).exec();
    if (!movement) {
      throw new NotFoundException('Movimiento de stock no encontrado');
    }
    if (movement.reference) {
      throw new ConflictException('No se puede eliminar un movimiento con referencia');
    }

    const result = await this.stockMovementModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Movimiento de stock no encontrado');
    }
  }

  /**
   * Obtener movimientos por producto con paginación
   */
  async findByProduct(
    productId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ movements: StockMovementDocument[]; total: number }> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const skip = (page - 1) * limit;
    const filter = { productId: new Types.ObjectId(productId) };

    const [movements, total] = await Promise.all([
      this.stockMovementModel
        .find(filter)
        .populate('productId', 'name sku barcode salePrice costPrice')
        .populate('userId', 'profile.firstName profile.lastName email')
        .populate('reference')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.stockMovementModel.countDocuments(filter).exec(),
    ]);

    return { movements, total };
  }

  /**
   * Obtener movimientos por tipo con paginación
   */
  async findByType(
    type: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ movements: StockMovementDocument[]; total: number }> {
    if (!['in', 'out', 'adjustment'].includes(type)) {
      throw new BadRequestException('Tipo de movimiento inválido');
    }

    const skip = (page - 1) * limit;
    const filter = { type };

    const [movements, total] = await Promise.all([
      this.stockMovementModel
        .find(filter)
        .populate('productId', 'name sku barcode salePrice costPrice')
        .populate('userId', 'profile.firstName profile.lastName email')
        .populate('reference')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.stockMovementModel.countDocuments(filter).exec(),
    ]);

    return { movements, total };
  }

  /**
   * Obtener movimientos por razón con paginación
   */
  async findByReason(
    reason: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ movements: StockMovementDocument[]; total: number }> {
    if (!['sale', 'purchase', 'manual', 'return', 'damaged', 'expired'].includes(reason)) {
      throw new BadRequestException('Razón de movimiento inválida');
    }

    const skip = (page - 1) * limit;
    const filter = { reason };

    const [movements, total] = await Promise.all([
      this.stockMovementModel
        .find(filter)
        .populate('productId', 'name sku barcode salePrice costPrice')
        .populate('userId', 'profile.firstName profile.lastName email')
        .populate('reference')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.stockMovementModel.countDocuments(filter).exec(),
    ]);

    return { movements, total };
  }

  /**
   * Obtener movimientos por rango de fechas
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<StockMovementDocument[]> {
    return this.stockMovementModel
      .find({
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      })
      .populate('productId', 'name sku barcode salePrice costPrice')
      .populate('userId', 'profile.firstName profile.lastName email')
      .populate('reference')
      .sort({ timestamp: -1 })
      .exec();
  }

  /**
   * Obtener estadísticas de movimientos
   */
  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byReason: Record<string, number>;
    totalIn: number;
    totalOut: number;
    mostMovedProducts: Array<{ product: any; totalMovement: number }>;
  }> {
    const [total, byType, byReason, quantityStats, productStats] = await Promise.all([
      this.stockMovementModel.countDocuments(),
      this.stockMovementModel.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
      this.stockMovementModel.aggregate([{ $group: { _id: '$reason', count: { $sum: 1 } } }]),
      this.stockMovementModel.aggregate([
        { $group: { _id: '$type', totalQuantity: { $sum: '$quantity' } } },
      ]),
      this.stockMovementModel.aggregate([
        {
          $group: {
            _id: '$productId',
            totalMovement: { $sum: '$quantity' },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalMovement: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
      ]),
    ]);

    const statsByType: Record<string, number> = {};
    byType.forEach((stat) => (statsByType[stat._id] = stat.count));

    const statsByReason: Record<string, number> = {};
    byReason.forEach((stat) => (statsByReason[stat._id] = stat.count));

    const totalIn = quantityStats.find((stat) => stat._id === 'in')?.totalQuantity || 0;
    const totalOut = quantityStats.find((stat) => stat._id === 'out')?.totalQuantity || 0;

    return {
      total,
      byType: statsByType,
      byReason: statsByReason,
      totalIn,
      totalOut,
      mostMovedProducts: productStats.map((stat) => ({
        product: stat.product,
        totalMovement: stat.totalMovement,
      })),
    };
  }

  /**
   * Obtener historial de stock para un producto
   */
  async getProductHistory(productId: string, days: number = 30): Promise<StockMovementDocument[]> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.stockMovementModel
      .find({
        productId: new Types.ObjectId(productId),
        timestamp: { $gte: startDate },
      })
      .populate('productId', 'name sku barcode salePrice costPrice')
      .populate('userId', 'profile.firstName profile.lastName email')
      .populate('reference')
      .sort({ timestamp: -1 })
      .exec();
  }

  /**
   * Calcular stock actual basado en movimientos
   */
  async calculateCurrentStock(productId: string): Promise<number> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const result = await this.stockMovementModel.aggregate([
      { $match: { productId: new Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$productId',
          totalIn: {
            $sum: {
              $cond: [{ $eq: ['$type', 'in'] }, '$quantity', 0],
            },
          },
          totalOut: {
            $sum: {
              $cond: [{ $eq: ['$type', 'out'] }, '$quantity', 0],
            },
          },
        },
      },
      {
        $project: {
          currentStock: { $subtract: ['$totalIn', '$totalOut'] },
        },
      },
    ]);

    return result[0]?.currentStock || 0;
  }

  /**
   * Crear ajuste de stock
   */
  async createStockAdjustment(adjustmentDto: StockAdjustmentDto): Promise<StockMovementDocument> {
    const product = await this.productsService.findOne(adjustmentDto.productId);
    const currentStock = product.stockQuantity;
    const adjustmentQuantity = Math.abs(adjustmentDto.newQuantity - currentStock);
    const type = adjustmentDto.newQuantity > currentStock ? 'in' : 'out';

    const stockMovementData: CreateStockMovementDto = {
      productId: adjustmentDto.productId,
      type: 'adjustment',
      quantity: adjustmentQuantity,
      reason: adjustmentDto.reason,
      previousStock: currentStock,
      newStock: adjustmentDto.newQuantity,
      userId: adjustmentDto.userId,
      notes: adjustmentDto.notes || `Ajuste de stock: ${adjustmentDto.reason}`,
    };

    return this.create(stockMovementData);
  }

  /**
   * Obtener movimientos recientes
   */
  async getRecentMovements(limit: number = 20): Promise<StockMovementDocument[]> {
    return this.stockMovementModel
      .find()
      .populate('productId', 'name sku barcode')
      .populate('userId', 'profile.firstName profile.lastName')
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Obtener movimientos por referencia
   */
  async findByReference(referenceId: string): Promise<StockMovementDocument[]> {
    if (!Types.ObjectId.isValid(referenceId)) {
      throw new BadRequestException('ID de referencia inválido');
    }

    return this.stockMovementModel
      .find({ reference: new Types.ObjectId(referenceId) })
      .populate('productId', 'name sku barcode salePrice costPrice')
      .populate('userId', 'profile.firstName profile.lastName email')
      .populate('reference')
      .sort({ timestamp: -1 })
      .exec();
  }

  /**
   * Resumen diario de movimientos
   */
  async getDailySummary(days: number = 7): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return this.stockMovementModel.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            type: '$type',
          },
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          movements: {
            $push: {
              type: '$_id.type',
              totalQuantity: '$totalQuantity',
              count: '$count',
            },
          },
          totalMovements: { $sum: '$count' },
        },
      },
      { $sort: { _id: -1 } },
    ]);
  }

  /**
   * Validar consistencia del movimiento
   */
  private validateStockMovement(movement: CreateStockMovementDto): void {
    const available = movement.previousStock - (movement.reservedAtMovement || 0);
    if (movement.type === 'out' && movement.quantity > available) {
      throw new BadRequestException(
        `Stock disponible insuficiente. Disponible: ${available}`,
      );
    }

    const expectedNewStock =
      movement.type === 'in'
        ? movement.previousStock + movement.quantity
        : movement.previousStock - movement.quantity;

    if (Math.abs(movement.newStock - expectedNewStock) > 0.01) {
      throw new BadRequestException(
        `El nuevo stock no es consistente. Esperado: ${expectedNewStock}, recibido: ${movement.newStock}`,
      );
    }
  }
}