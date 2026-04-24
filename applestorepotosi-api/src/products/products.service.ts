// src/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { ProductImage, ProductImageDocument } from './schemas/product-image.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { StockUpdateDto } from './dto/stock-update.dto';
import { CreateProductImageDto, UpdateProductImageDto } from './dto/product-image.dto';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductImage.name) private productImageModel: Model<ProductImageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /* ========== CREATE ========== */
  async create(createProductDto: CreateProductDto, userId: string): Promise<ProductDocument> {
    // 1. Duplicados
    const existSku = await this.productModel.exists({ sku: createProductDto.sku });
    if (existSku) throw new ConflictException('SKU duplicado');

    if (createProductDto.barcode) {
      const existBar = await this.productModel.exists({ barcode: createProductDto.barcode });
      if (existBar) throw new ConflictException('Código de barras duplicado');
    }

    // 2. Validar precios
    if (createProductDto.salePrice < createProductDto.costPrice) {
      throw new BadRequestException('El precio de venta debe ser mayor o igual al precio de costo');
    }

    // 3. Resolver usuario creador (Firebase UID → ObjectId)
    const user = await this.userModel.findOne({ uid: userId }).exec();
    if (!user) throw new BadRequestException(`Usuario con uid ${userId} no encontrado`);

    // 4. Crear producto
    const productData = {
      ...createProductDto,
      categoryId:  new Types.ObjectId(createProductDto.categoryId),
      brandId:     new Types.ObjectId(createProductDto.brandId),
      supplierId:  new Types.ObjectId(createProductDto.supplierId),
      createdBy:   user._id,
    };

    const product = new this.productModel(productData);
    const saved = await product.save();

    // 5. Imágenes opcionales
    if (createProductDto.images?.length) {
      await this.createProductImages(saved._id.toString(), createProductDto.images);
    }

    return this.findOne(saved._id.toString());
  }

  /* ========== FIND ALL ========== */
  async findAll(query: ProductQueryDto): Promise<{
    products: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      isActive, isFeatured, categoryId, brandId, supplierId,
      search, minPrice, maxPrice, stockStatus, ids,
      page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc',
    } = query;

    const skip = (page - 1) * limit;
    const filter: Record<string, any> = {};

    if (isActive !== undefined)  filter.isActive  = isActive;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;

    if (categoryId) {
      if (!Types.ObjectId.isValid(categoryId)) throw new BadRequestException('ID de categoría inválido');
      filter.categoryId = new Types.ObjectId(categoryId);
    }
    if (brandId) {
      if (!Types.ObjectId.isValid(brandId)) throw new BadRequestException('ID de marca inválido');
      filter.brandId = new Types.ObjectId(brandId);
    }
    if (supplierId) {
      if (!Types.ObjectId.isValid(supplierId)) throw new BadRequestException('ID de proveedor inválido');
      filter.supplierId = new Types.ObjectId(supplierId);
    }
    if (ids?.length) {
      filter._id = { $in: ids.map((id) => new Types.ObjectId(id)) };
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.salePrice = {};
      if (minPrice !== undefined) filter.salePrice.$gte = minPrice;
      if (maxPrice !== undefined) filter.salePrice.$lte = maxPrice;
    }
    if (search) {
      filter.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku:         { $regex: search, $options: 'i' } },
      ];
    }

    // ✅ FIX #1: stockStatus aplicado al filtro ANTES de la consulta, no después.
    // El patrón original construía filter.$expr después de la query → nunca se aplicaba.
    if (stockStatus) {
      const available = { $subtract: ['$stockQuantity', '$reservedQuantity'] };
      if (stockStatus === 'out-of-stock') {
        filter.$expr = { $lte: [available, 0] };
      } else if (stockStatus === 'low-stock') {
        filter.$expr = {
          $and: [
            { $gt: [available, 0] },
            { $lte: [available, '$minStock'] },
          ],
        };
      } else if (stockStatus === 'in-stock') {
        filter.$expr = { $gt: [available, '$minStock'] };
      }
    }

    const ALLOWED_SORT_FIELDS = new Set(['name','sku','salePrice','costPrice','stockQuantity','createdAt']);
    const safeSortBy = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : 'name';
    const sort: Record<string, 1 | -1> = { [safeSortBy]: sortOrder === 'desc' ? -1 : 1 };

    // ✅ FIX #1: total se calcula con el filtro corregido (incluyendo stockStatus)
    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('categoryId', 'name slug')
        .populate('brandId', 'name logoUrl')
        .populate('supplierId', 'name contactEmail')
        .populate('createdBy', 'displayName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    // Cargar primera imagen de cada producto en un solo query
    const productIds = products.map((p) => p._id);
    const images = await this.productImageModel
      .find({ productId: { $in: productIds } })
      .sort({ isPrimary: -1, sortOrder: 1 })
      .select('productId url')
      .lean();

    // Mapa productId → primera imagen para O(1) lookup
    const imageMap = new Map<string, string>();
    for (const img of images) {
      const key = img.productId.toString();
      if (!imageMap.has(key)) imageMap.set(key, img.url); // primera imagen gana
    }

    const plainProducts = products.map((p) => {
      const obj = p.toObject({ virtuals: true }) as Record<string, any>;
      obj.imageUrl = imageMap.get((p._id as Types.ObjectId).toString())
        ?? '/assets/imgs/product-no-image.png';
      return obj;
    });

    return { products: plainProducts, total, page, totalPages: Math.ceil(total / limit) };
  }

  /* ========== FIND ONE ========== */
  /**
   * ✅ FIX #2 (inconsistencia con módulos anteriores): acepta ClientSession opcional
   * para que StockMovementsService y SalesService puedan leerlo dentro de una transacción.
   */
  /**
   * @param skipImage true cuando se llama desde contexto transaccional (POS, stock)
   *   para evitar la query extra a product_images que no se necesita en ese flujo.
   */
  async findOne(id: string, session?: ClientSession, skipImage = false): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('ID de producto inválido');

    const product = await this.productModel
      .findById(id)
      .session(session ?? null)
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl website')
      .populate('supplierId', 'name contactEmail contactPhone')
      .populate('createdBy', 'displayName email')
      .exec();

    if (!product) throw new NotFoundException('Producto no encontrado');

    if (!skipImage) {
      const image = await this.productImageModel
        .findOne({ productId: product._id })
        .sort({ isPrimary: -1, sortOrder: 1 })
        .lean();
      (product as any).imageUrl = image?.url ?? '/assets/imgs/product-no-image.png';
    }

    return product;
  }

  /* ========== FIND BY SKU ========== */
  async findBySku(sku: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findOne({ sku })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .populate('createdBy', 'displayName email')
      .exec();
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  /* ========== FIND BY BARCODE ========== */
  async findByBarcode(barcode: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findOne({ barcode })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .populate('createdBy', 'displayName email')
      .exec();
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  /* ========== UPDATE ========== */
  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de producto inválido');

    if (updateProductDto.sku) {
      const dup = await this.productModel.findOne({ sku: updateProductDto.sku, _id: { $ne: id } }).exec();
      if (dup) throw new ConflictException('Ya existe otro producto con este SKU');
    }
    if (updateProductDto.barcode) {
      const dup = await this.productModel.findOne({ barcode: updateProductDto.barcode, _id: { $ne: id } }).exec();
      if (dup) throw new ConflictException('Ya existe otro producto con este código de barras');
    }

    // ✅ FIX #3: validar precio también cuando solo se actualiza uno de los dos campos.
    // Se lee el valor actual del campo que no viene en el DTO.
    if (updateProductDto.salePrice !== undefined || updateProductDto.costPrice !== undefined) {
      const current = await this.productModel.findById(id).select('costPrice salePrice').lean();
      if (!current) throw new NotFoundException('Producto no encontrado');
      const newSale = updateProductDto.salePrice ?? current.salePrice;
      const newCost = updateProductDto.costPrice ?? current.costPrice;
      if (newSale < newCost) {
        throw new BadRequestException('El precio de venta debe ser mayor o igual al precio de costo');
      }
    }

    const product = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true, runValidators: true })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .populate('createdBy', 'displayName email')
      .exec();

    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  /* ========== REMOVE ========== */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de producto inválido');
    await this.productImageModel.deleteMany({ productId: id }).exec();
    const result = await this.productModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) throw new NotFoundException('Producto no encontrado');
  }

  /* ========== TOGGLE ACTIVE / FEATURED ========== */
  async toggleActive(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de producto inválido');
    const product = await this.productModel.findById(id).exec();
    if (!product) throw new NotFoundException('Producto no encontrado');
    product.isActive = !product.isActive;
    return product.save();
  }

  async toggleFeatured(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de producto inválido');
    const product = await this.productModel.findById(id).exec();
    if (!product) throw new NotFoundException('Producto no encontrado');
    product.isFeatured = !product.isFeatured;
    return product.save();
  }

  /* ========== STOCK OPS ========== */

  /**
   * Reemplaza el stock con el valor absoluto del DTO.
   * Usado por StockMovementsService después de un movimiento.
   */
  async updateStock(
    id: string,
    stockUpdate: StockUpdateDto,
    session?: ClientSession,
  ): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de producto inválido');

    const product = await this.productModel
      .findById(id)
      .session(session ?? null)
      .exec();
    if (!product) throw new NotFoundException('Producto no encontrado');

    product.stockQuantity = stockUpdate.quantity;
    return product.save({ session });
  }

  async incrementStock(productId: string, quantity: number, session?: ClientSession): Promise<void> {
    await this.productModel
      .updateOne(
        { _id: new Types.ObjectId(productId) },
        { $inc: { stockQuantity: quantity } },
        { session },
      )
      .exec();
  }

  /**
   * ✅ FIX #4: decrementStock usa operación atómica ($inc) con validación de stock
   * disponible para evitar race conditions. Antes: findById + save (dos operaciones).
   */
  async decrementStock(id: string, quantity: number, session?: ClientSession): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de producto inválido');

    const result = await this.productModel
      .updateOne(
        { _id: new Types.ObjectId(id), stockQuantity: { $gte: quantity } },
        { $inc: { stockQuantity: -quantity } },
        { session },
      )
      .exec();

    if (result.matchedCount === 0) {
      const exists = await this.productModel.exists({ _id: id });
      throw exists
        ? new BadRequestException('Stock insuficiente')
        : new NotFoundException('Producto no encontrado');
    }

    return this.findOne(id);
  }

  /**
   * ✅ FIX #4: reserveStock y releaseStock también usan operaciones atómicas.
   */
  async reserveStock(id: string, quantity: number, session?: ClientSession): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de producto inválido');

    const result = await this.productModel
      .updateOne(
        {
          _id: new Types.ObjectId(id),
          $expr: {
            $gte: [
              { $subtract: ['$stockQuantity', '$reservedQuantity'] },
              quantity,
            ],
          },
        },
        { $inc: { reservedQuantity: quantity } },
        { session },
      )
      .exec();

    if (result.matchedCount === 0) {
      const exists = await this.productModel.exists({ _id: id });
      throw exists
        ? new BadRequestException('Stock disponible insuficiente para reservar')
        : new NotFoundException('Producto no encontrado');
    }

    return this.findOne(id);
  }

  async releaseStock(id: string, quantity: number, session?: ClientSession): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de producto inválido');

    const result = await this.productModel
      .updateOne(
        { _id: new Types.ObjectId(id), reservedQuantity: { $gte: quantity } },
        { $inc: { reservedQuantity: -quantity } },
        { session },
      )
      .exec();

    if (result.matchedCount === 0) {
      const exists = await this.productModel.exists({ _id: id });
      throw exists
        ? new BadRequestException('Cantidad a liberar mayor al stock reservado')
        : new NotFoundException('Producto no encontrado');
    }

    return this.findOne(id);
  }

  /**
   * Decrementa stock solo si hay cantidad disponible.
   * Operación atómica — usada por PosService y SalesService en transacciones.
   */
  async decrementStockIfAvailable(
    productId: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(productId)) return false;

    const result = await this.productModel
      .updateOne(
        {
          _id: new Types.ObjectId(productId),
          stockQuantity: { $gte: quantity },
        },
        { $inc: { stockQuantity: -quantity } },
        { session },
      )
      .exec();

    return result.modifiedCount === 1;
  }

  /* ========== QUERIES ========== */

  async findByCategory(categoryId: string): Promise<ProductDocument[]> {
    if (!Types.ObjectId.isValid(categoryId)) throw new BadRequestException('ID de categoría inválido');
    return this.productModel
      .find({ categoryId: new Types.ObjectId(categoryId), isActive: true })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .sort({ name: 1 })
      .exec();
  }

  async findByBrand(brandId: string): Promise<ProductDocument[]> {
    if (!Types.ObjectId.isValid(brandId)) throw new BadRequestException('ID de marca inválido');
    return this.productModel
      .find({ brandId: new Types.ObjectId(brandId), isActive: true })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .sort({ name: 1 })
      .exec();
  }

  async findFeaturedProducts(limit = 10): Promise<ProductDocument[]> {
    return this.productModel
      .find({ isFeatured: true, isActive: true })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findLowStockProducts(): Promise<ProductDocument[]> {
    return this.productModel
      .find({
        isActive: true,
        $expr: {
          $and: [
            { $gt:  [{ $subtract: ['$stockQuantity', '$reservedQuantity'] }, 0] },
            { $lte: [{ $subtract: ['$stockQuantity', '$reservedQuantity'] }, '$minStock'] },
          ],
        },
      })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .sort({ stockQuantity: 1 })
      .exec();
  }

  async findOutOfStockProducts(): Promise<ProductDocument[]> {
    return this.productModel
      .find({
        isActive: true,
        $expr: { $lte: [{ $subtract: ['$stockQuantity', '$reservedQuantity'] }, 0] },
      })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .sort({ name: 1 })
      .exec();
  }

  async searchProducts(search: string, limit = 10): Promise<ProductDocument[]> {
    return this.productModel
      .find({
        $or: [
          { name:        { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { sku:         { $regex: search, $options: 'i' } },
        ],
        isActive: true,
      })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .limit(limit)
      .exec();
  }

  async getProductsForSelect(): Promise<Array<{ _id: string; name: string; sku: string; salePrice: number }>> {
    const products = await this.productModel
      .find({ isActive: true })
      .select('name sku salePrice')
      .sort({ name: 1 })
      .exec();

    return products.map((p) => ({
      _id: (p._id as Types.ObjectId).toString(),
      name: p.name,
      sku: p.sku,
      salePrice: p.salePrice,
    }));
  }

  /* ========== STATS ========== */
  async getStats() {
    const available = { $subtract: ['$stockQuantity', '$reservedQuantity'] };

    const [total, active, featured, outOfStock, lowStock, stockValueResult, marginResult] =
      await Promise.all([
        this.productModel.countDocuments(),
        this.productModel.countDocuments({ isActive: true }),
        this.productModel.countDocuments({ isFeatured: true, isActive: true }),
        this.productModel.countDocuments({
          isActive: true,
          $expr: { $lte: [available, 0] },
        }),
        this.productModel.countDocuments({
          isActive: true,
          $expr: {
            $and: [
              { $gt: [available, 0] },
              { $lte: [available, '$minStock'] },
            ],
          },
        }),
        this.productModel.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: null, totalValue: { $sum: { $multiply: ['$stockQuantity', '$costPrice'] } } } },
        ]),
        this.productModel.aggregate([
          { $match: { isActive: true, costPrice: { $gt: 0 } } },
          {
            $group: {
              _id: null,
              avgMargin: {
                $avg: {
                  $multiply: [
                    { $divide: [{ $subtract: ['$salePrice', '$costPrice'] }, '$costPrice'] },
                    100,
                  ],
                },
              },
            },
          },
        ]),
      ]);

    return {
      total, active, featured, outOfStock, lowStock,
      totalStockValue: stockValueResult[0]?.totalValue || 0,
      averageProfitMargin: marginResult[0]?.avgMargin || 0,
    };
  }

  /* ========== UTILS ========== */
  async skuExists(sku: string, excludeId?: string): Promise<boolean> {
    const query: Record<string, any> = { sku };
    if (excludeId) query._id = { $ne: excludeId };
    return (await this.productModel.countDocuments(query).exec()) > 0;
  }

  async barcodeExists(barcode: string, excludeId?: string): Promise<boolean> {
    if (!barcode) return false;
    const query: Record<string, any> = { barcode };
    if (excludeId) query._id = { $ne: excludeId };
    return (await this.productModel.countDocuments(query).exec()) > 0;
  }

  async countByBrand(brandId: string): Promise<number> {
    if (!Types.ObjectId.isValid(brandId)) return 0;
    return this.productModel.countDocuments({ brandId: new Types.ObjectId(brandId) }).exec();
  }

  /* ========== ACTIVATE / DEACTIVATE ========== */
  async deactivateProduct(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const product = await this.productModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async activateProduct(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const product = await this.productModel
      .findByIdAndUpdate(id, { isActive: true }, { new: true })
      .exec();
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  /* ========== IMAGES ========== */
  private async createProductImages(productId: string, images: any[]): Promise<void> {
    const docs = images.map((img) => ({ ...img, productId: new Types.ObjectId(productId) }));
    await this.productImageModel.insertMany(docs);
  }

  async getProductImages(productId: string): Promise<ProductImageDocument[]> {
    if (!Types.ObjectId.isValid(productId)) throw new BadRequestException('ID de producto inválido');
    return this.productImageModel
      .find({ productId: new Types.ObjectId(productId) })
      .sort({ isPrimary: -1, sortOrder: 1 })
      .exec();
  }

  async addProductImage(createImageDto: CreateProductImageDto): Promise<ProductImageDocument> {
    if (!Types.ObjectId.isValid(createImageDto.productId))
      throw new BadRequestException('ID de producto inválido');

    const product = await this.productModel.findById(createImageDto.productId).exec();
    if (!product) throw new NotFoundException('Producto no encontrado');

    if (createImageDto.isPrimary) {
      await this.productImageModel
        .updateMany({ productId: createImageDto.productId }, { isPrimary: false })
        .exec();
    }

    const image = new this.productImageModel({
      ...createImageDto,
      productId: new Types.ObjectId(createImageDto.productId),
    });
    return image.save();
  }

  async updateProductImage(id: string, updateImageDto: UpdateProductImageDto): Promise<ProductImageDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de imagen inválido');

    if (updateImageDto.isPrimary) {
      const image = await this.productImageModel.findById(id).exec();
      if (image) {
        await this.productImageModel
          .updateMany({ productId: image.productId, _id: { $ne: id } }, { isPrimary: false })
          .exec();
      }
    }

    const image = await this.productImageModel
      .findByIdAndUpdate(id, updateImageDto, { new: true, runValidators: true })
      .exec();
    if (!image) throw new NotFoundException('Imagen no encontrada');
    return image;
  }

  async removeProductImage(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de imagen inválido');
    const result = await this.productImageModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) throw new NotFoundException('Imagen no encontrada');
  }

  async setPrimaryImage(id: string): Promise<ProductImageDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de imagen inválido');

    const image = await this.productImageModel.findById(id).exec();
    if (!image) throw new NotFoundException('Imagen no encontrada');

    await this.productImageModel
      .updateMany({ productId: image.productId }, { isPrimary: false })
      .exec();

    image.isPrimary = true;
    return image.save();
  }

  async reorderProductImages(updates: Array<{ id: string; sortOrder: number }>): Promise<void> {
    const bulkOps = updates.map((u) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(u.id) },
        update: { sortOrder: u.sortOrder },
      },
    }));
    await this.productImageModel.bulkWrite(bulkOps);
  }
}