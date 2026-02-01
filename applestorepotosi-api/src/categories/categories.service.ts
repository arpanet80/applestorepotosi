// src/categories/categories.service.ts
import {Injectable,NotFoundException,ConflictException,BadRequestException,} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import urlSlug from 'url-slug';
import NodeCache from 'node-cache';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';

const categoryTreeCache = new NodeCache({ stdTTL: 120 });
type LeanCategory = Omit<Category, keyof Document> & { _id: Types.ObjectId };

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  /* ---------- privados ---------- */
  private async wouldCreateCycle(
    categoryId: string,
    parentId: string | null,
  ): Promise<boolean> {
    if (!parentId) return false;
    if (categoryId === parentId) return true;

    let current = parentId;
    while (current) {
      if (current === categoryId) return true;
      const parent = await this.categoryModel
        .findById(current)
        .select('parentId')
        .lean()
        .exec();
      if (!parent) break;
      current = parent.parentId?.toString() ?? null;
    }
    return false;
  }

  private invalidateCache() {
    categoryTreeCache.del('tree');
  }

  /* ---------- crear ---------- */
  async create(dto: CreateCategoryDto): Promise<CategoryDocument> {
    const slug = urlSlug(dto.name);

    const dup = await this.categoryModel.findOne({ slug }).lean();
    if (dup) throw new ConflictException('Ya existe una categoría con este slug');

    if (dto.parentId) {
      const parent = await this.categoryModel.findById(dto.parentId).lean();
      if (!parent) throw new NotFoundException('La categoría padre no existe');
      if (!parent.isActive)
        throw new BadRequestException('La categoría padre está desactivada');
      if (await this.wouldCreateCycle('FAKE_ID', dto.parentId))
        throw new BadRequestException('La categoría padre forma un ciclo');
    }

    const category = new this.categoryModel({ ...dto, slug });
    const saved = await category.save();
    this.invalidateCache();
    return saved;
  }

  async findAll(query: CategoryQueryDto) {
    const { isActive, parentId, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (isActive !== undefined) filter.isActive = isActive;
    if (parentId) {
      if (parentId === 'null') filter.parentId = null;
      else filter.parentId = new Types.ObjectId(parentId);
    }

    if (search?.trim()) {
      const rx = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: rx }, { slug: rx }];
    }

    const [categories, total] = await Promise.all([
      this.categoryModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit).exec(),
      this.categoryModel.countDocuments(filter).exec(),
    ]);

    return { categories, total, page, totalPages: Math.ceil(total / limit) };
  }

  /* ---------- listado ---------- */
  /*async findAll(query: CategoryQueryDto): Promise<{
    categories: CategoryDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { isActive, parentId, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (isActive !== undefined) filter.isActive = isActive;

    if (parentId) {
      if (parentId === 'null') filter.parentId = null;
      else filter.parentId = new Types.ObjectId(parentId);
    }

    if (search) {
      filter.$text = { $search: search }; // índice de texto
    }

    const [categories, total] = await Promise.all([
      this.categoryModel
        .find(filter)
        .populate('parentId', 'name slug')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.categoryModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { categories, total, page, totalPages };
  }*/

  /* ---------- único ---------- */
  async findOne(id: string): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('ID de categoría inválido');
    const cat = await this.categoryModel
      .findById(id)
      .populate('parentId', 'name slug')
      .exec();
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    return cat;
  }

  async findBySlug(slug: string): Promise<CategoryDocument> {
    const cat = await this.categoryModel
      .findOne({ slug })
      .populate('parentId', 'name slug')
      .exec();
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    return cat;
  }

  /* ---------- árbol ---------- */
  async getCategoryTree(): Promise<any[]> {
    if (categoryTreeCache.has('tree')) return categoryTreeCache.get<any[]>('tree')!;

    const categories = await this.categoryModel
    .find({ isActive: true })
    .sort({ name: 1 })
    .lean<LeanCategory[]>();  

  const tree = this.buildCategoryTree(categories);
    categoryTreeCache.set('tree', tree);
    return tree;
  }

  private buildCategoryTree(cats: LeanCategory[],parentId: any = null,): any[] {
    return cats
      .filter((c) =>
        parentId === null
          ? !c.parentId
          : c.parentId && c.parentId.toString() === parentId.toString(),
      )
      .map((c) => ({
        _id: c._id,
        name: c.name,
        description: c.description,
        slug: c.slug,
        imageUrl: c.imageUrl,
        isActive: c.isActive,
        children: this.buildCategoryTree(cats, c._id),
      }));
  }

  /* ---------- raíces ---------- */
  async findMainCategories(): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find({ parentId: null, isActive: true })
      .sort({ name: 1 })
      .exec();
  }

  /* ---------- sub ---------- */
  async findSubcategories(parentId: string): Promise<CategoryDocument[]> {
    if (!Types.ObjectId.isValid(parentId))
      throw new BadRequestException('ID de categoría padre inválido');
    return this.categoryModel
      .find({ parentId, isActive: true })
      .sort({ name: 1 })
      .exec();
  }

  /* ---------- toggle ---------- */
  async toggleActive(id: string): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('ID de categoría inválido');
    const cat = await this.categoryModel.findById(id).exec();
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    cat.isActive = !cat.isActive;
    const saved = await cat.save();
    this.invalidateCache();
    return saved;
  }

  /* ---------- stats ---------- */
  async getStats(): Promise<{
    total: number;
    active: number;
    withParent: number;
    withoutParent: number;
  }> {
    const [total, active, withParent, withoutParent] = await Promise.all([
      this.categoryModel.countDocuments(),
      this.categoryModel.countDocuments({ isActive: true }),
      this.categoryModel.countDocuments({ parentId: { $ne: null } }),
      this.categoryModel.countDocuments({ parentId: null }),
    ]);
    return { total, active, withParent, withoutParent };
  }

  /* ---------- búsqueda ---------- */
  async searchCategories(search: string, limit = 10): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find(
        { $text: { $search: search }, isActive: true },
        { score: { $meta: 'textScore' } },
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .exec();
  }

  /* ---------- slug exists ---------- */
  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const query: any = { slug: urlSlug(slug) };
    if (excludeId) query._id = { $ne: excludeId };
    return (await this.categoryModel.countDocuments(query).exec()) > 0;
  }

  /* ---------- actualizar ---------- */
  async update(
    id: string,
    dto: UpdateCategoryDto,
    userId: string,
  ): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('ID de categoría inválido');

    if (dto.slug) dto.slug = urlSlug(dto.slug);

    if (dto.slug) {
      const dup = await this.categoryModel
        .findOne({ slug: dto.slug, _id: { $ne: id } })
        .lean();
      if (dup) throw new ConflictException('Ya existe otra categoría con este slug');
    }

    if (dto.parentId) {
      if (dto.parentId === id)
        throw new BadRequestException('Una categoría no puede ser padre de sí misma');
      const parent = await this.categoryModel.findById(dto.parentId).lean();
      if (!parent) throw new NotFoundException('La categoría padre no existe');
      if (!parent.isActive)
        throw new BadRequestException('La categoría padre está desactivada');
      if (await this.wouldCreateCycle(id, dto.parentId))
        throw new BadRequestException('La categoría padre forma un ciclo');
    }

    const updated = await this.categoryModel
      .findByIdAndUpdate(id, { ...dto, updatedBy: userId }, { new: true, runValidators: true })
      .populate('parentId', 'name slug')
      .exec();

    if (!updated) throw new NotFoundException('Categoría no encontrada');
    this.invalidateCache();
    return updated;
  }

  /* ---------- eliminar ---------- */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('ID de categoría inválido');
    const hasChildren = await this.categoryModel.exists({ parentId: id });
    if (hasChildren)
      throw new ConflictException('No se puede eliminar una categoría que tiene subcategorías');
    const res = await this.categoryModel.deleteOne({ _id: id }).exec();
    if (res.deletedCount === 0)
      throw new NotFoundException('Categoría no encontrada');
    this.invalidateCache();
  }
}