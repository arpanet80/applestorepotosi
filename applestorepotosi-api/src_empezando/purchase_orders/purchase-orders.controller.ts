// src/purchase-orders/purchase-orders.controller.ts
import { Controller,Get,Post,Put,Delete,Param,Body,Query,UseGuards,  HttpCode,  HttpStatus,Req,} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('purchase-orders')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  create(@Body() dto: CreatePurchaseOrderDto, @Req() req: any) {
    this.purchaseOrdersService.validateItems(dto.items);
    return this.purchaseOrdersService.create(dto, req.user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findAll(@Query() query: PurchaseOrderQueryDto) {
    return this.purchaseOrdersService.findAll(query);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getStats() {
    return this.purchaseOrdersService.getStats();
  }

  @Get('supplier/:supplierId')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findBySupplier(@Param('supplierId') supplierId: string) {
    return this.purchaseOrdersService.findBySupplier(supplierId);
  }

  @Get('status/:status')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findByStatus(@Param('status') status: string) {
    return this.purchaseOrdersService.findByStatus(status);
  }

  @Get('pending')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findPendingOrders() {
    return this.purchaseOrdersService.findByStatus('pending');
  }

  @Get('completed')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findCompletedOrders() {
    return this.purchaseOrdersService.findByStatus('completed');
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findOne(@Param('id') id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
    @Req() req: any,
  ) {
    if (dto.items) this.purchaseOrdersService.validateItems(dto.items);
    return this.purchaseOrdersService.update(id, dto, req.user.uid);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Req() req: any,
  ) {
    return this.purchaseOrdersService.updateStatus(id, dto, req.user.uid);
  }

  @Put(':id/approve')
  @Roles(UserRole.ADMIN)
  approveOrder(
    @Param('id') id: string,
    @Req() req: any,
    @Body('reason') reason?: string,
  ) {
    return this.purchaseOrdersService.approveOrder(id, reason, req.user);
  }


  @Put(':id/reject')
  @Roles(UserRole.ADMIN)
  rejectOrder(
    @Param('id') id: string,
    @Req() req: any,
    @Body('reason') reason?: string,
  ) {
    return this.purchaseOrdersService.rejectOrder(id, reason, req.user);
  }


  @Put(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  completeOrder(@Param('id') id: string, @Req() req: any) {
    return this.purchaseOrdersService.completeOrder(id, req.user);
  }

  @Put(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  cancelOrder(
    @Param('id') id: string,
    @Req() req: any,
    @Body('reason') reason?: string,
  ) {
    return this.purchaseOrdersService.cancelOrder(id, reason, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.purchaseOrdersService.remove(id, req.user.uid);
  }

  @Post('calculate-total')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  calculateTotal(@Body() items: any[]) {
    const total = this.purchaseOrdersService.calculateOrderTotal(items);
    return { total };
  }

  @Put(':uid/deactivate')
    @Roles(UserRole.ADMIN)
    deactivateUser(@Param('uid') uid: string) {
      return this.purchaseOrdersService.deactivateProduct(uid);
    }
  
    @Put(':uid/activate')
    @Roles(UserRole.ADMIN)
    activateUser(@Param('uid') uid: string) {
      return this.purchaseOrdersService.activateProduct(uid);
    }
  
}