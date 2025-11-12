// src/products/products.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { ProductImage, ProductImageDocument } from './schemas/product-image.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { StockUpdateDto } from './dto/stock-update.dto';
import { CreateProductImageDto, UpdateProductImageDto } from './dto/product-image.dto';
import { User, UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) 
    private productModel: Model<ProductDocument>,
    @InjectModel(ProductImage.name)
    private productImageModel: Model<ProductImageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Crear nuevo producto
   */
  async create(createProductDto: CreateProductDto, userId: string): Promise<ProductDocument> {
    
    console.log("===========>", createProductDto);
    
    // Verificar si ya existe un producto con el mismo SKU
    const existingProduct = await this.productModel.findOne({ 
      sku: createProductDto.sku 
    }).exec();

    if (existingProduct) {
      throw new ConflictException('Ya existe un producto con este SKU');
    }

    // Verificar si ya existe un producto con el mismo código de barras si se proporciona
    if (createProductDto.barcode) {
      const existingBarcode = await this.productModel.findOne({ 
        barcode: createProductDto.barcode 
      }).exec();

      if (existingBarcode) {
        throw new ConflictException('Ya existe un producto con este código de barras');
      }
    }

    // Validar que el precio de venta sea mayor al costo
    if (createProductDto.salePrice < createProductDto.costPrice) {
      throw new BadRequestException('El precio de venta debe ser mayor o igual al precio de costo');
    }
  // console.log("==========>", new Types.ObjectId(createProductDto.categoryId));

  // console.log("===========> userid", userId);

  const user = await this.userModel.findOne({ uid: userId }).exec();

if (!user) {
  throw new BadRequestException(`Usuario con uid ${userId} no encontrado`);
}

    const productData = {
      ...createProductDto,
      categoryId: new Types.ObjectId(createProductDto.categoryId),
      brandId: new Types.ObjectId(createProductDto.brandId),
      supplierId: new Types.ObjectId(createProductDto.supplierId),
      createdBy: user._id, 
      // createdBy: new Types.ObjectId(userId),
    };

    const product = new this.productModel(productData);
    const savedProduct = await product.save();

    // Crear imágenes si se proporcionan
    if (createProductDto.images && createProductDto.images.length > 0) {
      await this.createProductImages((savedProduct._id as Types.ObjectId).toString(), createProductDto.images);
    }

    return this.findOne((savedProduct._id as Types.ObjectId).toString());
  }

  /**
   * Obtener todos los productos con filtros
   */
  async findAll(query: ProductQueryDto): Promise<{
    products: ProductDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { 
      isActive, 
      isFeatured, 
      categoryId, 
      brandId, 
      supplierId, 
      search, 
      minPrice, 
      maxPrice, 
      stockStatus,
      ids,
      page = 1, 
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc'
    } = query;

    const skip = (page - 1) * limit;
    const filter: any = {};

    // Filtrar por estado activo
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    // Filtrar por featured
    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    // Filtrar por categoría
    if (categoryId) {
      if (!Types.ObjectId.isValid(categoryId)) {
        throw new BadRequestException('ID de categoría inválido');
      }
      filter.categoryId = new Types.ObjectId(categoryId);
    }

    // Filtrar por marca
    if (brandId) {
      if (!Types.ObjectId.isValid(brandId)) {
        throw new BadRequestException('ID de marca inválido');
      }
      filter.brandId = new Types.ObjectId(brandId);
    }

    // Filtrar por proveedor
    if (supplierId) {
      if (!Types.ObjectId.isValid(supplierId)) {
        throw new BadRequestException('ID de proveedor inválido');
      }
      filter.supplierId = new Types.ObjectId(supplierId);
    }

    // Filtrar por IDs específicos
    if (ids && ids.length > 0) {
      filter._id = { $in: ids.map(id => new Types.ObjectId(id)) };
    }

    // Filtrar por precio
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.salePrice = {};
      if (minPrice !== undefined) filter.salePrice.$gte = minPrice;
      if (maxPrice !== undefined) filter.salePrice.$lte = maxPrice;
    }

    // Búsqueda por nombre, descripción o SKU
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    // Ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

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
      this.productModel.countDocuments(filter).exec()
    ]);

    // Aplicar filtro de estado de stock si se solicita
    let filteredProducts = products;
    if (stockStatus) {
      filteredProducts = products.filter(product => {
        const available = product.stockQuantity - product.reservedQuantity;
        switch (stockStatus) {
          case 'out-of-stock':
            return available <= 0;
          case 'low-stock':
            return available > 0 && available <= product.minStock;
          case 'in-stock':
            return available > product.minStock;
          default:
            return true;
        }
      });
    }

    const totalPages = Math.ceil(total / limit);

    return {
      products: filteredProducts,
      total,
      page,
      totalPages
    };
  }

  /**
   * Obtener producto por ID
   */
  async findOne(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const product = await this.productModel
      .findById(id)
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl website')
      .populate('supplierId', 'name contactEmail contactPhone')
      .populate('createdBy', 'displayName email')
      .exec();

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  /**
   * Obtener producto por SKU
   */
  async findBySku(sku: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findOne({ sku })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .populate('createdBy', 'displayName email')
      .exec();

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  /**
   * Obtener producto por código de barras
   */
  async findByBarcode(barcode: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findOne({ barcode })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .populate('createdBy', 'displayName email')
      .exec();

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  /**
   * Actualizar producto
   */
  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    // Verificar si ya existe otro producto con el mismo SKU
    if (updateProductDto.sku) {
      const existingProduct = await this.productModel.findOne({ 
        sku: updateProductDto.sku,
        _id: { $ne: id }
      }).exec();

      if (existingProduct) {
        throw new ConflictException('Ya existe otro producto con este SKU');
      }
    }

    // Verificar si ya existe otro producto con el mismo código de barras
    if (updateProductDto.barcode) {
      const existingBarcode = await this.productModel.findOne({ 
        barcode: updateProductDto.barcode,
        _id: { $ne: id }
      }).exec();

      if (existingBarcode) {
        throw new ConflictException('Ya existe otro producto con este código de barras');
      }
    }

    // Validar precios si se actualizan
    if (updateProductDto.salePrice !== undefined && updateProductDto.costPrice !== undefined) {
      if (updateProductDto.salePrice < updateProductDto.costPrice) {
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

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  /**
   * Eliminar producto
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    // Eliminar imágenes asociadas primero
    await this.productImageModel.deleteMany({ productId: id }).exec();

    const result = await this.productModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Producto no encontrado');
    }
  }

  /**
   * Activar/desactivar producto
   */
  async toggleActive(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    product.isActive = !product.isActive;
    return product.save();
  }

  /**
   * Marcar/desmarcar producto como destacado
   */
  async toggleFeatured(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    product.isFeatured = !product.isFeatured;
    return product.save();
  }

  /**
   * Actualizar stock del producto
   */
  async updateStock(id: string, stockUpdate: StockUpdateDto): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    product.stockQuantity = stockUpdate.quantity;
    const updatedProduct = await product.save();

    // Aquí podrías registrar el movimiento de stock en otra colección
    // await this.stockMovementService.recordMovement(...);

    return this.findOne(id);
  }

  /**
   * Incrementar stock
   */
  async incrementStock(id: string, quantity: number): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const product = await this.productModel.findByIdAndUpdate(
      id,
      { $inc: { stockQuantity: quantity } },
      { new: true }
    ).exec();

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return this.findOne(id);
  }

  /**
   * Decrementar stock
   */
  async decrementStock(id: string, quantity: number): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (product.stockQuantity < quantity) {
      throw new BadRequestException('Stock insuficiente');
    }

    product.stockQuantity -= quantity;
    const updatedProduct = await product.save();

    return this.findOne(id);
  }

  /**
   * Reservar stock
   */
  async reserveStock(id: string, quantity: number): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const available = product.stockQuantity - product.reservedQuantity;
    if (available < quantity) {
      throw new BadRequestException('Stock disponible insuficiente para reservar');
    }

    product.reservedQuantity += quantity;
    const updatedProduct = await product.save();

    return this.findOne(id);
  }

  /**
   * Liberar stock reservado
   */
  async releaseStock(id: string, quantity: number): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (product.reservedQuantity < quantity) {
      throw new BadRequestException('Cantidad a liberar mayor al stock reservado');
    }

    product.reservedQuantity -= quantity;
    const updatedProduct = await product.save();

    return this.findOne(id);
  }

  /**
   * Obtener productos por categoría
   */
  async findByCategory(categoryId: string): Promise<ProductDocument[]> {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('ID de categoría inválido');
    }

    return this.productModel
      .find({ 
        categoryId: new Types.ObjectId(categoryId),
        isActive: true 
      })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Obtener productos por marca
   */
  async findByBrand(brandId: string): Promise<ProductDocument[]> {
    if (!Types.ObjectId.isValid(brandId)) {
      throw new BadRequestException('ID de marca inválido');
    }

    return this.productModel
      .find({ 
        brandId: new Types.ObjectId(brandId),
        isActive: true 
      })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Obtener productos destacados
   */
  async findFeaturedProducts(limit: number = 10): Promise<ProductDocument[]> {
    return this.productModel
      .find({ 
        isFeatured: true,
        isActive: true 
      })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Obtener productos con stock bajo
   */
  async findLowStockProducts(): Promise<ProductDocument[]> {
    return this.productModel
      .find({
        isActive: true,
        $expr: {
          $lte: [
            { $subtract: ['$stockQuantity', '$reservedQuantity'] },
            '$minStock'
          ]
        }
      })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .sort({ stockQuantity: 1 })
      .exec();
  }

  /**
   * Obtener productos sin stock
   */
  async findOutOfStockProducts(): Promise<ProductDocument[]> {
    return this.productModel
      .find({
        isActive: true,
        $expr: {
          $lte: [
            { $subtract: ['$stockQuantity', '$reservedQuantity'] },
            0
          ]
        }
      })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Obtener estadísticas de productos
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    featured: number;
    outOfStock: number;
    lowStock: number;
    totalStockValue: number;
    averageProfitMargin: number;
  }> {
    const [
      total,
      active,
      featured,
      outOfStock,
      lowStock,
      stockValueResult,
      marginResult
    ] = await Promise.all([
      this.productModel.countDocuments(),
      this.productModel.countDocuments({ isActive: true }),
      this.productModel.countDocuments({ isFeatured: true, isActive: true }),
      this.productModel.countDocuments({
        isActive: true,
        $expr: { $lte: [{ $subtract: ['$stockQuantity', '$reservedQuantity'] }, 0] }
      }),
      this.productModel.countDocuments({
        isActive: true,
        $expr: {
          $and: [
            { $gt: [{ $subtract: ['$stockQuantity', '$reservedQuantity'] }, 0] },
            { $lte: [
              { $subtract: ['$stockQuantity', '$reservedQuantity'] },
              '$minStock'
            ]}
          ]
        }
      }),
      this.productModel.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ['$stockQuantity', '$costPrice'] } }
          }
        }
      ]),
      this.productModel.aggregate([
        { $match: { isActive: true, costPrice: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            avgMargin: {
              $avg: {
                $multiply: [
                  { $divide: [
                    { $subtract: ['$salePrice', '$costPrice'] },
                    '$costPrice'
                  ]},
                  100
                ]
              }
            }
          }
        }
      ])
    ]);

    const totalStockValue = stockValueResult[0]?.totalValue || 0;
    const averageProfitMargin = marginResult[0]?.avgMargin || 0;

    return {
      total,
      active,
      featured,
      outOfStock,
      lowStock,
      totalStockValue,
      averageProfitMargin
    };
  }

  /**
   * Buscar productos
   */
  async searchProducts(search: string, limit: number = 10): Promise<ProductDocument[]> {
    return this.productModel
      .find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } }
        ],
        isActive: true
      })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name logoUrl')
      .populate('supplierId', 'name contactEmail')
      .limit(limit)
      .exec();
  }

  /**
   * Verificar si existe producto por SKU
   */
  async skuExists(sku: string, excludeId?: string): Promise<boolean> {
    const query: any = { 
      sku 
    };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const count = await this.productModel.countDocuments(query).exec();
    return count > 0;
  }

  /**
   * Verificar si existe producto por código de barras
   */
  async barcodeExists(barcode: string, excludeId?: string): Promise<boolean> {
    if (!barcode) return false;
    
    const query: any = { 
      barcode 
    };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const count = await this.productModel.countDocuments(query).exec();
    return count > 0;
  }

  /**
   * Obtener productos con información básica para selects
   */
  async getProductsForSelect(): Promise<Array<{ _id: string; name: string; sku: string; salePrice: number }>> {
    const products = await this.productModel
      .find({ isActive: true })
      .select('name sku salePrice')
      .sort({ name: 1 })
      .exec();

    return products.map(product => ({
      _id: (product._id as Types.ObjectId).toString(),
      name: product.name,
      sku: product.sku,
      salePrice: product.salePrice
    }));
  }

  // ========== MÉTODOS PARA IMÁGENES DE PRODUCTOS ==========

  /**
   * Crear imágenes de producto
   */
  private async createProductImages(productId: string, images: any[]): Promise<void> {
    const imageDocs = images.map(image => ({
      ...image,
      productId: new Types.ObjectId(productId)
    }));

    await this.productImageModel.insertMany(imageDocs);
  }

  /**
   * Obtener imágenes de un producto
   */
  async getProductImages(productId: string): Promise<ProductImageDocument[]> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID de producto inválido');
    }

    return this.productImageModel
      .find({ productId: new Types.ObjectId(productId) })
      .sort({ isPrimary: -1, sortOrder: 1 })
      .exec();
  }

  /**
   * Agregar imagen a producto
   */
  async addProductImage(createImageDto: CreateProductImageDto): Promise<ProductImageDocument> {
    if (!Types.ObjectId.isValid(createImageDto.productId)) {
      throw new BadRequestException('ID de producto inválido');
    }

    // Verificar que el producto existe
    const product = await this.productModel.findById(createImageDto.productId).exec();
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Si esta imagen es primaria, quitar primaria de otras imágenes
    if (createImageDto.isPrimary) {
      await this.productImageModel.updateMany(
        { productId: createImageDto.productId },
        { isPrimary: false }
      ).exec();
    }

    const image = new this.productImageModel({
      ...createImageDto,
      productId: new Types.ObjectId(createImageDto.productId)
    });

    return image.save();
  }

  /**
   * Actualizar imagen de producto
   */
  async updateProductImage(id: string, updateImageDto: UpdateProductImageDto): Promise<ProductImageDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de imagen inválido');
    }

    // Si esta imagen se marca como primaria, quitar primaria de otras imágenes
    if (updateImageDto.isPrimary) {
      const image = await this.productImageModel.findById(id).exec();
      if (image) {
        await this.productImageModel.updateMany(
          { 
            productId: image.productId,
            _id: { $ne: id }
          },
          { isPrimary: false }
        ).exec();
      }
    }

    const image = await this.productImageModel
      .findByIdAndUpdate(id, updateImageDto, { new: true, runValidators: true })
      .exec();

    if (!image) {
      throw new NotFoundException('Imagen no encontrada');
    }

    return image;
  }

  /**
   * Eliminar imagen de producto
   */
  async removeProductImage(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de imagen inválido');
    }

    const result = await this.productImageModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Imagen no encontrada');
    }
  }

  /**
   * Establecer imagen como primaria
   */
  async setPrimaryImage(id: string): Promise<ProductImageDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de imagen inválido');
    }

    const image = await this.productImageModel.findById(id).exec();
    if (!image) {
      throw new NotFoundException('Imagen no encontrada');
    }

    // Quitar primaria de todas las imágenes del producto
    await this.productImageModel.updateMany(
      { productId: image.productId },
      { isPrimary: false }
    ).exec();

    // Establecer esta imagen como primaria
    image.isPrimary = true;
    return image.save();
  }

  /**
   * Reordenar imágenes de producto
   */
  async reorderProductImages(updates: Array<{ id: string; sortOrder: number }>): Promise<void> {
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(update.id) },
        update: { sortOrder: update.sortOrder }
      }
    }));

    await this.productImageModel.bulkWrite(bulkOps);
  }

  async countByBrand(brandId: string): Promise<number> {
    if (!Types.ObjectId.isValid(brandId)) return 0;
    return this.productModel.countDocuments({ brandId: new Types.ObjectId(brandId) }).exec();
  }
}