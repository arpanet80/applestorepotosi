// src/stock-movements/stock-movements.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards,ParseIntPipe,DefaultValuePipe,HttpCode,HttpStatus, Req} from '@nestjs/common';
import { StockMovementsService } from './stock-movements.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateStockMovementDto } from './dto/update-stock-movement.dto';
import { StockMovementQueryDto } from './dto/stock-movement-query.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('stock-movements')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class StockMovementsController {
  constructor(
    private readonly stockMovementsService: StockMovementsService
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  create(@Body() dto: CreateStockMovementDto, @Req() req: any) {
    const userId = req.user.uid; 
    return this.stockMovementsService.create({ ...dto, userId });
  }

  @Post('adjustment')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  createAdjustment(@Body() dto: StockAdjustmentDto, @Req() req: any) {
    const userId = req.user.uid; // ✅ UID de Firebase
    return this.stockMovementsService.createStockAdjustment({ ...dto, userId });
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  findAll(@Query() query: StockMovementQueryDto) {
    return this.stockMovementsService.findAll(query);
  }

  @Get('all')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  findAllRaw() {
    return this.stockMovementsService.findAllRaw();
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getStats() {
    return this.stockMovementsService.getStats();
  }

  @Get('daily-summary')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getDailySummary(
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number
  ) {
    return this.stockMovementsService.getDailySummary(days);
  }

  @Get('recent')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  getRecentMovements(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ) {
    return this.stockMovementsService.getRecentMovements(limit);
  }

  @Get('product/:productId')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  findByProduct(
    @Param('productId') productId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.stockMovementsService.findByProduct(productId, page, limit);
  }

  @Get('product/:productId/history')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  getProductHistory(
    @Param('productId') productId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number
  ) {
    return this.stockMovementsService.getProductHistory(productId, days);
  }

  @Get('product/:productId/current-stock')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  calculateCurrentStock(@Param('productId') productId: string) {
    return this.stockMovementsService.calculateCurrentStock(productId);
  }

  @Get('type/:type')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  findByType(
    @Param('type') type: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.stockMovementsService.findByType(type, page, limit);
  }

  @Get('reason/:reason')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  findByReason(
    @Param('reason') reason: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.stockMovementsService.findByReason(reason, page, limit);
  }

  @Get('reference/:referenceId')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  findByReference(@Param('referenceId') referenceId: string) {
    return this.stockMovementsService.findByReference(referenceId);
  }

  @Get('date-range')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.stockMovementsService.findByDateRange(
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  findOne(@Param('id') id: string) {
    return this.stockMovementsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStockMovementDto,
    @Req() req: any, // ✅ agrega esto
  ) {
    const userId = req.user.uid; // ✅ UID de Firebase
    return this.stockMovementsService.update(id, { ...dto, userId });
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.stockMovementsService.remove(id);
  }
}