import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SaleService } from '../../services/sale.service';
import { Sale, SaleStatus, PaymentMethod, PaymentStatus } from '../../models/sale.model';

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sale-form.component.html',
  styleUrls: ['./sale-form.component.css']
})
export class SaleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private saleService = inject(SaleService);

  saleForm!: FormGroup;
  isEditMode = false;
  saleId?: string;
  loading = false;
  submitting = false;
  error = '';

  // Opciones para selects
  paymentMethods = Object.values(PaymentMethod);
  paymentStatuses = Object.values(PaymentStatus);
  saleStatuses = Object.values(SaleStatus);

  ngOnInit() {
    this.initForm();
    this.checkEditMode();
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
      })
    });
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
      next: sale => {
        const patch: any = {
          ...sale,
          customerId: this.extractCustomerId(sale.customerId),
          saleDate: new Date(sale.saleDate).toISOString().slice(0, 16)
        };
        this.saleForm.patchValue(patch);
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar la venta';
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.saleForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.submitting = true;
    this.error = '';

    const raw = this.saleForm.value;
    const payload: Partial<Sale> = {
      customerId: this.extractCustomerId(raw.customerId),
      saleDate: raw.saleDate,
      payment: raw.payment,
      status: raw.status as SaleStatus,
      isReturn: raw.isReturn,
      notes: raw.notes || undefined,
      totals: raw.totals
    };

    const op = this.isEditMode
      ? this.saleService.update(this.saleId!, payload)
      : this.saleService.create(payload);

    op.subscribe({
      next: () => this.router.navigate(['/dashboard', 'sales']),
      error: err => {
        this.error = this.isEditMode
          ? 'Error al actualizar la venta'
          : 'Error al crear la venta';
        this.submitting = false;
        console.error(err);
      }
    });
  }

  onCancel() {
    this.router.navigate(['/dashboard', 'sales']);
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.saleForm.controls).forEach(key => {
      this.saleForm.get(key)?.markAsTouched();
    });
  }

  private extractCustomerId(value: any): string {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && value._id) return value._id;
    return '';
  }
}