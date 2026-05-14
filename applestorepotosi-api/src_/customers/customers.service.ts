// src/customers/customers.service.ts
import {Injectable,NotFoundException,ConflictException,BadRequestException,} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { LoyaltyPointsDto } from './dto/loyalty-points.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  /* ---------- VALIDACIONES PRIVADAS (DRY) ---------- */
  private async ensureUniqueEmail(email: string, excludeId?: string) {
    const q: any = { email };
    if (excludeId) q._id = { $ne: excludeId };
    if (await this.customerModel.exists(q))
      throw new ConflictException('Email ya registrado');
  }

  private async ensureUniqueTaxId(taxId: string, excludeId?: string) {
    if (!taxId) return;
    const q: any = { taxId };
    if (excludeId) q._id = { $ne: excludeId };
    if (await this.customerModel.exists(q))
      throw new ConflictException('TaxId ya registrado');
  }

  private async ensureUniqueUserId(userId: string, excludeId?: string) {
    if (!userId) return;
    const q: any = { userId: new Types.ObjectId(userId) };
    if (excludeId) q._id = { $ne: excludeId };
    if (await this.customerModel.exists(q))
      throw new ConflictException('Este usuario ya está asociado a otro cliente');
  }

  /* ---------- CREAR ---------- */
  async create(
    dto: CreateCustomerDto,
    updatedBy?: string,
  ): Promise<CustomerDocument> {
    await this.ensureUniqueEmail(dto.email);
    if (dto.taxId) await this.ensureUniqueTaxId(dto.taxId);
    if (dto.userId) await this.ensureUniqueUserId(dto.userId);

    const data = {
      ...dto,
      // ...(dto.userId && { userId: new Types.ObjectId(dto.userId) }),
      updatedBy,
    };

    // 🔥 Quitamos la clave si no hay usuario
    if (!data.userId || data.userId === 'null' || data.userId === null) {
      delete data.userId; // no se guarda
    } else {
      data.userId = data.userId; // ← ya es string, déjalo tal cual
    }

    return new this.customerModel(data).save();
  }

  /* ---------- CREAR DESDE USUARIO ---------- */
  async createFromUser(
    userId: string,
    customerData: Partial<CreateCustomerDto>,
  ): Promise<CustomerDocument> {
    await this.ensureUniqueUserId(userId);
    const data = {
      ...customerData,
      userId,
    };
    return this.create(data as CreateCustomerDto);
  }

  /* ---------- LISTADO ---------- */
  async findAll(query: CustomerQueryDto) {
    const { isActive, country, search, hasLoyaltyPoints, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const filter: any = { isDeleted: false };

    if (isActive !== undefined) filter.isActive = isActive;
    if (country) filter['address.country'] = { $regex: country, $options: 'i' };
    if (hasLoyaltyPoints !== undefined)
      filter.loyaltyPoints = hasLoyaltyPoints ? { $gt: 0 } : 0;
    if (search)
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];

    const [customers, total] = await Promise.all([
      this.customerModel
        .find(filter)
        .populate('userId', 'displayName email phoneNumber')
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.customerModel.countDocuments(filter).exec(),
    ]);
    const totalPages = Math.ceil(total / limit);
    return { customers, total, page, totalPages };
  }

  /* ---------- ACTIVOS ---------- */
  async findActiveCustomers(): Promise<CustomerDocument[]> {
    return this.customerModel
      .find({ isActive: true, isDeleted: false })
      .populate('userId', 'displayName email phoneNumber')
      .sort({ fullName: 1 })
      .exec();
  }

  /* ---------- TOP LEALTAD ---------- */
  async findTopLoyaltyCustomers(limit = 10): Promise<CustomerDocument[]> {
    return this.customerModel
      .find({ isActive: true, isDeleted: false, loyaltyPoints: { $gt: 0 } })
      .populate('userId', 'displayName email phoneNumber')
      .sort({ loyaltyPoints: -1 })
      .limit(limit)
      .exec();
  }

  /* ---------- POR PAÍS ---------- */
  async findByCountry(country: string): Promise<CustomerDocument[]> {
    return this.customerModel
      .find({ 'address.country': { $regex: country, $options: 'i' }, isDeleted: false })
      .populate('userId', 'displayName email phoneNumber')
      .sort({ fullName: 1 })
      .exec();
  }

  /* ---------- ÚNICO ---------- */
  async findOne(id: string): Promise<CustomerDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const c = await this.customerModel
      .findOne({ _id: id, isDeleted: false })
      .populate('userId', 'displayName email phoneNumber')
      .exec();
    if (!c) throw new NotFoundException('Cliente no encontrado');
    return c;
  }

  /* ---------- VARIOS BY ---------- */
  async findByEmail(email: string) {
    const c = await this.customerModel
      .findOne({ email, isDeleted: false })
      .populate('userId', 'displayName email phoneNumber')
      .exec();
    if (!c) throw new NotFoundException('Cliente no encontrado');
    return c;
  }

  async findByUserId(userId: string) {
    if (!Types.ObjectId.isValid(userId)) throw new BadRequestException('UserID inválido');
    const c = await this.customerModel
      .findOne({ userId: new Types.ObjectId(userId), isDeleted: false })
      .populate('userId', 'displayName email phoneNumber')
      .exec();
    if (!c) throw new NotFoundException('Cliente no encontrado');
    return c;
  }

  async findByTaxId(taxId: string) {
    const c = await this.customerModel
      .findOne({ taxId, isDeleted: false })
      .populate('userId', 'displayName email phoneNumber')
      .exec();
    if (!c) throw new NotFoundException('Cliente no encontrado');
    return c;
  }

  async findAllRaw(): Promise<CustomerDocument[]> {
    const docs = await this.customerModel
      .find()
      .sort({ timestamp: -1 })
      .exec();

    return docs; 
  }

  /* ---------- ACTUALIZAR ---------- */
  async update(
    id: string,
    dto: UpdateCustomerDto,
    updatedBy?: string,
  ): Promise<CustomerDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');

    if (dto.email) await this.ensureUniqueEmail(dto.email, id);
    if (dto.taxId) await this.ensureUniqueTaxId(dto.taxId, id);
    if (dto.userId) await this.ensureUniqueUserId(dto.userId, id);

    const data = {
      ...dto,
      ...(dto.userId && { userId: new Types.ObjectId(dto.userId) }),
      updatedBy,
    };

    const customer = await this.customerModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, data, {
        new: true,
        runValidators: true,
      })
      .populate('userId', 'displayName email phoneNumber')
      .exec();
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }

  /* ---------- SOFT-DELETE ---------- */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const res = await this.customerModel
      .updateOne({ _id: id, isDeleted: false }, { isDeleted: true })
      .exec();
    if (res.modifiedCount === 0) throw new NotFoundException('Cliente no encontrado');
  }

  /* ---------- TOGGLE ACTIVO ---------- */
  async toggleActive(id: string): Promise<CustomerDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('ID inválido');
    const customer = await this.customerModel.findOne({ _id: id, isDeleted: false }).exec();
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    customer.isActive = !customer.isActive;
    return customer.save();
  }

  /* ---------- PUNTOS LEALTAD ---------- */
  async addLoyaltyPoints(id: string, dto: LoyaltyPointsDto): Promise<CustomerDocument> {
    const customer = await this.findOne(id);
    customer.loyaltyPoints += dto.points;
    await customer.save();
    return this.findOne(id);
  }

  async subtractLoyaltyPoints(id: string, dto: LoyaltyPointsDto): Promise<CustomerDocument> {
    const customer = await this.findOne(id);
    if (customer.loyaltyPoints < dto.points)
      throw new BadRequestException('Puntos insuficientes');
    customer.loyaltyPoints -= dto.points;
    await customer.save();
    return this.findOne(id);
  }

  async setLoyaltyPoints(id: string, points: number): Promise<CustomerDocument> {
    if (points < 0) throw new BadRequestException('Puntos negativos');
    const customer = await this.customerModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { loyaltyPoints: points }, { new: true })
      .exec();
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }

  /* ---------- ESTADÍSTICAS ---------- */
  async getStats() {
    const [total, active, withLoyalty, byCountry, totalPoints] = await Promise.all([
      this.customerModel.countDocuments({ isDeleted: false }),
      this.customerModel.countDocuments({ isActive: true, isDeleted: false }),
      this.customerModel.countDocuments({ loyaltyPoints: { $gt: 0 }, isDeleted: false }),
      this.customerModel.aggregate([{ $group: { _id: '$address.country', count: { $sum: 1 } } }]),
      this.customerModel.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, total: { $sum: '$loyaltyPoints' } } }]),
    ]);

    const byCountryMap: Record<string, number> = {};
    byCountry.forEach((c) => (byCountryMap[c._id || 'Sin país'] = c.count));

    return {
      total,
      active: active,
      withLoyaltyPoints: withLoyalty,
      byCountry: byCountryMap,
      totalLoyaltyPoints: totalPoints[0]?.total || 0,
    };
  }

  /* ---------- BÚSQUEDAS / SELECT ---------- */
  async searchCustomers(search: string, limit = 10) {
    return this.customerModel
      .find({
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
        isDeleted: false,
        isActive: true,
      })
      .populate('userId', 'displayName email phoneNumber')
      .limit(limit)
      .exec();
  }

  async getUniqueCountries() {
    const countries = await this.customerModel.distinct('address.country', { isDeleted: false }).exec();
    return countries.filter((c) => c && c.trim() !== '');
  }

  async getCustomersForSelect() {
    return this.customerModel
      .find({ isActive: true, isDeleted: false })
      .select('fullName email phone')
      .sort({ fullName: 1 })
      .exec();
  }

  /* ---------- VERIFICACIONES ---------- */
  async emailExists(email: string, excludeId?: string) {
    const q: any = { email };
    if (excludeId) q._id = { $ne: excludeId };
    return (await this.customerModel.countDocuments(q).exec()) > 0;
  }

  async taxIdExists(taxId: string, excludeId?: string) {
    if (!taxId) return false;
    const q: any = { taxId };
    if (excludeId) q._id = { $ne: excludeId };
    return (await this.customerModel.countDocuments(q).exec()) > 0;
  }

  async userIdExists(userId: string, excludeId?: string) {
    if (!userId) return false;
    const q: any = { userId: new Types.ObjectId(userId) };
    if (excludeId) q._id = { $ne: excludeId };
    return (await this.customerModel.countDocuments(q).exec()) > 0;
  }

  /* ---------- CLIENTE AUTENTICADO ---------- */
  async getCurrentCustomer(userId: string): Promise<CustomerDocument> {
    return this.findByUserId(userId);
  }

  async findAllDebug() {
    const [customers, total] = await Promise.all([
      this.customerModel
        .find()
        .populate('userId', 'displayName email phoneNumber')
        .sort({ fullName: 1 })
        .exec(),
      this.customerModel.countDocuments().exec(),
    ]);
    return { customers, total };
  }

  async getPublicGeneralId(): Promise<any> {
    const customer = await this.customerModel.findOne({ isPublicGeneral: true });
    if (!customer) {
      return { customerId: null };
    }
    return { customerId: customer._id || null };
  }

  async findPublicGeneral(): Promise<CustomerDocument> {
    const customer = await this.customerModel
      .findOne({ isPublicGeneral: true })
      .exec();

    if (!customer) {
      throw new NotFoundException('Cliente "Público General" no encontrado');
    }

    return customer; // ✅ ahora es CustomerDocument, no null
  }
}