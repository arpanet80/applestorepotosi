// src/modules/cash-sessions/schemas/cash-session.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CashSessionDocument = CashSession & Document;

@Schema({ timestamps: true })
export class CashSession {
  @Prop({ required: true, unique: true })
  sessionId: string; // YYYYMMDD-CAJA1

  @Prop({ type: String, required: true }) // ✅ cambia de ObjectId a String
openedBy: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  closedBy?: Types.ObjectId;

  @Prop({ default: Date.now })
  openedAt: Date;

  @Prop()
  closedAt?: Date;

  @Prop({ default: false })
  isClosed: boolean;

  @Prop({ default: 'X' })
  closeType?: 'X' | 'Z';

  /* -------- money -------- */
  @Prop({ default: 0 })
  openingBalance: number;

  @Prop({ default: 0 })
  cashSales: number;

  @Prop({ default: 0 })
  cashRefunds: number;

  @Prop({ default: 0 })
  cashInOut: number; // manual adjustment (+/-)

  @Prop({ default: 0 })
  expectedCash: number;

  @Prop()
  actualCash?: number;

  @Prop({ type: Object })
  medios: {
    efectivo: number;
    tarjeta: number;
    transfer: number;
    deposito: number;
  };

  /* -------- relations -------- */
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Sale' }] })
  sales: Types.ObjectId[];

  @Prop({ type: String, default: '' })
  notes?: string;

  @Prop({ type: Object })
  discrepancy?: {
    amount: number;
    reason?: string;
  };
}

export const CashSessionSchema = SchemaFactory.createForClass(CashSession);
// auto-calc expectedCash before save
CashSessionSchema.pre<CashSessionDocument>('save', function () {
  this.expectedCash =
    this.openingBalance + this.cashSales - this.cashRefunds + this.cashInOut;
});

// CashSessionSchema.index({ sessionId: 1 }, { unique: true });