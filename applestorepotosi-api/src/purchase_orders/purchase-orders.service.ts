// src/purchase-orders/purchase-orders.service.ts
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { PurchaseOrder, PurchaseOrderDocument } from './schemas/purchase-order.schema';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { Supplier, SupplierDocument } from '../suppliers/schemas/supplier.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

// ---------- Tipos auxiliares ----------

/**
 * Perfil mínimo del usuario autenticado que el guard inyecta en req.user.
 * Centralizar aquí evita el patrón reqUser?._id?.toString() ?? reqUser?.uid ?? reqUser
 * disperso en todo el service.
 */
export interface AuthUser {
  /** ObjectId de MongoDB del usuario (string hex de 24 chars). */
  _id: string;
  uid?: string;
  email?: string;
}

/** Extrae el ID del usuario de forma segura sin importar cómo llegue el objeto. */
function resolveUserId(reqUser: AuthUser | any): string {
  return reqUser?._id?.toString() ?? reqUser?.uid ?? String(reqUser);
}

// ---------- Nombre del contador de secuencia ----------
const ORDER_COUNTER_KEY = 'purchase_order_seq';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectModel(PurchaseOrder.name)
    private readonly purchaseOrderModel: Model<PurchaseOrderDocument>,

    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    /** Conexión de Mongoose para acceder a la colección de contadores y abrir sessions. */
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  // =========================================================
  //  VALIDACIONES PRIVADAS
  // =========================================================

  private validateObjectId(id: string, field: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        `${field} debe ser un ObjectId válido de 24 caracteres hexadecimales`,
      );
    }
  }

  /**
   * Validación interna de items.
   * Es PRIVADA: el controller nunca la invoca directamente.
   */
  private validateItems(items: CreatePurchaseOrderDto['items']): void {
    if (!items || items.length === 0) {
      throw new BadRequestException('La orden debe contener al menos un item');
    }
    items.forEach((item, index) => {
      if (!item.productId)
        throw new BadRequestException(`Item ${index + 1}: falta productId`);
      if (item.quantity <= 0)
        throw new BadRequestException(`Item ${index + 1}: quantity debe ser > 0`);
      if (item.unitCost < 0)
        throw new BadRequestException(`Item ${index + 1}: unitCost no puede ser negativo`);
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
      throw new BadRequestException(
        `Transición de estado no permitida: ${current} → ${next}`,
      );
    }
  }

  calculateOrderTotal(items: Array<{ quantity: number; unitCost: number }>): number {
    return items.reduce((total, item) => total + item.quantity * item.unitCost, 0);
  }

  // =========================================================
  //  GENERACIÓN DE NÚMERO DE ORDEN — contador atómico
  // =========================================================

  /**
   * Genera un número de orden único usando un contador atómico con $inc.
   * Una sola query, sin condición de carrera, sin reintentos.
   *
   * La colección `counters` almacena documentos { _id: string, seq: number }.
   */
  private async generateOrderNumber(): Promise<string> {
    // La colección `counters` usa _id de tipo string, no ObjectId.
    // Se castea el filtro a `any` para evitar el error de TypeScript que espera ObjectId.
    const countersCollection = this.connection.collection<{ _id: string; seq: number }>('counters');

    const result = await countersCollection.findOneAndUpdate(
      { _id: ORDER_COUNTER_KEY } as any,
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' },
    );

    if (!result) {
      throw new InternalServerErrorException(
        'No se pudo generar el número de orden (contador atómico falló)',
      );
    }

    const seq: number = (result as any).seq ?? (result as any).value?.seq;
    return `OC-${String(seq).padStart(6, '0')}`;
  }

  // =========================================================
  //  CREATE
  // =========================================================

  async create(
    dto: CreatePurchaseOrderDto,
    reqUser: AuthUser,
  ): Promise<PurchaseOrderDocument> {
    this.validateObjectId(dto.supplierId, 'supplierId');
    dto.items.forEach((item, i) =>
      this.validateObjectId(item.productId, `items[${i}].productId`),
    );

    const supplierExists = await this.supplierModel.exists({ _id: dto.supplierId });
    if (!supplierExists) throw new NotFoundException('Proveedor no encontrado');

    this.validateItems(dto.items);

    const calculatedTotal = this.calculateOrderTotal(dto.items);
    const orderNumber     = await this.generateOrderNumber();
    const creatorId       = new Types.ObjectId(resolveUserId(reqUser));

    const order = new this.purchaseOrderModel({
      ...dto,
      orderNumber,
      supplierId:    new Types.ObjectId(dto.supplierId),
      orderDate:     dto.orderDate ?? new Date(),
      status:        'pending',
      createdBy:     creatorId,
      updatedBy:     creatorId,
      totalAmount:   calculatedTotal,
      statusHistory: [
        { status: 'pending', changedBy: creatorId, changedAt: new Date(), reason: '' },
      ],
      items: dto.items.map((item) => ({
        productId: new Types.ObjectId(item.productId),
        quantity:  item.quantity,
        unitCost:  item.unitCost,
        subtotal:  item.quantity * item.unitCost,
      })),
    });

    try {
      return await order.save();
    } catch (err: any) {
      // E11000: race condition extremadamente improbable con $inc, pero la manejamos igual
      if (err?.code === 11000) {
        throw new ConflictException(
          'Conflicto al generar el número de orden. Intente nuevamente.',
        );
      }
      throw err;
    }
  }

  // =========================================================
  //  FIND ALL
  // =========================================================

  async findAll(query: PurchaseOrderQueryDto) {
    const {
      status, supplierId, search,
      startDate, endDate,
      page = 1, limit = 10,
    } = query;

    const skip = (page - 1) * limit;
    const filter: Record<string, any> = { isDeleted: false };

    if (status)    filter.status = status;
    if (supplierId && Types.ObjectId.isValid(supplierId)) {
      filter.supplierId = new Types.ObjectId(supplierId);
    }
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate)   filter.orderDate.$lte = new Date(endDate);
    }
    if (search) {
      const conditions: any[] = [
        { notes: { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } },
      ];
      if (Types.ObjectId.isValid(search)) {
        conditions.push({ _id: new Types.ObjectId(search) });
      }
      filter.$or = conditions;
    }

    const [orders, total] = await Promise.all([
      this.purchaseOrderModel
        .find(filter)
        .populate('supplierId', 'name contactEmail contactPhone')
        .populate('createdBy', 'profile.firstName profile.lastName email')
        .populate('items.productId', 'name sku barcode costPrice salePrice')
        .sort({ orderDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.purchaseOrderModel.countDocuments(filter).exec(),
    ]);

    return {
      purchaseOrders: orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // =========================================================
  //  FIND ONE
  // =========================================================

  async findOne(id: string): Promise<PurchaseOrderDocument> {
    this.validateObjectId(id, 'id');

    const order = await this.purchaseOrderModel
      .findOne({ _id: id, isDeleted: false })
      .populate('supplierId', 'name contactEmail contactPhone')
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .populate('items.productId', 'name sku barcode costPrice salePrice stockQuantity')
      .exec();

    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }

  // =========================================================
  //  UPDATE
  // =========================================================

  async update(
    id: string,
    dto: UpdatePurchaseOrderDto,
    reqUserId: string,
  ): Promise<PurchaseOrderDocument> {
    this.validateObjectId(id, 'id');
    this.validateObjectId(reqUserId, 'reqUserId');

    const existing = await this.purchaseOrderModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
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
      dto.items.forEach((item, i) =>
        this.validateObjectId(item.productId, `items[${i}].productId`),
      );
      this.validateItems(dto.items);
    }

    const updateData: Record<string, any> = {
      updatedBy: new Types.ObjectId(reqUserId),
    };

    if (dto.notes !== undefined)     updateData.notes     = dto.notes;
    if (dto.orderDate !== undefined) updateData.orderDate = dto.orderDate;
    if (dto.supplierId)              updateData.supplierId = new Types.ObjectId(dto.supplierId);

    if (dto.items) {
      updateData.items = dto.items.map((item) => ({
        productId: new Types.ObjectId(item.productId),
        quantity:  item.quantity,
        unitCost:  item.unitCost,
        subtotal:  item.quantity * item.unitCost,
      }));
      updateData.totalAmount = this.calculateOrderTotal(dto.items);
    }

    const updated = await this.purchaseOrderModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .populate('supplierId', 'name contactEmail contactPhone')
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .populate('items.productId', 'name sku barcode costPrice salePrice')
      .exec();

    if (!updated) throw new NotFoundException('Orden no encontrada después de actualizar');
    return updated;
  }

  // =========================================================
  //  REMOVE (soft-delete)
  // =========================================================

  async remove(id: string, userId: string): Promise<void> {
    this.validateObjectId(id, 'id');
    this.validateObjectId(userId, 'userId');

    // Una sola query: filtra status protegido + isDeleted en el mismo updateOne.
    const result = await this.purchaseOrderModel
      .updateOne(
        {
          _id:       new Types.ObjectId(id),
          isDeleted: false,
          status:    { $nin: ['completed', 'approved'] },
        },
        {
          $set: {
            isDeleted: true,
            updatedBy: new Types.ObjectId(userId),
          },
        },
      )
      .exec();

    if (result.matchedCount === 0) {
      // Determinar si no existía o si tenía un estado protegido para dar mensaje preciso.
      const order = await this.purchaseOrderModel
        .findOne({ _id: id, isDeleted: false })
        .select('status')
        .lean()
        .exec();

      if (!order) throw new NotFoundException('Orden no encontrada');
      throw new ConflictException(
        `No se puede eliminar una orden en estado "${order.status}"`,
      );
    }
  }

  // =========================================================
  //  UPDATE STATUS (interno — con session opcional)
  // =========================================================

  /**
   * Actualiza el estado de una orden y registra la transición en statusHistory.
   * Acepta una session de Mongoose para participar en transacciones.
   */
  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
    userId?: string,
    session?: any,
  ): Promise<PurchaseOrderDocument> {
    this.validateObjectId(id, 'id');
    if (userId) this.validateObjectId(userId, 'userId');

    const order = await this.purchaseOrderModel
      .findOne({ _id: id, isDeleted: false })
      .session(session ?? null)
      .exec();
    if (!order) throw new NotFoundException('Orden no encontrada');

    this.validateStatusTransition(order.status, dto.status);

    const changedBy = userId ? new Types.ObjectId(userId) : undefined;

    const historyEntry = {
      status:    dto.status,
      changedBy,
      changedAt: new Date(),
      reason:    dto.reason ?? '',
    };

    const updatePayload: Record<string, any> = {
      $set: {
        status:    dto.status,
        updatedBy: changedBy,
      },
      $push: {
        statusHistory: historyEntry,
      },
    };

    const updated = await this.purchaseOrderModel
      .findByIdAndUpdate(id, updatePayload, {
        new:            true,
        runValidators:  true,
        session:        session ?? null,
      })
      .populate('supplierId', 'name contactEmail contactPhone')
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .populate('items.productId', 'name sku barcode costPrice salePrice')
      .exec();

    if (!updated)
      throw new NotFoundException('Orden no encontrada después de actualizar estado');
    return updated;
  }

  // =========================================================
  //  COMPLETE ORDER — transacción atómica stock + estado
  // =========================================================

  /**
   * Completa la orden e incrementa el stock de cada producto.
   * Usa una sesión de MongoDB para garantizar atomicidad: si falla
   * la actualización de stock, el cambio de estado no se aplica (y viceversa).
   */
  async completeOrder(
    id: string,
    reqUser?: AuthUser,
  ): Promise<PurchaseOrderDocument> {
    const userId = resolveUserId(reqUser);
    this.validateObjectId(id, 'id');

    // Leer la orden ANTES de abrir la transacción para validar rápido.
    const order = await this.purchaseOrderModel
      .findOne({ _id: id, isDeleted: false })
      .lean()
      .exec();
    if (!order) throw new NotFoundException('Orden no encontrada');

    this.validateStatusTransition(order.status, 'completed');

    // Verificar que todos los productos existen antes de tocar nada.
    const productIds = order.items.map((item) => item.productId);
    const foundCount = await this.productModel.countDocuments({
      _id: { $in: productIds },
    });
    if (foundCount !== productIds.length) {
      throw new NotFoundException(
        `${productIds.length - foundCount} producto(s) de la orden no fueron encontrados`,
      );
    }

    // Transacción: primero cambia el estado, luego actualiza stock.
    // Si cualquiera falla, MongoDB revierte todo.
    const session = await this.connection.startSession();
    let result: PurchaseOrderDocument;

    try {
      await session.withTransaction(async () => {
        result = await this.updateStatus(
          id,
          { status: 'completed' },
          userId,
          session,
        );

        await Promise.all(
          order.items.map((item) =>
            this.productModel.updateOne(
              { _id: item.productId },
              { $inc: { stockQuantity: item.quantity } },
              { session },
            ),
          ),
        );
      });
    } finally {
      await session.endSession();
    }

    return result!;
  }

  // =========================================================
  //  APPROVE / REJECT / CANCEL
  // =========================================================

  async approveOrder(
    id: string,
    reason?: string,
    reqUser?: AuthUser,
  ): Promise<PurchaseOrderDocument> {
    const userId = resolveUserId(reqUser);
    return this.updateStatus(id, { status: 'approved', reason }, userId);
  }

  async rejectOrder(
    id: string,
    reason?: string,
    reqUser?: AuthUser,
  ): Promise<PurchaseOrderDocument> {
    const userId = resolveUserId(reqUser);
    return this.updateStatus(id, { status: 'rejected', reason }, userId);
  }

  async cancelOrder(
    id: string,
    reason?: string,
    reqUser?: AuthUser,
  ): Promise<PurchaseOrderDocument> {
    const userId = resolveUserId(reqUser);
    return this.updateStatus(id, { status: 'cancelled', reason }, userId);
  }

  // =========================================================
  //  FIND BY SUPPLIER / STATUS
  // =========================================================

  async findBySupplier(supplierId: string, page = 1, limit = 20) {
    this.validateObjectId(supplierId, 'supplierId');

    const skip   = (page - 1) * limit;
    const filter = { supplierId: new Types.ObjectId(supplierId), isDeleted: false };

    const [orders, total] = await Promise.all([
      this.purchaseOrderModel
        .find(filter)
        .populate('supplierId', 'name contactEmail contactPhone')
        .populate('createdBy', 'profile.firstName profile.lastName email')
        .populate('items.productId', 'name sku barcode costPrice salePrice')
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.purchaseOrderModel.countDocuments(filter).exec(),
    ]);

    return { orders, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findByStatus(status: string, page = 1, limit = 20) {
    const valid = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
    if (!valid.includes(status)) throw new BadRequestException('Estado inválido');

    const skip   = (page - 1) * limit;
    const filter = { status, isDeleted: false };

    const [orders, total] = await Promise.all([
      this.purchaseOrderModel
        .find(filter)
        .populate('supplierId', 'name contactEmail contactPhone')
        .populate('createdBy', 'profile.firstName profile.lastName email')
        .populate('items.productId', 'name sku barcode costPrice salePrice')
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.purchaseOrderModel.countDocuments(filter).exec(),
    ]);

    return { orders, total, page, totalPages: Math.ceil(total / limit) };
  }

  // =========================================================
  //  STATS
  // =========================================================

  async getStats() {
    const [agg] = await this.purchaseOrderModel.aggregate([
      { $match: { isDeleted: false } },
      {
        $facet: {
          total:     [{ $count: 'n' }],
          byStatus:  [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          financial: [
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' },
                avg:         { $avg: '$totalAmount' },
              },
            },
          ],
          pending: [
            { $match: { status: 'pending' } },
            { $group: { _id: null, amount: { $sum: '$totalAmount' } } },
          ],
          completed: [
            { $match: { status: 'completed' } },
            { $group: { _id: null, amount: { $sum: '$totalAmount' } } },
          ],
        },
      },
    ]);

    const statsByStatus: Record<string, number> = {};
    (agg.byStatus ?? []).forEach((s: any) => (statsByStatus[s._id] = s.count));

    return {
      total:             agg.total[0]?.n             ?? 0,
      byStatus:          statsByStatus,
      totalAmount:       agg.financial[0]?.totalAmount ?? 0,
      averageOrderValue: agg.financial[0]?.avg          ?? 0,
      pendingAmount:     agg.pending[0]?.amount         ?? 0,
      completedAmount:   agg.completed[0]?.amount       ?? 0,
    };
  }
}