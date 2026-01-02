// src/settings/settings.service.ts
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException,
  InternalServerErrorException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from './schemas/setting.schema';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpdateValueDto } from './dto/update-value.dto';
import { SettingQueryDto } from './dto/setting-query.dto';
import { BulkUpdateDto } from './dto/bulk-update.dto';

@Injectable()
export class SettingsService {
  // Configuraciones por defecto del sistema
  private readonly defaultSettings = {
    // Configuraciones generales
    'app.name': { 
      value: 'AppleStore Potosí', 
      category: 'general', 
      type: 'string',
      description: 'AppleStore Potosí',
      isEditable: true,
      isPublic: true
    },
    'app.description': { 
      value: 'Sistema de gestión para tienda Apple y servicio técnico', 
      category: 'general', 
      type: 'string',
      description: 'Sistema de gestión para tienda Apple y servicio técnico',
      isEditable: true,
      isPublic: true
    },
    'app.language': { 
      value: 'es', 
      category: 'general', 
      type: 'string',
      options: ['es', 'en'],
      description: 'Idioma de la aplicación',
      isEditable: true,
      isPublic: false
    },
    'app.currency': { 
      value: 'BOB', 
      category: 'general', 
      type: 'string',
      description: 'Moneda por defecto',
      isEditable: true,
      isPublic: false
    },
    'app.timezone': { 
      value: 'Caracas/La_Paz', 
      category: 'general', 
      type: 'string',
      description: 'Zona horaria',
      isEditable: true,
      isPublic: false
    },

    // Configuraciones de inventario
    'inventory.lowStockThreshold': { 
      value: 5, 
      category: 'inventory', 
      type: 'number',
      description: 'Umbral para alertas de stock bajo',
      isEditable: true,
      isPublic: false
    },
    'inventory.autoUpdateStock': { 
      value: true, 
      category: 'inventory', 
      type: 'boolean',
      description: 'Actualizar stock automáticamente en ventas',
      isEditable: true,
      isPublic: false
    },
    'inventory.allowNegativeStock': { 
      value: false, 
      category: 'inventory', 
      type: 'boolean',
      description: 'Permitir stock negativo',
      isEditable: true,
      isPublic: false
    },

    // Configuraciones de ventas
    'sales.taxRate': { 
      value: 0.16, 
      category: 'sales', 
      type: 'number',
      description: 'Tasa de impuesto (IVA)',
      isEditable: true,
      isPublic: false
    },
    'sales.defaultPaymentMethod': { 
      value: 'cash', 
      category: 'sales', 
      type: 'string',
      options: ['cash', 'card', 'transfer'],
      description: 'Método de pago por defecto',
      isEditable: true,
      isPublic: false
    },
    'sales.enableLoyaltyProgram': { 
      value: true, 
      category: 'sales', 
      type: 'boolean',
      description: 'Habilitar programa de lealtad',
      isEditable: true,
      isPublic: false
    },
    'sales.loyaltyPointsRate': { 
      value: 0.1, 
      category: 'sales', 
      type: 'number',
      description: 'Puntos por cada peso gastado',
      isEditable: true,
      isPublic: false
    },

    // Configuraciones del sistema
    'system.maintenanceMode': { 
      value: false, 
      category: 'system', 
      type: 'boolean',
      description: 'Modo mantenimiento del sistema',
      isEditable: true,
      isPublic: true
    },
    'system.sessionTimeout': { 
      value: 3600, 
      category: 'system', 
      type: 'number',
      description: 'Tiempo de expiración de sesión en segundos',
      isEditable: true,
      isPublic: false
    },
    'system.backupInterval': { 
      value: 24, 
      category: 'system', 
      type: 'number',
      description: 'Intervalo de respaldo en horas',
      isEditable: true,
      isPublic: false
    },

    // Configuraciones de notificaciones
    'notifications.emailEnabled': { 
      value: true, 
      category: 'notifications', 
      type: 'boolean',
      description: 'Habilitar notificaciones por email',
      isEditable: true,
      isPublic: false
    },
    'notifications.smsEnabled': { 
      value: false, 
      category: 'notifications', 
      type: 'boolean',
      description: 'Habilitar notificaciones por SMS',
      isEditable: true,
      isPublic: false
    },
    'notifications.lowStockAlert': { 
      value: true, 
      category: 'notifications', 
      type: 'boolean',
      description: 'Alertas de stock bajo',
      isEditable: true,
      isPublic: false
    },

    // Configuraciones de seguridad
    'security.passwordMinLength': { 
      value: 8, 
      category: 'security', 
      type: 'number',
      description: 'Longitud mínima de contraseña',
      isEditable: true,
      isPublic: false
    },
    'security.requireStrongPassword': { 
      value: true, 
      category: 'security', 
      type: 'boolean',
      description: 'Requerir contraseña fuerte',
      isEditable: true,
      isPublic: false
    },
    'security.maxLoginAttempts': { 
      value: 5, 
      category: 'security', 
      type: 'number',
      description: 'Intentos máximos de login',
      isEditable: true,
      isPublic: false
    },

    // Configuraciones de apariencia
    'appearance.theme': { 
      value: 'light', 
      category: 'appearance', 
      type: 'string',
      options: ['light', 'dark', 'auto'],
      description: 'Tema de la aplicación',
      isEditable: true,
      isPublic: true
    },
    'appearance.primaryColor': { 
      value: '#007AFF', 
      category: 'appearance', 
      type: 'string',
      description: 'Color primario de la marca',
      isEditable: true,
      isPublic: true
    },

    // Configuraciones específicas para tienda Apple
    'apple.genuinePartsOnly': { 
      value: true, 
      category: 'inventory', 
      type: 'boolean',
      description: 'Usar solo repuestos genuinos Apple',
      isEditable: true,
      isPublic: false
    },
    'apple.warrantyMonths': { 
      value: 12, 
      category: 'sales', 
      type: 'number',
      description: 'Meses de garantía por defecto para productos Apple',
      isEditable: true,
      isPublic: false
    },
    'apple.technicalService.enabled': { 
      value: true, 
      category: 'system', 
      type: 'boolean',
      description: 'Habilitar módulo de servicio técnico',
      isEditable: true,
      isPublic: false
    },
    'apple.technicalService.defaultDiagnosticFee': { 
      value: 250, 
      category: 'sales', 
      type: 'number',
      description: 'Costo de diagnóstico por defecto',
      isEditable: true,
      isPublic: false
    },

    // Configuraciones de productos y categorías
    'products.allowMultipleCategories': { 
      value: false, 
      category: 'inventory', 
      type: 'boolean',
      description: 'Permitir múltiples categorías por producto',
      isEditable: true,
      isPublic: false
    },
    'products.autoGenerateSKU': { 
      value: true, 
      category: 'inventory', 
      type: 'boolean',
      description: 'Generar SKU automáticamente',
      isEditable: true,
      isPublic: false
    },
    'products.skuPrefix': { 
      value: 'APL', 
      category: 'inventory', 
      type: 'string',
      description: 'Prefijo para SKU automáticos',
      isEditable: true,
      isPublic: false
    },

    // Configuraciones de clientes
    'customers.requireEmail': { 
      value: false, 
      category: 'sales', 
      type: 'boolean',
      description: 'Requerir email para clientes',
      isEditable: true,
      isPublic: false
    },
    'customers.requirePhone': { 
      value: true, 
      category: 'sales', 
      type: 'boolean',
      description: 'Requerir teléfono para clientes',
      isEditable: true,
      isPublic: false
    },
    'customers.autoCreateFromUsers': { 
      value: true, 
      category: 'sales', 
      type: 'boolean',
      description: 'Crear cliente automáticamente al registrar usuario',
      isEditable: true,
      isPublic: false
    },

    // Configuraciones de reportes
    'reports.autoGenerateDaily': { 
      value: true, 
      category: 'system', 
      type: 'boolean',
      description: 'Generar reportes diarios automáticamente',
      isEditable: true,
      isPublic: false
    },
    'reports.keepMonths': { 
      value: 24, 
      category: 'system', 
      type: 'number',
      description: 'Meses a conservar reportes históricos',
      isEditable: true,
      isPublic: false
    },

    // Configuraciones de facturación
    'billing.companyName': { 
      value: 'AppleStore Potosí', 
      category: 'general', 
      type: 'string',
      description: 'Nombre de la empresa para facturación',
      isEditable: true,
      isPublic: true
    },
    'billing.rfc': { 
      value: '', 
      category: 'general', 
      type: 'string',
      description: 'RFC de la empresa',
      isEditable: true,
      isPublic: false
    },
    'billing.address': { 
      value: '', 
      category: 'general', 
      type: 'string',
      description: 'Dirección fiscal',
      isEditable: true,
      isPublic: false
    }
  };

