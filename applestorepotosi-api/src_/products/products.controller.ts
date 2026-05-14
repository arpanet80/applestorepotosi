// src/products/products.controller.ts
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
  Req,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { StockUpdateDto } from './dto/stock-update.dto';
import { CreateProductImageDto, UpdateProductImageDto } from './dto/product-image.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { StockMovementsService } from '../stock_movements/stock-movements.service';
import { StockQuantityDto } from './dto/stock-quantity.dto';

@Controller('products')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly stockMovementsService: StockMovementsService,
  ) {}

  // ============================================================
  // CRÍTICO: Las rutas con segmentos estáticos DEBEN ir ANTES
  // que las rutas con parámetros dinámicos (:id), de lo contrario
  // Express interpreta el segmento estático como el valor de :id.
  // ============================================================

  // ─── Rutas estáticas (sin parámetro) ────────────────────────

  @Get('active')
  findActiveProducts() {
    return this.productsService.findAll({ isActive: true, limit: 100, page: 1 });
  }

  @Get('active-paginated')
  findActivePaginated(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(8), ParseIntPipe) limit: number,
  ) {
    return this.productsService.findAll({ isActive: true, page, limit });
  }

  @Get('featured')
  findFeaturedProducts(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.productsService.findFeaturedProducts(limit);
  }

  @Get('low-stock')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findLowStockProducts() {
    return this.productsService.findLowStockProducts();
  }

  @Get('out-of-stock')
  findOutOfStockProducts() {
    return this.productsService.findOutOfStockProducts();
  }

  @Get('select-options')
  getProductsForSelect() {
    return this.productsService.getProductsForSelect();
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getStats() {
    return this.productsService.getStats();
  }

  @Get('search')
  searchProducts(
    @Query('q') search: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    // CORRECCIÓN: validar límite máximo para prevenir abuso
    const safeLimit = Math.min(Math.max(1, limit), 100);
    return this.productsService.searchProducts(search, safeLimit);
  }

  // ─── Rutas con prefijo + parámetro fijo ─────────────────────

  @Get('sku/:sku')
  findBySku(@Param('sku') sku: string) {
    return this.productsService.findBySku(sku);
  }

  @Get('barcode/:barcode')
  findByBarcode(@Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(barcode);
  }

  @Get('category/:categoryId')
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.productsService.findByCategory(categoryId);
  }

  @Get('brand/:brandId')
  findByBrand(@Param('brandId') brandId: string) {
    return this.productsService.findByBrand(brandId);
  }

  // CRÍTICO: check-sku y check-barcode deben ir antes de :id
  @Get('check-sku/:sku')
  async checkSku(
    @Param('sku') sku: string,
    @Query('excludeId') excludeId?: string,
  ) {
    const exists = await this.productsService.skuExists(sku, excludeId);
    return { exists, available: !exists };
  }

  @Get('check-barcode/:barcode')
  async checkBarcode(
    @Param('barcode') barcode: string,
    @Query('excludeId') excludeId?: string,
  ) {
    const exists = await this.productsService.barcodeExists(barcode, excludeId);
    return { exists, available: !exists };
  }

  // ─── CRUD principal ──────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  create(@Body() createProductDto: CreateProductDto, @Req() req: any) {
    const userId = req.user.uid;
    return this.productsService.create(createProductDto, userId);
  }

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // ─── Sub-rutas de :id ────────────────────────────────────────

  @Get(':id/stock-history')
  async getStockHistory(@Param('id') id: string) {
    return this.stockMovementsService.findByProduct(id);
  }

  @Put(':id/stock')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  updateStock(@Param('id') id: string, @Body() stockUpdate: StockUpdateDto) {
    return this.productsService.updateStock(id, stockUpdate);
  }

  // CORRECCIÓN: usar DTO completo con class-validator en lugar de @Body('quantity')
  @Put(':id/increment-stock')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  incrementStock(
    @Param('id') id: string,
    @Body() body: StockQuantityDto,
  ) {
    return this.productsService.incrementStock(id, body.quantity);
  }

  @Put(':id/decrement-stock')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  decrementStock(
    @Param('id') id: string,
    @Body() body: StockQuantityDto,
  ) {
    return this.productsService.decrementStock(id, body.quantity);
  }

  @Put(':id/reserve-stock')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  reserveStock(
    @Param('id') id: string,
    @Body() body: StockQuantityDto,
  ) {
    return this.productsService.reserveStock(id, body.quantity);
  }

  @Put(':id/release-stock')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  releaseStock(
    @Param('id') id: string,
    @Body() body: StockQuantityDto,
  ) {
    return this.productsService.releaseStock(id, body.quantity);
  }

  @Put(':id/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  toggleActive(@Param('id') id: string) {
    return this.productsService.toggleActive(id);
  }

  @Put(':id/toggle-featured')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  toggleFeatured(@Param('id') id: string) {
    return this.productsService.toggleFeatured(id);
  }

  @Put(':id/activate')
  @Roles(UserRole.ADMIN)
  activateProduct(@Param('id') id: string) {
    return this.productsService.activateProduct(id);
  }

  @Put(':id/deactivate')
  @Roles(UserRole.ADMIN)
  deactivateProduct(@Param('id') id: string) {
    return this.productsService.deactivateProduct(id);
  }

  // ─── Imágenes de producto (sub-rutas de :id) ─────────────────

  @Get(':id/images')
  getProductImages(@Param('id') id: string) {
    return this.productsService.getProductImages(id);
  }

  // CORRECCIÓN: movido de POST /products/images a POST /products/:id/images
  @Post(':id/images')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  addProductImage(
    @Param('id') productId: string,
    @Body() createImageDto: Omit<CreateProductImageDto, 'productId'>,
  ) {
    return this.productsService.addProductImage({ ...createImageDto, productId });
  }

  // ─── Imágenes individuales (por imageId) ────────────────────

  @Put('images/:imageId')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  updateProductImage(
    @Param('imageId') imageId: string,
    @Body() updateImageDto: UpdateProductImageDto,
  ) {
    return this.productsService.updateProductImage(imageId, updateImageDto);
  }

  @Put('images/:imageId/primary')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  setPrimaryImage(@Param('imageId') imageId: string) {
    return this.productsService.setPrimaryImage(imageId);
  }

  @Put('images/reorder')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  reorderProductImages(
    @Body() updates: Array<{ id: string; sortOrder: number }>,
  ) {
    return this.productsService.reorderProductImages(updates);
  }

  @Delete('images/:imageId')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  removeProductImage(@Param('imageId') imageId: string) {
    return this.productsService.removeProductImage(imageId);
  }
}