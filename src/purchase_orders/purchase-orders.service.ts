import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PurchaseOrder, PurchaseOrderDocument } from './schemas/purchase-order.schema';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { Supplier, SupplierDocument } from '../suppliers/schemas/supplier.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectModel(PurchaseOrder.name)
    private purchaseOrderModel: Model<PurchaseOrderDocument>,

    @InjectModel(Supplier.name)
    private supplierModel: Model<SupplierDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  private validateObjectId(id: string, field: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`${field} debe ser un ID válido de 24 caracteres hexadecimales`);
    }
  }

  async create(
    dto: CreatePurchaseOrderDto,
    reqUser: any, // ← ya es el documento completo del usuario
  ): Promise<PurchaseOrderDocument> {
    // console.log('🔍 supplierId recibido:', dto.supplierId);
    // console.log('🔍 userId recibido (body):', dto.userId);
    // console.log('🔍 reqUser (token):', reqUser);
    // console.log('🔍 items:', dto.items);

    // 1. Validar formato de ObjectId
    if (!Types.ObjectId.isValid(dto.supplierId)) {
      throw new BadRequestException('supplierId debe ser un ObjectId válido de 24 caracteres hexadecimales');
    }
    dto.items.forEach((item, i) => {
      if (!Types.ObjectId.isValid(item.productId)) {
        throw new BadRequestException(`items[${i}].productId debe ser un ObjectId válido de 24 caracteres hexadecimales`);
      }
    });

    // 2. Verificar que exista el proveedor
    const supplierExists = await this.supplierModel.exists({ _id: dto.supplierId });
    if (!supplierExists) throw new NotFoundException('Proveedor no encontrado');

    // 3. ✅ Usar directamente el _id del usuario autenticado (reqUser ya es el documento)
    const creatorObjectId = reqUser._id;

    // 4. Validar items
    this.validateItems(dto.items);

    // 5. Calcular totalAmount ANTES de guardar
    const calculatedTotal = dto.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

    // 6. ✅ GENERAR orderNumber ÚNICO
    const last = await this.purchaseOrderModel
      .findOne({ orderNumber: { $regex: /^OC-/ } })
      .sort({ orderNumber: -1 })
      .exec();

    let seq = 1;
    if (last) {
      const match = last.orderNumber.match(/^OC-(\d+)$/);
      if (match) seq = parseInt(match[1], 10) + 1;
    }
    const orderNumber = `OC-${String(seq).padStart(6, '0')}`;

    // 7. Crear el documento con el número ya asignado
    const data = {
      ...dto,
      orderNumber,              // ← campo nuevo
      supplierId: new Types.ObjectId(dto.supplierId),
      userId: creatorObjectId, 
      orderDate: dto.orderDate || new Date(),
      status: 'pending',
      createdBy: creatorObjectId,
      totalAmount: calculatedTotal,
    };

    // 8. Guardar
    const order = new this.purchaseOrderModel(data);
    order.markModified('items');
    return order.save();
  }

  async findAll(query: PurchaseOrderQueryDto) {
    const {
      status,
      supplierId,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = query;

    const skip = (page - 1) * limit;
    const filter: any = { isDeleted: false };

    if (status) filter.status = status;
    if (supplierId && Types.ObjectId.isValid(supplierId)) {
      filter.supplierId = new Types.ObjectId(supplierId);
    }
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { notes: { $regex: search, $options: 'i' } },
        { _id: Types.ObjectId.isValid(search) ? new Types.ObjectId(search) : null },
      ].filter((c) => c._id !== null || c.notes);
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

    return {
      purchaseOrders: orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

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

  async update(
    id: string,
    dto: UpdatePurchaseOrderDto,
    reqUser: any, // ← ya es el documento completo
  ): Promise<PurchaseOrderDocument> {
    console.log('🔍 update id:', id);
    console.log('🔍 Items recibidos:', JSON.stringify(dto.items, null, 2));

    // 1. Validar ID de orden
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de orden inválido');
    }

    // 2. Buscar orden existente
    const existing = await this.purchaseOrderModel.findOne({ _id: id, isDeleted: false }).exec();
    if (!existing) throw new NotFoundException('Orden no encontrada');

    // 3. Verificar que no esté completada ni aprobada
    if (['completed', 'approved'].includes(existing.status)) {
      throw new ConflictException('No se puede editar una orden completada o aprobada');
    }

    // 4. Validar IDs nuevos si vienen
    if (dto.supplierId && !Types.ObjectId.isValid(dto.supplierId)) {
      throw new BadRequestException('supplierId debe ser un ObjectId válido de 24 caracteres hexadecimales');
    }
    if (dto.items) {
      dto.items.forEach((item, i) => {
        if (!Types.ObjectId.isValid(item.productId)) {
          throw new BadRequestException(`items[${i}].productId debe ser un ObjectId válido de 24 caracteres hexadecimales`);
        }
      });
    }

    // 5. Verificar que existan en BD (solo si se actualizan)
    if (dto.supplierId) {
      const exists = await this.supplierModel.exists({ _id: dto.supplierId });
      if (!exists) throw new NotFoundException('Proveedor no encontrado');
    }

    // 6. ✅ Usar directamente el _id del usuario autenticado
    const editorObjectId = reqUser._id;

    // 7. Validar items si vienen
    if (dto.items) this.validateItems(dto.items);

    // 8. ✅ Calcular subtotal por item y total general
    let finalTotal = existing.totalAmount;
    if (dto.items) {
      finalTotal = dto.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    }

    // 9. Construir el objeto de actualización
    const updateData: any = {
      ...dto,
      updatedBy: editorObjectId,
      totalAmount: finalTotal,
    };
    if (dto.supplierId) updateData.supplierId = new Types.ObjectId(dto.supplierId);

    // 10. Actualizar y devolver
    const updated = await this.purchaseOrderModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('supplierId', 'name contactEmail contactPhone')
      .populate('userId', 'profile.firstName profile.lastName email')
      .populate('items.productId', 'name sku barcode costPrice salePrice')
      .exec();

    if (updated && dto.items) {
      updated.markModified('items');
      await updated.save();
    }

    if (!updated) throw new NotFoundException('Orden no encontrada después de actualizar');
    return updated;
  }

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

  async updateStatus(id: string, dto: UpdateStatusDto, userId?: string): Promise<PurchaseOrderDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');

    const order = await this.purchaseOrderModel.findOne({ _id: id, isDeleted: false }).exec();
    if (!order) throw new NotFoundException('Orden no encontrada');

    this.validateStatusTransition(order.status, dto.status);

    const updateData: any = { status: dto.status, updatedBy: new Types.ObjectId(userId!) };
    if (dto.reason) {
      const currentNotes = order.notes || '';
      updateData.notes = `${currentNotes}\n[${new Date().toISOString()}] ${userId}: ${order.status} → ${dto.status} | ${dto.reason}`;
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

  async findBySupplier(supplierId: string) {
    if (!Types.ObjectId.isValid(supplierId)) throw new BadRequestException('ID de proveedor inválido');
    return this.purchaseOrderModel
      .find({ supplierId: new Types.ObjectId(supplierId), isDeleted: false })
      .populate('supplierId', 'name contactEmail contactPhone')
      .populate('userId', 'profile.firstName profile.lastName email')
      .populate('items.productId', 'name sku barcode costPrice salePrice')
      .sort({ orderDate: -1 })
      .exec();
  }

  async findByStatus(status: string) {
    const valid = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
    if (!valid.includes(status)) throw new BadRequestException('Estado inválido');

    return this.purchaseOrderModel
      .find({ status, isDeleted: false })
      .populate('supplierId', 'name contactEmail contactPhone')
      .populate('userId', 'profile.firstName profile.lastName email')
      .populate('items.productId', 'name sku barcode costPrice salePrice')
      .sort({ orderDate: -1 })
      .exec();
  }

  async getStats() {
    const [total, byStatus, financial, pending, completed] = await Promise.all([
      this.purchaseOrderModel.countDocuments({ isDeleted: false }),
      this.purchaseOrderModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.purchaseOrderModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, totalAmount: { $sum: '$totalAmount' }, averageOrderValue: { $avg: '$totalAmount' } } },
      ]),
      this.purchaseOrderModel.aggregate([
        { $match: { status: 'pending', isDeleted: false } },
        { $group: { _id: null, totalAmount: { $sum: '$totalAmount' } } },
      ]),
      this.purchaseOrderModel.aggregate([
        { $match: { status: 'completed', isDeleted: false } },
        { $group: { _id: null, totalAmount: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const statsByStatus: Record<string, number> = {};
    byStatus.forEach((s) => (statsByStatus[s._id] = s.count));

    const financialData = financial[0] || { totalAmount: 0, averageOrderValue: 0 };
    const pendingAmount = pending[0]?.totalAmount || 0;
    const completedAmount = completed[0]?.totalAmount || 0;

    return {
      total,
      byStatus: statsByStatus,
      totalAmount: financialData.totalAmount,
      averageOrderValue: financialData.averageOrderValue,
      pendingAmount,
      completedAmount,
    };
  }

  calculateOrderTotal(items: any[]): number {
    return items.reduce((total, item) => total + item.quantity * item.unitCost, 0);
  }

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
      pending: ['approved', 'rejected', 'cancelled'],
      approved: ['completed', 'cancelled'],
      rejected: ['pending'],
      completed: [],
      cancelled: ['pending'],
    };
    if (!allowed[current]?.includes(next)) {
      throw new BadRequestException(`Transición no permitida: ${current} → ${next}`);
    }
  }

  async approveOrder(id: string, reason?: string, reqUser?: any): Promise<PurchaseOrderDocument> {
    return this.updateStatus(id, { status: 'approved', reason }, reqUser);
  }

  async rejectOrder(id: string, reason?: string, reqUser?: any): Promise<PurchaseOrderDocument> {
    return this.updateStatus(id, { status: 'rejected', reason }, reqUser);
  }

  async completeOrder(id: string, reqUser?: any): Promise<PurchaseOrderDocument> {
    return this.updateStatus(id, { status: 'completed' }, reqUser);
  }

  async cancelOrder(id: string, reason?: string, reqUser?: any): Promise<PurchaseOrderDocument> {
    return this.updateStatus(id, { status: 'cancelled', reason }, reqUser);
  }

  /**
   * Desactivar usuario
   */
  async deactivateProduct(_id: string): Promise<PurchaseOrderDocument> {
    const product = await this.purchaseOrderModel.findOneAndUpdate(
      { _id },
      { 
        isActive: false,
        updatedAt: new Date()
      },
      { new: true }
    ).exec();

    if (!product) {
      throw new NotFoundException(`Producto con UID ${_id} no encontrado`);
    }

    return product;
  }

  /**
   * Activar usuario
   */
  async activateProduct(_id: string): Promise<PurchaseOrderDocument> {
    const product = await this.purchaseOrderModel.findOneAndUpdate(
      { _id },
      { 
        isActive: true,
        updatedAt: new Date()
      },
      { new: true }
    ).exec();

    if (!product) {
      throw new NotFoundException(`Producto con UID ${_id} no encontrado`);
    }

    return product;
  }
}