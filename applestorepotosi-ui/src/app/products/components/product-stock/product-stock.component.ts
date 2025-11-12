import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { ToastrService } from 'ngx-toastr';
import { StockMovement } from '../../models/stock-movement.model';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-stock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-stock.component.html',
  styleUrls: ['./product-stock.component.css']
})
export class ProductStockComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private toastr = inject(ToastrService);

  private destroy$ = new Subject<void>();

  product!: Product;
  productId!: string;
  loading = true;
  submitting = false;
  error = '';

  // Formularios
  stockForm!: FormGroup;
  adjustmentForm!: FormGroup;

  // Historial real desde backend
  stockMovements: StockMovement[] = [];

  // UI
  activeOperation: 'adjust' | 'quick' | 'history' = 'quick';

  ngOnInit() {
    this.initForms();
    this.loadProductData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms() {
    this.stockForm = this.fb.group({
      operation: ['increment', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      reason: ['', Validators.required]
    });

    this.adjustmentForm = this.fb.group({
      newQuantity: [0, [Validators.required, Validators.min(0)]],
      reason: ['', Validators.required],
      note: ['']
    });
  }

  public loadProductData() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.productId = params['id'];
      if (this.productId) {
        this.loadProduct();
        this.loadStockHistory();
      }
    });
  }

  public loadProduct() {
    this.loading = true;
    this.error = '';

    this.productService.findOne(this.productId).subscribe({
      next: (product) => {
        this.product = product;
        this.adjustmentForm.patchValue({ newQuantity: product.stockQuantity });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el producto';
        this.loading = false;
        console.error('Error loading product:', err);
      }
    });
  }

  private loadStockHistory() {
    this.productService.getStockHistory(this.productId).subscribe({
      next: (movements) => {
        this.stockMovements = movements;
      },
      error: (err) => {
        console.error('❌ Error al cargar historial de stock:', err);
        this.stockMovements = [];
      }
    });
  }

  onQuickOperation() {
    if (this.stockForm.invalid) {
      this.markFormGroupTouched(this.stockForm);
      return;
    }

    this.submitting = true;
    const { operation, quantity, reason } = this.stockForm.value;

    let operation$;

    switch (operation) {
      case 'increment':
        operation$ = this.productService.incrementStock(this.productId, quantity);
        break;
      case 'decrement':
        operation$ = this.productService.decrementStock(this.productId, quantity);
        break;
      case 'reserve':
        operation$ = this.productService.reserveStock(this.productId, quantity);
        break;
      case 'release':
        operation$ = this.productService.releaseStock(this.productId, quantity);
        break;
      default:
        this.submitting = false;
        return;
    }

    operation$.subscribe({
      next: (updatedProduct) => {
        this.product = updatedProduct;
        this.submitting = false;
        this.stockForm.reset({ operation: 'increment', quantity: 1, reason: '' });
        this.loadStockHistory(); // ✅ recargar historial
        this.toastr.success('Stock actualizado correctamente', '¡Listo!');
      },
      error: (err) => {
        this.submitting = false;
        this.error = 'Error al actualizar el stock';
        console.error('Error updating stock:', err);
      }
    });
  }

  onAdjustStock() {
    if (this.adjustmentForm.invalid) {
      this.markFormGroupTouched(this.adjustmentForm);
      return;
    }

    this.submitting = true;
    const { newQuantity, reason, note } = this.adjustmentForm.value;

    this.productService.updateStock(this.productId, newQuantity, reason).subscribe({
      next: (updatedProduct) => {
        this.product = updatedProduct;
        this.submitting = false;
        this.loadStockHistory(); // ✅ recargar historial
        this.toastr.success('Stock ajustado correctamente', '¡Listo!');
      },
      error: (err) => {
        this.submitting = false;
        this.error = 'Error al ajustar el stock';
        console.error('Error adjusting stock:', err);
      }
    });
  }

  onCancel() {
    if (!this.productId) {
      this.router.navigate(['/products']); // ← fallback seguro
      return;
    }
    this.router.navigate(['/dashboard', 'products', 'detail', this.productId]);
  }

  setActiveOperation(operation: 'adjust' | 'quick' | 'history') {
    this.activeOperation = operation;
  }

  // === HELPERS PARA EL TEMPLATE ===

  getStockStatusClass(): string {
    if (!this.product) return 'status-unknown';
    switch (this.product.stockStatus) {
      case 'out-of-stock': return 'status-out-of-stock';
      case 'low-stock': return 'status-low-stock';
      case 'over-stock': return 'status-over-stock';
      default: return 'status-in-stock';
    }
  }

  getStockStatusText(): string {
    if (!this.product) return 'Desconocido';
    switch (this.product.stockStatus) {
      case 'out-of-stock': return 'Sin Stock';
      case 'low-stock': return 'Stock Bajo';
      case 'over-stock': return 'Stock Excedido';
      default: return 'En Stock';
    }
  }

  getStockLevelPercentage(): number {
    if (!this.product) return 0;
    const available = this.product.availableQuantity || 0;
    const maxStock = this.product.maxStock || this.product.stockQuantity || 1;
    return Math.min((available / maxStock) * 100, 100);
  }

  getStockLevelClass(): string {
    const percentage = this.getStockLevelPercentage();
    if (percentage === 0) return 'level-empty';
    if (percentage <= 25) return 'level-low';
    if (percentage <= 75) return 'level-medium';
    return 'level-high';
  }

  getMovementIcon(type: StockMovement['type']): string {
    switch (type) {
      case 'in': return '📥';
      case 'out': return '📤';
      case 'adjustment': return '⚙️';
      default: return '📊';
    }
  }

  getMovementColor(type: StockMovement['type']): string {
    switch (type) {
      case 'in': return 'success';
      case 'out': return 'danger';
      case 'adjustment': return 'primary';
      default: return 'secondary';
    }
  }

  getMovementText(type: StockMovement['type']): string {
    switch (type) {
      case 'in': return 'Entrada';
      case 'out': return 'Salida';
      case 'adjustment': return 'Ajuste';
      default: return 'Movimiento';
    }
  }

  private markFormGroupTouched(form: FormGroup) {
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;
    if (errors['required']) return 'Este campo es requerido';
    if (errors['min']) return `El valor debe ser mayor o igual a ${errors['min'].min}`;
    return 'Campo inválido';
  }

  getMovementSign(type: StockMovement['type']): string {
    return type === 'out' ? '-' : '+';
  }
}