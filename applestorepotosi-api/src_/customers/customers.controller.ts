// src/customers/customers.controller.ts
import {Controller,Get,Post,Put,Delete,Param,Body,Query,UseGuards,ParseIntPipe,DefaultValuePipe,  Req,} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { LoyaltyPointsDto } from './dto/loyalty-points.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('customers')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  /* ---------- CREAR ---------- */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  create(@Body() dto: CreateCustomerDto, @Req() req: any) {
    return this.customersService.create(dto, req.user.uid);
  }

  @Post('from-user/:userId')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  createFromUser(
    @Param('userId') userId: string,
    @Body() customerData: Partial<CreateCustomerDto>,
  ) {
    return this.customersService.createFromUser(userId, customerData);
  }

  @Get('customer-general-id')
  async getPublicGeneralId() {
    // const customer = await this.customerModel.findOne({ isPublicGeneral: true });
    // return { customerId: customer._id };
    return this.customersService.getPublicGeneralId();
  }

  @Get('public-general')
  async getPublicGeneral() {
    return this.customersService.findPublicGeneral();
  }

  @Get('all')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  findAllRaw() {
    return this.customersService.findAllRaw();
  }


  /* ---------- LISTADOS ---------- */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findAll(@Query() query: CustomerQueryDto) {
    return this.customersService.findAll(query);
  }

  @Get('active')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findActiveCustomers() {
    return this.customersService.findActiveCustomers();
  }

  @Get('select-options')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  getCustomersForSelect() {
    return this.customersService.getCustomersForSelect();
  }

  @Get('top-loyalty')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findTopLoyaltyCustomers(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.customersService.findTopLoyaltyCustomers(limit);
  }

  @Get('countries')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getUniqueCountries() {
    return this.customersService.getUniqueCountries();
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getStats() {
    return this.customersService.getStats();
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  searchCustomers(
    @Query('q') search: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.customersService.searchCustomers(search, limit);
  }

  @Get('country/:country')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findByCountry(@Param('country') country: string) {
    return this.customersService.findByCountry(country);
  }

  @Get('email/:email')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findByEmail(@Param('email') email: string) {
    return this.customersService.findByEmail(email);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findByUserId(@Param('userId') userId: string) {
    return this.customersService.findByUserId(userId);
  }

  @Get('tax-id/:taxId')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findByTaxId(@Param('taxId') taxId: string) {
    return this.customersService.findByTaxId(taxId);
  }

  /* ---------- CLIENTE AUTENTICADO ---------- */
  @Get('me')
  getCurrentCustomer(@Req() req: any) {
    return this.customersService.getCurrentCustomer(req.user.uid);
  }

  /* ---------- ÚNICO POR ID ---------- */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  /* ---------- ACTUALIZAR ---------- */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @Req() req: any,
  ) {
    return this.customersService.update(id, dto, req.user.uid);
  }

  /* ---------- PUNTOS LEALTAD ---------- */
  @Put(':id/loyalty-points/add')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  addLoyaltyPoints(
    @Param('id') id: string,
    @Body() dto: LoyaltyPointsDto,
  ) {
    return this.customersService.addLoyaltyPoints(id, dto);
  }

  @Put(':id/loyalty-points/subtract')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  subtractLoyaltyPoints(
    @Param('id') id: string,
    @Body() dto: LoyaltyPointsDto,
  ) {
    return this.customersService.subtractLoyaltyPoints(id, dto);
  }

  @Put(':id/loyalty-points/set')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  setLoyaltyPoints(
    @Param('id') id: string,
    @Body('points') points: number,
  ) {
    return this.customersService.setLoyaltyPoints(id, points);
  }

  /* ---------- TOGGLE ESTADO ---------- */
  @Put(':id/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  toggleActive(@Param('id') id: string) {
    return this.customersService.toggleActive(id);
  }

  /* ---------- SOFT-DELETE ---------- */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }

  /* ---------- VERIFICACIONES ---------- */
  @Get('check-email/:email')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  async checkEmail(
    @Param('email') email: string,
    @Query('excludeId') excludeId?: string,
  ) {
    const exists = await this.customersService.emailExists(email, excludeId);
    return { exists, available: !exists };
  }

  @Get('check-tax-id/:taxId')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  async checkTaxId(
    @Param('taxId') taxId: string,
    @Query('excludeId') excludeId?: string,
  ) {
    const exists = await this.customersService.taxIdExists(taxId, excludeId);
    return { exists, available: !exists };
  }

  @Get('check-user-id/:userId')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  async checkUserId(
    @Param('userId') userId: string,
    @Query('excludeId') excludeId?: string,
  ) {
    const exists = await this.customersService.userIdExists(userId, excludeId);
    return { exists, available: !exists };
  }

  @Get('debug/all')
  @Roles(UserRole.ADMIN)
  findAllDebug() {
    return this.customersService.findAllDebug();
  }

}