// src/app/products/components/product-stock/product-stock.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { ToastrService } from 'ngx-toastr';
import { StockMovement } from '../../models/stock-movement.model';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-stock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
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
  productId = '';
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

  ngOnInit(): void {
    this.initForms();
    this.loadProductData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
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

  loadProductData(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.productId = id;
        this.loadProduct();
        this.loadStockHistory();
      } else {
        this.error = 'ID de producto no proporcionado';
        this.loading = false;
      }
    });
  }

  loadProduct(): void {
    this.loading = true;
    this.error = '';

    this.productService.findOne(this.productId).subscribe({
      next: (product) => {
        this.product = product;
        this.adjustmentForm.patchValue({ newQuantity: product.stockQuantity });
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = 'Error al cargar el producto. Intenta nuevamente.';
        this.loading = false;
        console.error('Error loading product:', err);
      }
    });
  }

  private loadStockHistory(): void {
    this.productService.getStockHistory(this.productId).subscribe({
      next: (movements) => {
        this.stockMovements = movements;
      },
      error: (err: Error) => {
        console.error('Error al cargar historial de stock:', err);
        this.stockMovements = [];
      }
    });
  }

  onQuickOperation(): void {
    if (this.stockForm.invalid) {
      this.markFormGroupTouched(this.stockForm);
      return;
    }

    this.submitting = true;
    this.error = '';
    const { operation, quantity, reason } = this.stockForm.value;

    // ✅ CORREGIDO: No almacenar Observable en variable.
    // Llamar directamente cada método y manejar con callback helper.
    const onSuccess = (msg: string): void => {
      this.loadProduct();
      this.loadStockHistory();
      this.submitting = false;
      this.stockForm.reset({ operation: 'increment', quantity: 1, reason: '' });
      this.toastr.success(`${msg}${reason ? ': ' + reason : ''}`, '¡Listo!');
    };

    const onError = (err: Error, defaultMsg: string): void => {
      this.submitting = false;
      const msg = err?.message || defaultMsg;
      this.error = msg;
      this.toastr.error(msg, 'Error');
      console.error(defaultMsg, err);
    };

    switch (operation) {
      case 'increment':
        this.productService.incrementStock(this.productId, quantity).subscribe({
          next: () => onSuccess(`Stock incrementado en ${quantity} unidades`),
          error: (err: Error) => onError(err, 'Error al incrementar stock')
        });
        break;

      case 'decrement':
        this.productService.decrementStock(this.productId, quantity).subscribe({
          next: () => onSuccess(`Stock decrementado en ${quantity} unidades`),
          error: (err: Error) => onError(err, 'Error al decrementar stock')
        });
        break;

      case 'reserve':
        this.productService.reserveStock(this.productId, quantity).subscribe({
          next: () => onSuccess(`Stock reservado: ${quantity} unidades`),
          error: (err: Error) => onError(err, 'Error al reservar stock')
        });
        break;

      case 'release':
        this.productService.releaseStock(this.productId, quantity).subscribe({
          next: () => onSuccess(`Stock liberado: ${quantity} unidades`),
          error: (err: Error) => onError(err, 'Error al liberar stock')
        });
        break;

      default:
        this.submitting = false;
        return;
    }
  }

  onAdjustStock(): void {
    if (this.adjustmentForm.invalid) {
      this.markFormGroupTouched(this.adjustmentForm);
      return;
    }

    this.submitting = true;
    this.error = '';
    const { newQuantity, reason, note } = this.adjustmentForm.value;

    // Concatenar note al reason si existe
    const fullReason = note ? `${reason} | Nota: ${note}` : reason;

    this.productService.updateStock(this.productId, newQuantity, fullReason).subscribe({
      next: (updatedProduct) => {
        this.product = updatedProduct;
        this.loadStockHistory();
        this.submitting = false;
        this.toastr.success('Stock ajustado correctamente', '¡Listo!');
      },
      error: (err: Error) => {
        this.submitting = false;
        const msg = err?.message || 'Error al ajustar el stock';
        this.error = msg;
        this.toastr.error(msg, 'Error');
        console.error('Error adjusting stock:', err);
      }
    });
  }

  onCancel(): void {
    if (!this.productId) {
      this.router.navigate(['/dashboard', 'products']);
      return;
    }
    this.router.navigate(['/dashboard', 'products', 'detail', this.productId]);
  }

  setActiveOperation(operation: 'adjust' | 'quick' | 'history'): void {
    this.activeOperation = operation;
    this.error = '';
  }

  // === HELPERS PARA EL TEMPLATE ===

  getStockStatusClass(): string {
    if (!this.product) return 'badge-light-secondary';
    switch (this.product.stockStatus) {
      case 'out-of-stock': return 'badge-light-danger';
      case 'low-stock': return 'badge-light-warning';
      case 'over-stock': return 'badge-light-info';
      default: return 'badge-light-success';
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
    if (maxStock === 0) return 0;
    return Math.min((available / maxStock) * 100, 100);
  }

  getStockLevelClass(): string {
    const percentage = this.getStockLevelPercentage();
    if (percentage === 0) return 'level-empty';
    if (percentage <= 25) return 'level-low';
    if (percentage <= 75) return 'level-medium';
    return 'level-high';
  }

  getMovementText(type: StockMovement['type']): string {
    switch (type) {
      case 'in': return 'Entrada';
      case 'out': return 'Salida';
      case 'adjustment': return 'Ajuste';
      default: return 'Movimiento';
    }
  }

  getMovementSign(type: StockMovement['type']): string {
    return type === 'out' ? '-' : '+';
  }

  private markFormGroupTouched(form: FormGroup): void {
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
}