import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { StockMovementsService } from '../../services/stock-movements.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { Product } from '../../../products/models/product.model';
import { ProductService } from '../../../products/services/product.service';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { ToastrAlertService } from '../../../../shared/services/toastr-alert.service';

@Component({
  selector: 'app-stock-adjustment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stock-adjustment-form.component.html',
  styleUrls: ['./stock-adjustment-form.component.css']
})
export class StockAdjustmentFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private stockService = inject(StockMovementsService);
  private productService = inject(ProductService);
  private sweetAlert = inject(SweetAlertService);
  private toastr = inject(ToastrAlertService);

  private destroy$ = new Subject<void>();

  products: Product[] = [];
  loadingProducts = false;

  adjustmentForm: FormGroup = this.fb.group({
    productId: ['', Validators.required],
    newQuantity: [0, [Validators.required, Validators.min(0)]],
    reason: ['manual', Validators.required],
    notes: ['']
  });

  submitting = false;
  error = '';

  ngOnInit() {
    this.loadProducts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // CORRECCIÓN: usar findAll() en lugar de getProducts() que no existe
  // También se agrega tipado explícito y takeUntil para prevenir memory leaks
  private loadProducts() {
    this.loadingProducts = true;
    this.productService.findAll({ limit: 1000, isActive: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // CORRECCIÓN: tipado explícito - response tiene forma {products, total, totalPages}
          this.products = response.products;
          this.loadingProducts = false;
        },
        error: (err) => {
          console.error('Error loading products:', err);
          this.products = [];
          this.loadingProducts = false;
          this.toastr.error('No se pudieron cargar los productos', 'Error');
        }
      });
  }

  onSubmit() {
    if (this.adjustmentForm.invalid) {
      this.adjustmentForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error = '';

    const payload = this.adjustmentForm.value;

    this.stockService.createAdjustment(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Ajuste de stock creado correctamente', 'Éxito');
          this.router.navigate(['/dashboard', 'stock-movements']);
        },
        error: (err) => {
          this.error = err?.error?.message || 'Error al crear el ajuste de stock';
          this.submitting = false;
          this.toastr.error(this.error, 'Error');
        }
      });
  }

  onCancel() {
    this.router.navigate(['/dashboard', 'stock-movements']);
  }
}