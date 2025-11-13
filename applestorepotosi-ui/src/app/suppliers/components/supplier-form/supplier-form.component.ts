// src/app/suppliers/components/supplier-form/supplier-form.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SupplierService } from '../../services/supplier.service';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './supplier-form.component.html',
  styleUrls: ['./supplier-form.component.css'],
})
export class SupplierFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private supplierService = inject(SupplierService);

  form!: FormGroup;
  isEditMode = false;
  supplierId?: string;
  submitting = false;
  error = '';

  ngOnInit() {
    this.initForm();
    this.checkEditMode();
  }

  initForm() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      representative: [''],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: ['', Validators.required],
      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        zipCode: [''],
        country: [''],
      }),
      taxId: [''],
      rfc: [''],
      paymentTerms: [''],
      bankInfo: this.fb.group({
        accountNumber: [''],
        bankName: [''],
      }),
      isActive: [true],
    });
  }

  checkEditMode() {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.supplierId = params['id'];
        this.loadSupplier();
      }
    });
  }

  loadSupplier() {
    if (!this.supplierId) return;
    this.supplierService.findOne(this.supplierId).subscribe({
      next: (s) => this.form.patchValue(s),
      error: () => (this.error = 'Error al cargar el proveedor'),
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.submitting = true;
    const dto = this.form.value;

    const op = this.isEditMode
      ? this.supplierService.update(this.supplierId!, dto)
      : this.supplierService.create(dto);

    op.subscribe({
      next: () => this.router.navigate(['/dashboard', 'suppliers']),
      error: () => {
        this.error = this.isEditMode ? 'Error al actualizar' : 'Error al crear';
        this.submitting = false;
      },
    });
  }

  onCancel() {
    this.router.navigate(['/dashboard', 'suppliers']);
  }
}