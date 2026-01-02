// src/products/schemas/product.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ 
  collection: 'products',
  timestamps: true,
})
export class Product {
  @Prop({ required: true, unique: true })
  sku: string;

  @Prop()
  barcode: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', required: true })
  categoryId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Brand', required: true })
  brandId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Supplier', required: true })
  supplierId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: Object })
  specifications: Record<string, any>;

  @Prop({ required: true, min: 0 })
  costPrice: number;

  @Prop({ required: true, min: 0 })
  salePrice: number;

  @Prop({ default: 0, min: 0 })
  warrantyMonths: number;

  @Prop({ default: 0, min: 0 })
  stockQuantity: number;

  @Prop({ default: 0, min: 0 })
  minStock: number;

  @Prop({ default: 0, min: 0 })
  maxStock: number;

  @Prop({ default: 0, min: 0 })
  reservedQuantity: number;

  @Prop()
  location: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  // Campos calculados virtuales
  availableQuantity?: number;
  profitMargin?: number;
  stockStatus?: string;

  // Campos automáticos de timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Índices únicos
// ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ barcode: 1 }, { sparse: true, unique: true });

// Índices de rendimiento
ProductSchema.index({ categoryId: 1, isActive: 1 });
ProductSchema.index({ brandId: 1, isActive: 1 });
ProductSchema.index({ stockQuantity: 1, minStock: 1 });

// Virtual para cantidad disponible
ProductSchema.virtual('availableQuantity').get(function() {
  return Math.max(0, this.stockQuantity - this.reservedQuantity);
});

// Virtual para margen de ganancia
ProductSchema.virtual('profitMargin').get(function() {
  if (this.costPrice === 0) return 0;
  return ((this.salePrice - this.costPrice) / this.costPrice) * 100;
});

// Virtual para estado del stock
ProductSchema.virtual('stockStatus').get(function() {
  const available = this.stockQuantity - this.reservedQuantity;
  if (available <= 0) return 'out-of-stock';
  if (available <= this.minStock) return 'low-stock';
  if (available >= this.maxStock && this.maxStock > 0) return 'over-stock';
  return 'in-stock';
});

// Asegurar que los virtuals se incluyan en JSON
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });


