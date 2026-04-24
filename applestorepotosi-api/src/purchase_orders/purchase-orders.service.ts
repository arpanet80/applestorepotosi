// src/purchase-orders/purchase-orders.service.ts
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PurchaseOrder, PurchaseOrderDocument } from './schemas/purchase-order.schema';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { Supplier, SupplierDocument } from '../suppliers/schemas/supplier.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectModel(PurchaseOrder.name)
    private purchaseOrderModel: Model<PurchaseOrderDocument>,

    @InjectModel(Supplier.name)
    private supplierModel: Model<SupplierDocument>,

    // ✅ FIX #2: necesitamos el modelo de Product para actualizar stock al completar
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  /* ========== VALIDACIONES ========== */

  private validateObjectId(id: string, field: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`${field} debe ser un ID válido de 24 caracteres hexadecimales`);
    }
  }

  // ✅ FIX #8: validateItems solo vive en el service, el controller ya no la llama
  validateItems(items: any[]): void {
    if (!items || items.length === 0) {
      throw new BadRequestException('La orden debe contener al menos un item');
    }
    items.forEach((item, index) => {
      if (!item.productId) throw new BadRequestException(`Item ${index + 1} sin productId`);
      if (item.quantity <= 0) throw new BadRequestException(`Item ${index + 1} cantidad <= 0`);
      if (item.unitCost < 0) throw new BadRequestException(`Item ${index + 1} costo < 0`);
    });
  }

  validateStatusTransition(current: string, next: string): void {
    const allowed: Record<string, string[]> = {
      pending:   ['approved', 'rejected', 'cancelled'],
      approved:  ['completed', 'cancelled'],
      rejected:  ['pending'],
      completed: [],
      cancelled: ['pending'],
    };
    if (!allowed[current]?.includes(next)) {
      throw new BadRequestException(`Transición no permitida: ${current} → ${next}`);
    }
  }

  calculateOrderTotal(items: any[]): number {
    return items.reduce((total, item) => total + item.quantity * item.unitCost, 0);
  }

  /* ========== GENERATE ORDER NUMBER ========== */

  // ✅ FIX #1: mismo patrón robusto que generateSaleNumber — retry con exists()
  private async generateOrderNumber(): Promise<string> {
    const MAX_RETRIES = 10;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const last = await this.purchaseOrderModel
        .findOne({ orderNumber: { $regex: /^OC-/ } })
        .sort({ orderNumber: -1 })
        .select('orderNumber')
        .lean()
        .exec();

      let seq = 1;
      if (last) {
        const match = (last.orderNumber as string).match(/^OC-(\d+)$/);
        if (match) seq = parseInt(match[1], 10) + 1;
      }
      const candidate = `OC-${String(seq).padStart(6, '0')}`;

      const exists = await this.purchaseOrderModel.exists({ orderNumber: candidate });
      if (!exists) return candidate;
    }
    throw new Error('No se pudo generar un número de orden único tras varios intentos');
  }

  /* ========== CREATE ========== */

  async create(
    dto: CreatePurchaseOrderDto,
    reqUser: any,
  ): Promise<PurchaseOrderDocument> {
    this.validateObjectId(dto.supplierId, 'supplierId');
    dto.items.forEach((item, i) => this.validateObjectId(item.productId, `items[${i}].productId`));

    const supplierExists = await this.supplierModel.exists({ _id: dto.supplierId });
    if (!supplierExists) throw new NotFoundException('Proveedor no encontrado');

    // ✅ FIX #8: validación centralizada en service
    this.validateItems(dto.items);

    const calculatedTotal = this.calculateOrderTotal(dto.items);
    const orderNumber = await this.generateOrderNumber();
    const creatorObjectId = reqUser._id;

    const order = new this.purchaseOrderModel({
      ...dto,
      orderNumber,
      supplierId:  new Types.ObjectId(dto.supplierId),
      userId:      creatorObjectId,
      orderDate:   dto.orderDate || new Date(),
      status:      'pending',
      createdBy:   creatorObjectId,
      totalAmount: calculatedTotal,
      items: dto.items.map((item) => ({
        ...item,
        productId: new Types.ObjectId(item.productId),
        subtotal:  item.quantity * item.unitCost,
      })),
    });

    return order.save();
  }

  /* ========== FIND ALL ========== */

  async findAll(query: PurchaseOrderQueryDto) {
    const { status, supplierId, search, startDate, endDate, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const filter: Record<string, any> = { isDeleted: false };

    if (status) filter.status = status;
    if (supplierId && Types.ObjectId.isValid(supplierId)) {
      filter.supplierId = new Types.ObjectId(supplierId);
    }
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate)   filter.orderDate.$lte = new Date(endDate);
    }

    // ✅ FIX #5: search filter corregido — condiciones separadas limpias
    if (search) {
      const conditions: any[] = [{ notes: { $regex: search, $options: 'i' } }];
      if (Types.ObjectId.isValid(search)) {
        conditions.push({ _id: new Types.ObjectId(search) });
      }
      filter.$or = conditions;
    }

    const [orders, total] = await Promise.all([
      this.purchaseOrderModel
        .find(filter)
        .populate('supplierId', 'name contactEmail contactPhone')
        .populate('userId', 'profile.firstName profile.lastName email')
        .populate('items.productId', 'name sku barcode costPrice salePrice')
        .sort({ orderDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.purchaseOrderModel.countDocuments(filter).exec(),
    ]);

    return { purchaseOrders: orders, total, page, totalPages: Math.ceil(total / limit) };
  }

  /* ========== FIND ONE ========== */

  async findOne(id: string): Promise<PurchaseOrderDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');

    const order = await this.purchaseOrderModel
      .findOne({ _id: id, isDeleted: false })
      .populate('supplierId', 'name contactEmail contactPhone')
      .populate('userId', 'profile.firstName profile.lastName email')
      .populate('items.productId', 'name sku barcode costPrice salePrice stockQuantity')
      .exec();

    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }

  /* ========== UPDATE ========== */

  async update(
    id: string,
    dto: UpdatePurchaseOrderDto,
    reqUserId: string, // ✅ FIX #9: recibe solo el UID string, no el objeto completo
  ): Promise<PurchaseOrderDocument> {
    // ✅ FIX #9: eliminados console.log de debug

    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de orden inválido');

    const existing = await this.purchaseOrderModel.findOne({ _id: id, isDeleted: false }).exec();
    if (!existing) throw new NotFoundException('Orden no encontrada');

    if (['completed', 'approved'].includes(existing.status)) {
      throw new ConflictException('No se puede editar una orden completada o aprobada');
    }

    if (dto.supplierId) {
      this.validateObjectId(dto.supplierId, 'supplierId');
      const exists = await this.supplierModel.exists({ _id: dto.supplierId });
      if (!exists) throw new NotFoundException('Proveedor no encontrado');
    }

    if (dto.items) {
      dto.items.forEach((item, i) => this.validateObjectId(item.productId, `items[${i}].productId`));
      this.validateItems(dto.items);
    }

    // ✅ FIX #3: construir el updateData sin spreads problemáticos
    // Evita doble escritura (findByIdAndUpdate + markModified + save)
    const updateData: Record<string, any> = {
      updatedBy: new Types.ObjectId(reqUserId),
    };

    if (dto.notes !== undefined)   updateData.notes = dto.notes;
    if (dto.orderDate !== undefined) updateData.orderDate = dto.orderDate;
    if (dto.supplierId)            updateData.supplierId = new Types.ObjectId(dto.supplierId);

    if (dto.items) {
      // Construir items con subtotales calculados para que el pre-save no recalcule mal
      updateData.items = dto.items.map((item) => ({
        productId: new Types.ObjectId(item.productId),
        quantity:  item.quantity,
        unitCost:  item.unitCost,
        subtotal:  item.quantity * item.unitCost,
      }));
      updateData.totalAmount = dto.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
    }

    const updated = await this.purchaseOrderModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .populate('supplierId', 'name contactEmail contactPhone')
      .populate('userId', 'profile.firstName profile.lastName email')
      .populate('items.productId', 'name sku barcode costPrice salePrice')
      .exec();

    if (!updated) throw new NotFoundException('Orden no encontrada después de actualizar');
    return updated;
  }

  /* ========== REMOVE ========== */

  async remove(id: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');

    const order = await this.purchaseOrderModel.findOne({ _id: id, isDeleted: false }).exec();
    if (!order) throw new NotFoundException('Orden no encontrada');

    if (['completed', 'approved'].includes(order.status)) {
      throw new ConflictException('No se puede eliminar una orden completada o aprobada');
    }

    const result = await this.purchaseOrderModel
      .updateOne({ _id: id }, { isDeleted: true, updatedBy: new Types.ObjectId(userId) })
      .exec();

    if (result.modifiedCount === 0) throw new NotFoundException('Orden no encontrada');
  }

  /* ========== UPDATE STATUS ========== */

  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
    userId?: string, // ✅ FIX #4: siempre string UID, no objeto
  ): Promise<PurchaseOrderDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    if (userId && !Types.ObjectId.isValid(userId)) throw new BadRequestException('userId inválido');

    const order = await this.purchaseOrderModel.findOne({ _id: id, isDeleted: false }).exec();
    if (!order) throw new NotFoundException('Orden no encontrada');

    this.validateStatusTransition(order.status, dto.status);

    const updateData: Record<string, any> = {
      status:    dto.status,
      updatedBy: userId ? new Types.ObjectId(userId) : undefined,
    };

    if (dto.reason) {
      const currentNotes = order.notes || '';
      updateData.notes = `${currentNotes}\n[${new Date().toISOString()}] ${userId}: ${order.status} → ${dto.status} | ${dto.reason}`.trim();
    }

    const updated = await this.purchaseOrderModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('supplierId', 'name contactEmail contactPhone')
      .populate('userId', 'profile.firstName profile.lastName email')
      .populate('items.productId', 'name sku barcode costPrice salePrice')
      .exec();

    if (!updated) throw new NotFoundException('Orden no encontrada después de actualizar estado');
    return updated;
  }

  /* ========== COMPLETE ORDER — actualiza stock ========== */

  // ✅ FIX #2: al completar la orden se incrementa el stock de cada producto recibido
  async completeOrder(id: string, reqUser?: any): Promise<PurchaseOrderDocument> {
    const userId: string = reqUser?._id?.toString() ?? reqUser?.uid ?? reqUser;

    const order = await this.purchaseOrderModel
      .findOne({ _id: id, isDeleted: false })
      .lean()
      .exec();
    if (!order) throw new NotFoundException('Orden no encontrada');

    // Validar transición antes de actualizar stock
    this.validateStatusTransition(order.status, 'completed');

    // Incrementar stock de cada producto en paralelo con $inc atómico
    await Promise.all(
      order.items.map((item) =>
        this.productModel.updateOne(
          { _id: item.productId },
          { $inc: { stockQuantity: item.quantity } },
        ),
      ),
    );

    return this.updateStatus(id, { status: 'completed' }, userId);
  }

  /* ========== APPROVE / REJECT / CANCEL ========== */

  // ✅ FIX #4: extraer el _id string del reqUser antes de pasar a updateStatus
  async approveOrder(id: string, reason?: string, reqUser?: any): Promise<PurchaseOrderDocument> {
    const userId: string = reqUser?._id?.toString() ?? reqUser?.uid ?? reqUser;
    return this.updateStatus(id, { status: 'approved', reason }, userId);
  }

  async rejectOrder(id: string, reason?: string, reqUser?: any): Promise<PurchaseOrderDocument> {
    const userId: string = reqUser?._id?.toString() ?? reqUser?.uid ?? reqUser;
    return this.updateStatus(id, { status: 'rejected', reason }, userId);
  }

  async cancelOrder(id: string, reason?: string, reqUser?: any): Promise<PurchaseOrderDocument> {
    const userId: string = reqUser?._id?.toString() ?? reqUser?.uid ?? reqUser;
    return this.updateStatus(id, { status: 'cancelled', reason }, userId);
  }

  /* ========== FIND BY SUPPLIER / STATUS ========== */

  // ✅ FIX #15: paginación agregada
  async findBySupplier(supplierId: string, page = 1, limit = 20) {
    if (!Types.ObjectId.isValid(supplierId)) throw new BadRequestException('ID de proveedor inválido');
    const skip = (page - 1) * limit;
    const filter = { supplierId: new Types.ObjectId(supplierId), isDeleted: false };

    const [orders, total] = await Promise.all([
      this.purchaseOrderModel
        .find(filter)
        .populate('supplierId', 'name contactEmail contactPhone')
        .populate('userId', 'profile.firstName profile.lastName email')
        .populate('items.productId', 'name sku barcode costPrice salePrice')
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.purchaseOrderModel.countDocuments(filter),
    ]);

    return { orders, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findByStatus(status: string, page = 1, limit = 20) {
    const valid = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
    if (!valid.includes(status)) throw new BadRequestException('Estado inválido');
    const skip = (page - 1) * limit;
    const filter = { status, isDeleted: false };

    const [orders, total] = await Promise.all([
      this.purchaseOrderModel
        .find(filter)
        .populate('supplierId', 'name contactEmail contactPhone')
        .populate('userId', 'profile.firstName profile.lastName email')
        .populate('items.productId', 'name sku barcode costPrice salePrice')
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.purchaseOrderModel.countDocuments(filter),
    ]);

    return { orders, total, page, totalPages: Math.ceil(total / limit) };
  }

  /* ========== STATS ========== */

  // ✅ FIX #14: consolidado en 1 aggregation con $facet en vez de 5 queries
  async getStats() {
    const [agg] = await this.purchaseOrderModel.aggregate([
      { $match: { isDeleted: false } },
      {
        $facet: {
          total:     [{ $count: 'n' }],
          byStatus:  [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          financial: [{ $group: { _id: null, totalAmount: { $sum: '$totalAmount' }, avg: { $avg: '$totalAmount' } } }],
          pending:   [{ $match: { status: 'pending' } },   { $group: { _id: null, amount: { $sum: '$totalAmount' } } }],
          completed: [{ $match: { status: 'completed' } }, { $group: { _id: null, amount: { $sum: '$totalAmount' } } }],
        },
      },
    ]);

    const statsByStatus: Record<string, number> = {};
    (agg.byStatus ?? []).forEach((s: any) => (statsByStatus[s._id] = s.count));

    return {
      total:              agg.total[0]?.n ?? 0,
      byStatus:           statsByStatus,
      totalAmount:        agg.financial[0]?.totalAmount ?? 0,
      averageOrderValue:  agg.financial[0]?.avg ?? 0,
      pendingAmount:      agg.pending[0]?.amount ?? 0,
      completedAmount:    agg.completed[0]?.amount ?? 0,
    };
  }
}