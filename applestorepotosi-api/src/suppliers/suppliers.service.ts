// src/suppliers/suppliers.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Supplier, SupplierDocument } from './schemas/supplier.schema';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierQueryDto } from './dto/supplier-query.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name) 
    private supplierModel: Model<SupplierDocument>,
  ) {}

  /**
   * Crear nuevo proveedor
   */
  async create(createSupplierDto: CreateSupplierDto): Promise<SupplierDocument> {
    // Verificar si ya existe un proveedor con el mismo email
    const existingSupplier = await this.supplierModel.findOne({ 
      contactEmail: createSupplierDto.contactEmail 
    }).exec();

    if (existingSupplier) {
      throw new ConflictException('Ya existe un proveedor con este email');
    }

    // Verificar si ya existe un proveedor con el mismo taxId si se proporciona
    if (createSupplierDto.taxId) {
      const existingTaxId = await this.supplierModel.findOne({ 
        taxId: createSupplierDto.taxId 
      }).exec();

      if (existingTaxId) {
        throw new ConflictException('Ya existe un proveedor con este taxId');
      }
    }

    const supplier = new this.supplierModel(createSupplierDto);
    return supplier.save();
  }

  /**
   * Obtener todos los proveedores con filtros
   */
  async findAll(query: SupplierQueryDto): Promise<{
    suppliers: SupplierDocument[];
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

    const skip = (page - 1) * limit;
    const filter: any = {};

    // Filtrar por estado activo
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    // Filtrar por país
    if (country) {
      filter['address.country'] = { $regex: country, $options: 'i' };
    }

    // Búsqueda por nombre, representante, email o teléfono
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { representative: { $regex: search, $options: 'i' } },
        { contactEmail: { $regex: search, $options: 'i' } },
        { contactPhone: { $regex: search, $options: 'i' } }
      ];
    }

    const [suppliers, total] = await Promise.all([
      this.supplierModel
        .find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.supplierModel.countDocuments(filter).exec()
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      suppliers,
      total,
      page,
      totalPages
    };
  }

  /**
   * Obtener proveedor por ID
   */
  async findOne(id: string): Promise<SupplierDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de proveedor inválido');
    }

    const supplier = await this.supplierModel.findById(id).exec();

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return supplier;
  }

  /**
   * Obtener proveedor por email
   */
  async findByEmail(email: string): Promise<SupplierDocument> {
    const supplier = await this.supplierModel.findOne({ 
      contactEmail: email 
    }).exec();

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return supplier;
  }

  /**
   * Obtener proveedor por taxId
   */
  async findByTaxId(taxId: string): Promise<SupplierDocument> {
    const supplier = await this.supplierModel.findOne({ 
      taxId 
    }).exec();

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return supplier;
  }

  /**
   * Actualizar proveedor
   */
  async update(id: string, updateSupplierDto: UpdateSupplierDto): Promise<SupplierDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de proveedor inválido');
    }

    // Verificar si ya existe otro proveedor con el mismo email
    if (updateSupplierDto.contactEmail) {
      const existingSupplier = await this.supplierModel.findOne({ 
        contactEmail: updateSupplierDto.contactEmail,
        _id: { $ne: id }
      }).exec();

      if (existingSupplier) {
        throw new ConflictException('Ya existe otro proveedor con este email');
      }
    }

    // Verificar si ya existe otro proveedor con el mismo taxId
    if (updateSupplierDto.taxId) {
      const existingTaxId = await this.supplierModel.findOne({ 
        taxId: updateSupplierDto.taxId,
        _id: { $ne: id }
      }).exec();

      if (existingTaxId) {
        throw new ConflictException('Ya existe otro proveedor con este taxId');
      }
    }

    const supplier = await this.supplierModel
      .findByIdAndUpdate(id, updateSupplierDto, { new: true, runValidators: true })
      .exec();

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return supplier;
  }

  /**
   * Eliminar proveedor
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de proveedor inválido');
    }

    // Verificar si el proveedor tiene órdenes de compra asociadas
    // Esto requeriría inyectar PurchaseOrdersService o hacer una consulta directa
    // Por ahora solo eliminamos

    const result = await this.supplierModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Proveedor no encontrada');
    }
  }

  /**
   * Activar/desactivar proveedor
   */
  async toggleActive(id: string): Promise<SupplierDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de proveedor inválido');
    }

    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    supplier.isActive = !supplier.isActive;
    return supplier.save();
  }

  /**
   * Obtener proveedores activos
   */
  async findActiveSuppliers(): Promise<SupplierDocument[]> {
    return this.supplierModel
      .find({ isActive: true })
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Obtener proveedores por país
   */
  async findByCountry(country: string): Promise<SupplierDocument[]> {
    return this.supplierModel
      .find({ 
        'address.country': { $regex: country, $options: 'i' },
        isActive: true 
      })
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Obtener estadísticas de proveedores
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    byCountry: Record<string, number>;
  }> {
    const [total, active, byCountry] = await Promise.all([
      this.supplierModel.countDocuments(),
      this.supplierModel.countDocuments({ isActive: true }),
      this.supplierModel.aggregate([
        {
          $group: {
            _id: '$address.country',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const statsByCountry: Record<string, number> = {};

    byCountry.forEach(countryGroup => {
      const countryName = countryGroup._id || 'Sin país';
      statsByCountry[countryName] = countryGroup.count;
    });

    return {
      total,
      active,
      byCountry: statsByCountry
    };
  }

  /**
   * Buscar proveedores por nombre, email o representante
   */
  async searchSuppliers(search: string, limit: number = 10): Promise<SupplierDocument[]> {
    return this.supplierModel
      .find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { representative: { $regex: search, $options: 'i' } },
          { contactEmail: { $regex: search, $options: 'i' } }
        ],
        isActive: true
      })
      .limit(limit)
      .exec();
  }

  /**
   * Obtener países únicos de proveedores
   */
  async getUniqueCountries(): Promise<string[]> {
    const countries = await this.supplierModel.distinct('address.country').exec();
    return countries.filter(country => country && country.trim() !== '');
  }

  /**
   * Verificar si existe proveedor por email
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const query: any = { 
      contactEmail: email 
    };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const count = await this.supplierModel.countDocuments(query).exec();
    return count > 0;
  }

  /**
   * Verificar si existe proveedor por taxId
   */
  async taxIdExists(taxId: string, excludeId?: string): Promise<boolean> {
    if (!taxId) return false;
    
    const query: any = { 
      taxId 
    };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const count = await this.supplierModel.countDocuments(query).exec();
    return count > 0;
  }

  /**
   * Obtener proveedores con información básica para selects
   */
  async getSuppliersForSelect(): Promise<Array<{ _id: string; name: string; contactEmail: string }>> {
    const suppliers = await this.supplierModel
      .find({ isActive: true })
      .select('name contactEmail')
      .sort({ name: 1 })
      .exec();

    return suppliers.map(supplier => ({
      _id: (supplier._id as Types.ObjectId).toString(),
      name: supplier.name,
      contactEmail: supplier.contactEmail
    }));
  }

  /**
   * Actualizar información bancaria del proveedor
   */
  async updateBankInfo(id: string, bankInfo: { accountNumber?: string; bankName?: string }): Promise<SupplierDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de proveedor inválido');
    }

    const supplier = await this.supplierModel
      .findByIdAndUpdate(
        id, 
        { bankInfo }, 
        { new: true, runValidators: true }
      )
      .exec();

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return supplier;
  }

  /**
   * Actualizar términos de pago
   */
  async updatePaymentTerms(id: string, paymentTerms: string): Promise<SupplierDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de proveedor inválido');
    }

    const supplier = await this.supplierModel
      .findByIdAndUpdate(
        id, 
        { paymentTerms }, 
        { new: true, runValidators: true }
      )
      .exec();

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return supplier;
  }

  /**
   * Obtener proveedores con mejores términos de pago
   */
  async getSuppliersWithBestTerms(): Promise<SupplierDocument[]> {
    return this.supplierModel
      .find({ 
        isActive: true,
        paymentTerms: { $exists: true, $ne: '' }
      })
      .sort({ name: 1 })
      .limit(10)
      .exec();
  }
}