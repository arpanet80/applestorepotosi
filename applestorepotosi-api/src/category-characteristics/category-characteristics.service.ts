// src/category-characteristics/category-characteristics.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { 
  CategoryCharacteristic, 
  CategoryCharacteristicDocument,
  CharacteristicType 
} from './schemas/category-characteristic.schema';
import { CreateCategoryCharacteristicDto } from './dto/create-category-characteristic.dto';
import { UpdateCategoryCharacteristicDto } from './dto/update-category-characteristic.dto';
import { CategoryCharacteristicQueryDto } from './dto/category-characteristic-query.dto';

@Injectable()
export class CategoryCharacteristicsService {
  constructor(
    @InjectModel(CategoryCharacteristic.name) 
    private characteristicModel: Model<CategoryCharacteristicDocument>,
  ) {}

  /**
   * Crear nueva característica de categoría
   */
  async create(createCharacteristicDto: CreateCategoryCharacteristicDto): Promise<CategoryCharacteristicDocument> {
    // Verificar si la categoría existe (deberías inyectar CategoriesService)
    // Por ahora solo validamos el formato del ID
    
    if (!Types.ObjectId.isValid(createCharacteristicDto.categoryId)) {
      throw new BadRequestException('ID de categoría inválido');
    }

    // Verificar si ya existe una característica con el mismo nombre en la categoría
    const existingCharacteristic = await this.characteristicModel.findOne({ 
      categoryId: createCharacteristicDto.categoryId,
      name: createCharacteristicDto.name 
    }).exec();

    if (existingCharacteristic) {
      throw new ConflictException('Ya existe una característica con este nombre en la categoría');
    }

    // Validar que los tipos select/multiselect tengan possibleValues
    if (
      (createCharacteristicDto.type === 'select' || createCharacteristicDto.type === 'multiselect') &&
      (!createCharacteristicDto.possibleValues || createCharacteristicDto.possibleValues.length === 0)
    ) {
      throw new BadRequestException('Los tipos select y multiselect requieren possibleValues');
    }

    // Validar que otros tipos no tengan possibleValues
    if (
      createCharacteristicDto.type !== 'select' && 
      createCharacteristicDto.type !== 'multiselect' &&
      createCharacteristicDto.possibleValues &&
      createCharacteristicDto.possibleValues.length > 0
    ) {
      throw new BadRequestException('Los tipos text, number, boolean y date no pueden tener possibleValues');
    }

    const characteristic = new this.characteristicModel(createCharacteristicDto);
    return characteristic.save();
  }

  /**
   * Obtener todas las características con filtros
   */
  async findAll(query: CategoryCharacteristicQueryDto): Promise<{
    characteristics: CategoryCharacteristicDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { 
      categoryId, 
      isActive, 
      isRequired, 
      type, 
      search, 
      page = 1, 
      limit = 10 
    } = query;

    const skip = (page - 1) * limit;
    const filter: any = {};

    // Filtrar por categoría
    if (categoryId) {
      if (!Types.ObjectId.isValid(categoryId)) {
        throw new BadRequestException('ID de categoría inválido');
      }
      filter.categoryId = new Types.ObjectId(categoryId);
    }

    // Filtrar por estado activo
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    // Filtrar por requerido
    if (isRequired !== undefined) {
      filter.isRequired = isRequired;
    }

    // Filtrar por tipo
    if (type) {
      filter.type = type;
    }

    // Búsqueda por nombre o descripción
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const [characteristics, total] = await Promise.all([
      this.characteristicModel
        .find(filter)
        .populate('categoryId', 'name slug')
        .sort({ sortOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.characteristicModel.countDocuments(filter).exec()
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      characteristics,
      total,
      page,
      totalPages
    };
  }

  /**
   * Obtener característica por ID
   */
  async findOne(id: string): Promise<CategoryCharacteristicDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de característica inválido');
    }

    const characteristic = await this.characteristicModel
      .findById(id)
      .populate('categoryId', 'name slug')
      .exec();

    if (!characteristic) {
      throw new NotFoundException('Característica no encontrada');
    }

    return characteristic;
  }

  /**
   * Obtener características por categoría
   */
  async findByCategory(categoryId: string): Promise<CategoryCharacteristicDocument[]> {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('ID de categoría inválido');
    }

    return this.characteristicModel
      .find({ 
        categoryId: new Types.ObjectId(categoryId),
        isActive: true 
      })
      .populate('categoryId', 'name slug')
      .sort({ sortOrder: 1, name: 1 })
      .exec();
  }

  /**
   * Obtener características requeridas por categoría
   */
  async findRequiredByCategory(categoryId: string): Promise<CategoryCharacteristicDocument[]> {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('ID de categoría inválido');
    }

