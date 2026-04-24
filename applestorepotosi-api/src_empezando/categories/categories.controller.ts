// src/categories/categories.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body,   Query,   UseGuards,ParseIntPipe,DefaultValuePipe,Req} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('categories')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  findAll(@Query() query: CategoryQueryDto) {
    return this.categoriesService.findAll(query);
  }

  @Get('tree')
  getCategoryTree() {
    return this.categoriesService.getCategoryTree();
  }

  @Get('main')
  findMainCategories() {
    return this.categoriesService.findMainCategories();
  }

  @Get('search')
  searchCategories(
    @Query('q') search: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.categoriesService.searchCategories(search, limit);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getStats() {
    return this.categoriesService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':id/subcategories')
  findSubcategories(@Param('id') id: string) {
    return this.categoriesService.findSubcategories(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @Req() req: any, // ← extraes el usuario
  ) {
    return this.categoriesService.update(id, dto, req.user.uid);
  }

  @Put(':id/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  toggleActive(@Param('id') id: string) {
    return this.categoriesService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  @Get('check-slug/:slug')
  async checkSlug(
    @Param('slug') slug: string,
    @Query('excludeId') excludeId?: string
  ) {
    const exists = await this.categoriesService.slugExists(slug, excludeId);
    return { exists, available: !exists };
  }

  @Roles(UserRole.ADMIN, UserRole.SALES)
  update2(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @Req() req: any,
  ) {
    return this.categoriesService.update(id, dto, req.user.uid);
  }
}