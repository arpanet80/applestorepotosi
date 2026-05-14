// src/app/purchase-orders/components/purchase-order-form/purchase-order-form.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { SupplierService } from '../../../suppliers/services/supplier.service';
import { ProductService } from '../../../products/services/product.service';

@Component({
  selector: 'app-purchase-order-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './purchase-order-form.component.html',
  styleUrls: ['./purchase-order-form.component.css'],
})
export class PurchaseOrderFormComponent implements OnInit {
  private fb                   = inject(FormBuilder);
  private router               = inject(Router);
  private route                = inject(ActivatedRoute);
  private purchaseOrderService = inject(PurchaseOrderService);
  private supplierService      = inject(SupplierService);
  private productService       = inject(ProductService);

  form!: FormGroup;
  isEditMode  = false;
  orderId?: string;
  submitting  = false;
  error       = '';

  suppliers: any[] = [];
  products:  any[] = [];

  // ── Lifecycle ────────────────────────────────────────────

  ngOnInit() {
    this.initForm();
    this.loadSuppliers();
    this.loadProducts();
    this.checkEditMode();
  }

  // ── Formulario ────────────────────────────────────────────

  initForm() {
    this.form = this.fb.group({
      supplierId: ['', Validators.required],
      orderDate:  [new Date().toISOString().substring(0, 10)],
      items:      this.fb.array([], Validators.minLength(1)),
      notes:      [''],
    });
    // Agregar un item vacío por defecto al crear
    if (!this.isEditMode) this.addItem();
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  addItem() {
    this.items.push(
      this.fb.group({
        productId: ['', Validators.required],
        quantity:  [1,  [Validators.required, Validators.min(1)]],
        unitCost:  [0,  [Validators.required, Validators.min(0)]],
      }),
    );
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  /** Calcula el subtotal de un item a partir del índice (para mostrar en template). */
  getSubtotal(index: number): number {
    const item = this.items.at(index).value;
    return (item.quantity ?? 0) * (item.unitCost ?? 0);
  }

  /** Total general de la orden (suma de subtotales). */
  get orderTotal(): number {
    return this.items.controls.reduce((sum, ctrl) => {
      const v = ctrl.value;
      return sum + (v.quantity ?? 0) * (v.unitCost ?? 0);
    }, 0);
  }

  // ── Carga de datos ────────────────────────────────────────

  loadSuppliers() {
    this.supplierService.getSuppliersForSelect().subscribe({
      next: (list) => (this.suppliers = list),
      error: () => (this.suppliers = []),
    });
  }

  loadProducts() {
    this.productService.getProductsForSelect().subscribe({
      next: (list) => (this.products = list),
      error: () => (this.products = []),
    });
  }

  checkEditMode() {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.orderId    = params['id'];
        this.loadOrder();
      }
    });
  }

  loadOrder() {
    if (!this.orderId) return;
    this.purchaseOrderService.findOne(this.orderId).subscribe({
      next: (order) => {
        // Limpiar el item vacío inicial antes de poblar
        while (this.items.length) this.items.removeAt(0);

        this.form.patchValue({
          supplierId: order.supplierId._id,
          // orderDate viene como ISO string completo, recortamos a yyyy-MM-dd
          orderDate:  order.orderDate?.substring(0, 10) ?? '',
          notes:      order.notes ?? '',
        });

        order.items.forEach((item) => {
          this.items.push(
            this.fb.group({
              // productId viene populado como objeto; necesitamos solo el _id
              productId: [item.productId._id,  Validators.required],
              quantity:  [item.quantity,        [Validators.required, Validators.min(1)]],
              unitCost:  [item.unitCost,        [Validators.required, Validators.min(0)]],
            }),
          );
        });

        // Bloquear form si la orden ya no es editable
        if (!['pending'].includes(order.status)) {
          this.form.disable();
          this.error = `La orden en estado "${order.status}" no puede editarse.`;
        }
      },
      error: () => (this.error = 'Error al cargar la orden'),
    });
  }

  // ── Submit ────────────────────────────────────────────────

  onSubmit() {
    if (this.form.invalid || this.items.length === 0) {
      this.form.markAllAsTouched();
      if (this.items.length === 0) {
        this.error = 'Debe agregar al menos un producto.';
      }
      return;
    }

    this.submitting = true;
    this.error      = '';

    // El backend NO acepta userId en el DTO; lo extrae del token.
    const dto = {
      supplierId: this.form.value.supplierId,
      orderDate:  this.form.value.orderDate || undefined,
      notes:      this.form.value.notes     || undefined,
      items:      (this.form.value.items as any[]).map((i) => ({
        productId: i.productId,
        quantity:  Number(i.quantity),
        unitCost:  Number(i.unitCost),
      })),
    };

    const op$ = this.isEditMode
      ? this.purchaseOrderService.update(this.orderId!, dto)
      : this.purchaseOrderService.create(dto);

    op$.subscribe({
      next: () => this.router.navigate(['/dashboard', 'purchase-orders']),
      error: (err) => {
        this.error      = err?.error?.message
          ?? (this.isEditMode ? 'Error al actualizar la orden' : 'Error al crear la orden');
        this.submitting = false;
      },
    });
  }

  onCancel() {
    this.router.navigate(['/dashboard', 'purchase-orders']);
  }
}