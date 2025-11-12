// src/customers/customers.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { LoyaltyPointsDto } from './dto/loyalty-points.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) 
    private customerModel: Model<CustomerDocument>,
  ) {}

  /**
   * Crear nuevo cliente
   */
  async create(createCustomerDto: CreateCustomerDto): Promise<CustomerDocument> {
    // Verificar si ya existe un cliente con el mismo email
    const existingCustomer = await this.customerModel.findOne({ 
      email: createCustomerDto.email 
    }).exec();

    if (existingCustomer) {
      throw new ConflictException('Ya existe un cliente con este email');
    }

    // Verificar si ya existe un cliente con el mismo taxId si se proporciona
    if (createCustomerDto.taxId) {
      const existingTaxId = await this.customerModel.findOne({ 
        taxId: createCustomerDto.taxId 
      }).exec();

      if (existingTaxId) {
        throw new ConflictException('Ya existe un cliente con este taxId');
      }
    }

    // Si se proporciona userId, verificar que no esté ya en uso
    if (createCustomerDto.userId) {
      const existingUserId = await this.customerModel.findOne({ 
        userId: new Types.ObjectId(createCustomerDto.userId)
      }).exec();

      if (existingUserId) {
        throw new ConflictException('Este usuario ya está asociado a otro cliente');
      }
    }

    const customerData = {
      ...createCustomerDto,
      ...(createCustomerDto.userId && { 
        userId: new Types.ObjectId(createCustomerDto.userId) 
      })
    };

    const customer = new this.customerModel(customerData);
    return customer.save();
  }

  /**
   * Obtener todos los clientes con filtros
   */
  async findAll(query: CustomerQueryDto): Promise<{
    customers: CustomerDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { 
      isActive, 
      country, 
      search, 
      hasLoyaltyPoints,
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

    // Filtrar por puntos de lealtad
    if (hasLoyaltyPoints !== undefined) {
      if (hasLoyaltyPoints) {
        filter.loyaltyPoints = { $gt: 0 };
      } else {
        filter.loyaltyPoints = 0;
      }
    }

    // Búsqueda por nombre, email o teléfono
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const [customers, total] = await Promise.all([
      this.customerModel
        .find(filter)
        .populate('userId', 'displayName email phoneNumber')
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.customerModel.countDocuments(filter).exec()
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      customers,
      total,
      page,
      totalPages
    };
  }

  /**
   * Obtener cliente por ID
   */
  async findOne(id: string): Promise<CustomerDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de cliente inválido');
    }

    const customer = await this.customerModel
      .findById(id)
      .populate('userId', 'displayName email phoneNumber profile')
      .exec();

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return customer;
  }

  /**
   * Obtener cliente por email
   */
  async findByEmail(email: string): Promise<CustomerDocument> {
    const customer = await this.customerModel
      .findOne({ email })
      .populate('userId', 'displayName email phoneNumber')
      .exec();

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return customer;
  }

  /**
   * Obtener cliente por userId
   */
  async findByUserId(userId: string): Promise<CustomerDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const customer = await this.customerModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('userId', 'displayName email phoneNumber profile')
      .exec();

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado para este usuario');
    }

    return customer;
  }

  /**
   * Obtener cliente por taxId
   */
  async findByTaxId(taxId: string): Promise<CustomerDocument> {
    const customer = await this.customerModel
      .findOne({ taxId })
      .populate('userId', 'displayName email phoneNumber')
      .exec();

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return customer;
  }

  /**
   * Actualizar cliente
   */
  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de cliente inválido');
    }

    // Verificar si ya existe otro cliente con el mismo email
    if (updateCustomerDto.email) {
      const existingCustomer = await this.customerModel.findOne({ 
        email: updateCustomerDto.email,
        _id: { $ne: id }
      }).exec();

      if (existingCustomer) {
        throw new ConflictException('Ya existe otro cliente con este email');
      }
    }

    // Verificar si ya existe otro cliente con el mismo taxId
    if (updateCustomerDto.taxId) {
      const existingTaxId = await this.customerModel.findOne({ 
        taxId: updateCustomerDto.taxId,
        _id: { $ne: id }
      }).exec();

      if (existingTaxId) {
        throw new ConflictException('Ya existe otro cliente con este taxId');
      }
    }

    // Verificar si ya existe otro cliente con el mismo userId
    if (updateCustomerDto.userId) {
      const existingUserId = await this.customerModel.findOne({ 
        userId: new Types.ObjectId(updateCustomerDto.userId),
        _id: { $ne: id }
      }).exec();

      if (existingUserId) {
        throw new ConflictException('Este usuario ya está asociado a otro cliente');
      }
    }

    const updateData = {
      ...updateCustomerDto,
      ...(updateCustomerDto.userId && { 
        userId: new Types.ObjectId(updateCustomerDto.userId) 
      })
    };

    const customer = await this.customerModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('userId', 'displayName email phoneNumber')
      .exec();

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return customer;
  }

  /**
   * Eliminar cliente
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de cliente inválido');
    }

    // Verificar si el cliente tiene ventas asociadas
    // Esto requeriría inyectar SalesService o hacer una consulta directa
    // Por ahora solo eliminamos

    const result = await this.customerModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Cliente no encontrado');
    }
  }

  /**
   * Activar/desactivar cliente
   */
  async toggleActive(id: string): Promise<CustomerDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de cliente inválido');
    }

    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    customer.isActive = !customer.isActive;
    return customer.save();
  }

  /**
   * Agregar puntos de lealtad
   */
  async addLoyaltyPoints(id: string, loyaltyPointsDto: LoyaltyPointsDto): Promise<CustomerDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de cliente inválido');
    }

    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    customer.loyaltyPoints += loyaltyPointsDto.points;
    const updatedCustomer = await customer.save();

    // Aquí podrías registrar la transacción de puntos en otra colección
    // await this.loyaltyTransactionService.recordTransaction(...);

    return this.findOne(id);
  }

  /**
   * Reducir puntos de lealtad
   */
  async subtractLoyaltyPoints(id: string, loyaltyPointsDto: LoyaltyPointsDto): Promise<CustomerDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de cliente inválido');
    }

    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (customer.loyaltyPoints < loyaltyPointsDto.points) {
      throw new BadRequestException('Puntos de lealtad insuficientes');
    }

    customer.loyaltyPoints -= loyaltyPointsDto.points;
    const updatedCustomer = await customer.save();

    return this.findOne(id);
  }

  /**
   * Establecer puntos de lealtad
   */
  async setLoyaltyPoints(id: string, points: number): Promise<CustomerDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de cliente inválido');
    }

    if (points < 0) {
      throw new BadRequestException('Los puntos de lealtad no pueden ser negativos');
    }

    const customer = await this.customerModel
      .findByIdAndUpdate(
        id,
        { loyaltyPoints: points },
        { new: true, runValidators: true }
      )
      .populate('userId', 'displayName email phoneNumber')
      .exec();

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return customer;
  }

  /**
   * Obtener clientes activos
   */
  async findActiveCustomers(): Promise<CustomerDocument[]> {
    return this.customerModel
      .find({ isActive: true })
      .populate('userId', 'displayName email phoneNumber')
      .sort({ fullName: 1 })
      .exec();
  }

  /**
   * Obtener clientes por país
   */
  async findByCountry(country: string): Promise<CustomerDocument[]> {
    return this.customerModel
      .find({ 
        'address.country': { $regex: country, $options: 'i' },
        isActive: true 
      })
      .populate('userId', 'displayName email phoneNumber')
      .sort({ fullName: 1 })
      .exec();
  }

  /**
   * Obtener clientes con más puntos de lealtad
   */
  async findTopLoyaltyCustomers(limit: number = 10): Promise<CustomerDocument[]> {
    return this.customerModel
      .find({ 
        isActive: true,
        loyaltyPoints: { $gt: 0 }
      })
      .populate('userId', 'displayName email phoneNumber')
      .sort({ loyaltyPoints: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Obtener estadísticas de clientes
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    withLoyaltyPoints: number;
    byCountry: Record<string, number>;
    totalLoyaltyPoints: number;
  }> {
    const [total, active, withLoyaltyPoints, byCountry, totalLoyaltyPoints] = await Promise.all([
      this.customerModel.countDocuments(),
      this.customerModel.countDocuments({ isActive: true }),
      this.customerModel.countDocuments({ loyaltyPoints: { $gt: 0 } }),
      this.customerModel.aggregate([
        {
          $group: {
            _id: '$address.country',
            count: { $sum: 1 }
          }
        }
      ]),
      this.customerModel.aggregate([
        {
          $group: {
            _id: null,
            totalPoints: { $sum: '$loyaltyPoints' }
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
      withLoyaltyPoints,
      byCountry: statsByCountry,
      totalLoyaltyPoints: totalLoyaltyPoints[0]?.totalPoints || 0
    };
  }

  /**
   * Buscar clientes por nombre, email o teléfono
   */
  async searchCustomers(search: string, limit: number = 10): Promise<CustomerDocument[]> {
    return this.customerModel
      .find({
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ],
        isActive: true
      })
      .populate('userId', 'displayName email phoneNumber')
      .limit(limit)
      .exec();
  }

  /**
   * Obtener países únicos de clientes
   */
  async getUniqueCountries(): Promise<string[]> {
    const countries = await this.customerModel.distinct('address.country').exec();
    return countries.filter(country => country && country.trim() !== '');
  }

  /**
   * Verificar si existe cliente por email
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const query: any = { 
      email 
    };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const count = await this.customerModel.countDocuments(query).exec();
    return count > 0;
  }

  /**
   * Verificar si existe cliente por taxId
   */
  async taxIdExists(taxId: string, excludeId?: string): Promise<boolean> {
    if (!taxId) return false;
    
    const query: any = { 
      taxId 
    };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const count = await this.customerModel.countDocuments(query).exec();
    return count > 0;
  }

  /**
   * Verificar si existe cliente por userId
   */
  async userIdExists(userId: string, excludeId?: string): Promise<boolean> {
    if (!userId) return false;
    
    const query: any = { 
      userId: new Types.ObjectId(userId)
    };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const count = await this.customerModel.countDocuments(query).exec();
    return count > 0;
  }

  /**
   * Obtener clientes con información básica para selects
   */
  async getCustomersForSelect(): Promise<Array<{ _id: string; fullName: string; email: string; phone: string }>> {
    const customers = await this.customerModel
      .find({ isActive: true })
      .select('fullName email phone')
      .sort({ fullName: 1 })
      .exec();

    return customers.map(customer => ({
      _id: (customer._id as Types.ObjectId).toString(),
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone
    }));
  }

  /**
   * Crear cliente desde usuario existente
   */
  async createFromUser(userId: string, customerData: Partial<CreateCustomerDto>): Promise<CustomerDocument> {
    // Verificar si ya existe un cliente para este usuario
    const existingCustomer = await this.customerModel.findOne({ 
      userId: new Types.ObjectId(userId)
    }).exec();

    if (existingCustomer) {
      throw new ConflictException('Ya existe un cliente para este usuario');
    }

    // Obtener información del usuario para completar datos del cliente
    // Esto requeriría inyectar UsersService
    // Por ahora usamos los datos proporcionados

    const customer = new this.customerModel({
      ...customerData,
      userId: new Types.ObjectId(userId)
    });

    return customer.save();
  }

  /**
   * Obtener cliente actual (para usuarios autenticados)
   */
  async getCurrentCustomer(userId: string): Promise<CustomerDocument> {
    return this.findByUserId(userId);
  }
}