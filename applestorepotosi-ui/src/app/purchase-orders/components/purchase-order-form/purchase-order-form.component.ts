// src/app/purchase-orders/components/purchase-order-form/purchase-order-form.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { SupplierService } from '../../../suppliers/services/supplier.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ProductService } from '../../../products/services/product.service';

@Component({
  selector: 'app-purchase-order-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './purchase-order-form.component.html',
  styleUrls: ['./purchase-order-form.component.css'],
})
export class PurchaseOrderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private purchaseOrderService = inject(PurchaseOrderService);
  private supplierService = inject(SupplierService);
  private authService = inject(AuthService);
    private productService = inject(ProductService); // ← agregado


  products: any[] = [];
  form!: FormGroup;
  isEditMode = false;
  orderId?: string;
  submitting = false;
  error = '';

  suppliers: any[] = [];
  currentUser = this.authService.getCurrentUser();

  ngOnInit() {
    this.initForm();
    this.loadSuppliers();
    this.loadProducts(); 
    this.checkEditMode();
  }

  loadProducts() {
    this.productService.getProductsForSelect().subscribe({
      next: (list) => (this.products = list),
      error: () => (this.products = []),
    });
  }

  initForm() {
    this.form = this.fb.group({
      supplierId: ['', Validators.required],
      userId: [this.currentUser?.uid || '', Validators.required],
      orderDate: [new Date().toISOString().substring(0, 10)],
      items: this.fb.array([], Validators.minLength(1)),
      notes: [''],
    });
  }

  get items() {
    return this.form.get('items') as FormArray;
  }

  addItem() {
    this.items.push(this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitCost: [0, [Validators.required, Validators.min(0)]],
    }));
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  loadSuppliers() {
    this.supplierService.getSuppliersForSelect().subscribe((list) => {
      this.suppliers = list;
    });
  }

  checkEditMode() {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.orderId = params['id'];
        this.loadOrder();
      }
    });
  }

  loadOrder() {
    if (!this.orderId) return;
    this.purchaseOrderService.findOne(this.orderId).subscribe({
      next: (order) => {
        this.form.patchValue({
          supplierId: order.supplierId,
          userId: order.userId,
          orderDate: order.orderDate.substring(0, 10),
          notes: order.notes,
        });
        order.items.forEach((item: any) => {
          this.items.push(this.fb.group({
            productId: [item.productId._id, Validators.required],
            quantity: [item.quantity, Validators.required],
            unitCost: [item.unitCost, Validators.required],
          }));
        });
      },
      error: () => (this.error = 'Error al cargar la orden'),
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.submitting = true;
    const dto = this.form.value;

    const op = this.isEditMode
      ? this.purchaseOrderService.update(this.orderId!, dto)
      : this.purchaseOrderService.create(dto);

    op.subscribe({
      next: () => this.router.navigate(['/dashboard', 'purchase-orders']),
      error: () => {
        this.error = this.isEditMode ? 'Error al actualizar' : 'Error al crear';
        this.submitting = false;
      },
    });
  }

  onCancel() {
    this.router.navigate(['/dashboard', 'purchase-orders']);
  }
}