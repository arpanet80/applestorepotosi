// src/settings/settings.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards,ParseIntPipe,DefaultValuePipe,HttpCode,HttpStatus} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { SettingQueryDto } from './dto/setting-query.dto';
import { BulkUpdateDto } from './dto/bulk-update.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { UpdateValueDto } from './dto/update-value.dto';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService
  ) {}

  @Post('initialize')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async initializeDefaults() {
    await this.settingsService.initializeDefaultSettings();
    return { message: 'Configuraciones por defecto inicializadas' };
  }

  @Post()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createSettingDto: CreateSettingDto) {
    return this.settingsService.create(createSettingDto);
  }

  @Post('bulk-update')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  bulkUpdate(@Body() bulkUpdateDto: BulkUpdateDto) {
    return this.settingsService.bulkUpdate(bulkUpdateDto);
  }

  @Get()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findAll(@Query() query: SettingQueryDto) {
    return this.settingsService.findAll(query);
  }

  @Get('public')
  findPublicSettings() {
    return this.settingsService.findPublicSettings();
  }

  @Get('all-object')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getAllAsObject() {
    return this.settingsService.getAllAsObject();
  }

  @Get('stats')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getStats() {
    return this.settingsService.getStats();
  }

  @Get('critical')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getCriticalSettings() {
    return this.settingsService.getCriticalSettings();
  }

  @Get('category/:category')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findByCategory(@Param('category') category: string) {
    return this.settingsService.findByCategory(category);
  }

  @Get('maintenance-mode')
  async checkMaintenanceMode() {
    const isMaintenance = await this.settingsService.isMaintenanceMode();
    return { maintenanceMode: isMaintenance };
  }

  @Get(':key')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findOne(@Param('key') key: string) {
    return this.settingsService.findOne(key);
  }

  @Get(':key/value')
  async getValue(@Param('key') key: string) {
    const value = await this.settingsService.getValue(key);
    return { key, value };
  }

  @Put(':key')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('key') key: string, 
    @Body() updateSettingDto: CreateSettingDto
  ) {
    return this.settingsService.update(key, updateSettingDto);
  }

  @Put(':key/value')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateValue(
    @Param('key') key: string,
    @Body() updateValueDto: UpdateValueDto
  ) {
    return this.settingsService.updateValue(key, updateValueDto);
  }

  @Put(':key/reset')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  resetToDefault(@Param('key') key: string) {
    return this.settingsService.resetToDefault(key);
  }

  @Delete(':key')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('key') key: string) {
    return this.settingsService.remove(key);
  }

  @Get('apple/store-settings')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
getAppleStoreSettings() {
  return this.settingsService.getAppleStoreSettings();
}

@Get('apple/technical-service/enabled')
async isTechnicalServiceEnabled() {
  const enabled = await this.settingsService.isTechnicalServiceEnabled();
  return { enabled };
}

@Get('apple/warranty-months/default')
async getDefaultWarrantyMonths() {
  const months = await this.settingsService.getDefaultWarrantyMonths();
  return { months };
}

@Get('apple/genuine-parts/required')
async mustUseGenuineParts() {
  const required = await this.settingsService.mustUseGenuineParts();
  return { required };
}
}