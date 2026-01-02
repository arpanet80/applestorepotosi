// src/stock-movements/stock-movements.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { StockMovement, StockMovementDocument } from './schemas/stock-movement.schema';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateStockMovementDto } from './dto/update-stock-movement.dto';
import { StockMovementQueryDto } from './dto/stock-movement-query.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class StockMovementsService {
  constructor(
    @InjectModel(StockMovement.name)
    private stockMovementModel: Model<StockMovementDocument>,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
  ) {}

  /* ----------  populate helpers  ---------- */
  private async _populateOne(doc: StockMovementDocument | null): Promise<StockMovementDocument> {
  if (!doc) throw new NotFoundException('Movimiento no encontrado');

  await this.stockMovementModel.populate(doc, [
    { path: 'productId', select: 'name sku barcode salePrice costPrice' },
  ]);

  if (Types.ObjectId.isValid(doc.userId.toString())) {
    await this.stockMovementModel.populate(doc, {
      path: 'userId',
      select: 'profile.firstName profile.lastName email',
    });
  }

  /* ----  NUEVO: saltamos StockAdjustment  ---- */
  if (doc.reference && doc.referenceModel !== 'StockAdjustment' && Types.ObjectId.isValid(doc.reference.toString())) {
    await this.stockMovementModel.populate(doc, {
      path: 'reference',
      model: doc.referenceModel, // 'Sale' | 'PurchaseOrder'
    });
  }
  return doc;
}

