// src/audit-logs/schemas/audit-log.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Model } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

// Exportar los tipos para usar en otros archivos
export type AuditAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'login' 
  | 'logout' 
  | 'export' 
  | 'import' 
  | 'backup' 
  | 'restore';

export type AuditCollection =
  | 'users'
  | 'products'
  | 'customers'
  | 'sales'
  | 'purchase_orders'
  | 'stock_movements'
  | 'categories'
  | 'brands'
  | 'suppliers'
  | 'settings';

// Constantes para usar en validaciones
export const AUDIT_ACTIONS: AuditAction[] = [
  'create', 'read', 'update', 'delete', 'login', 'logout', 
  'export', 'import', 'backup', 'restore'
];

export const AUDIT_COLLECTIONS: AuditCollection[] = [
  'users', 'products', 'customers', 'sales', 'purchase_orders', 
  'stock_movements', 'categories', 'brands', 'suppliers', 'settings'
];

@Schema({ 
  collection: 'audit_logs',
  timestamps: true 
})
export class AuditLog {
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'El ID de usuario es requerido'] 
  })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ 
    type: String,
    enum: {
      values: AUDIT_COLLECTIONS,
      message: 'Colección inválida. Valores válidos: ' + AUDIT_COLLECTIONS.join(', ')
    },
    required: [true, 'La colección es requerida']
  })
  collectionName: AuditCollection;

  @Prop({ 
    type: MongooseSchema.Types.ObjectId,
    required: false 
  })
  documentId: MongooseSchema.Types.ObjectId;

  @Prop({ 
    type: String,
    enum: {
      values: AUDIT_ACTIONS,
      message: 'Acción inválida. Valores válidos: ' + AUDIT_ACTIONS.join(', ')
    },
    required: [true, 'La acción es requerida']
  })
  action: AuditAction;

  @Prop({ type: MongooseSchema.Types.Mixed })
  before: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  after: any;

  @Prop({ 
    type: String,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres'],
    default: ''
  })
  notes: string;

  @Prop({ 
    type: String 
  })
  ipAddress: string;

  @Prop({ 
    type: String 
  })
  userAgent: string;

  @Prop({ 
    type: Date,
    default: Date.now 
  })
  timestamp: Date;

  @Prop({ 
    type: Boolean,
    default: false 
  })
  isSensitive: boolean;

  @Prop({ 
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Severidad inválida. Valores válidos: low, medium, high'
    },
    default: 'medium'
  })
  severity: string;

  // Campos automáticos de timestamps
  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Función helper para detectar datos sensibles (no como método estático)
function containsSensitiveData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'creditCard', 
    'rfc', 'curp', 'bankAccount', 'pin', 'securityCode'
  ];
  
  try {
    const dataString = JSON.stringify(data).toLowerCase();
    return sensitiveFields.some(field => dataString.includes(field.toLowerCase()));
  } catch {
    return false;
  }
}

// Función helper para redactar datos sensibles
function redactSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'creditCard', 
    'rfc', 'curp', 'bankAccount', 'pin', 'securityCode'
  ];

  const redact = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(item => redact(item));
    }
    
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.includes(key.toLowerCase())) {
          result[key] = '***REDACTED***';
        } else {
          result[key] = redact(value);
        }
      }
      return result;
    }
    
    return obj;
  };

  return redact(data);
}

// Middleware para validaciones antes de guardar
AuditLogSchema.pre('save', function(next) {
  const auditLog = this as AuditLogDocument;
  
  // Validar que para acciones de documento haya documentId
  if (['create', 'read', 'update', 'delete'].includes(auditLog.action) && !auditLog.documentId) {
    const error = new Error('documentId es requerido para acciones de documento (create, read, update, delete)');
    return next(error);
  }

  // CORRECCIÓN: Usar la función helper directamente
  if ((auditLog.before && containsSensitiveData(auditLog.before)) || 
      (auditLog.after && containsSensitiveData(auditLog.after))) {
    auditLog.isSensitive = true;
    auditLog.severity = 'high';
  }

  // Limpiar datos sensibles si se detectan
  if (auditLog.before) {
    auditLog.before = redactSensitiveData(auditLog.before);
  }
  if (auditLog.after) {
    auditLog.after = redactSensitiveData(auditLog.after);
  }

  next();
});

// Middleware para actualizaciones
AuditLogSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as any;
  
  // Si se está actualizando before o after, aplicar redacción
  if (update.before || update.$set?.before) {
    const beforeData = update.before || update.$set?.before;
    if (update.$set) {
      update.$set.before = redactSensitiveData(beforeData);
    } else {
      update.before = redactSensitiveData(beforeData);
    }
  }

  if (update.after || update.$set?.after) {
    const afterData = update.after || update.$set?.after;
    if (update.$set) {
      update.$set.after = redactSensitiveData(afterData);
    } else {
      update.after = redactSensitiveData(afterData);
    }
  }

  next();
});

// Método de instancia para validar tipo (opcional)
AuditLogSchema.methods.validateValueType = function(value: any): boolean {
  switch (this.type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    default:
      return true;
  }
};

// Métodos estáticos
AuditLogSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId: new MongooseSchema.Types.ObjectId(userId) })
    .populate('userId', 'profile.firstName profile.lastName email')
    .sort({ timestamp: -1 });
};

AuditLogSchema.statics.findByCollection = function(collection: AuditCollection) {
  return this.find({ collection })
    .populate('userId', 'profile.firstName profile.lastName email')
    .sort({ timestamp: -1 });
};

AuditLogSchema.statics.findByAction = function(action: AuditAction) {
  return this.find({ action })
    .populate('userId', 'profile.firstName profile.lastName email')
    .sort({ timestamp: -1 });
};

AuditLogSchema.statics.findRecent = function(limit: number = 50) {
  return this.find()
    .populate('userId', 'profile.firstName profile.lastName email')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Método estático para detectar datos sensibles
AuditLogSchema.statics.containsSensitiveData = function(data: any): boolean {
  return containsSensitiveData(data);
};

// Método estático para redactar datos sensibles
AuditLogSchema.statics.redactSensitiveData = function(data: any): any {
  return redactSensitiveData(data);
};

// Índices para mejor performance
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ collection: 1, action: 1 });
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ isSensitive: 1 });
AuditLogSchema.index({ severity: 1 });
AuditLogSchema.index({ 'before._id': 1, 'after._id': 1 });
AuditLogSchema.index({ collection: 1, documentId: 1, timestamp: -1 });

// Interface para métodos estáticos
export interface AuditLogModel extends Model<AuditLogDocument> {
  containsSensitiveData(data: any): boolean;
  redactSensitiveData(data: any): any;
  findByUser(userId: string): Promise<AuditLogDocument[]>;
  findByCollection(collection: AuditCollection): Promise<AuditLogDocument[]>;
  findByAction(action: AuditAction): Promise<AuditLogDocument[]>;
  findRecent(limit?: number): Promise<AuditLogDocument[]>;
}