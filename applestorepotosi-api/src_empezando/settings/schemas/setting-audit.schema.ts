import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type SettingAuditDocument = SettingAudit & Document;

@Schema({ collection: 'settings_audit', timestamps: true })
export class SettingAudit {
  @Prop({ type: Types.ObjectId, ref: 'Setting', required: true })
  settingId: Types.ObjectId;

  @Prop({ required: true })
  key: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  oldValue: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  newValue: any;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;
}

export const SettingAuditSchema = SchemaFactory.createForClass(SettingAudit);