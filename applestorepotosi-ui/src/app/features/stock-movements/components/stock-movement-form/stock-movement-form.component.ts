import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { StockMovementsService } from '../../services/stock-movements.service';
import { StockMovement, StockMovementType, StockMovementReason, StockMovementReferenceModel } from '../../models/stock-movement.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { Product } from '../../../products/models/product.model';
import { ProductService } from '../../../products/services/product.service';

@Component({
  selector: 'app-stock-movement-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stock-movement-form.component.html',
  styleUrls: ['./stock-movement-form.component.css']
})
export class StockMovementFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private stockService = inject(StockMovementsService);
  private authService = inject(AuthService);
  private productService = inject(ProductService);

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

  private loadProducts() {
    this.productService.getProducts().subscribe({
      next: (list) => {
        this.products = list.products;
      },
      error: () => (this.products = [])
    });
  }

  checkEditMode() {
    this.route.params.subscribe(params => {
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
    this.stockService.findOne(this.movementId!).subscribe({
      next: movement => {
        const patch: any = {
          ...movement,
          productId: movement.productId._id, 
          timestamp: new Date(movement.timestamp).toISOString().slice(0, 16)
        };
        this.movementForm.patchValue(patch);
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar el movimiento';
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.movementForm.invalid) return;

    this.submitting = true;
    this.error = '';

    const raw = this.movementForm.value;

    // ✅ Extrae solo los IDs
    const payload = {
        ...raw,
        productId: this.extractId(raw.productId),
        // userId: this.extractUserId(raw.userId)
    };

    const op = this.isEditMode
        ? this.stockService.update(this.movementId!, payload)
        : this.stockService.create(payload);

    op.subscribe({
        next: () => this.router.navigate(['/dashboard', 'stock-movements']),
        error: (err) => {
        this.error = this.isEditMode
            ? 'Error al actualizar el movimiento'
            : 'Error al crear el movimiento';
        this.submitting = false;
        console.error(err);
        }
    });
  }

  // ✅ Helpers seguros
    private extractId(value: any): string {
        if (typeof value === 'string') return value;
        if (value && typeof value === 'object' && value._id) return value._id;
        return '';
    }

    private extractUserId(value: any): string {
        if (typeof value === 'string') return value;
        if (value && typeof value === 'object' && value.uid) return value.uid;
        return this.authService.getCurrentUser()?.uid || '';
    }

  onCancel() {
    this.router.navigate(['/dashboard', 'stock-movements']);
  }

  // get references$() {
  //   const model = this.movementForm.get('referenceModel')?.value;
  //   if (!model || model === 'StockAdjustment') return of([]);
  //   return this.stockService.getReferences(model); // ← endpoint /api/sales | /api/purchase-orders
  // }
}