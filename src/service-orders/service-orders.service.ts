import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { ServiceOrderStatus } from './enums/service-order-status.enum';
import { ServiceOrder, ServiceOrderDocument } from './schemas/service-order.schema';

@Injectable()
export class ServiceOrdersService {
  constructor(
    @InjectModel(ServiceOrder.name) private readonly model: Model<ServiceOrderDocument>,
  ) {}

  async create(dto: CreateServiceOrderDto, technicianId: string): Promise<ServiceOrderDocument> {
    if (!Types.ObjectId.isValid(technicianId)) {
      throw new BadRequestException('technicianId no es un ObjectId válido');
    }

    // ---- cálculo del total SIEMPRE backend ----
    const itemsTotal = (dto.items ?? []).reduce(
      (sum, it) => sum + it.quantity * Math.max(it.unitPrice, 0),
      0,
    );
    const laborCost = dto.laborCost ?? 0;
    const totalCost = Math.round((itemsTotal + laborCost) * 100) / 100; // 2 decimales

    const orderNumber = await this.generateOrderNumber();

    const created = new this.model({
      ...dto,
      orderNumber,
      technicianId: new Types.ObjectId(technicianId),
      customerId: new Types.ObjectId(dto.customerId),
      status: ServiceOrderStatus.INGRESADO,
      warrantyMonths: dto.warrantyMonths ?? 3,
      totalCost,               // <-- calculado, no del cliente
      items: dto.items ?? [],
    });
    return created.save();
  }

  async findAll(filters: any) {
    const skip = (filters.page - 1) * filters.limit;
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.customerId) query.customerId = new Types.ObjectId(filters.customerId);
    if (filters.technicianId) query.technicianId = new Types.ObjectId(filters.technicianId);
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const [orders, total] = await Promise.all([
      this.model
        .find(query)
        .populate('customerId', 'fullName phone email')
        .populate('technicianId', 'displayName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit)
        .exec(),
      this.model.countDocuments(query),
    ]);

    return { orders, total, page: filters.page, totalPages: Math.ceil(total / filters.limit) };
  }

  async findOne(id: string): Promise<ServiceOrderDocument> {
    const doc = await this.model
      .findById(id)
      .populate('customerId', 'fullName phone email')
      .populate('technicianId', 'displayName email')
      .exec();
    if (!doc) throw new NotFoundException('Orden no encontrada');
    return doc;
  }

  async update(id: string, dto: UpdateServiceOrderDto): Promise<ServiceOrderDocument> {
    const doc = await this.model
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
    if (!doc) throw new NotFoundException('Orden no encontrada');
    return doc;
  }

  async changeStatus(id: string, status: ServiceOrderStatus, notes?: string): Promise<ServiceOrderDocument> {
    const update: any = { status };
    if (notes) update.notes = notes; // ✅ campo genérico

    const doc = await this.model
      .findByIdAndUpdate(id, update, { new: true })
      .exec();

    if (!doc) throw new NotFoundException('Orden no encontrada');
    return doc;
  }

  async addItem(id: string, item: any): Promise<ServiceOrderDocument> {
    const order = await this.model.findById(id);
    if (!order) throw new NotFoundException('Orden no encontrada');

    order.items.push(item);

    // ✅ Recalcular totalCost
    const totalItems = order.items.reduce(
      (sum, i) => sum + i.quantity * i.unitPrice,
      0,
    );
    order.totalCost = totalItems + (order.laborCost || 0);

    return order.save();
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const base = `OS-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const last = await this.model.findOne({ orderNumber: new RegExp(`^${base}`) }).sort({ orderNumber: -1 });
    const seq = last ? parseInt(last.orderNumber.split('-').pop() || '0') + 1 : 1;
    return `${base}-${String(seq).padStart(4, '0')}`;
  }

  async incomeReport(filters: {
    startDate?: Date;
    endDate?: Date;
    technicianId?: string;
  }) {
    const match: any = { status: { $ne: ServiceOrderStatus.CANCELADO } };
    if (filters.technicianId && Types.ObjectId.isValid(filters.technicianId)) {
      match.technicianId = new Types.ObjectId(filters.technicianId);
    }
    if (filters.startDate || filters.endDate) {
      match.createdAt = {};
      if (filters.startDate) match.createdAt.$gte = filters.startDate;
      if (filters.endDate) match.createdAt.$lte = filters.endDate;
    }

    const pipeline: any[] = [
      { $match: match },
      {
        $project: {
          laborCost: 1,
          totalCost: 1,
          items: 1,
          orderCount: { $literal: 1 },
        },
      },
      {
        $group: {
          _id: null,
          orderCount: { $sum: '$orderCount' },
          totalLabor: { $sum: '$laborCost' },
          totalInvoiced: { $sum: '$totalCost' },
          totalParts: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $multiply: ['$$this.quantity', '$$this.unitPrice'] },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          orderCount: 1,
          totalLabor: { $round: ['$totalLabor', 2] },
          totalParts: { $round: ['$totalParts', 2] },
          totalInvoiced: { $round: ['$totalInvoiced', 2] },
          grossMargin: {
            $round: [
              { $subtract: ['$totalInvoiced', { $add: ['$totalLabor', '$totalParts'] }] },
              2,
            ],
          },
        },
      },
    ];

    const [result] = await this.model.aggregate(pipeline);
    return result ?? {
      orderCount: 0,
      totalLabor: 0,
      totalParts: 0,
      totalInvoiced: 0,
      grossMargin: 0,
    };
  }
}