import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { StockMovementsService } from '../../services/stock-movements.service';
import { StockMovement, StockMovementType, StockMovementReason, StockMovementReferenceModel } from '../../models/stock-movement.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { Product } from '../../../products/models/product.model';
import { ProductService } from '../../../products/services/product.service';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { ToastrAlertService } from '../../../../shared/services/toastr-alert.service';

@Component({
  selector: 'app-stock-movement-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stock-movement-form.component.html',
  styleUrls: ['./stock-movement-form.component.css']
})
export class StockMovementFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private stockService = inject(StockMovementsService);
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private sweetAlert = inject(SweetAlertService);
  private toastr = inject(ToastrAlertService);

  private destroy$ = new Subject<void>();

  movementForm!: FormGroup;
  products: Product[] = [];
  isEditMode = false;
  movementId?: string;
  loading = false;
  submitting = false;
  error = '';

  types = Object.values(StockMovementType);
  reasons = Object.values(StockMovementReason);
  referenceModels = Object.values(StockMovementReferenceModel);

  ngOnInit() {
    this.loadProducts();
    this.initForm();
    this.checkEditMode();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm() {
    this.movementForm = this.fb.group({
      productId: ['', Validators.required],
      type: [StockMovementType.IN, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      reason: [StockMovementReason.MANUAL, Validators.required],
      reference: [null],
      referenceModel: [null],
      previousStock: [0, [Validators.required, Validators.min(0)]],
      newStock: [0, [Validators.required, Validators.min(0)]],
      notes: [''],
      timestamp: [new Date().toISOString().slice(0, 16)]
    });
  }

  // CORRECCIÓN: usar findAll() en lugar de getProducts() que no existe
  // Se agrega tipado explícito y takeUntil para prevenir memory leaks
  private loadProducts() {
    this.productService.findAll({ limit: 1000, isActive: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // CORRECCIÓN: tipado explícito - response tiene forma {products, total, totalPages}
          this.products = response.products;
        },
        error: (err) => {
          console.error('Error loading products:', err);
          this.products = [];
          this.toastr.error('No se pudieron cargar los productos', 'Error');
        }
      });
  }

  checkEditMode() {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.isEditMode = true;
          this.movementId = params['id'];
          this.loadMovement();
        }
      });
  }

  loadMovement() {
    if (!this.movementId) return;
    this.loading = true;
    this.stockService.findOne(this.movementId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (movement) => {
          const patch: any = {
            ...movement,
            productId: this.extractId(movement.productId),
            timestamp: new Date(movement.timestamp).toISOString().slice(0, 16)
          };
          this.movementForm.patchValue(patch);
          this.loading = false;
        },
        error: () => {
          this.error = 'Error al cargar el movimiento';
          this.loading = false;
          this.toastr.error(this.error, 'Error');
        }
      });
  }

  onSubmit() {
    if (this.movementForm.invalid) {
      this.movementForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error = '';

    const raw = this.movementForm.value;

    const payload = {
      ...raw,
      productId: this.extractId(raw.productId),
    };

    const op = this.isEditMode
      ? this.stockService.update(this.movementId!, payload)
      : this.stockService.create(payload);

    op.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const msg = this.isEditMode ? 'Movimiento actualizado' : 'Movimiento creado';
          this.toastr.success(`${msg} correctamente`, 'Éxito');
          this.router.navigate(['/dashboard', 'stock-movements']);
        },
        error: (err) => {
          this.error = this.isEditMode
            ? 'Error al actualizar el movimiento'
            : 'Error al crear el movimiento';
          this.submitting = false;
          this.toastr.error(this.error, 'Error');
          console.error(err);
        }
      });
  }

  private extractId(value: any): string {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && value._id) return value._id;
    return '';
  }

  onCancel() {
    this.router.navigate(['/dashboard', 'stock-movements']);
  }
}