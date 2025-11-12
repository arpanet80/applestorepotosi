// src/category-characteristics/category-characteristics.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards,ParseIntPipe,DefaultValuePipe} from '@nestjs/common';
import { CategoryCharacteristicsService } from './category-characteristics.service';
import { CreateCategoryCharacteristicDto } from './dto/create-category-characteristic.dto';
import { UpdateCategoryCharacteristicDto } from './dto/update-category-characteristic.dto';
import { CategoryCharacteristicQueryDto } from './dto/category-characteristic-query.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('category-characteristics')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class CategoryCharacteristicsController {
  constructor(
    private readonly characteristicsService: CategoryCharacteristicsService
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  create(@Body() createCharacteristicDto: CreateCategoryCharacteristicDto) {
    return this.characteristicsService.create(createCharacteristicDto);
  }

  @Get()
  findAll(@Query() query: CategoryCharacteristicQueryDto) {
    return this.characteristicsService.findAll(query);
  }

  @Get('types')
  getCharacteristicTypes() {
    return this.characteristicsService.getCharacteristicTypes();
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getStats() {
    return this.characteristicsService.getStats();
  }

  @Get('search')
  searchCharacteristics(
    @Query('q') search: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.characteristicsService.searchCharacteristics(search, limit);
  }

  @Get('category/:categoryId')
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.characteristicsService.findByCategory(categoryId);
  }

  @Get('category/:categoryId/required')
  findRequiredByCategory(@Param('categoryId') categoryId: string) {
    return this.characteristicsService.findRequiredByCategory(categoryId);
  }

  @Get('category/:categoryId/form')
  getCharacteristicsForForm(@Param('categoryId') categoryId: string) {
    return this.characteristicsService.getCharacteristicsForForm(categoryId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.characteristicsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  update(
    @Param('id') id: string, 
    @Body() updateCharacteristicDto: UpdateCategoryCharacteristicDto
  ) {
    return this.characteristicsService.update(id, updateCharacteristicDto);
  }

  @Put(':id/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  toggleActive(@Param('id') id: string) {
    return this.characteristicsService.toggleActive(id);
  }

  @Put('sort-order/update')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  updateSortOrder(@Body() updates: Array<{ id: string; sortOrder: number }>) {
    return this.characteristicsService.updateSortOrder(updates);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.characteristicsService.remove(id);
  }

  @Get('check-name/:categoryId/:name')
  async checkName(
    @Param('categoryId') categoryId: string,
    @Param('name') name: string,
    @Query('excludeId') excludeId?: string
  ) {
    const exists = await this.characteristicsService.nameExistsInCategory(categoryId, name, excludeId);
    return { exists, available: !exists };
  }
}