// src/products/products.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards,ParseIntPipe,DefaultValuePipe,Req} from '@nestjs/common';
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

@Controller('products')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly stockMovementsService: StockMovementsService
    
  ) {}

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

  @Get('active')
  findActiveProducts() {
    return this.productsService.findAll({ isActive: true, limit: 100 });
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
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
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
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.productsService.searchProducts(search, limit);
  }

  @Get('category/:categoryId')
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.productsService.findByCategory(categoryId);
  }

  @Get('brand/:brandId')
  findByBrand(@Param('brandId') brandId: string) {
    return this.productsService.findByBrand(brandId);
  }

  @Get('sku/:sku')
  findBySku(@Param('sku') sku: string) {
    return this.productsService.findBySku(sku);
  }

  @Get('barcode/:barcode')
  findByBarcode(@Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(barcode);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  update(
    @Param('id') id: string, 
    @Body() updateProductDto: UpdateProductDto
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Get(':id/stock-history')
  @UseGuards(FirebaseAuthGuard)
  async getStockHistory(@Param('id') id: string) {
    return this.stockMovementsService.findByProduct(id);
  }

  @Put(':id/stock')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  updateStock(
    @Param('id') id: string,
    @Body() stockUpdate: StockUpdateDto
  ) {
    return this.productsService.updateStock(id, stockUpdate);
  }

  @Put(':id/increment-stock')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  incrementStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number
  ) {
    return this.productsService.incrementStock(id, quantity);
  }

  @Put(':id/decrement-stock')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  decrementStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number
  ) {
    return this.productsService.decrementStock(id, quantity);
  }

  @Put(':id/reserve-stock')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  reserveStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number
  ) {
    return this.productsService.reserveStock(id, quantity);
  }

  @Put(':id/release-stock')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  releaseStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number
  ) {
    return this.productsService.releaseStock(id, quantity);
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

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get('check-sku/:sku')
  async checkSku(
    @Param('sku') sku: string,
    @Query('excludeId') excludeId?: string
  ) {
    const exists = await this.productsService.skuExists(sku, excludeId);
    return { exists, available: !exists };
  }

  @Get('check-barcode/:barcode')
  async checkBarcode(
    @Param('barcode') barcode: string,
    @Query('excludeId') excludeId?: string
  ) {
    const exists = await this.productsService.barcodeExists(barcode, excludeId);
    return { exists, available: !exists };
  }

  // ========== ENDPOINTS PARA IMÁGENES ==========

  @Get(':id/images')
  getProductImages(@Param('id') id: string) {
    return this.productsService.getProductImages(id);
  }

  @Post('images')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  addProductImage(@Body() createImageDto: CreateProductImageDto) {
    return this.productsService.addProductImage(createImageDto);
  }

  @Put('images/:id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  updateProductImage(
    @Param('id') id: string,
    @Body() updateImageDto: UpdateProductImageDto
  ) {
    return this.productsService.updateProductImage(id, updateImageDto);
  }

  @Put('images/:id/primary')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  setPrimaryImage(@Param('id') id: string) {
    return this.productsService.setPrimaryImage(id);
  }

  @Put('images/reorder')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  reorderProductImages(@Body() updates: Array<{ id: string; sortOrder: number }>) {
    return this.productsService.reorderProductImages(updates);
  }

  @Delete('images/:id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  removeProductImage(@Param('id') id: string) {
    return this.productsService.removeProductImage(id);
  }

  @Put(':id/deactivate')
  @Roles(UserRole.ADMIN)
  deactivateProduct(@Param('id') id: string) {
    return this.productsService.deactivateProduct(id);
  }

  @Put(':id/activate')
  @Roles(UserRole.ADMIN)
  activateProduct(@Param('id') id: string) {
    return this.productsService.activateProduct(id);
  }

}