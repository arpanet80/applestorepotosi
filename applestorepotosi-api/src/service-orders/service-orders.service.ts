// src/service-orders/service-orders.service.ts
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

  /* ========== CREATE ========== */

  async create(dto: CreateServiceOrderDto, technicianId: string): Promise<ServiceOrderDocument> {
    // ✅ FIX #11: technicianId viene del controller como MongoDB _id string (ObjectId válido)
    // La validación es correcta — solo verificamos formato aquí
    if (!Types.ObjectId.isValid(technicianId)) {
      throw new BadRequestException('technicianId no es un ObjectId válido');
    }

    // Total calculado siempre en backend
    const itemsTotal = (dto.items ?? []).reduce(
      (sum, it) => sum + it.quantity * Math.max(it.unitPrice, 0),
      0,
    );
    const laborCost  = dto.laborCost ?? 0;
    const totalCost  = Math.round((itemsTotal + laborCost) * 100) / 100;

    const orderNumber = await this.generateOrderNumber();

    const created = new this.model({
      ...dto,
      orderNumber,
      technicianId: new Types.ObjectId(technicianId),
      customerId:   new Types.ObjectId(dto.customerId),
      status:       ServiceOrderStatus.INGRESADO,
      warrantyMonths: dto.warrantyMonths ?? 3,
      totalCost,
      items: dto.items ?? [],
    });
    return created.save();
  }

  /* ========== FIND ALL ========== */

  async findAll(filters: {
    page: number;
    limit: number;
    status?: string;
    customerId?: string;
    technicianId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const skip = (filters.page - 1) * filters.limit;
    const query: Record<string, any> = {};

    if (filters.status) query.status = filters.status;
    if (filters.customerId && Types.ObjectId.isValid(filters.customerId)) {
      query.customerId = new Types.ObjectId(filters.customerId);
    }
    if (filters.technicianId && Types.ObjectId.isValid(filters.technicianId)) {
      query.technicianId = new Types.ObjectId(filters.technicianId);
    }
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate)   query.createdAt.$lte = filters.endDate;
    }

    const [orders, total] = await Promise.all([
      this.model
        .find(query)
        .populate('customerId',   'fullName phone email')
        .populate('technicianId', 'displayName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit)
        .exec(),
      this.model.countDocuments(query),
    ]);

    return { orders, total, page: filters.page, totalPages: Math.ceil(total / filters.limit) };
  }

  /* ========== FIND ONE ========== */

  async findOne(id: string): Promise<ServiceOrderDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const doc = await this.model
      .findById(id)
      .populate('customerId',   'fullName phone email')
      .populate('technicianId', 'displayName email')
      .exec();
    if (!doc) throw new NotFoundException('Orden no encontrada');
    return doc;
  }

  /* ========== UPDATE ========== */

  async update(id: string, dto: UpdateServiceOrderDto): Promise<ServiceOrderDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const doc = await this.model
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
    if (!doc) throw new NotFoundException('Orden no encontrada');
    return doc;
  }

  /* ========== CHANGE STATUS ========== */

  async changeStatus(
    id: string,
    status: ServiceOrderStatus,
    notes?: string,
  ): Promise<ServiceOrderDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');

    const update: Record<string, any> = { status };
    if (notes) update.notes = notes;

    const doc = await this.model.findByIdAndUpdate(id, update, { new: true }).exec();
    if (!doc) throw new NotFoundException('Orden no encontrada');
    return doc;
  }

  /* ========== ADD ITEM ========== */

  async addItem(id: string, item: any): Promise<ServiceOrderDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');

    // ✅ FIX #12: validar item antes de agregar
    if (!item.partName?.trim()) {
      throw new BadRequestException('partName es requerido');
    }
    if (!item.quantity || item.quantity < 1) {
      throw new BadRequestException('quantity debe ser >= 1');
    }
    if (item.unitPrice === undefined || item.unitPrice < 0) {
      throw new BadRequestException('unitPrice debe ser >= 0');
    }
    if (item.unitCost === undefined || item.unitCost < 0) {
      throw new BadRequestException('unitCost debe ser >= 0');
    }

    const order = await this.model.findById(id);
    if (!order) throw new NotFoundException('Orden no encontrada');

    order.items.push(item);

    // Recalcular totalCost
    const totalItems = order.items.reduce(
      (sum, i) => sum + i.quantity * i.unitPrice,
      0,
    );
    order.totalCost = Math.round((totalItems + (order.laborCost || 0)) * 100) / 100;

    return order.save();
  }

  /* ========== GENERATE ORDER NUMBER ========== */

  // ✅ FIX #10: mismo patrón robusto — retry con exists()
  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const base = `OS-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

    const MAX_RETRIES = 10;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const last = await this.model
        .findOne({ orderNumber: new RegExp(`^${base}`) })
        .sort({ orderNumber: -1 })
        .select('orderNumber')
        .lean()
        .exec();

      const nextSeq = last
        ? parseInt((last.orderNumber as string).split('-').pop() ?? '0', 10) + 1
        : 1;

      const candidate = `${base}-${String(nextSeq).padStart(4, '0')}`;
      const exists = await this.model.exists({ orderNumber: candidate });
      if (!exists) return candidate;
    }
    throw new Error(`No se pudo generar número de orden único para ${base}`);
  }

  /* ========== INCOME REPORT ========== */

  async incomeReport(filters: {
    startDate?: Date;
    endDate?: Date;
    technicianId?: string;
  }) {
    const match: Record<string, any> = { status: { $ne: ServiceOrderStatus.CANCELADO } };

    if (filters.technicianId && Types.ObjectId.isValid(filters.technicianId)) {
      match.technicianId = new Types.ObjectId(filters.technicianId);
    }
    if (filters.startDate || filters.endDate) {
      match.createdAt = {};
      if (filters.startDate) match.createdAt.$gte = filters.startDate;
      if (filters.endDate)   match.createdAt.$lte = filters.endDate;
    }

    const pipeline: any[] = [
      { $match: match },
      {
        $group: {
          _id:            null,
          orderCount:     { $sum: 1 },
          totalLabor:     { $sum: '$laborCost' },
          totalInvoiced:  { $sum: '$totalCost' },
          totalParts: {
            $sum: {
              $reduce: {
                input:        '$items',
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
          _id:            0,
          orderCount:     1,
          totalLabor:     { $round: ['$totalLabor',    2] },
          totalParts:     { $round: ['$totalParts',    2] },
          totalInvoiced:  { $round: ['$totalInvoiced', 2] },
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
      orderCount:    0,
      totalLabor:    0,
      totalParts:    0,
      totalInvoiced: 0,
      grossMargin:   0,
    };
  }
}