private async _populateMany(docs: StockMovementDocument[]): Promise<StockMovementDocument[]> {
  await this.stockMovementModel.populate(docs, [
    { path: 'productId', select: 'name sku barcode salePrice costPrice' },
  ]);

  for (const d of docs) {
    if (Types.ObjectId.isValid(d.userId.toString())) {
      await this.stockMovementModel.populate(d, {
        path: 'userId',
        select: 'profile.firstName profile.lastName email',
      });
    }
    /* ----  NUEVO: saltamos StockAdjustment  ---- */
    if (d.reference && d.referenceModel !== 'StockAdjustment' && Types.ObjectId.isValid(d.reference.toString())) {
      await this.stockMovementModel.populate(d, {
        path: 'reference',
        model: d.referenceModel,
      });
    }
  }
  return docs;
}

  /* ----------  create  ---------- */
  async create(
    createStockMovementDto: CreateStockMovementDto,
    session?: ClientSession,
  ): Promise<StockMovementDocument> {
    this.validateStockMovement(createStockMovementDto);

    const product = await this.productsService.findOne(createStockMovementDto.productId);
    const reservedAtMovement = product.reservedQuantity ?? 0;
    const unitCostAtMovement = product.costPrice ?? 0;

    // --- limpieza de reference y referenceModel ---
    let ref: Types.ObjectId | undefined;
    if (
      createStockMovementDto.reference &&
      createStockMovementDto.reference !== '' &&
      createStockMovementDto.reference !== 'null'
    ) {
      ref = new Types.ObjectId(createStockMovementDto.reference);
    }

    const created = new this.stockMovementModel({
      ...createStockMovementDto,
      productId: new Types.ObjectId(createStockMovementDto.productId),
      userId: createStockMovementDto.userId,
      timestamp: createStockMovementDto.timestamp ?? new Date(),
      reservedAtMovement,
      unitCostAtMovement,
      reference: ref,
      referenceModel: createStockMovementDto.referenceModel || undefined,
    });

    // guardar y actualizar stock dentro de la sesión
    await created.save({ session });
    await this.productsService.updateStock(
      createStockMovementDto.productId,
      { quantity: createStockMovementDto.newStock },
      session,
    );

    return this._populateOne(created);
  }

  /* ----------  findAll  ---------- */
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
      this._populateMany(
        await this.stockMovementModel
          .find(filter)
          .sort({ timestamp: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
      ),
      this.stockMovementModel.countDocuments(filter),
    ]);

    return {
      stockMovements,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllRaw(): Promise<StockMovementDocument[]> {
    const docs = await this.stockMovementModel
      .find()
      .sort({ timestamp: -1 })
      .exec();

    return this._populateMany(docs); // ← mismo populate que usas en findAll
  }

  /* ----------  findOne  ---------- */
  async findOne(id: string): Promise<StockMovementDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const movement = await this.stockMovementModel.findById(id).exec();
    return this._populateOne(movement);
  }

  /* ----------  update  ---------- */
  async update(id: string, dto: UpdateStockMovementDto): Promise<StockMovementDocument> {
    
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    if (dto.reference === '' || dto.reference === 'null') dto.reference = null;
    if (dto.referenceModel === '' || dto.referenceModel === 'null') dto.referenceModel = null;

    const updated = await this.stockMovementModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
    return this._populateOne(updated);
  }

  /* ----------  remove  ---------- */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const movement = await this.stockMovementModel.findById(id).exec();
    if (!movement) throw new NotFoundException('Movimiento no encontrado');
    if (movement.reference) {
      throw new ConflictException('No se puede eliminar un movimiento con referencia');
    }
    await this.stockMovementModel.deleteOne({ _id: id });
  }

  /* ----------  otros métodos  ---------- */
  async findByProduct(productId: string, page = 1, limit = 10) {
    if (!Types.ObjectId.isValid(productId)) throw new BadRequestException('ID producto inválido');
    const skip = (page - 1) * limit;
    const filter = { productId: new Types.ObjectId(productId) };
    const [movements, total] = await Promise.all([
      this._populateMany(
        await this.stockMovementModel.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).exec(),
      ),
      this.stockMovementModel.countDocuments(filter),
    ]);
    return { movements, total };
  }

  async findByType(type: string, page = 1, limit = 10) {
    if (!['in', 'out', 'adjustment'].includes(type)) throw new BadRequestException('Tipo inválido');
    const skip = (page - 1) * limit;
    const filter = { type };
    const [movements, total] = await Promise.all([
      this._populateMany(
        await this.stockMovementModel.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).exec(),
      ),
      this.stockMovementModel.countDocuments(filter),
    ]);
    return { movements, total };
  }

  async findByReason(reason: string, page = 1, limit = 10) {
    const valid = ['sale', 'purchase', 'manual', 'return', 'damaged', 'expired'];
    if (!valid.includes(reason)) throw new BadRequestException('Razón inválida');
    const skip = (page - 1) * limit;
    const filter = { reason };
    const [movements, total] = await Promise.all([
      this._populateMany(
        await this.stockMovementModel.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).exec(),
      ),
      this.stockMovementModel.countDocuments(filter),
    ]);
    return { movements, total };
  }

  async findByDateRange(startDate: Date, endDate: Date) {
    return this._populateMany(
      await this.stockMovementModel
        .find({ timestamp: { $gte: startDate, $lte: endDate } })
        .sort({ timestamp: -1 })
        .exec(),
    );
  }

  async getStats() {
    const [total, byType, byReason, qtyStats, prodStats] = await Promise.all([
      this.stockMovementModel.countDocuments(),
      this.stockMovementModel.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
      this.stockMovementModel.aggregate([{ $group: { _id: '$reason', count: { $sum: 1 } } }]),
      this.stockMovementModel.aggregate([
        { $group: { _id: '$type', totalQuantity: { $sum: '$quantity' } } },
      ]),
      this.stockMovementModel.aggregate([
        { $group: { _id: '$productId', totalMovement: { $sum: '$quantity' }, count: { $sum: 1 } } },
        { $sort: { totalMovement: -1 } },
        { $limit: 10 },
        {
          $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' },
        },
        { $unwind: '$product' },
      ]),
    ]);

    const statsByType = Object.fromEntries(byType.map((x) => [x._id, x.count]));
    const statsByReason = Object.fromEntries(byReason.map((x) => [x._id, x.count]));
    const totalIn = qtyStats.find((x) => x._id === 'in')?.totalQuantity || 0;
    const totalOut = qtyStats.find((x) => x._id === 'out')?.totalQuantity || 0;

    return {
      total,
      byType: statsByType,
      byReason: statsByReason,
      totalIn,
      totalOut,
      mostMovedProducts: prodStats.map((x) => ({ product: x.product, totalMovement: x.totalMovement })),
    };
  }

  async getProductHistory(productId: string, days = 30) {
    if (!Types.ObjectId.isValid(productId)) throw new BadRequestException('ID producto inválido');
    const start = new Date();
    start.setDate(start.getDate() - days);
    return this._populateMany(
      await this.stockMovementModel
        .find({ productId: new Types.ObjectId(productId), timestamp: { $gte: start } })
        .sort({ timestamp: -1 })
        .exec(),
    );
  }

  async calculateCurrentStock(productId: string) {
    if (!Types.ObjectId.isValid(productId)) throw new BadRequestException('ID producto inválido');
    const [res] = await this.stockMovementModel.aggregate([
      { $match: { productId: new Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$productId',
          totalIn: { $sum: { $cond: [{ $eq: ['$type', 'in'] }, '$quantity', 0] } },
          totalOut: { $sum: { $cond: [{ $eq: ['$type', 'out'] }, '$quantity', 0] } },
        },
      },
      { $project: { currentStock: { $subtract: ['$totalIn', '$totalOut'] } } },
    ]);
    return res?.currentStock ?? 0;
  }

  async createStockAdjustment(adj: StockAdjustmentDto): Promise<StockMovementDocument> {
    const product = await this.productsService.findOne(adj.productId);
    const currentStock = product.stockQuantity;
    const adjQty = Math.abs(adj.newQuantity - currentStock);
    const type: 'in' | 'out' = adj.newQuantity > currentStock ? 'in' : 'out';

    return this.create({
      productId: adj.productId,
      type: 'adjustment',
      quantity: adjQty,
      reason: adj.reason,
      previousStock: currentStock,
      newStock: adj.newQuantity,
      userId: adj.userId,
      notes: adj.notes || `Ajuste de stock: ${adj.reason}`,
    });
  }

  async getRecentMovements(limit = 20) {
    return this._populateMany(
      await this.stockMovementModel
        .find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec(),
    );
  }

  async findByReference(referenceId: string) {
    if (!Types.ObjectId.isValid(referenceId)) throw new BadRequestException('ID referencia inválido');
    return this._populateMany(
      await this.stockMovementModel
        .find({ reference: new Types.ObjectId(referenceId) })
        .sort({ timestamp: -1 })
        .exec(),
    );
  }

  async getDailySummary(days = 7) {
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return this.stockMovementModel.aggregate([
      { $match: { timestamp: { $gte: start } } },
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
          movements: { $push: { type: '$_id.type', totalQuantity: '$totalQuantity', count: '$count' } },
          totalMovements: { $sum: '$count' },
        },
      },
      { $sort: { _id: -1 } },
    ]);
  }

  /* ----------  validaciones  ---------- */
  private validateStockMovement(dto: CreateStockMovementDto): void {
    const available = dto.previousStock - (dto.reservedAtMovement || 0);
    if (dto.type === 'out' && dto.quantity > available) {
      throw new BadRequestException(`Stock disponible insuficiente. Disponible: ${available}`);
    }
    const expectedNewStock =
      dto.type === 'in'
        ? dto.previousStock + dto.quantity
        : dto.previousStock - dto.quantity;
    if (Math.abs(dto.newStock - expectedNewStock) > 0.01) {
      throw new BadRequestException(
        `El nuevo stock no es consistente. Esperado: ${expectedNewStock}, recibido: ${dto.newStock}`,
      );
    }
  }
}