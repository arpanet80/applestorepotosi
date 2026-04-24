// src/suppliers/suppliers.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
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

  async create(createSupplierDto: CreateSupplierDto): Promise<SupplierDocument> {
    const existing = await this.supplierModel.findOne({
      contactEmail: createSupplierDto.contactEmail,
    });
    if (existing) throw new ConflictException('Email ya registrado');

    if (createSupplierDto.taxId) {
      const existingTax = await this.supplierModel.findOne({
        taxId: createSupplierDto.taxId,
      });
      if (existingTax) throw new ConflictException('TaxId ya registrado');
    }

    const supplier = new this.supplierModel(createSupplierDto);
    return supplier.save();
  }

  async findAll(query: SupplierQueryDto) {
    const { isActive, country, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (isActive !== undefined) filter.isActive = isActive;
    if (country) filter['address.country'] = { $regex: country, $options: 'i' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { representative: { $regex: search, $options: 'i' } },
        { contactEmail: { $regex: search, $options: 'i' } },
        { contactPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      this.supplierModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit).exec(),
      this.supplierModel.countDocuments(filter).exec(),
    ]);

    return { suppliers, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<SupplierDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<SupplierDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');

    if (dto.contactEmail) {
      const existing = await this.supplierModel.findOne({
        contactEmail: dto.contactEmail,
        _id: { $ne: id },
      });
      if (existing) throw new ConflictException('Email ya registrado');
    }

    if (dto.taxId) {
      const existing = await this.supplierModel.findOne({
        taxId: dto.taxId,
        _id: { $ne: id },
      });
      if (existing) throw new ConflictException('TaxId ya registrado');
    }

    const updated = await this.supplierModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();

    if (!updated) throw new NotFoundException('Proveedor no encontrado');
    return updated;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const result = await this.supplierModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) throw new NotFoundException('Proveedor no encontrado');
  }

  async toggleActive(id: string): Promise<SupplierDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    supplier.isActive = !supplier.isActive;
    return supplier.save();
  }

  async getSuppliersForSelect(): Promise<Array<{ _id: string; name: string }>> {
    const suppliers = await this.supplierModel
      .find({ isActive: true })
      .select('_id name')
      .sort({ name: 1 })
      .exec();

    return suppliers.map((s) => ({
      _id: (s._id as Types.ObjectId).toString(),
      name: s.name,
    }));
  }

  async findActiveSuppliers(): Promise<SupplierDocument[]> {
    return this.supplierModel.find({ isActive: true }).sort({ name: 1 }).exec();
  }

  async findByCountry(country: string): Promise<SupplierDocument[]> {
    return this.supplierModel
      .find({ 'address.country': { $regex: country, $options: 'i' }, isActive: true })
      .sort({ name: 1 })
      .exec();
  }

  async findByEmail(email: string): Promise<SupplierDocument> {
    const supplier = await this.supplierModel.findOne({ contactEmail: email }).exec();
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier;
  }

  async findByTaxId(taxId: string): Promise<SupplierDocument> {
    const supplier = await this.supplierModel.findOne({ taxId }).exec();
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier;
  }

  async getStats() {
    const [total, active, byCountry] = await Promise.all([
      this.supplierModel.countDocuments(),
      this.supplierModel.countDocuments({ isActive: true }),
      this.supplierModel.aggregate([
        { $group: { _id: '$address.country', count: { $sum: 1 } } },
      ]),
    ]);

    const byCountryMap: Record<string, number> = {};
    byCountry.forEach((c) => {
      const name = c._id || 'Sin país';
      byCountryMap[name] = c.count;
    });

    return { total, active, byCountry: byCountryMap };
  }

  async searchSuppliers(search: string, limit = 10): Promise<SupplierDocument[]> {
    return this.supplierModel
      .find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { representative: { $regex: search, $options: 'i' } },
          { contactEmail: { $regex: search, $options: 'i' } },
        ],
        isActive: true,
      })
      .limit(limit)
      .sort({ name: 1 })
      .exec();
  }

  async getUniqueCountries(): Promise<string[]> {
    const countries = await this.supplierModel.distinct('address.country').exec();
    return countries.filter((c) => c && c.trim() !== '');
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const query: any = { contactEmail: email };
    if (excludeId) query._id = { $ne: excludeId };
    const count = await this.supplierModel.countDocuments(query).exec();
    return count > 0;
  }

  async taxIdExists(taxId: string, excludeId?: string): Promise<boolean> {
    if (!taxId) return false;
    const query: any = { taxId };
    if (excludeId) query._id = { $ne: excludeId };
    const count = await this.supplierModel.countDocuments(query).exec();
    return count > 0;
  }

  async updateBankInfo(id: string, bankInfo: any): Promise<SupplierDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const updated = await this.supplierModel
      .findByIdAndUpdate(id, { bankInfo }, { new: true, runValidators: true })
      .exec();
    if (!updated) throw new NotFoundException('Proveedor no encontrado');
    return updated;
  }

  async updatePaymentTerms(id: string, paymentTerms: string): Promise<SupplierDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const updated = await this.supplierModel
      .findByIdAndUpdate(id, { paymentTerms }, { new: true, runValidators: true })
      .exec();
    if (!updated) throw new NotFoundException('Proveedor no encontrado');
    return updated;
  }

  async getSuppliersWithBestTerms(): Promise<SupplierDocument[]> {
    return this.supplierModel
      .find({ isActive: true, paymentTerms: { $exists: true, $ne: '' } })
      .sort({ name: 1 })
      .limit(10)
      .exec();
  }

  /**
   * Desactivar usuario
   */
  async deactivateProduct(_id: string): Promise<SupplierDocument> {
    const product = await this.supplierModel.findOneAndUpdate(
      { _id },
      { 
        isActive: false,
        updatedAt: new Date()
      },
      { new: true }
    ).exec();

    if (!product) {
      throw new NotFoundException(`Proveedor con UID ${_id} no encontrado`);
    }

    return product;
  }

  /**
   * Activar usuario
   */
  async activateProduct(_id: string): Promise<SupplierDocument> {
    const product = await this.supplierModel.findOneAndUpdate(
      { _id },
      { 
        isActive: true,
        updatedAt: new Date()
      },
      { new: true }
    ).exec();

    if (!product) {
      throw new NotFoundException(`Proveedor con UID ${_id} no encontrado`);
    }

    return product;
  }
}