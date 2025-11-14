import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
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

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findAll(@Query() query: SaleQueryDto) {
    return this.salesService.findAll(query);
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
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.salesService.remove(id);
  }
}