    return this.characteristicModel
      .find({ 
        categoryId: new Types.ObjectId(categoryId),
        isActive: true,
        isRequired: true
      })
      .sort({ sortOrder: 1, name: 1 })
      .exec();
  }

  /**
   * Actualizar característica
   */
  async update(id: string, updateCharacteristicDto: UpdateCategoryCharacteristicDto): Promise<CategoryCharacteristicDocument> {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException('ID de característica inválido');
  }

  // Verificar si la característica existe
  const existingCharacteristic = await this.characteristicModel.findById(id).exec();
  if (!existingCharacteristic) {
    throw new NotFoundException('Característica no encontrada');
  }

  // Verificar si ya existe otra característica con el mismo nombre en la categoría
  if (updateCharacteristicDto.name) {
    const duplicateCharacteristic = await this.characteristicModel.findOne({ 
      categoryId: updateCharacteristicDto.categoryId || existingCharacteristic.categoryId,
      name: updateCharacteristicDto.name,
      _id: { $ne: id }
    }).exec();

    if (duplicateCharacteristic) {
      throw new ConflictException('Ya existe otra característica con este nombre en la categoría');
    }
  }

  // Validaciones de tipo y possibleValues
  const typeToValidate = updateCharacteristicDto.type || existingCharacteristic.type;
  const possibleValuesToValidate = updateCharacteristicDto.possibleValues || existingCharacteristic.possibleValues;

  if (
    (typeToValidate === 'select' || typeToValidate === 'multiselect') &&
    (!possibleValuesToValidate || possibleValuesToValidate.length === 0)
  ) {
    throw new BadRequestException('Los tipos select y multiselect requieren possibleValues');
  }

  if (
    typeToValidate !== 'select' && 
    typeToValidate !== 'multiselect' &&
    possibleValuesToValidate &&
    possibleValuesToValidate.length > 0
  ) {
    throw new BadRequestException('Los tipos text, number, boolean y date no pueden tener possibleValues');
  }

  const characteristic = await this.characteristicModel
    .findByIdAndUpdate(id, updateCharacteristicDto, { new: true, runValidators: true })
    .populate('categoryId', 'name slug')
    .exec();

  // CORRECCIÓN: Verificar que characteristic no sea null
  if (!characteristic) {
    throw new NotFoundException('Característica no encontrada después de la actualización');
  }

  return characteristic;
}

  /**
   * Eliminar característica
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de característica inválido');
    }

    const result = await this.characteristicModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Característica no encontrada');
    }
  }

  /**
   * Activar/desactivar característica
   */
  async toggleActive(id: string): Promise<CategoryCharacteristicDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de característica inválido');
    }

    const characteristic = await this.characteristicModel.findById(id).exec();
    if (!characteristic) {
      throw new NotFoundException('Característica no encontrada');
    }

    characteristic.isActive = !characteristic.isActive;
    return characteristic.save();
  }

  /**
   * Actualizar orden de características
   */
  async updateSortOrder(updates: Array<{ id: string; sortOrder: number }>): Promise<void> {
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(update.id) },
        update: { sortOrder: update.sortOrder }
      }
    }));

    await this.characteristicModel.bulkWrite(bulkOps);
  }

  /**
   * Obtener tipos de características disponibles
   */
  getCharacteristicTypes(): Array<{ value: CharacteristicType; label: string }> {
    return [
      { value: 'text', label: 'Texto' },
      { value: 'number', label: 'Número' },
      { value: 'boolean', label: 'Sí/No' },
      { value: 'select', label: 'Selección única' },
      { value: 'multiselect', label: 'Selección múltiple' },
      { value: 'date', label: 'Fecha' }
    ];
  }

  /**
   * Obtener estadísticas de características
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    byType: Record<CharacteristicType, number>;
    required: number;
  }> {
    const [total, active, required, byType] = await Promise.all([
      this.characteristicModel.countDocuments(),
      this.characteristicModel.countDocuments({ isActive: true }),
      this.characteristicModel.countDocuments({ isRequired: true }),
      this.characteristicModel.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const statsByType: Record<CharacteristicType, number> = {
      'text': 0,
      'number': 0,
      'boolean': 0,
      'select': 0,
      'multiselect': 0,
      'date': 0
    };

    byType.forEach(typeGroup => {
      statsByType[typeGroup._id] = typeGroup.count;
    });

    return {
      total,
      active,
      required,
      byType: statsByType
    };
  }

  /**
   * Buscar características por nombre
   */
  async searchCharacteristics(search: string, limit: number = 10): Promise<CategoryCharacteristicDocument[]> {
    return this.characteristicModel
      .find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ],
        isActive: true
      })
      .populate('categoryId', 'name slug')
      .limit(limit)
      .exec();
  }

  /**
   * Verificar si existe característica con nombre en categoría
   */
  async nameExistsInCategory(categoryId: string, name: string, excludeId?: string): Promise<boolean> {
    const query: any = { 
      categoryId: new Types.ObjectId(categoryId),
      name 
    };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const count = await this.characteristicModel.countDocuments(query).exec();
    return count > 0;
  }

  /**
   * Obtener características con valores posibles para formularios
   */
  async getCharacteristicsForForm(categoryId: string): Promise<any[]> {
    const characteristics = await this.findByCategory(categoryId);
    
    return characteristics.map(char => ({
      _id: char._id,
      name: char.name,
      type: char.type,
      possibleValues: char.possibleValues,
      isRequired: char.isRequired,
      description: char.description,
      sortOrder: char.sortOrder
    }));
  }
}