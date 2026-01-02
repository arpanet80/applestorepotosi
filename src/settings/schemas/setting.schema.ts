// src/settings/schemas/setting.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SettingDocument = Setting & Document;

@Schema({ 
  collection: 'settings',
  timestamps: true 
})
export class Setting {
  @Prop({ 
    required: true,
    unique: true,
    index: true
  })
  key: string;

  @Prop({ 
    type: MongooseSchema.Types.Mixed, // CORRECCIÓN: Usar MongooseSchema
    required: true 
  })
  value: any;

  @Prop({ 
    default: 'general',
    enum: ['general', 'inventory', 'sales', 'system', 'notifications', 'security', 'appearance']
  })
  category: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ 
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true 
  })
  type: string;

  @Prop({ type: MongooseSchema.Types.Mixed }) // CORRECCIÓN: Usar MongooseSchema
  defaultValue: any;

  @Prop({ type: MongooseSchema.Types.Mixed }) // CORRECCIÓN: Usar MongooseSchema
  options: any;

  @Prop({ default: true })
  isEditable: boolean;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ default: 0 })
  version: number;

  // CORRECCIÓN: Definir explícitamente los campos de timestamps
  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);

// CORRECCIÓN: Middleware para incrementar versión al actualizar
SettingSchema.pre('save', function(next) {
  if (this.isModified('value')) {
    this.version += 1;
  }
  next();
});

// CORRECCIÓN: Índices para mejor performance
SettingSchema.index({ category: 1 });
SettingSchema.index({ isPublic: 1 });
SettingSchema.index({ isEditable: 1 });
SettingSchema.index({ key: 'text', description: 'text' });