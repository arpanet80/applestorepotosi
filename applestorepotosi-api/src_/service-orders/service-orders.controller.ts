// src/service-orders/service-orders.controller.ts
// ============================================================
// CONTROLADOR DE ÓRDENES DE SERVICIO
// Flujo simplificado de estados:
//   PENDIENTE → EN_PROCESO → COMPLETADA
//        ↓           ↓
//     CANCELADA ←─┘
//
// Endpoint de migración: POST /service-orders/migrate-statuses
// (ejecutar UNA VEZ como ADMIN después del deploy)
// ============================================================

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { AddServiceItemDto } from './dto/add-service-item.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FirebaseAuthGuard } from 'src/auth/guards/firebase-auth.guard';
import { UserRole } from '../users/schemas/user.schema';
import { Roles } from '../auth/decorators/roles.decorator';
import { CustomersService } from '../customers/customers.service';
import { UsersService } from '../users/users.service';

// CurrentUser ya no se importa: ahora es un param decorator y no se usa
// con `new` sino como @CurrentUser() en la firma del método.
// En este controlador se accede directo a req.user.uid para evitar el
// error TS2350 ("Only a void function can be called with the 'new' keyword").

@Controller('service-orders')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ServiceOrdersController {
  constructor(
    private readonly service: ServiceOrdersService,
    private readonly customersService: CustomersService,
    private readonly usersService: UsersService,
  ) {}

  /* ========== CREATE ========== */

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  async create(@Body() dto: CreateServiceOrderDto, @Req() req: any) {
    // FIX: req.user es el UserDocument completo que FirebaseAuthGuard
    // cargó desde MongoDB — accedemos al uid directamente.
    const uid: string = req.user?.uid;

    // 1. Validar que el cliente existe
    try {
      await this.customersService.findOne(dto.customerId);
    } catch {
      throw new BadRequestException('El cliente especificado no existe');
    }

    // 2. Obtener el usuario actual desde la BD para leer su _id de Mongo
    const currentUser = await this.usersService.findOneByUid(uid);
    if (!currentUser) {
      throw new NotFoundException('Usuario no encontrado en el sistema');
    }

    // El DTO no expone technicianId, por lo que el tecnico asignado
    // es siempre el usuario que crea la orden, sin importar su rol.
    const technicianId: string = currentUser._id.toString();

    return this.service.create(dto, technicianId);
  }

  /* ========== FIND ALL ========== */

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('technicianId') technicianId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({
      page: +page,
      limit: +limit,
      status,
      customerId,
      technicianId,
      startDate,
      endDate,
      search,
    });
  }

  /* ========== INCOME REPORT ========== */

  @Get('income-report')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  async incomeReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('technicianId') technicianId?: string,
    @Req() req?: any,
  ) {
    let finalTechnicianId = technicianId;

    if (req) {
      const uid: string = req.user?.uid;
      const currentUser = await this.usersService.findOneByUid(uid);

      if (currentUser?.role === UserRole.TECHNICIAN) {
        // Técnico solo puede ver sus propios ingresos
        finalTechnicianId = currentUser._id.toString();
      }
    }

    return this.service.incomeReport({
      startDate,
      endDate,
      technicianId: finalTechnicianId,
    });
  }

  /* ========== MIGRATION ENDPOINT (ejecutar UNA VEZ) ========== */

  @Post('migrate-statuses')
  @Roles(UserRole.ADMIN)
  async migrateStatuses() {
    const result = await this.service.migrateStatuses();
    return {
      message: 'Migración de estados completada',
      ...result,
    };
  }

  /* ========== FIND ONE ========== */

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  async findOne(@Param('id') id: string, @Req() req: any) {
    const order = await this.service.findOne(id);

    const uid: string = req.user?.uid;
    const currentUser = await this.usersService.findOneByUid(uid);

    const orderTechId = this.extractId(order.technicianId);
    const currentUserId = this.extractId(currentUser?._id);

    if (
      currentUser?.role === UserRole.TECHNICIAN &&
      orderTechId !== currentUserId
    ) {
      throw new ForbiddenException(
        'No tienes permiso para ver esta orden de servicio',
      );
    }

    return order;
  }

  /**
   * Extrae el string de ID ya sea de un ObjectId, un string, o un documento populateado.
   */
  private extractId(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (value._id) return value._id.toString();
    return value.toString();
  }

  /* ========== UPDATE ========== */

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceOrderDto,
    @Req() req: any,
  ) {
    const uid: string = req.user?.uid;
    const currentUser = await this.usersService.findOneByUid(uid);
    if (!currentUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const order = await this.service.findOne(id);

    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isSales = currentUser.role === UserRole.SALES;
    const isAssignedTechnician =
      this.extractId(order.technicianId) === currentUser._id.toString();

    if (!isAdmin && !isSales && !isAssignedTechnician) {
      throw new ForbiddenException(
        'No tienes permiso para editar esta orden de servicio',
      );
    }

    return this.service.update(id, dto, currentUser._id.toString());
  }

  /* ========== CHANGE STATUS ========== */

  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @Req() req: any,
  ) {
    const uid: string = req.user?.uid;
    const currentUser = await this.usersService.findOneByUid(uid);
    if (!currentUser) {
      throw new NotFoundException('Usuario no encontrado en el sistema');
    }

    const order = await this.service.findOne(id);

    const isTechnician = currentUser.role === UserRole.TECHNICIAN;
    const orderTechnicianId = this.extractId(order.technicianId);
    const isAssignedTechnician = orderTechnicianId === currentUser._id.toString();

    if (isTechnician && !isAssignedTechnician) {
      throw new ForbiddenException(
        'No tienes permiso para cambiar el estado de esta orden. Solo puedes modificar órdenes asignadas a ti.',
      );
    }

    return this.service.changeStatus(
      id,
      dto.status,
      dto.notes,
      currentUser._id.toString(),
    );
  }

  /* ========== ADD ITEM ========== */

  @Post(':id/items')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  async addItem(
    @Param('id') id: string,
    @Body() dto: AddServiceItemDto,
    @Req() req: any,
  ) {
    const uid: string = req.user?.uid;
    const currentUser = await this.usersService.findOneByUid(uid);
    if (!currentUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const order = await this.service.findOne(id);
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isSales = currentUser.role === UserRole.SALES;
    const isAssignedTechnician =
      this.extractId(order.technicianId) === currentUser._id.toString();

    if (!isAdmin && !isSales && !isAssignedTechnician) {
      throw new ForbiddenException(
        'No tienes permiso para modificar items de esta orden',
      );
    }

    return this.service.addItem(id, dto.item);
  }

  /* ========== REMOVE ITEM ========== */

  @Delete(':id/items/:index')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  async removeItem(
    @Param('id') id: string,
    @Param('index') index: string,
    @Req() req: any,
  ) {
    const uid: string = req.user?.uid;
    const currentUser = await this.usersService.findOneByUid(uid);
    if (!currentUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const order = await this.service.findOne(id);
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isSales = currentUser.role === UserRole.SALES;
    const isAssignedTechnician =
      this.extractId(order.technicianId) === currentUser._id.toString();

    if (!isAdmin && !isSales && !isAssignedTechnician) {
      throw new ForbiddenException(
        'No tienes permiso para modificar items de esta orden',
      );
    }

    const itemIndex = parseInt(index, 10);
    if (isNaN(itemIndex)) {
      throw new BadRequestException('Índice inválido');
    }

    return this.service.removeItem(id, itemIndex);
  }
}