// src/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
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
import { ImageKitService } from './imagekit.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductImage.name) private productImageModel: Model<ProductImageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly imageKitService: ImageKitService,
  ) {}

  /* ========== CREATE ========== */
  async create(createProductDto: CreateProductDto, userId: string): Promise<ProductDocument> {
    // 1. Verificar duplicados
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

    // 4. Construir documento — excluimos `images` del spread para no pisarlo en el schema
    const { images, ...rest } = createProductDto;
    const productData = {
      ...rest,
      categoryId: new Types.ObjectId(createProductDto.categoryId),
      brandId:    new Types.ObjectId(createProductDto.brandId),
      supplierId: new Types.ObjectId(createProductDto.supplierId),
      createdBy:  user._id,
    };

    const product = new this.productModel(productData);
    const saved = await product.save();

    // 5. Imágenes opcionales
    if (images?.length) {
      await this.createProductImages(saved._id.toString(), images);
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

    if (isActive !== undefined)   filter.isActive   = isActive;
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
      const validIds = ids
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));
      if (validIds.length) filter._id = { $in: validIds };
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

    // CORRECCIÓN: stockStatus incluye 'over-stock'
    if (stockStatus) {
      const available = { $subtract: ['$stockQuantity', '$reservedQuantity'] };
      if (stockStatus === 'out-of-stock') {
        filter.$expr = { $lte: [available, 0] };
      } else if (stockStatus === 'low-stock') {
        filter.$expr = {
          $and: [
            { $gt:  [available, 0] },
            { $lte: [available, '$minStock'] },
          ],
        };
      } else if (stockStatus === 'in-stock') {
        filter.$expr = { $gt: [available, '$minStock'] };
      } else if (stockStatus === 'over-stock') {
        filter.$expr = {
          $and: [
            { $gt: [available, '$minStock'] },
            { $gt: ['$maxStock', 0] },
            { $gte: [available, '$maxStock'] },
          ],
        };
      }
    }

    const ALLOWED_SORT_FIELDS = new Set([
      'name', 'sku', 'salePrice', 'costPrice', 'stockQuantity', 'createdAt',
    ]);
    const safeSortBy = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : 'name';
    const sort: Record<string, 1 | -1> = { [safeSortBy]: sortOrder === 'desc' ? -1 : 1 };

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
        .lean() // CORRECCIÓN: lean() para mejor performance en listados
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    // Cargar primera imagen de cada producto en un solo query (evita N+1)
    const productIds = products.map((p) => p._id);
    const images = await this.productImageModel
      .find({ productId: { $in: productIds } })
      .sort({ isPrimary: -1, sortOrder: 1 })
      .select('productId url')
      .lean();

    const imageMap = new Map<string, string>();
    for (const img of images) {
      const key = img.productId.toString();
      if (!imageMap.has(key)) imageMap.set(key, img.url);
    }

    const plainProducts = products.map((p) => {
      const obj = p as Record<string, any>;
      // Los virtuals no se computan en lean(), los calculamos manualmente
      obj.availableQuantity = Math.max(0, (obj.stockQuantity || 0) - (obj.reservedQuantity || 0));
      if (obj.costPrice > 0) {
        obj.profitMargin = ((obj.salePrice - obj.costPrice) / obj.costPrice) * 100;
      } else {
        obj.profitMargin = 0;
      }
      const available = obj.availableQuantity;
      if (available <= 0) obj.stockStatus = 'out-of-stock';
      else if (available <= (obj.minStock || 0)) obj.stockStatus = 'low-stock';
      else if ((obj.maxStock || 0) > 0 && available >= obj.maxStock) obj.stockStatus = 'over-stock';
      else obj.stockStatus = 'in-stock';

      obj.imageUrl =
        imageMap.get((p._id as Types.ObjectId).toString()) ??
        '/assets/imgs/product-no-image.png';
      return obj;
    });

    return { products: plainProducts, total, page, totalPages: Math.ceil(total / limit) };
  }

  /* ========== FIND ONE ========== */
  async findOne(
    id: string,
    session?: ClientSession,
    skipImage = false,
  ): Promise<ProductDocument> {
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
      (product as any).imageUrl =
        image?.url ?? '/assets/imgs/product-no-image.png';
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
      const dup = await this.productModel
        .findOne({ sku: updateProductDto.sku, _id: { $ne: id } })
        .exec();
      if (dup) throw new ConflictException('Ya existe otro producto con este SKU');
    }
    if (updateProductDto.barcode) {
      const dup = await this.productModel
        .findOne({ barcode: updateProductDto.barcode, _id: { $ne: id } })
        .exec();
      if (dup) throw new ConflictException('Ya existe otro producto con este código de barras');
    }

    if (updateProductDto.salePrice !== undefined || updateProductDto.costPrice !== undefined) {
      const current = await this.productModel
        .findById(id)
        .select('costPrice salePrice')
        .lean();
      if (!current) throw new NotFoundException('Producto no encontrado');
      const newSale = updateProductDto.salePrice ?? current.salePrice;
      const newCost = updateProductDto.costPrice ?? current.costPrice;
      if (newSale < newCost) {
        throw new BadRequestException(
          'El precio de venta debe ser mayor o igual al precio de costo',
        );
      }
    }

    // CORRECCIÓN: excluir campos sensibles del update
    const { images: _images, createdBy: _createdBy, ...updateData } = updateProductDto as any;

    const product = await this.productModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
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

    // CORRECCIÓN: eliminar imágenes de ImageKit ANTES de borrar de MongoDB
    const images = await this.productImageModel
      .find({ productId: new Types.ObjectId(id) })
      .select('fileId')
      .lean();

    const fileIds = images.map((img) => img.fileId).filter(Boolean);
    if (fileIds.length) {
      const results = await this.imageKitService.deleteFiles(fileIds);
      for (const [fileId, success] of results.entries()) {
        if (!success) {
          this.logger.warn(`No se pudo eliminar imagen ${fileId} de ImageKit`);
        }
      }
    }

    await this.productImageModel
      .deleteMany({ productId: new Types.ObjectId(id) })
      .exec();
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

  async incrementStock(
    productId: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<void> {
    if (quantity <= 0) throw new BadRequestException('La cantidad debe ser mayor a 0');
    if (!Types.ObjectId.isValid(productId))
      throw new BadRequestException('ID de producto inválido');

    await this.productModel
      .updateOne(
        { _id: new Types.ObjectId(productId) },
        { $inc: { stockQuantity: quantity } },
        { session },
      )
      .exec();
  }

  async decrementStock(
    id: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de producto inválido');
    if (quantity <= 0) throw new BadRequestException('La cantidad debe ser mayor a 0');

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

    return this.findOne(id, session, true);
  }

  async reserveStock(
    id: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de producto inválido');
    if (quantity <= 0) throw new BadRequestException('La cantidad debe ser mayor a 0');

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

    return this.findOne(id, session, true);
  }

  async releaseStock(
    id: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de producto inválido');
    if (quantity <= 0) throw new BadRequestException('La cantidad debe ser mayor a 0');

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

    return this.findOne(id, session, true);
  }

  async decrementStockIfAvailable(
    productId: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(productId)) return false;
    if (quantity <= 0) return false;

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
    if (!Types.ObjectId.isValid(categoryId))
      throw new BadRequestException('ID de categoría inválido');
    return this.productModel
      .find({ categoryId: new Types.ObjectId(categoryId), isActive: true })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .sort({ name: 1 })
      .exec();
  }

  async findByBrand(brandId: string): Promise<ProductDocument[]> {
    if (!Types.ObjectId.isValid(brandId))
      throw new BadRequestException('ID de marca inválido');
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
    if (!search?.trim()) return [];

    // CORRECCIÓN: escapar caracteres especiales de regex para evitar ReDoS
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // CORRECCIÓN: limitar el máximo de resultados para prevenir abuso
    const safeLimit = Math.min(Math.max(1, limit), 100);

    return this.productModel
      .find({
        $or: [
          { name:        { $regex: escaped, $options: 'i' } },
          { description: { $regex: escaped, $options: 'i' } },
          { sku:         { $regex: escaped, $options: 'i' } },
        ],
        isActive: true,
      })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .limit(safeLimit)
      .exec();
  }

  async getProductsForSelect(): Promise<
    Array<{ _id: string; name: string; sku: string; salePrice: number }>
  > {
    const products = await this.productModel
      .find({ isActive: true })
      .select('name sku salePrice')
      .sort({ name: 1 })
      .lean()
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
              { $gt:  [available, 0] },
              { $lte: [available, '$minStock'] },
            ],
          },
        }),
        this.productModel.aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: null,
              totalValue: { $sum: { $multiply: ['$stockQuantity', '$costPrice'] } },
            },
          },
        ]),
        this.productModel.aggregate([
          { $match: { isActive: true, costPrice: { $gt: 0 } } },
          {
            $group: {
              _id: null,
              avgMargin: {
                $avg: {
                  $multiply: [
                    {
                      $divide: [
                        { $subtract: ['$salePrice', '$costPrice'] },
                        '$costPrice',
                      ],
                    },
                    100,
                  ],
                },
              },
            },
          },
        ]),
      ]);

    return {
      total,
      active,
      featured,
      outOfStock,
      lowStock,
      totalStockValue:    stockValueResult[0]?.totalValue    ?? 0,
      averageProfitMargin: marginResult[0]?.avgMargin         ?? 0,
    };
  }

  /* ========== UTILS ========== */
  async skuExists(sku: string, excludeId?: string): Promise<boolean> {
    const query: Record<string, any> = { sku };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }
    return (await this.productModel.countDocuments(query).exec()) > 0;
  }

  async barcodeExists(barcode: string, excludeId?: string): Promise<boolean> {
    if (!barcode) return false;
    const query: Record<string, any> = { barcode };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }
    return (await this.productModel.countDocuments(query).exec()) > 0;
  }

  async countByBrand(brandId: string): Promise<number> {
    if (!Types.ObjectId.isValid(brandId)) return 0;
    return this.productModel
      .countDocuments({ brandId: new Types.ObjectId(brandId) })
      .exec();
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
    const docs = images.map((img) => ({
      ...img,
      productId: new Types.ObjectId(productId),
    }));
    await this.productImageModel.insertMany(docs);
  }

  async getProductImages(productId: string): Promise<ProductImageDocument[]> {
    if (!Types.ObjectId.isValid(productId))
      throw new BadRequestException('ID de producto inválido');
    return this.productImageModel
      .find({ productId: new Types.ObjectId(productId) })
      .sort({ isPrimary: -1, sortOrder: 1 })
      .exec();
  }

  async addProductImage(
    createImageDto: CreateProductImageDto,
  ): Promise<ProductImageDocument> {
    if (!Types.ObjectId.isValid(createImageDto.productId))
      throw new BadRequestException('ID de producto inválido');

    const product = await this.productModel
      .findById(createImageDto.productId)
      .exec();
    if (!product) throw new NotFoundException('Producto no encontrado');

    if (createImageDto.isPrimary) {
      await this.productImageModel
        .updateMany(
          { productId: new Types.ObjectId(createImageDto.productId) },
          { isPrimary: false },
        )
        .exec();
    }

    const image = new this.productImageModel({
      ...createImageDto,
      productId: new Types.ObjectId(createImageDto.productId),
    });
    return image.save();
  }

  async updateProductImage(
    id: string,
    updateImageDto: UpdateProductImageDto,
  ): Promise<ProductImageDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de imagen inválido');

    const currentImage = await this.productImageModel.findById(id).exec();
    if (!currentImage) throw new NotFoundException('Imagen no encontrada');

    // CORRECCIÓN: si se está quitando isPrimary, verificar que quede al menos una primaria
    if (currentImage.isPrimary && updateImageDto.isPrimary === false) {
      const countPrimary = await this.productImageModel.countDocuments({
        productId: currentImage.productId,
        isPrimary: true,
      });
      if (countPrimary <= 1) {
        throw new BadRequestException(
          'No se puede quitar la imagen primaria sin designar otra primaria primero',
        );
      }
    }

    if (updateImageDto.isPrimary) {
      await this.productImageModel
        .updateMany(
          { productId: currentImage.productId, _id: { $ne: new Types.ObjectId(id) } },
          { isPrimary: false },
        )
        .exec();
    }

    const image = await this.productImageModel
      .findByIdAndUpdate(id, updateImageDto, { new: true, runValidators: true })
      .exec();
    if (!image) throw new NotFoundException('Imagen no encontrada');
    return image;
  }

  async removeProductImage(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID de imagen inválido');

    // CORRECCIÓN: obtener fileId y eliminar de ImageKit antes de borrar de MongoDB
    const image = await this.productImageModel.findById(id).select('fileId').lean();
    if (!image) throw new NotFoundException('Imagen no encontrada');

    if (image.fileId) {
      const success = await this.imageKitService.deleteFile(image.fileId);
      if (!success) {
        this.logger.warn(`No se pudo eliminar imagen ${image.fileId} de ImageKit`);
      }
    }

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

  async reorderProductImages(
    updates: Array<{ id: string; sortOrder: number }>,
  ): Promise<void> {
    const validUpdates = updates.filter((u) => Types.ObjectId.isValid(u.id));
    if (!validUpdates.length) return;

    // CORRECCIÓN: validar que todos los IDs pertenezcan al mismo producto
    const imageIds = validUpdates.map((u) => new Types.ObjectId(u.id));
    const images = await this.productImageModel
      .find({ _id: { $in: imageIds } })
      .select('productId')
      .lean();

    const productIds = new Set(images.map((img) => img.productId.toString()));
    if (productIds.size > 1) {
      throw new BadRequestException(
        'Todas las imágenes a reordenar deben pertenecer al mismo producto',
      );
    }
    if (productIds.size === 0) {
      throw new BadRequestException('No se encontraron imágenes válidas para reordenar');
    }

    const bulkOps = validUpdates.map((u) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(u.id) },
        update: { sortOrder: u.sortOrder },
      },
    }));
    await this.productImageModel.bulkWrite(bulkOps);
  }
}