  constructor(
    @InjectModel(Setting.name) 
    private settingModel: Model<SettingDocument>,
  ) {}

  /**
   * Inicializar configuraciones por defecto
   */
  async initializeDefaultSettings(): Promise<void> {
    try {
      for (const [key, config] of Object.entries(this.defaultSettings)) {
        const existingSetting = await this.settingModel.findOne({ key }).exec();
        
        if (!existingSetting) {
          const setting = new this.settingModel({
            key,
            ...config,
            defaultValue: config.value
          });
          await setting.save();
        }
      }
      console.log('Configuraciones por defecto inicializadas');
    } catch (error) {
      console.error('Error inicializando configuraciones por defecto:', error);
    }
  }

  /**
   * Crear nueva configuración
   */
  async create(createSettingDto: CreateSettingDto): Promise<SettingDocument> {
    // Verificar si ya existe una configuración con la misma clave
    const existingSetting = await this.settingModel.findOne({ 
      key: createSettingDto.key 
    }).exec();

    if (existingSetting) {
      throw new ConflictException('Ya existe una configuración con esta clave');
    }

    // Validar el tipo de dato
    this.validateValueType(createSettingDto.value, createSettingDto.type);

    const setting = new this.settingModel(createSettingDto);
    return setting.save();
  }

  /**
   * Obtener todas las configuraciones con filtros
   */
  async findAll(query: SettingQueryDto): Promise<{
    settings: SettingDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { 
      category, 
      search, 
      isEditable, 
      isPublic,
      page = 1, 
      limit = 50 
    } = query;

    const skip = (page - 1) * limit;
    const filter: any = {};

    // Filtrar por categoría
    if (category) {
      filter.category = category;
    }

    // Filtrar por editable
    if (isEditable !== undefined) {
      filter.isEditable = isEditable;
    }

    // Filtrar por público
    if (isPublic !== undefined) {
      filter.isPublic = isPublic;
    }

    // Búsqueda por clave o descripción
    if (search) {
      filter.$or = [
        { key: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const [settings, total] = await Promise.all([
      this.settingModel
        .find(filter)
        .sort({ category: 1, key: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.settingModel.countDocuments(filter).exec()
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      settings,
      total,
      page,
      totalPages
    };
  }

  /**
   * Obtener configuración por clave
   */
  async findOne(key: string): Promise<SettingDocument> {
    const setting = await this.settingModel.findOne({ key }).exec();

    if (!setting) {
      throw new NotFoundException(`Configuración con clave '${key}' no encontrada`);
    }

    return setting;
  }

  /**
   * Obtener valor de configuración por clave
   */
  async getValue<T>(key: string, defaultValue?: T): Promise<T> {
    try {
      const setting = await this.settingModel.findOne({ key }).exec();
      
      if (!setting) {
        if (defaultValue !== undefined) {
          return defaultValue;
        }
        throw new NotFoundException(`Configuración con clave '${key}' no encontrada`);
      }

      return setting.value as T;
    } catch (error) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw error;
    }
  }

  /**
   * Actualizar configuración
   */
  async update(key: string, updateSettingDto: UpdateSettingDto): Promise<SettingDocument> {
    const existingSetting = await this.settingModel.findOne({ key }).exec();
    
    if (!existingSetting) {
      throw new NotFoundException(`Configuración con clave '${key}' no encontrada`);
    }

    // Si se está actualizando el valor, validar el tipo
    if (updateSettingDto.value !== undefined) {
      const typeToValidate = updateSettingDto.type || existingSetting.type;
      this.validateValueType(updateSettingDto.value, typeToValidate);
    }

    // Si se está cambiando la clave, verificar que no exista
    if (updateSettingDto.key && updateSettingDto.key !== key) {
      const keyExists = await this.settingModel.findOne({ 
        key: updateSettingDto.key 
      }).exec();

      if (keyExists) {
        throw new ConflictException('Ya existe una configuración con esta nueva clave');
      }
    }

    const setting = await this.settingModel
      .findOneAndUpdate(
        { key }, 
        updateSettingDto, 
        { new: true, runValidators: true }
      )
      .exec();

    if (!setting) {
      throw new NotFoundException(`Configuración con clave '${key}' no encontrada después de la actualización`);
    }

    return setting;
  }

  /**
   * Actualizar solo el valor de una configuración
   */
  async updateValue(key: string, updateValueDto: UpdateValueDto): Promise<SettingDocument> {
    const existingSetting = await this.settingModel.findOne({ key }).exec();
    
    if (!existingSetting) {
      throw new NotFoundException(`Configuración con clave '${key}' no encontrada`);
    }

    if (!existingSetting.isEditable) {
      throw new BadRequestException('Esta configuración no es editable');
    }

    // Validar el tipo de dato
    this.validateValueType(updateValueDto.value, existingSetting.type);

    const updateData: any = {
      value: updateValueDto.value
    };

    if (updateValueDto.description) {
      updateData.description = updateValueDto.description;
    }

    const setting = await this.settingModel
      .findOneAndUpdate(
        { key }, 
        updateData, 
        { new: true, runValidators: true }
      )
      .exec();

    if (!setting) {
      throw new NotFoundException(`Configuración con clave '${key}' no encontrada después de la actualización`);
    }

    return setting;
  }

  /**
   * Eliminar configuración
   */
  async remove(key: string): Promise<void> {
    const setting = await this.settingModel.findOne({ key }).exec();
    
    if (!setting) {
      throw new NotFoundException(`Configuración con clave '${key}' no encontrada`);
    }

    // No permitir eliminar configuraciones del sistema críticas
    if (this.defaultSettings[key] && !setting.isEditable) {
      throw new BadRequestException('No se puede eliminar una configuración del sistema crítica');
    }

    const result = await this.settingModel.deleteOne({ key }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Configuración con clave '${key}' no encontrada`);
    }
  }

  /**
   * Actualizar múltiples configuraciones
   */
  async bulkUpdate(bulkUpdateDto: BulkUpdateDto): Promise<SettingDocument[]> {
    const results: SettingDocument[] = [];

    for (const update of bulkUpdateDto.settings) {
      try {
        const updatedSetting = await this.updateValue(update.key, { value: update.value });
        results.push(updatedSetting);
      } catch (error) {
        // Continuar con las demás actualizaciones incluso si una falla
        console.error(`Error actualizando configuración ${update.key}:`, error);
      }
    }

    return results;
  }

  /**
   * Obtener configuraciones por categoría
   */
  async findByCategory(category: string): Promise<SettingDocument[]> {
    const settings = await this.settingModel
      .find({ category })
      .sort({ key: 1 })
      .exec();

    return settings;
  }

  /**
   * Obtener configuraciones públicas
   */
  async findPublicSettings(): Promise<SettingDocument[]> {
    const settings = await this.settingModel
      .find({ isPublic: true })
      .select('key value category type description')
      .sort({ category: 1, key: 1 })
      .exec();

    return settings;
  }

  /**
   * Obtener todas las configuraciones como objeto plano
   */
  async getAllAsObject(): Promise<Record<string, any>> {
    const settings = await this.settingModel
      .find()
      .select('key value')
      .exec();

    const settingsObject: Record<string, any> = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });

    return settingsObject;
  }

  /**
   * Obtener estadísticas de configuraciones
   */
  async getStats(): Promise<{
    total: number;
    byCategory: Record<string, number>;
    editableCount: number;
    publicCount: number;
  }> {
    const [total, byCategory, editableCount, publicCount] = await Promise.all([
      this.settingModel.countDocuments(),
      this.settingModel.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      this.settingModel.countDocuments({ isEditable: true }),
      this.settingModel.countDocuments({ isPublic: true })
    ]);

    const statsByCategory: Record<string, number> = {};
    byCategory.forEach(stat => {
      statsByCategory[stat._id] = stat.count;
    });

    return {
      total,
      byCategory: statsByCategory,
      editableCount,
      publicCount
    };
  }

  /**
   * Restablecer configuración a valor por defecto
   */
  async resetToDefault(key: string): Promise<SettingDocument> {
    const existingSetting = await this.settingModel.findOne({ key }).exec();
    
    if (!existingSetting) {
      throw new NotFoundException(`Configuración con clave '${key}' no encontrada`);
    }

    if (!existingSetting.isEditable) {
      throw new BadRequestException('Esta configuración no es editable');
    }

    const defaultValue = existingSetting.defaultValue !== undefined 
      ? existingSetting.defaultValue 
      : this.defaultSettings[key]?.value;

    if (defaultValue === undefined) {
      throw new BadRequestException('No hay valor por defecto definido para esta configuración');
    }

    const setting = await this.settingModel
      .findOneAndUpdate(
        { key }, 
        { value: defaultValue }, 
        { new: true, runValidators: true }
      )
      .exec();

    if (!setting) {
      throw new NotFoundException(`Configuración con clave '${key}' no encontrada después del restablecimiento`);
    }

    return setting;
  }

  /**
   * Validar tipo de dato del valor
   */
  private validateValueType(value: any, type: string): void {
    let isValid = true;

    switch (type) {
      case 'string':
        isValid = typeof value === 'string';
        break;
      case 'number':
        isValid = typeof value === 'number' && !isNaN(value);
        break;
      case 'boolean':
        isValid = typeof value === 'boolean';
        break;
      case 'object':
        isValid = typeof value === 'object' && value !== null && !Array.isArray(value);
        break;
      case 'array':
        isValid = Array.isArray(value);
        break;
      default:
        isValid = true;
    }

    if (!isValid) {
      throw new BadRequestException(`El valor no coincide con el tipo esperado: ${type}`);
    }
  }

  /**
   * Verificar si el sistema está en modo mantenimiento
   */
  async isMaintenanceMode(): Promise<boolean> {
    try {
      return await this.getValue<boolean>('system.maintenanceMode', false);
    } catch {
      return false;
    }
  }

  /**
   * Obtener configuraciones críticas del sistema
   */
  async getCriticalSettings(): Promise<SettingDocument[]> {
    const criticalKeys = [
      'system.maintenanceMode',
      'inventory.autoUpdateStock',
      'sales.taxRate',
      'app.language',
      'app.currency'
    ];

    const settings = await this.settingModel
      .find({ key: { $in: criticalKeys } })
      .sort({ key: 1 })
      .exec();

    return settings;
  }

  /**
   * Obtener configuraciones específicas para tienda Apple
   */
  async getAppleStoreSettings(): Promise<Record<string, any>> {
    const appleKeys = [
      'apple.genuinePartsOnly',
      'apple.warrantyMonths',
      'apple.technicalService.enabled',
      'apple.technicalService.defaultDiagnosticFee',
      'products.skuPrefix'
    ];

    const settings = await this.settingModel
      .find({ key: { $in: appleKeys } })
      .select('key value')
      .exec();

    const settingsObject: Record<string, any> = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });

    return settingsObject;
  }

  /**
   * Verificar si el servicio técnico está habilitado
   */
  async isTechnicalServiceEnabled(): Promise<boolean> {
    try {
      return await this.getValue<boolean>('apple.technicalService.enabled', true);
    } catch {
      return true;
    }
  }

  /**
   * Obtener meses de garantía por defecto
   */
  async getDefaultWarrantyMonths(): Promise<number> {
    try {
      return await this.getValue<number>('apple.warrantyMonths', 12);
    } catch {
      return 12;
    }
  }

  /**
   * Obtener configuración de uso de repuestos genuinos
   */
  async mustUseGenuineParts(): Promise<boolean> {
    try {
      return await this.getValue<boolean>('apple.genuinePartsOnly', true);
    } catch {
      return true;
    }
  }

  /**
   * Obtener costo de diagnóstico por defecto
   */
  async getDefaultDiagnosticFee(): Promise<number> {
    try {
      return await this.getValue<number>('apple.technicalService.defaultDiagnosticFee', 250);
    } catch {
      return 250;
    }
  }

  /**
   * Obtener prefijo para SKU automáticos
   */
  async getSkuPrefix(): Promise<string> {
    try {
      return await this.getValue<string>('products.skuPrefix', 'APL');
    } catch {
      return 'APL';
    }
  }

  /**
   * Verificar si se debe generar SKU automáticamente
   */
  async shouldAutoGenerateSku(): Promise<boolean> {
    try {
      return await this.getValue<boolean>('products.autoGenerateSKU', true);
    } catch {
      return true;
    }
  }

  /**
   * Obtener tasa de impuesto actual
   */
  async getTaxRate(): Promise<number> {
    try {
      return await this.getValue<number>('sales.taxRate', 0.16);
    } catch {
      return 0.16;
    }
  }

  /**
   * Obtener umbral para alertas de stock bajo
   */
  async getLowStockThreshold(): Promise<number> {
    try {
      return await this.getValue<number>('inventory.lowStockThreshold', 5);
    } catch {
      return 5;
    }
  }
}