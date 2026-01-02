// src/category-characteristics/category-characteristics.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CategoryCharacteristic,
  CategoryCharacteristicDocument,
  CharacteristicType,
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

  /* ---------- privados ---------- */
  private validatePossibleValues(
    type: CharacteristicType,
    values?: string[],
  ) {
    const needsValues = ['select', 'multiselect'].includes(type);
    if (needsValues && (!values || values.length === 0)) {
      throw new BadRequestException(
        'Los tipos select y multiselect requieren possibleValues',
      );
    }
    if (!needsValues && values && values.length > 0) {
      throw new BadRequestException(
        'Los tipos text, number, boolean y date no pueden tener possibleValues',
      );
    }
  }

  /* ---------- crear ---------- */
  async create(
    dto: CreateCategoryCharacteristicDto,
    userId: string,
  ): Promise<CategoryCharacteristicDocument> {
    if (!Types.ObjectId.isValid(dto.categoryId)) {
      throw new BadRequestException('ID de categoría inválido');
    }

    const exists = await this.characteristicModel.findOne({
      categoryId: dto.categoryId,
      name: dto.name,
    });
    if (exists) {
      throw new ConflictException(
        'Ya existe una característica con este nombre en la categoría',
      );
    }

    const type = dto.type as CharacteristicType;
    this.validatePossibleValues(type, dto.possibleValues);

    const created = new this.characteristicModel({
      ...dto,
      categoryId: new Types.ObjectId(dto.categoryId),
      updatedBy: userId,
    });
    return created.save();
  }

  /* ---------- listado ---------- */
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
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (categoryId) {
      if (!Types.ObjectId.isValid(categoryId))
        throw new BadRequestException('ID de categoría inválido');
      filter.categoryId = new Types.ObjectId(categoryId);
    }
    if (isActive !== undefined) filter.isActive = isActive;
    if (isRequired !== undefined) filter.isRequired = isRequired;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
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
      this.characteristicModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { characteristics, total, page, totalPages };
  }

  /* ---------- único ---------- */
  async findOne(id: string): Promise<CategoryCharacteristicDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('ID de característica inválido');
    const char = await this.characteristicModel
      .findById(id)
      .populate('categoryId', 'name slug')
      .exec();
    if (!char) throw new NotFoundException('Característica no encontrada');
    return char;
  }

  /* ---------- por categoría ---------- */
  async findByCategory(
    categoryId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    characteristics: CategoryCharacteristicDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (!Types.ObjectId.isValid(categoryId))
      throw new BadRequestException('ID de categoría inválido');

    const skip = (page - 1) * limit;
    const filter = {
      categoryId: new Types.ObjectId(categoryId),
      isActive: true,
    };

    const [characteristics, total] = await Promise.all([
      this.characteristicModel
        .find(filter)
        .populate('categoryId', 'name slug')
        .sort({ sortOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.characteristicModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { characteristics, total, page, totalPages };
  }
    async findRequiredByCategory(
    categoryId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    characteristics: CategoryCharacteristicDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (!Types.ObjectId.isValid(categoryId))
      throw new BadRequestException('ID de categoría inválido');

    const skip = (page - 1) * limit;
    const filter = {
      categoryId: new Types.ObjectId(categoryId),
      isActive: true,
      isRequired: true,
    };

    const [characteristics, total] = await Promise.all([
      this.characteristicModel
        .find(filter)
        .sort({ sortOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.characteristicModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { characteristics, total, page, totalPages };
  }

  async update(
    id: string,
    dto: UpdateCategoryCharacteristicDto,
    userId: string,
  ): Promise<CategoryCharacteristicDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('ID de característica inválido');

    const existing = await this.characteristicModel.findById(id).exec();
    if (!existing)
      throw new NotFoundException('Característica no encontrada');

    if (dto.name) {
      const duplicate = await this.characteristicModel.findOne({
        categoryId: dto.categoryId || existing.categoryId,
        name: dto.name,
        _id: { $ne: id },
      });
      if (duplicate)
        throw new ConflictException(
          'Ya existe otra característica con este nombre en la categoría',
        );
    }

    //const typeToValidate = dto.type || existing.type;
    // const valuesToValidate = dto.possibleValues || existing.possibleValues;
    // this.validatePossibleValues(typeToValidate, valuesToValidate);
    
    const typeToValidate = (dto.type || existing.type) as CharacteristicType;
    const valuesToValidate = dto.possibleValues ?? existing.possibleValues;
    this.validatePossibleValues(typeToValidate, valuesToValidate);

    const updated = await this.characteristicModel
      .findByIdAndUpdate(
        id,
        { ...dto, updatedBy: userId },
        { new: true, runValidators: true },
      )
      .populate('categoryId', 'name slug')
      .exec();

    if (!updated)
      throw new NotFoundException(
        'Característica no encontrada después de la actualización',
      );
    return updated;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('ID de característica inválido');

    const res = await this.characteristicModel.deleteOne({ _id: id }).exec();
    if (res.deletedCount === 0)
      throw new NotFoundException('Característica no encontrada');
  }

  async toggleActive(id: string): Promise<CategoryCharacteristicDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('ID de característica inválido');

    const char = await this.characteristicModel.findById(id).exec();
    if (!char) throw new NotFoundException('Característica no encontrada');

    char.isActive = !char.isActive;
    return char.save();
  }

  async updateSortOrder(updates: Array<{ id: string; sortOrder: number }>): Promise<void> {
    const bulkOps = updates.map((u) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(u.id) },
        update: { sortOrder: u.sortOrder },
      },
    }));
    await this.characteristicModel.bulkWrite(bulkOps);
  }

  getCharacteristicTypes(): Array<{ value: CharacteristicType; label: string }> {
    return [
      { value: 'text', label: 'Texto' },
      { value: 'number', label: 'Número' },
      { value: 'boolean', label: 'Sí/No' },
      { value: 'select', label: 'Selección única' },
      { value: 'multiselect', label: 'Selección múltiple' },
      { value: 'date', label: 'Fecha' },
    ];
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    required: number;
    byType: Record<CharacteristicType, number>;
  }> {
    const [total, active, required, byTypeAgg] = await Promise.all([
      this.characteristicModel.countDocuments(),
      this.characteristicModel.countDocuments({ isActive: true }),
      this.characteristicModel.countDocuments({ isRequired: true }),
      this.characteristicModel.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);

    const byType: Record<CharacteristicType, number> = {
      text: 0,
      number: 0,
      boolean: 0,
      select: 0,
      multiselect: 0,
      date: 0,
    };
    byTypeAgg.forEach((t) => (byType[t._id] = t.count));

    return { total, active, required, byType };
  }

  async searchCharacteristics(
    search: string,
    limit = 10,
  ): Promise<CategoryCharacteristicDocument[]> {
    return this.characteristicModel
      .find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
        isActive: true,
      })
      .populate('categoryId', 'name slug')
      .limit(limit)
      .exec();
  }

  async existsByNameAndCategory(
    categoryId: string,
    name: string,
    excludeId?: string,
  ): Promise<boolean> {
    const query: any = {
      categoryId: new Types.ObjectId(categoryId),
      name,
    };
    if (excludeId) query._id = { $ne: excludeId };
    const count = await this.characteristicModel.countDocuments(query).exec();
    return count > 0;
  }

  async getCharacteristicsForForm(categoryId: string): Promise<any[]> {
    const chars = await this.findByCategory(categoryId, 1, 999);
    return chars.characteristics.map((c) => ({
      _id: c._id,
      name: c.name,
      type: c.type,
      possibleValues: c.possibleValues,
      isRequired: c.isRequired,
      description: c.description,
      sortOrder: c.sortOrder,
    }));
  }
}
