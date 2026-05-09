// src/purchase-orders/schemas/purchase-order.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PurchaseOrderDocument = PurchaseOrder & Document;

// ---------- Sub-esquemas ----------

@Schema({ _id: false })
export class PurchaseOrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitCost: number;

  @Prop({ default: 0 })
  subtotal: number;
}

/**
 * Historial de cambios de estado.
 * Reemplaza el antipatrón de concatenar notas en un string plano.
 */
@Schema({ _id: false })
export class StatusHistoryEntry {
  @Prop({
    required: true,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  changedBy?: Types.ObjectId;

  @Prop({ required: true, default: () => new Date() })
  changedAt: Date;

  @Prop({ default: '' })
  reason: string;
}

// ---------- Documento principal ----------

@Schema({
  collection: 'purchase_orders',
  timestamps: true,
})
export class PurchaseOrder {
  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true })
  supplierId: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  orderDate: Date;

  @Prop({
    required: true,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Prop({
    type: [PurchaseOrderItem],
    required: true,
    validate: {
      validator: (items: PurchaseOrderItem[]) => items.length > 0,
      message: 'La orden de compra debe tener al menos un item',
    },
  })
  items: PurchaseOrderItem[];

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ type: String, unique: true, required: true })
  orderNumber: string;

  @Prop({ default: '' })
  notes: string;

  /** Historial estructurado de transiciones de estado. */
  @Prop({ type: [StatusHistoryEntry], default: [] })
  statusHistory: StatusHistoryEntry[];

  createdAt: Date;
  updatedAt: Date;

  /** Usuario que creó la orden. */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  /** Último usuario que modificó la orden. */
  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const PurchaseOrderSchema = SchemaFactory.createForClass(PurchaseOrder);

// ---------- Índices compuestos para los filtros más frecuentes ----------
// Evitan full collection scan en findAll, findByStatus y findBySupplier.
PurchaseOrderSchema.index({ isDeleted: 1, status: 1 });
PurchaseOrderSchema.index({ isDeleted: 1, supplierId: 1 });
PurchaseOrderSchema.index({ isDeleted: 1, orderDate: -1 });
// orderNumber ya tiene índice único declarado con unique:true en el @Prop.

// ---------- Hook pre-save: recalcula subtotales y total ----------
// Solo se ejecuta en .save(), no en findByIdAndUpdate,
// por eso el service calcula los valores también al hacer $set.
PurchaseOrderSchema.pre('save', function (next) {
  this.items.forEach((item) => {
    item.subtotal = item.quantity * item.unitCost;
  });
  this.totalAmount = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  next();
});