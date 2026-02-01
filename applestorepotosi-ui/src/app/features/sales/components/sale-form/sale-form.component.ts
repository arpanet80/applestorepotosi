import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SaleService } from '../../services/sale.service';
import { Sale, SaleStatus, PaymentMethod, PaymentStatus } from '../../models/sale.model';
import { CustomerService } from '../../../customers/services/customer.service';
import { ProductService } from '../../../products/services/product.service';
import { GenericModalComponent } from '../../../../shared/components/generic-modal/generic-modal';

interface ItemPopulated {
  productId: { _id: string; name: string };
  quantity: number;
  unitPrice: number;
  discount: number;
}

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, GenericModalComponent],
  templateUrl: './sale-form.component.html',
  styleUrls: ['./sale-form.component.css']
})
export class SaleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private saleService = inject(SaleService);
  private customerService = inject(CustomerService);
  private productService = inject(ProductService);

  @ViewChild('productSelectorTpl') productSelectorTpl!: TemplateRef<any>;
  @ViewChild(GenericModalComponent) modal!: GenericModalComponent;

  saleForm!: FormGroup;
  isEditMode = false;
  saleId?: string;
  loading = false;
  submitting = false;
  error = '';

  customers: any[] = [];
  isPublicGeneral = false;
  PUBLIC_GENERAL_ID = '';

  paymentMethods = Object.values(PaymentMethod);
  paymentStatuses = Object.values(PaymentStatus);
  saleStatuses = Object.values(SaleStatus);

  products: any[] = [];
  selectedProduct: any = null;
  productsToShow: any[] = []; 

  ngOnInit() {
    this.loadCustomers();
    this.loadPublicGeneralId();
    this.initForm();
    this.checkEditMode();
  }

  private loadCustomers() {
    this.customerService.getCustomerRaw().subscribe({
      next: list => this.customers = list,
      error: () => this.customers = []
    });
  }

  private loadPublicGeneralId() {
    this.customerService.getPublicGeneralId().subscribe({
      next: res => this.PUBLIC_GENERAL_ID = res ?? '',
      error: () => this.PUBLIC_GENERAL_ID = ''
    });
  }

  initForm() {
    this.saleForm = this.fb.group({
      customerId: ['', Validators.required],
      saleDate: [new Date().toISOString().slice(0, 16), Validators.required],
      payment: this.fb.group({
        method: [PaymentMethod.CASH, Validators.required],
        status: [PaymentStatus.PENDING],
        reference: ['']
      }),
      status: [SaleStatus.PENDING, Validators.required],
      isReturn: [false],
      notes: [''],
      totals: this.fb.group({
        subtotal: [0, [Validators.required, Validators.min(0)]],
        taxAmount: [0, [Validators.required, Validators.min(0)]],
        discountAmount: [0, [Validators.required, Validators.min(0)]],
        totalAmount: [0, [Validators.required, Validators.min(0)]]
      }),
      items: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });
  }

  get items(): FormArray {
    return this.saleForm.get('items') as FormArray;
  }

  onPublicGeneralChange(checked: boolean) {
    const customerCtrl = this.saleForm.get('customerId');
    if (checked) {
      customerCtrl?.setValue(this.PUBLIC_GENERAL_ID);
      customerCtrl?.disable(); // ✅ así Angular lo maneja
    } else {
      customerCtrl?.enable();
      customerCtrl?.setValue('');
    }
  }

  onAddProduct() {
    this.loadProductsForModal();
    this.modal.open();
  }

  loadProductsForModal() {
    this.productService.getProductsForSelect().subscribe({
      next: list => {
        // Quitamos los productos que YA están en la venta
        const addedIds = new Set(
          this.items.controls.map(g => g.get('productId')?.value)
        );
        this.productsToShow = list.filter(p => !addedIds.has(p._id));
        this.modal.open();
      },
      error: () => this.productsToShow = []
    });
  }

  onSelectProduct(product: any) {
    this.modal.close();
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    this.selectedProduct = product;
    this.addItem(product);
  }

  

  addItem(product: any) {
    this.items.push(this.fb.group({
      productId: [product._id],
      productName: [product.name],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [product.salePrice, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0)]]
    }));
    this.recalcTotals();
  }

  removeItem(index: number) {
    this.items.removeAt(index);
    this.recalcTotals();
  }

  recalcTotals() {
    let sub = 0;
    let disc = 0;
    this.items.controls.forEach(g => {
      const q = g.get('quantity')?.value || 0;
      const p = g.get('unitPrice')?.value || 0;
      const d = g.get('discount')?.value || 0;
      sub += q * p;
      disc += d;
    });
    const tax = sub * 0.16;
    this.saleForm.patchValue({
      totals: {
        subtotal: sub,
        discountAmount: disc,
        taxAmount: tax,
        totalAmount: sub + tax - disc
      }
    }, { emitEvent: false });
  }

  calcLineTotal(group: AbstractControl): number {
    const q = group.get('quantity')?.value || 0;
    const p = group.get('unitPrice')?.value || 0;
    const d = group.get('discount')?.value || 0;
    return q * p - d;
  }

  checkEditMode() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.saleId = params['id'];
        this.loadSale();
      }
    });
  }

  loadSale() {
    if (!this.saleId) return;
    this.loading = true;
    this.saleService.findOne(this.saleId!).subscribe({
      next: (sale) => {
        // Patch básico
        this.saleForm.patchValue({
          customerId: this.extractCustomerId(sale.customerId),
          saleDate: new Date(sale.saleDate).toISOString().slice(0, 16),
          payment: sale.payment,
          status: sale.status,
          isReturn: sale.isReturn,
          notes: sale.notes,
          totals: sale.totals
        });

        // ---- CARGAR ÍTEMS ----
        this.clearItems();
        (sale.items as ItemPopulated[]).forEach(it =>
          this.items.push(this.fb.group({
            productId: [it.productId._id],
            productName: [it.productId.name],
            quantity: [it.quantity, [Validators.required, Validators.min(1)]],
            unitPrice: [it.unitPrice, [Validators.required, Validators.min(0)]],
            discount: [it.discount || 0, [Validators.min(0)]]
          }))
        );
        this.recalcTotals();
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar la venta';
        this.loading = false;
      }
    });
  }

  clearItems() {
    while (this.items.length) this.items.removeAt(0);
  }

  onSubmit() {
  if (this.saleForm.invalid) {
    this.markAllFieldsAsTouched();
    return;
  }

  this.submitting = true;
  this.error = '';

  const raw = this.saleForm.getRawValue();

  const customerId = typeof raw.customerId === 'string'
    ? raw.customerId
    : raw.customerId?._id || '';

  // ====== NUEVO: payload distinto según modo ======
  const payload: any = {
    customerId,
    saleDate: raw.saleDate,
    payment: raw.payment,
    status: raw.status,
    isReturn: raw.isReturn,
    notes: raw.notes || undefined,
  };

  // solo en creación enviamos items
  if (!this.isEditMode) {
    payload.items = raw.items.map((it: any) => ({
      productId: it.productId,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      discount: it.discount || 0,
    }));
  }

  const op = this.isEditMode
    ? this.saleService.update(this.saleId!, payload)
    : this.saleService.create(payload);

  op.subscribe({
    next: () => this.router.navigate(['/dashboard', 'sales']),
    error: (err) => {
      this.error = err.error?.message?.join?.(', ') || 'Error al guardar';
      this.submitting = false;
    },
  });
}

  onCancel() {
    this.router.navigate(['/dashboard', 'sales']);
  }

  private markAllFieldsAsTouched() {
    this.saleForm.markAllAsTouched();
  }

  private extractCustomerId(value: any): string {
    return typeof value === 'string' ? value : value?._id || '';
  }

  onModalSave() {
    // Lógica adicional si se desea al guardar desde el modal
    console.log('Guardar pulsado en modal');
  }
}