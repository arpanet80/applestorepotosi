// src/audit-logs/audit-logs.service.ts (VERSIÓN CORREGIDA)
import { Injectable, NotFoundException, BadRequestException,ConflictException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument,AuditAction,AuditCollection} from './schemas/audit-log.schema';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditStatsQueryDto } from './dto/audit-stats-query.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name) 
    private auditLogModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Crear nuevo registro de auditoría
   */
  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLogDocument> {
    // Validar datos del registro
    this.validateAuditLog(createAuditLogDto);

    const auditLogData = {
      ...createAuditLogDto,
      userId: new Types.ObjectId(createAuditLogDto.userId),
      ...(createAuditLogDto.documentId && { 
        documentId: new Types.ObjectId(createAuditLogDto.documentId) 
      }),
      timestamp: createAuditLogDto.timestamp || new Date()
    };

    const auditLog = new this.auditLogModel(auditLogData);
    return auditLog.save();
  }

  /**
   * Registrar acción de forma conveniente
   */
  async logAction(
    userId: string,
    collectionName: AuditCollection,
    action: AuditAction,
    documentId?: string,
    before?: any,
    after?: any,
    notes?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLogDocument> {
    const auditLogDto: CreateAuditLogDto = {
      userId,
      collectionName,
      action,
      documentId,
      before,
      after,
      notes,
      ipAddress,
      userAgent,
      timestamp: new Date()
    };

    return this.create(auditLogDto);
  }

  /**
   * Obtener todos los registros de auditoría con filtros
   */
  async findAll(query: AuditLogQueryDto): Promise<{
    auditLogs: AuditLogDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { 
      userId, 
      collectionName, 
      action, 
      documentId,
      startDate, 
      endDate,
      isSensitive,
      severity,
      search,
      page = 1, 
      limit = 50 
    } = query;

    const skip = (page - 1) * limit;
    const filter: any = {};

    // Filtrar por usuario
    if (userId && Types.ObjectId.isValid(userId)) {
      filter.userId = new Types.ObjectId(userId);
    }

    // Filtrar por colección
    if (collectionName) {
      filter.collection = collectionName;
    }

    // Filtrar por acción
    if (action) {
      filter.action = action;
    }

    // Filtrar por documento
    if (documentId && Types.ObjectId.isValid(documentId)) {
      filter.documentId = new Types.ObjectId(documentId);
    }

    // Filtrar por sensibilidad
    if (isSensitive !== undefined) {
      filter.isSensitive = isSensitive;
    }

    // Filtrar por severidad
    if (severity) {
      filter.severity = severity;
    }

    // Filtrar por rango de fechas
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Búsqueda por notas o userAgent
    if (search) {
      filter.$or = [
        { notes: { $regex: search, $options: 'i' } },
        { userAgent: { $regex: search, $options: 'i' } }
      ];
    }

    const [auditLogs, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .populate('userId', 'profile.firstName profile.lastName email role.name')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(filter).exec()
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      auditLogs,
      total,
      page,
      totalPages
    };
  }

  /**
   * Obtener registro de auditoría por ID
   */
  async findOne(id: string): Promise<AuditLogDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de registro de auditoría inválido');
    }

    const auditLog = await this.auditLogModel
      .findById(id)
      .populate('userId', 'profile.firstName profile.lastName email role.name')
      .exec();

    if (!auditLog) {
      throw new NotFoundException('Registro de auditoría no encontrado');
    }

    return auditLog;
  }

  /**
   * Actualizar registro de auditoría (solo para correcciones menores)
   */
  async update(id: string, updateAuditLogDto: UpdateAuditLogDto): Promise<AuditLogDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de registro de auditoría inválido');
    }

    const existingLog = await this.auditLogModel.findById(id).exec();
    if (!existingLog) {
      throw new NotFoundException('Registro de auditoría no encontrado');
    }

    // Restricciones estrictas para actualización de logs de auditoría
    // Solo permitir actualizar campos no críticos
    const allowedUpdates = ['notes', 'isSensitive', 'severity'];
    const updateData: any = {};

    Object.keys(updateAuditLogDto).forEach(key => {
      if (allowedUpdates.includes(key) && updateAuditLogDto[key] !== undefined) {
        updateData[key] = updateAuditLogDto[key];
      }
    });

    // Validar que no se intenten modificar campos críticos
    const criticalFields = ['userId', 'collectionName', 'action', 'documentId', 'before', 'after', 'timestamp'];
    const hasCriticalUpdates = criticalFields.some(field => updateAuditLogDto[field] !== undefined);
    
    if (hasCriticalUpdates) {
      throw new BadRequestException('No se pueden modificar campos críticos del registro de auditoría');
    }

    // SOLUCIÓN SIMPLE: Eliminar el array modificationNotes y hacerlo directamente
    let modificationText = '';
    
    if (updateData.isSensitive !== undefined || updateData.severity !== undefined) {
      const modifications: string[] = [];
      
      if (updateData.isSensitive !== undefined) {
        modifications.push(`Sensibilidad cambiada a: ${updateData.isSensitive}`);
      }
      if (updateData.severity !== undefined) {
        modifications.push(`Severidad cambiada a: ${updateData.severity}`);
      }
      
      modificationText = `[Modificación: ${new Date().toISOString()}] ${modifications.join(', ')}`;
    }

    // Agregar notas de modificación si hay cambios
    if (modificationText) {
      updateData.notes = existingLog.notes 
        ? `${existingLog.notes}\n${modificationText}`
        : modificationText;
    }

    const auditLog = await this.auditLogModel
      .findByIdAndUpdate(id, updateData, { 
        new: true, 
        runValidators: true 
      })
      .populate('userId', 'profile.firstName profile.lastName email')
      .exec();

    if (!auditLog) {
      throw new NotFoundException('Registro de auditoría no encontrado después de la actualización');
    }

    return auditLog;
  }

  /**
   * Eliminar registro de auditoría (solo para administradores)
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de registro de auditoría inválido');
    }

    const result = await this.auditLogModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Registro de auditoría no encontrado');
    }
  }

  /**
   * Obtener registros por usuario
   */
  async findByUser(userId: string): Promise<AuditLogDocument[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const auditLogs = await this.auditLogModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('userId', 'profile.firstName profile.lastName email')
      .sort({ timestamp: -1 })
      .exec();

    return auditLogs;
  }

  /**
   * Obtener registros por colección
   */
  async findByCollection(collectionName: AuditCollection): Promise<AuditLogDocument[]> {
    const auditLogs = await this.auditLogModel
      .find({ collectionName })
      .populate('userId', 'profile.firstName profile.lastName email')
      .sort({ timestamp: -1 })
      .exec();

    return auditLogs;
  }

  /**
   * Obtener registros por acción
   */
  async findByAction(action: AuditAction): Promise<AuditLogDocument[]> {
    const auditLogs = await this.auditLogModel
      .find({ action })
      .populate('userId', 'profile.firstName profile.lastName email')
      .sort({ timestamp: -1 })
      .exec();

    return auditLogs;
  }

  /**
   * Obtener registros por documento específico
   */
  async findByDocument(collectionName: AuditCollection, documentId: string): Promise<AuditLogDocument[]> {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException('ID de documento inválido');
    }

    const auditLogs = await this.auditLogModel
      .find({ 
        collectionName, 
        documentId: new Types.ObjectId(documentId) 
      })
      .populate('userId', 'profile.firstName profile.lastName email')
      .sort({ timestamp: -1 })
      .exec();

    return auditLogs;
  }

  /**
   * Obtener estadísticas de auditoría
   */
  async getStats(query: AuditStatsQueryDto): Promise<{
    total: number;
    byAction: Record<string, number>;
    byCollection: Record<string, number>;
    byUser: Array<{ user: any, count: number }>;
    bySeverity: Record<string, number>;
    dailyActivity: any[];
  }> {
    const { startDate, endDate, collectionName, groupBy = 'day' } = query;

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }

    if (collectionName) {
      dateFilter.collection = collectionName;
    }

    const [total, byAction, byCollection, byUser, bySeverity, dailyActivity] = await Promise.all([
      this.auditLogModel.countDocuments(dateFilter),
      this.auditLogModel.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$action', count: { $sum: 1 } } }
      ]),
      this.auditLogModel.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$collectionName', count: { $sum: 1 } } }
      ]),
      this.auditLogModel.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' }
      ]),
      this.auditLogModel.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      this.auditLogModel.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              date: { 
                $dateToString: { 
                  format: groupBy === 'day' ? '%Y-%m-%d' : groupBy === 'week' ? '%Y-%U' : '%Y-%m', 
                  date: '$timestamp' 
                } 
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ])
    ]);

    const statsByAction: Record<string, number> = {};
    byAction.forEach(stat => { statsByAction[stat._id] = stat.count; });

    const statsByCollection: Record<string, number> = {};
    byCollection.forEach(stat => { statsByCollection[stat._id] = stat.count; });

    const statsBySeverity: Record<string, number> = {};
    bySeverity.forEach(stat => { statsBySeverity[stat._id] = stat.count; });

    return {
      total,
      byAction: statsByAction,
      byCollection: statsByCollection,
      byUser: byUser.map(stat => ({
        user: stat.user,
        count: stat.count
      })),
      bySeverity: statsBySeverity,
      dailyActivity
    };
  }

  /**
   * Obtener actividad reciente
   */
  async getRecentActivity(limit: number = 20): Promise<AuditLogDocument[]> {
    const auditLogs = await this.auditLogModel
      .find()
      .populate('userId', 'profile.firstName profile.lastName email')
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();

    return auditLogs;
  }

  /**
   * Limpiar registros antiguos (más de X días)
   */
  async cleanupOldLogs(days: number = 365): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.auditLogModel
      .deleteMany({ 
        timestamp: { $lt: cutoffDate },
        isSensitive: false // No eliminar registros sensibles
      })
      .exec();

    return { deletedCount: result.deletedCount || 0 };
  }

  /**
   * Exportar registros de auditoría
   */
  async exportLogs(query: AuditLogQueryDto): Promise<AuditLogDocument[]> {
    const { 
      userId, 
      collectionName, 
      action, 
      startDate, 
      endDate 
    } = query;

    const filter: any = {};

    if (userId && Types.ObjectId.isValid(userId)) {
      filter.userId = new Types.ObjectId(userId);
    }
    if (collectionName) filter.collection = collectionName;
    if (action) filter.action = action;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const auditLogs = await this.auditLogModel
      .find(filter)
      .populate('userId', 'profile.firstName profile.lastName email')
      .sort({ timestamp: -1 })
      .exec();

    return auditLogs;
  }

  /**
   * Validar registro de auditoría
   */
  private validateAuditLog(auditLog: CreateAuditLogDto): void {
    // Validar que para acciones de documento haya documentId
    if (['create', 'read', 'update', 'delete'].includes(auditLog.action) && !auditLog.documentId) {
      throw new BadRequestException('documentId es requerido para acciones de documento');
    }

    // Validar que no se envíen datos sensibles en texto plano
    if (this.containsSensitiveData(auditLog.before) || this.containsSensitiveData(auditLog.after)) {
      throw new BadRequestException('No se permiten datos sensibles en los registros de auditoría');
    }
  }

  /**
   * Detectar datos sensibles
   */
  private containsSensitiveData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard', 'rfc', 'curp'];
    const dataString = JSON.stringify(data).toLowerCase();
    
    return sensitiveFields.some(field => dataString.includes(field.toLowerCase()));
  }

  /**
   * Métodos de conveniencia para acciones comunes
   */
  async logLogin(userId: string, ipAddress?: string, userAgent?: string): Promise<AuditLogDocument> {
    return this.logAction(
      userId,
      'users' as AuditCollection,
      'login' as AuditAction,
      undefined,
      undefined,
      undefined,
      'Inicio de sesión',
      ipAddress,
      userAgent
    );
  }

  async logLogout(userId: string, ipAddress?: string, userAgent?: string): Promise<AuditLogDocument> {
    return this.logAction(
      userId,
      'users' as AuditCollection,
      'logout' as AuditAction,
      undefined,
      undefined,
      undefined,
      'Cierre de sesión',
      ipAddress,
      userAgent
    );
  }

  async logCreate(
    userId: string, 
    collectionName: AuditCollection, 
    documentId: string, 
    after: any,
    notes?: string
  ): Promise<AuditLogDocument> {
    return this.logAction(
      userId,
      collectionName,
      'create' as AuditAction,
      documentId,
      undefined,
      after,
      notes || `Creación de ${collectionName}`
    );
  }

  async logUpdate(
    userId: string, 
    collectionName: AuditCollection, 
    documentId: string, 
    before: any,
    after: any,
    notes?: string
  ): Promise<AuditLogDocument> {
    return this.logAction(
      userId,
      collectionName,
      'update' as AuditAction,
      documentId,
      before,
      after,
      notes || `Actualización de ${collectionName}`
    );
  }

  async logDelete(
    userId: string, 
    collectionName: AuditCollection, 
    documentId: string, 
    before: any,
    notes?: string
  ): Promise<AuditLogDocument> {
    return this.logAction(
      userId,
      collectionName,
      'delete' as AuditAction,
      documentId,
      before,
      undefined,
      notes || `Eliminación de ${collectionName}`
    );
  }
}