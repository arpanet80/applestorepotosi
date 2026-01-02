import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SaleQueryDto } from './dto/sale-query.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { ParseObjectIdPipe } from './pipes/parse-object-id.pipe';

@Controller('sales')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  create(@Body() createSaleDto: CreateSaleDto, @Req() req: any) {
    const salesPersonId = req.user.uid;
    return this.salesService.create(createSaleDto, salesPersonId);
  }

  @Post('quick')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  createQuickSale(@Body() dto: Omit<CreateSaleDto, 'saleNumber'>, @Req() req: any) {
    const salesPersonId = req.user.uid;
    return this.salesService.createQuickSale(dto, salesPersonId);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getStats() {
    return this.salesService.getStats();
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findAll(@Query() query: SaleQueryDto) {
    return this.salesService.findAll(query);
  }

  @Get('all')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  findAllRaw() {
    return this.salesService.findAllRaw();
  }

  @Get(':id/items')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findItemsBySale(@Param('id', ParseObjectIdPipe) id: string) {
    return this.salesService.findItemsBySale(id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.salesService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() updateSaleDto: UpdateSaleDto) {
    return this.salesService.update(id, updateSaleDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseObjectIdPipe) id: string, @Req() req: any) {
    return this.salesService.remove(id, req.user.uid);
  }

  @Put(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  cancelSale(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: { notes?: string },
    @Req() req: any,
  ) {
    return this.salesService.cancelSale(id, req.user.uid, body.notes);
  }

}