// src/brands/brands.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Brand, BrandDocument } from './schemas/brand.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandQueryDto } from './dto/brand-query.dto';
// import { ProductsService } from 'src/products/products.service';
import { ProductsService } from '../products/products.service';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly productsService: ProductsService,
  ) {}

  /**
   * Crear nueva marca
   */
  async create(createBrandDto: CreateBrandDto): Promise<BrandDocument> {
    // Verificar si ya existe una marca con el mismo nombre
    const existingBrand = await this.brandModel.findOne({ 
      name: { $regex: new RegExp(`^${createBrandDto.name}$`, 'i') }
    }).exec();

    if (existingBrand) {
      throw new ConflictException('Ya existe una marca con este nombre');
    }

    const brand = new this.brandModel(createBrandDto);
    return brand.save();
  }

  /**
   * Obtener todas las marcas con filtros
   */
  async findAll(query: BrandQueryDto): Promise<{
    brands: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { 
      isActive, 
      country, 
      search, 
      page = 1, 
      limit = 10 
    } = query;

    // console.log("============>", limit);
    const skip = (page - 1) * limit;
    const filter: any = {};

    // Filtrar por estado activo
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    // Filtrar por país
    if (country) {
      filter.country = { $regex: country, $options: 'i' };
    }

    // Búsqueda por nombre o descripción
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }


    const [brands, total] = await Promise.all([
      this.brandModel
        .find(filter)
        .lean() // ← agrega lean
        .sort({ name: 1 })
        .skip(skip)
        .limit(0)             // .limit(limit)
        .exec(),
      this.brandModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { brands, total, page, totalPages };
  }

  /**
   * Obtener marca por ID
   */
  async findOne(id: string): Promise<BrandDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de marca inválido');
    }

    const brand = await this.brandModel.findById(id).exec();

    if (!brand) {
      throw new NotFoundException('Marca no encontrada');
    }

    return brand;
  }

  /**
   * Obtener marca por nombre
   */
  async findByName(name: string): Promise<BrandDocument> {
    const brand = await this.brandModel.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    }).exec();

    if (!brand) {
      throw new NotFoundException('Marca no encontrada');
    }

    return brand;
  }

  /**
   * Actualizar marca
   */
  async update(id: string, updateBrandDto: UpdateBrandDto): Promise<BrandDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de marca inválido');
    }

    // Verificar si ya existe otra marca con el mismo nombre
    if (updateBrandDto.name) {
      const existingBrand = await this.brandModel.findOne({ 
        name: { $regex: new RegExp(`^${updateBrandDto.name}$`, 'i') },
        _id: { $ne: id }
      }).exec();

      if (existingBrand) {
        throw new ConflictException('Ya existe otra marca con este nombre');
      }
    }

    const brand = await this.brandModel
      .findByIdAndUpdate(id, updateBrandDto, { new: true, runValidators: true })
      .exec();

    if (!brand) {
      throw new NotFoundException('Marca no encontrada');
    }

    return brand;
  }

  /**
   * Eliminar marca
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de marca inválido');
    }

    // ← Verificación de integridad
    const productsCount = await this.productsService.countByBrand(id);
    if (productsCount > 0) {
      throw new ConflictException(
        `No se puede eliminar la marca porque tiene ${productsCount} productos asociados.`,
      );
    }

    const result = await this.brandModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Marca no encontrada');
    }
  }

  /**
   * Activar/desactivar marca
   */
  async toggleActive(id: string): Promise<BrandDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de marca inválido');
    }

    const brand = await this.brandModel.findById(id).exec();
    if (!brand) {
      throw new NotFoundException('Marca no encontrada');
    }

    brand.isActive = !brand.isActive;
    return brand.save();
  }

  /**
   * Obtener marcas activas
   */
  async findActiveBrands(): Promise<any[]> {
    return this.brandModel.find({ isActive: true }).lean().sort({ name: 1 }).exec();
  }

  /**
   * Obtener marcas por país
   */
  async findByCountry(country: string): Promise<BrandDocument[]> {
    return this.brandModel
      .find({ 
        country: { $regex: country, $options: 'i' },
        isActive: true 
      })
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Obtener estadísticas de marcas
   */
  async getStats() {
    const [total, active, byCountry, productCountByBrand] = await Promise.all([
      this.brandModel.countDocuments(),
      this.brandModel.countDocuments({ isActive: true }),
      this.brandModel.aggregate([
        { $group: { _id: '$country', count: { $sum: 1 } } },
      ]),
      this.productModel.aggregate([
        { $group: { _id: '$brandId', productCount: { $sum: 1 } } },
      ]),
    ]);

    const statsByCountry = byCountry.reduce((acc, c) => {
      acc[c._id || 'Sin país'] = c.count;
      return acc;
    }, {});

    const brandProductMap = productCountByBrand.reduce((acc, b) => {
      acc[b._id.toString()] = b.productCount;
      return acc;
    }, {});

    return {
      total,
      active,
      byCountry: statsByCountry,
      productCountByBrand: brandProductMap, // ← nuevo
    };
  }

  /**
   * Buscar marcas por nombre (autocomplete)
   */
  async searchBrands(search: string, limit: number): Promise<any[]> { 
    return this.brandModel
      .find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
        isActive: true,
      })
      .lean() // ← agrega lean
      .limit(limit)
      .exec();
  }

  /**
   * Obtener países únicos de marcas
   */
  async getUniqueCountries(): Promise<string[]> {
    const countries = await this.brandModel.distinct('country').exec();
    return countries.filter(country => country && country.trim() !== '');
  }

  /**
   * Verificar si existe marca por nombre
   */
  async nameExists(name: string, excludeId?: string): Promise<boolean> {
    const query: any = { 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const count = await this.brandModel.countDocuments(query).exec();
    return count > 0;
  }

  /**
   * Obtener marcas populares (con más productos)
   * Nota: Esto requeriría agregar un campo de contador o hacer un aggregation
   */
  async getPopularBrands(limit: number = 10): Promise<BrandDocument[]> {
    // Por ahora retornamos marcas activas ordenadas por nombre
    // En una implementación real, esto haría un aggregation con products
    return this.brandModel
      .find({ isActive: true })
      .sort({ name: 1 })
      .limit(limit)
      .exec();
  }

  /**
   * Actualizar logo de marca
   */
  async updateLogo(id: string, logoUrl: string): Promise<BrandDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de marca inválido');
    }

    const brand = await this.brandModel
      .findByIdAndUpdate(
        id, 
        { logoUrl }, 
        { new: true, runValidators: true }
      )
      .exec();

    if (!brand) {
      throw new NotFoundException('Marca no encontrada');
    }

    return brand;
  }

  /**
   * Obtener marcas con información básica para selects
   */
  async getBrandsForSelect(): Promise<Array<{ _id: string; name: string; logoUrl?: string }>> {
    const brands = await this.brandModel
      .find({ isActive: true })
      .select('name logoUrl')
      .sort({ name: 1 })
      .exec();

    return brands.map(brand => ({
      _id: (brand._id as Types.ObjectId).toString(), // CORRECCIÓN: Type assertion
      name: brand.name,
      logoUrl: brand.logoUrl
    }));
  }

  /**
   * Desactivar usuario
   */
  async deactivateBrand(_id: string): Promise<BrandDocument> {
    const brand = await this.brandModel.findOneAndUpdate(
      { _id },
      { 
        isActive: false,
        updatedAt: new Date()
      },
      { new: true }
    ).exec();

    if (!brand) {
      throw new NotFoundException(`Marca con UID ${_id} no encontrado`);
    }

    return brand;
  }

  /**
   * Activar usuario
   */
  async activateBrand(_id: string): Promise<BrandDocument> {
    const brand = await this.brandModel.findOneAndUpdate(
      { _id },
      { 
        isActive: true,
        updatedAt: new Date()
      },
      { new: true }
    ).exec();

    if (!brand) {
      throw new NotFoundException(`Marca con UID ${_id} no encontrado`);
    }

    return brand;
  }
}