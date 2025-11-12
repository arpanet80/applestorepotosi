// src/purchase-orders/purchase-orders.service.ts (VERSIÓN CORREGIDA)
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { 
  PurchaseOrder, 
  PurchaseOrderDocument,
  PurchaseOrderItem 
} from './schemas/purchase-order.schema';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectModel(PurchaseOrder.name) 
    private purchaseOrderModel: Model<PurchaseOrderDocument>,
  ) {}

  async create(createPurchaseOrderDto: CreatePurchaseOrderDto): Promise<PurchaseOrderDocument> {
    this.validateOrderItems(createPurchaseOrderDto.items);

    const purchaseOrderData = {
      ...createPurchaseOrderDto,
      supplierId: new Types.ObjectId(createPurchaseOrderDto.supplierId),
      userId: new Types.ObjectId(createPurchaseOrderDto.userId),
      orderDate: createPurchaseOrderDto.orderDate || new Date(),
      status: 'pending'
    };

    const purchaseOrder = new this.purchaseOrderModel(purchaseOrderData);
    return purchaseOrder.save();
  }

  async findAll(query: PurchaseOrderQueryDto): Promise<{
    purchaseOrders: PurchaseOrderDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { 
      status, 
      supplierId, 
      search, 
      startDate, 
      endDate,
      page = 1, 
      limit = 10 
    } = query;

    const skip = (page - 1) * limit;
    const filter: any = {};

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
        { _id: Types.ObjectId.isValid(search) ? new Types.ObjectId(search) : null }
      ].filter(condition => condition._id !== null || condition.notes);
    }

    const [purchaseOrders, total] = await Promise.all([
      this.purchaseOrderModel
        .find(filter)
        .populate('supplierId', 'name contactEmail contactPhone')
        .populate('userId', 'profile.firstName profile.lastName email')
        .populate('items.productId', 'name sku barcode costPrice salePrice')
        .sort({ orderDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.purchaseOrderModel.countDocuments(filter).exec()
    ]);

    return {
      purchaseOrders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string): Promise<PurchaseOrderDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de orden de compra inválido');
    }

    const purchaseOrder = await this.purchaseOrderModel
      .findById(id)
      .populate('supplierId')
      .populate('userId', 'profile.firstName profile.lastName email')
      .populate('items.productId', 'name sku barcode costPrice salePrice stockQuantity')
      .exec();

    if (!purchaseOrder) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    return purchaseOrder;
  }

  async update(id: string, updatePurchaseOrderDto: UpdatePurchaseOrderDto): Promise<PurchaseOrderDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de orden de compra inválido');
    }

    const existingOrder = await this.purchaseOrderModel.findById(id).exec();
    if (!existingOrder) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    if (['completed', 'approved'].includes(existingOrder.status)) {
      throw new ConflictException('No se puede editar una orden completada o aprobada');
    }

    if (updatePurchaseOrderDto.items) {
      this.validateOrderItems(updatePurchaseOrderDto.items);
    }

    const updateData: any = { ...updatePurchaseOrderDto };
    if (updatePurchaseOrderDto.supplierId) {
      updateData.supplierId = new Types.ObjectId(updatePurchaseOrderDto.supplierId);
    }
    if (updatePurchaseOrderDto.userId) {
      updateData.userId = new Types.ObjectId(updatePurchaseOrderDto.userId);
    }

    const purchaseOrder = await this.purchaseOrderModel
      .findByIdAndUpdate(id, updateData, { 
        new: true, 
        runValidators: true 
      })
      .populate('supplierId', 'name contactEmail contactPhone')
      .populate('userId', 'profile.firstName profile.lastName email')
      .populate('items.productId', 'name sku barcode costPrice salePrice')
      .exec();

    if (!purchaseOrder) {
      throw new NotFoundException('Orden de compra no encontrada después de la actualización');
    }

    return purchaseOrder;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de orden de compra inválido');
    }

    const purchaseOrder = await this.purchaseOrderModel.findById(id).exec();
    if (!purchaseOrder) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    if (['completed', 'approved'].includes(purchaseOrder.status)) {
      throw new ConflictException('No se puede eliminar una orden completada o aprobada');
    }

    const result = await this.purchaseOrderModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Orden de compra no encontrada');
    }
  }

  async updateStatus(id: string, updateStatusDto: UpdateStatusDto): Promise<PurchaseOrderDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de orden de compra inválido');
    }

    const existingOrder = await this.purchaseOrderModel.findById(id).exec();
    if (!existingOrder) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    this.validateStatusTransition(existingOrder.status, updateStatusDto.status);

    const updateData: any = { status: updateStatusDto.status };
    if (updateStatusDto.reason) {
      const currentNotes = existingOrder.notes || '';
      updateData.notes = currentNotes + 
        `\n[Cambio de estado: ${existingOrder.status} → ${updateStatusDto.status}] ${updateStatusDto.reason}`;
    }

    const purchaseOrder = await this.purchaseOrderModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('supplierId', 'name contactEmail contactPhone')
      .populate('userId', 'profile.firstName profile.lastName email')
      .populate('items.productId', 'name sku barcode costPrice salePrice')
      .exec();

    if (!purchaseOrder) {
      throw new NotFoundException('Orden de compra no encontrada después de actualizar el estado');
    }

    return purchaseOrder;
  }

  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      pending: ['approved', 'rejected', 'cancelled'],
      approved: ['completed', 'cancelled'],
      rejected: ['pending'],
      completed: [],
      cancelled: ['pending']
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Transición de estado no permitida: ${currentStatus} → ${newStatus}. ` +
        `Transiciones válidas: ${allowedTransitions.join(', ')}`
      );
    }
  }

  async findBySupplier(supplierId: string): Promise<PurchaseOrderDocument[]> {
    if (!Types.ObjectId.isValid(supplierId)) {
      throw new BadRequestException('ID de proveedor inválido');
    }

    const orders = await this.purchaseOrderModel
      .find({ supplierId: new Types.ObjectId(supplierId) })
      .populate('supplierId', 'name contactEmail contactPhone')
      .populate('userId', 'profile.firstName profile.lastName email')
      .populate('items.productId', 'name sku barcode costPrice salePrice')
      .sort({ orderDate: -1 })
      .exec();

    return orders;
  }

  async findByStatus(status: string): Promise<PurchaseOrderDocument[]> {
    if (!['pending', 'approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
      throw new BadRequestException('Estado de orden inválido');
    }

    const orders = await this.purchaseOrderModel
      .find({ status })
      .populate('supplierId', 'name contactEmail contactPhone')
      .populate('userId', 'profile.firstName profile.lastName email')
      .populate('items.productId', 'name sku barcode costPrice salePrice')
      .sort({ orderDate: -1 })
      .exec();

    return orders;
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    totalAmount: number;
    averageOrderValue: number;
    pendingAmount: number;
    completedAmount: number;
  }> {
    const [total, byStatus, financialStats, pendingStats, completedStats] = await Promise.all([
      this.purchaseOrderModel.countDocuments(),
      this.purchaseOrderModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      this.purchaseOrderModel.aggregate([
        { $group: { _id: null, totalAmount: { $sum: '$totalAmount' }, averageOrderValue: { $avg: '$totalAmount' } } }
      ]),
      this.purchaseOrderModel.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, totalAmount: { $sum: '$totalAmount' } } }
      ]),
      this.purchaseOrderModel.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, totalAmount: { $sum: '$totalAmount' } } }
      ])
    ]);

    const statsByStatus: Record<string, number> = {};
    byStatus.forEach(stat => { statsByStatus[stat._id] = stat.count; });

    const financial = financialStats[0] || { totalAmount: 0, averageOrderValue: 0 };
    const pendingAmount = pendingStats[0]?.totalAmount || 0;
    const completedAmount = completedStats[0]?.totalAmount || 0;

    return {
      total,
      byStatus: statsByStatus,
      totalAmount: financial.totalAmount,
      averageOrderValue: financial.averageOrderValue,
      pendingAmount,
      completedAmount
    };
  }

  calculateOrderTotal(items: PurchaseOrderItem[]): number {
    return items.reduce((total, item) => total + (item.quantity * item.unitCost), 0);
  }

  validateOrderItems(items: any[]): void {
    if (!items || items.length === 0) {
      throw new BadRequestException('La orden debe contener al menos un item');
    }

    items.forEach((item, index) => {
      if (!item.productId) {
        throw new BadRequestException(`El item ${index + 1} debe tener un productId válido`);
      }
      if (item.quantity <= 0) {
        throw new BadRequestException(`La cantidad del item ${index + 1} debe ser mayor a 0`);
      }
      if (item.unitCost < 0) {
        throw new BadRequestException(`El costo unitario del item ${index + 1} no puede ser negativo`);
      }
    });
  }

  async approveOrder(id: string, reason?: string): Promise<PurchaseOrderDocument> {
    return this.updateStatus(id, { status: 'approved', reason });
  }

  async rejectOrder(id: string, reason?: string): Promise<PurchaseOrderDocument> {
    return this.updateStatus(id, { status: 'rejected', reason });
  }

  async completeOrder(id: string): Promise<PurchaseOrderDocument> {
    return this.updateStatus(id, { status: 'completed' });
  }

  async cancelOrder(id: string, reason?: string): Promise<PurchaseOrderDocument> {
    return this.updateStatus(id, { status: 'cancelled', reason });
  }
}