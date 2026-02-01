// src/brands/brands.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards,ParseIntPipe,DefaultValuePipe, UseInterceptors, UploadedFile} from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandQueryDto } from './dto/brand-query.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { ImageKitService } from '../products/imagekit.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('brands')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly imageKitService: ImageKitService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Get()
  findAll(@Query() query: BrandQueryDto) {
    return this.brandsService.findAll(query);
  }

  @Get('active')
  findActiveBrands() {
    return this.brandsService.findActiveBrands();
  }

  @Get('select-options')
  getBrandsForSelect() {
    return this.brandsService.getBrandsForSelect();
  }

  @Get('popular')
  getPopularBrands(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.brandsService.getPopularBrands(limit);
  }

  @Get('countries')
  getUniqueCountries() {
    return this.brandsService.getUniqueCountries();
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getStats() {
    return this.brandsService.getStats();
  }

  @Get('search')
  searchBrands(
    @Query('q') search: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.brandsService.searchBrands(search, limit);
  }

  @Get('country/:country')
  findByCountry(@Param('country') country: string) {
    return this.brandsService.findByCountry(country);
  }

  @Get('name/:name')
  findByName(@Param('name') name: string) {
    return this.brandsService.findByName(name);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  update(
    @Param('id') id: string, 
    @Body() updateBrandDto: UpdateBrandDto
  ) {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Put(':id/logo')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  updateLogo(
    @Param('id') id: string,
    @Body('logoUrl') logoUrl: string
  ) {
    return this.brandsService.updateLogo(id, logoUrl);
  }

  @Put(':id/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  toggleActive(@Param('id') id: string) {
    return this.brandsService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }

  @Get('check-name/:name')
  async checkName(
    @Param('name') name: string,
    @Query('excludeId') excludeId?: string
  ) {
    const exists = await this.brandsService.nameExists(name, excludeId);
    return { exists, available: !exists };
  }

  @Post('upload-logo')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 4 * 1024 * 1024 } }))
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    const { url } = await this.imageKitService.uploadFile(file);
    return { url };
  }

  @Put(':uid/deactivate')
    @Roles(UserRole.ADMIN)
    deactivateUser(@Param('uid') uid: string) {
      return this.brandsService.deactivateBrand(uid);
    }
  
    @Put(':uid/activate')
    @Roles(UserRole.ADMIN)
    activateUser(@Param('uid') uid: string) {
      return this.brandsService.activateBrand(uid);
    }
  
}