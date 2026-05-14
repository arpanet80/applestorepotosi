// src/suppliers/suppliers.controller.ts
import {Controller,Get,Post,Put,Delete,Param,Body,Query,UseGuards,ParseIntPipe,DefaultValuePipe,} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierQueryDto } from './dto/supplier-query.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('suppliers')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  findAll(@Query() query: SupplierQueryDto) {
    return this.suppliersService.findAll(query);
  }

  @Get('active')
  findActiveSuppliers() {
    return this.suppliersService.findActiveSuppliers();
  }

  @Get('select-options')
  getSuppliersForSelect() {
    return this.suppliersService.getSuppliersForSelect();
  }

  @Get('best-terms')
  getSuppliersWithBestTerms() {
    return this.suppliersService.getSuppliersWithBestTerms();
  }

  @Get('countries')
  getUniqueCountries() {
    return this.suppliersService.getUniqueCountries();
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getStats() {
    return this.suppliersService.getStats();
  }

  @Get('search')
  searchSuppliers(
    @Query('q') search: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.suppliersService.searchSuppliers(search, limit);
  }

  @Get('country/:country')
  findByCountry(@Param('country') country: string) {
    return this.suppliersService.findByCountry(country);
  }

  @Get('email/:email')
  findByEmail(@Param('email') email: string) {
    return this.suppliersService.findByEmail(email);
  }

  @Get('tax-id/:taxId')
  findByTaxId(@Param('taxId') taxId: string) {
    return this.suppliersService.findByTaxId(taxId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Put(':id/bank-info')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  updateBankInfo(
    @Param('id') id: string,
    @Body() bankInfo: { accountNumber?: string; bankName?: string },
  ) {
    return this.suppliersService.updateBankInfo(id, bankInfo);
  }

  @Put(':id/payment-terms')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  updatePaymentTerms(@Param('id') id: string, @Body('paymentTerms') paymentTerms: string) {
    return this.suppliersService.updatePaymentTerms(id, paymentTerms);
  }

  @Put(':id/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  toggleActive(@Param('id') id: string) {
    return this.suppliersService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }

  @Get('check-email/:email')
  async checkEmail(@Param('email') email: string, @Query('excludeId') excludeId?: string) {
    const exists = await this.suppliersService.emailExists(email, excludeId);
    return { exists, available: !exists };
  }

  @Get('check-tax-id/:taxId')
  async checkTaxId(@Param('taxId') taxId: string, @Query('excludeId') excludeId?: string) {
    const exists = await this.suppliersService.taxIdExists(taxId, excludeId);
    return { exists, available: !exists };
  }

  @Put(':uid/deactivate')
  @Roles(UserRole.ADMIN)
  deactivateUser(@Param('uid') uid: string) {
    return this.suppliersService.deactivateProduct(uid);
  }

  @Put(':uid/activate')
  @Roles(UserRole.ADMIN)
  activateUser(@Param('uid') uid: string) {
    return this.suppliersService.activateProduct(uid);
  }
}