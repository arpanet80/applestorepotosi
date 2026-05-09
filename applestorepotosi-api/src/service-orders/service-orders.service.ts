// src/service-orders/service-orders.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession, Schema } from 'mongoose';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import {
  ServiceOrderStatus,
  isValidStatusTransition,
  BILLED_STATUSES,
  TERMINAL_STATUSES,
} from './enums/service-order-status.enum';
import { ServiceOrder, ServiceOrderDocument } from './schemas/service-order.schema';

/* ---------- constantes ---------- */
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class ServiceOrdersService {
  constructor(
    @InjectModel(ServiceOrder.name)
    private readonly model: Model<ServiceOrderDocument>,
  ) {}

  /* ========== helpers privados ========== */

  /**
   * Recalcula el totalCost basado en items + laborCost.
   */
  private recalculateTotal(order: ServiceOrderDocument): number {
    const itemsTotal = (order.items ?? []).reduce(
      (sum, it) => sum + it.quantity * Math.max(it.unitPrice, 0),
      0,
    );
    const laborCost = order.laborCost ?? 0;
    return Math.round((itemsTotal + laborCost) * 100) / 100;
  }

  /**
   * Genera número de orden único usando counter collection (atómico).
   */
  private async generateOrderNumber(session?: ClientSession): Promise<string> {
    const date = new Date();
    const base = `OS-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

    const conn = this.model.db;
    const counterSchema = new Schema(
      {
        _id: { type: String, required: true },
        seq: { type: Number, default: 0 },
      },
      { collection: 'service_order_counters' },
    );

    const counterModel = conn.model('ServiceOrderCounter', counterSchema);

    const result = await counterModel.findOneAndUpdate(
      { _id: base } as any,
      { $inc: { seq: 1 } },
      { upsert: true, new: true, session } as any,
    ) as any;

    const seq = result ? result.seq ?? 1 : 1;
    return `${base}-${String(seq).padStart(4, '0')}`;
  }

  /**
   * Sanitiza y limita el tamaño de página.
   */
  private sanitizePagination(page: number, limit: number): { page: number; limit: number; skip: number } {
    const p = Math.max(1, Math.floor(page));
    const l = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(limit)));
    return { page: p, limit: l, skip: (p - 1) * l };
  }

  /**
   * Parsea fechas de string de forma segura.
   */
  private parseDate(value: string | undefined): Date | undefined {
    if (!value) return undefined;
    const d = new Date(value);
    if (isNaN(d.getTime())) return undefined;
    return d;
  }

  /* ========== CREATE ========== */

  async create(
    dto: CreateServiceOrderDto,
    technicianId: string,
  ): Promise<ServiceOrderDocument> {
    if (!Types.ObjectId.isValid(technicianId)) {
      throw new BadRequestException('technicianId no es un ObjectId válido');
    }

    const itemsTotal = (dto.items ?? []).reduce(
      (sum, it) => sum + it.quantity * Math.max(it.unitPrice, 0),
      0,
    );
    const laborCost = dto.laborCost ?? 0;
    const totalCost = Math.round((itemsTotal + laborCost) * 100) / 100;

    const orderNumber = await this.generateOrderNumber();

    const created = new this.model({
      ...dto,
      orderNumber,
      technicianId: new Types.ObjectId(technicianId),
      customerId: new Types.ObjectId(dto.customerId),
      status: ServiceOrderStatus.PENDIENTE,
      warrantyMonths: dto.warrantyMonths ?? 3,
      totalCost,
      items: dto.items ?? [],
      statusHistory: [
        {
          status: ServiceOrderStatus.PENDIENTE,
          changedBy: new Types.ObjectId(technicianId),
          changedAt: new Date(),
          notes: 'Orden creada',
        },
      ],
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
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    const { page, limit, skip } = this.sanitizePagination(filters.page, filters.limit);
    const query: Record<string, any> = {};

    if (filters.status) query.status = filters.status;

    if (filters.customerId && Types.ObjectId.isValid(filters.customerId)) {
      query.customerId = new Types.ObjectId(filters.customerId);
    }

    if (filters.technicianId && Types.ObjectId.isValid(filters.technicianId)) {
      query.technicianId = new Types.ObjectId(filters.technicianId);
    }

    const startDate = this.parseDate(filters.startDate);
    const endDate = this.parseDate(filters.endDate);

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    // Búsqueda por texto en orderNumber, symptom, device.model
    if (filters.search?.trim()) {
      const searchRegex = new RegExp(filters.search.trim(), 'i');
      query.$or = [
        { orderNumber: searchRegex },
        { symptom: searchRegex },
        { 'device.model': searchRegex },
        { 'device.type': searchRegex },
      ];
    }

    const [orders, total] = await Promise.all([
      this.model
        .find(query)
        .populate('customerId', 'fullName phone email')
        .populate('technicianId', 'displayName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.model.countDocuments(query),
    ]);

    return {
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /* ========== FIND ONE ========== */

  async findOne(id: string): Promise<ServiceOrderDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }
    const doc = await this.model
      .findById(id)
      .populate('customerId', 'fullName phone email')
      .populate('technicianId', 'displayName email')
      .exec();
    if (!doc) throw new NotFoundException('Orden no encontrada');
    return doc;
  }

  /* ========== UPDATE ========== */

  async update(
    id: string,
    dto: UpdateServiceOrderDto,
    userId: string,
  ): Promise<ServiceOrderDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    // 1. Verificar que la orden existe
    const order = await this.model.findById(id);
    if (!order) throw new NotFoundException('Orden no encontrada');

    // 2. No permitir editar órdenes terminadas o canceladas
    if (TERMINAL_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        `No se puede editar una orden que ya está ${order.status}`,
      );
    }

    // 3. Preparar update: nunca permitir customerId ni device desde el DTO
    const updateData: Record<string, any> = {};
    const allowedFields = [
      'symptom',
      'description',
      'photos',
      'items',
      'laborCost',
      'warrantyMonths',
      'diagnosisNotes',
      'repairNotes',
      'testNotes',
      'deliveryNotes',
      'isWarranty',
    ];

    for (const field of allowedFields) {
      if (dto[field as keyof UpdateServiceOrderDto] !== undefined) {
        updateData[field] = dto[field as keyof UpdateServiceOrderDto];
      }
    }

    // 4. Si se actualizan items o laborCost, recalcular totalCost
    const shouldRecalculate =
      updateData.items !== undefined || updateData.laborCost !== undefined;

    if (shouldRecalculate) {
      const tempItems = updateData.items ?? order.items;
      const tempLabor = updateData.laborCost ?? order.laborCost;
      const itemsTotal = (tempItems ?? []).reduce(
        (sum: number, it: any) => sum + it.quantity * Math.max(it.unitPrice, 0),
        0,
      );
      updateData.totalCost = Math.round((itemsTotal + tempLabor) * 100) / 100;
    }

    const doc = await this.model
      .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .exec();

    if (!doc) throw new NotFoundException('Orden no encontrada');
    return doc;
  }

  /* ========== CHANGE STATUS ========== */

  async changeStatus(
    id: string,
    newStatus: ServiceOrderStatus,
    notes: string | undefined,
    changedBy: string,
  ): Promise<ServiceOrderDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }
    if (!Types.ObjectId.isValid(changedBy)) {
      throw new BadRequestException('changedBy no es un ObjectId válido');
    }

    const order = await this.model.findById(id);
    if (!order) throw new NotFoundException('Orden no encontrada');

    // Validar transición de estado
    if (!isValidStatusTransition(order.status, newStatus)) {
      throw new BadRequestException(
        `Transición de estado inválida: no se puede cambiar de "${order.status}" a "${newStatus}"`,
      );
    }

    // No permitir cambios en órdenes terminadas
    if (TERMINAL_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        `No se puede cambiar el estado de una orden ${order.status}`,
      );
    }

    const update: Record<string, any> = {
      status: newStatus,
      $push: {
        statusHistory: {
          status: newStatus,
          changedBy: new Types.ObjectId(changedBy),
          changedAt: new Date(),
          notes: notes ?? '',
        },
      },
    };

    // Guardar notas específicas según el nuevo estado
    if (notes) {
      if (newStatus === ServiceOrderStatus.EN_PROCESO) {
        update.diagnosisNotes = notes;
      } else if (newStatus === ServiceOrderStatus.COMPLETADA) {
        update.deliveryNotes = notes;
      }
    }

    const doc = await this.model
      .findByIdAndUpdate(id, update, { new: true })
      .exec();

    if (!doc) throw new NotFoundException('Orden no encontrada');

    return doc;
  }

  /* ========== ADD ITEM ========== */

  async addItem(
    id: string,
    item: {
      partName: string;
      quantity: number;
      unitCost: number;
      unitPrice: number;
      notes?: string;
    },
  ): Promise<ServiceOrderDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    // Validar item antes de agregar
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

    // Verificar que la orden no esté cancelada o completada
    if (TERMINAL_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        `No se pueden agregar items a una orden ${order.status}`,
      );
    }

    order.items.push(item as any);
    order.totalCost = this.recalculateTotal(order);

    return order.save();
  }

  /* ========== REMOVE ITEM ========== */

  async removeItem(
    id: string,
    itemIndex: number,
  ): Promise<ServiceOrderDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    const order = await this.model.findById(id);
    if (!order) throw new NotFoundException('Orden no encontrada');

    if (TERMINAL_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        `No se pueden eliminar items de una orden ${order.status}`,
      );
    }

    if (itemIndex < 0 || itemIndex >= order.items.length) {
      throw new BadRequestException('Índice de item inválido');
    }

    order.items.splice(itemIndex, 1);
    order.totalCost = this.recalculateTotal(order);

    return order.save();
  }

  /* ========== INCOME REPORT ========== */

  async incomeReport(filters: {
    startDate?: string;
    endDate?: string;
    technicianId?: string;
  }) {
    const match: Record<string, any> = {
      status: { $in: BILLED_STATUSES },
    };

    if (filters.technicianId && Types.ObjectId.isValid(filters.technicianId)) {
      match.technicianId = new Types.ObjectId(filters.technicianId);
    }

    const startDate = this.parseDate(filters.startDate);
    const endDate = this.parseDate(filters.endDate);

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    const pipeline: any[] = [
      { $match: match },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 },
          totalLabor: { $sum: '$laborCost' },
          totalInvoiced: { $sum: '$totalCost' },
          totalPartsRevenue: {
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
          totalPartsCost: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $multiply: ['$$this.quantity', '$$this.unitCost'] },
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
          totalPartsRevenue: { $round: ['$totalPartsRevenue', 2] },
          totalPartsCost: { $round: ['$totalPartsCost', 2] },
          totalInvoiced: { $round: ['$totalInvoiced', 2] },
          grossMargin: {
            $round: [
              {
                $subtract: [
                  '$totalInvoiced',
                  { $add: ['$totalLabor', '$totalPartsCost'] },
                ],
              },
              2,
            ],
          },
          grossMarginPercent: {
            $round: [
              {
                $cond: [
                  { $eq: ['$totalInvoiced', 0] },
                  0,
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $subtract: [
                              '$totalInvoiced',
                              { $add: ['$totalLabor', '$totalPartsCost'] },
                            ],
                          },
                          '$totalInvoiced',
                        ],
                      },
                      100,
                    ],
                  },
                ],
              },
              2,
            ],
          },
        },
      },
    ];

    const [result] = await this.model.aggregate(pipeline);
    return (
      result ?? {
        orderCount: 0,
        totalLabor: 0,
        totalPartsRevenue: 0,
        totalPartsCost: 0,
        totalInvoiced: 0,
        grossMargin: 0,
        grossMarginPercent: 0,
      }
    );
  }

  /* ========== MIGRACIÓN DE DATOS ========== */

  /**
   * Migra los estados antiguos (7 estados) a los nuevos estados simplificados (4 estados).
   * Mapeo:
   *   INGRESADO, DIAGNOSTICADO → PENDIENTE
   *   APROBADO, REPARADO       → EN_PROCESO
   *   ENTREGADO, FINALIZADO    → COMPLETADA
   *   CANCELADO                → CANCELADA
   *
   * Ejecutar UNA SOLA VEZ en producción después del deploy.
   */
  async migrateStatuses(): Promise<{ updated: number; errors: string[] }> {
    const migrationMap: Record<string, ServiceOrderStatus> = {
      ingresado: ServiceOrderStatus.PENDIENTE,
      diagnosticado: ServiceOrderStatus.PENDIENTE,
      aprobado: ServiceOrderStatus.EN_PROCESO,
      reparado: ServiceOrderStatus.EN_PROCESO,
      entregado: ServiceOrderStatus.COMPLETADA,
      finalizado: ServiceOrderStatus.COMPLETADA,
      cancelado: ServiceOrderStatus.CANCELADA,
    };

    const oldStatuses = Object.keys(migrationMap);
    const errors: string[] = [];
    let updated = 0;

    for (const oldStatus of oldStatuses) {
      const newStatus = migrationMap[oldStatus];
      try {
        const result = await this.model.updateMany(
          { status: oldStatus },
          { $set: { status: newStatus } },
        );
        updated += result.modifiedCount || 0;
      } catch (err: any) {
        errors.push(`Error migrando "${oldStatus}" → "${newStatus}": ${err.message}`);
      }
    }

    return { updated, errors };
  }

  
}