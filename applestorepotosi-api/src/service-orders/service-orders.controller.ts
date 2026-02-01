import {Controller,Get,Post,Put,Body,Param,Query,UseGuards,Req,BadRequestException,NotFoundException,} from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { AddServiceItemDto } from './dto/add-service-item.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FirebaseAuthGuard } from 'src/auth/guards/firebase-auth.guard';
import { UserRole } from '../users/schemas/user.schema';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRequest } from '../auth/interfaces/user-request.interface';
import { CurrentUser } from '../auth/helpers/current-user.helper';
import { CustomersService } from '../customers/customers.service';
import { UsersService } from '../users/users.service';

@Controller('service-orders')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ServiceOrdersController {
  constructor(
    private readonly service: ServiceOrdersService,
    private readonly customersService: CustomersService,
    private readonly usersService: UsersService,
  ) {}

    @Post()
    @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
    async create(@Body() dto: CreateServiceOrderDto, @Req() req: any) {
      const user = new CurrentUser(req);

      // 1. existe cliente
      try {
        await this.customersService.findOne(dto.customerId);
      } catch {
        throw new BadRequestException('El cliente especificado no existe');
      }

      // 2. existe técnico
      const technician = await this.usersService.findOneByUid(user.uid);
      if (!technician) {
        throw new NotFoundException('Usuario técnico no encontrado en el sistema');
      }

      // 3. al menos un item VÁLIDO
      const validItems = dto.items.filter(i => i.partName?.trim().length > 0);
      if (validItems.length === 0) {
        throw new BadRequestException('Debe incluir al menos un repuesto válido');
      }

      // 4. llamada al servicio con items limpios
      return this.service.create({ ...dto, items: validItems }, technician._id.toString());
    }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('technicianId') technicianId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.findAll({
      page: +page,
      limit: +limit,
      status,
      customerId,
      technicianId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('income-report')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  async incomeReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('technicianId') technicianId?: string,
  ) {
    return this.service.incomeReport({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      technicianId,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  update(@Param('id') id: string, @Body() dto: UpdateServiceOrderDto) {
    return this.service.update(id, dto);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  changeStatus(@Param('id') id: string, @Body() dto: ChangeStatusDto) {
    return this.service.changeStatus(id, dto.status, dto.notes);
  }

  @Post(':id/items')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  addItem(@Param('id') id: string, @Body() dto: AddServiceItemDto) {
    return this.service.addItem(id, dto.item);
  }

}