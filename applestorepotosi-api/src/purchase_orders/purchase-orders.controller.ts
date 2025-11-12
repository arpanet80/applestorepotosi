// src/purchase-orders/purchase-orders.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards,ParseIntPipe,DefaultValuePipe,HttpCode,HttpStatus} from '@nestjs/common';
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
  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersService
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  create(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto) {
    // Validar items antes de crear
    this.purchaseOrdersService.validateOrderItems(createPurchaseOrderDto.items);
    return this.purchaseOrdersService.create(createPurchaseOrderDto);
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
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto
  ) {
    // Validar items si se están actualizando
    if (updatePurchaseOrderDto.items) {
      this.purchaseOrdersService.validateOrderItems(updatePurchaseOrderDto.items);
    }
    return this.purchaseOrdersService.update(id, updatePurchaseOrderDto);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto
  ) {
    return this.purchaseOrdersService.updateStatus(id, updateStatusDto);
  }

  @Put(':id/approve')
  @Roles(UserRole.ADMIN)
  approveOrder(@Param('id') id: string) {
    return this.purchaseOrdersService.updateStatus(id, { status: 'approved' });
  }

  @Put(':id/reject')
  @Roles(UserRole.ADMIN)
  rejectOrder(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.purchaseOrdersService.updateStatus(id, { 
      status: 'rejected', 
      reason 
    });
  }

  @Put(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  completeOrder(@Param('id') id: string) {
    return this.purchaseOrdersService.updateStatus(id, { status: 'completed' });
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.purchaseOrdersService.remove(id);
  }

  @Get('calculate-total')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  calculateTotal(@Body() items: any[]) {
    const total = this.purchaseOrdersService.calculateOrderTotal(items);
    return { total };
  }
}