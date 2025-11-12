// src/sales/sales.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  Query, 
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Req
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SaleQueryDto } from './dto/sale-query.dto';
import { UpdateSaleStatusDto } from './dto/update-sale-status.dto';
import { CreateSaleItemDto, UpdateSaleItemDto } from './dto/sale-item.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('sales')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class SalesController {
  constructor(
    private readonly salesService: SalesService
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  create(@Body() createSaleDto: CreateSaleDto, @Req() req: any) {
    const salesPersonId = req.user.uid;
    return this.salesService.create(createSaleDto, salesPersonId);
  }

  @Post('quick')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  createQuickSale(
    @Body() createSaleDto: Omit<CreateSaleDto, 'saleNumber'>,
    @Req() req: any
  ) {
    const salesPersonId = req.user.uid;
    return this.salesService.createQuickSale(createSaleDto, salesPersonId);
  }

  @Post('return/:originalSaleId')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  createReturn(
    @Param('originalSaleId') originalSaleId: string,
    @Body() returnData: { items: any[]; notes?: string },
    @Req() req: any
  ) {
    const salesPersonId = req.user.uid;
    return this.salesService.createReturn(originalSaleId, returnData.items, returnData.notes);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findAll(@Query() query: SaleQueryDto) {
    return this.salesService.findAll(query);
  }

  @Get('today')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findTodaySales() {
    return this.salesService.findTodaySales();
  }

  @Get('customer/:customerId')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findByCustomer(@Param('customerId') customerId: string) {
    return this.salesService.findByCustomer(customerId);
  }

  @Get('salesperson/:salesPersonId')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findBySalesPerson(@Param('salesPersonId') salesPersonId: string) {
    return this.salesService.findBySalesPerson(salesPersonId);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getStats(@Query('period') period: 'day' | 'week' | 'month' | 'year' = 'month') {
    return this.salesService.getStats(period);
  }

  @Get('revenue')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getRevenueByPeriod(@Query('period') period: 'day' | 'week' | 'month' | 'year' = 'week') {
    return this.salesService.getRevenueByPeriod(period);
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  searchSales(@Query('q') search: string) {
    return this.salesService.findAll({ search, limit: 20 });
  }

  @Get('number/:saleNumber')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findBySaleNumber(@Param('saleNumber') saleNumber: string) {
    return this.salesService.findBySaleNumber(saleNumber);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Get(':id/items')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findSaleItems(@Param('id') id: string) {
    return this.salesService.findSaleItems(id);
  }

  @Get(':id/full')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findSaleWithItems(@Param('id') id: string) {
    return this.salesService.findSaleWithItems(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  update(
    @Param('id') id: string, 
    @Body() updateSaleDto: UpdateSaleDto
  ) {
    return this.salesService.update(id, updateSaleDto);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateSaleStatusDto
  ) {
    return this.salesService.updateStatus(id, updateStatusDto);
  }

  @Put(':id/confirm')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  confirmSale(@Param('id') id: string) {
    return this.salesService.confirmSale(id);
  }

  @Put(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  cancelSale(
    @Param('id') id: string,
    @Body('notes') notes?: string
  ) {
    return this.salesService.cancelSale(id, notes);
  }

  @Put(':id/deliver')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  markAsDelivered(@Param('id') id: string) {
    return this.salesService.markAsDelivered(id);
  }

  @Put(':id/complete-payment')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  completePayment(
    @Param('id') id: string,
    @Body('reference') reference?: string
  ) {
    return this.salesService.completePayment(id, reference);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.salesService.remove(id);
  }

  @Get('check-number/:saleNumber')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  async checkSaleNumber(
    @Param('saleNumber') saleNumber: string,
    @Query('excludeId') excludeId?: string
  ) {
    const exists = await this.salesService.saleNumberExists(saleNumber, excludeId);
    return { exists, available: !exists };
  }

  // ========== ENDPOINTS PARA ITEMS DE VENTA ==========

  @Post('items')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  addSaleItem(@Body() createItemDto: CreateSaleItemDto) {
    return this.salesService.addSaleItem(createItemDto);
  }

  @Put('items/:id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  updateSaleItem(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateSaleItemDto
  ) {
    return this.salesService.updateSaleItem(id, updateItemDto);
  }

  @Delete('items/:id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  removeSaleItem(@Param('id') id: string) {
    return this.salesService.removeSaleItem(id);
  }
}