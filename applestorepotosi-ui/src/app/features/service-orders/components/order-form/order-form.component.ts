// service-orders/components/order-form/order-form.component.ts
import { Component, OnInit, ViewChild, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ServiceOrdersService } from '../../services/service-orders.service';
import { CustomerService } from '../../../customers/services/customer.service';
import { Customer } from '../../../customers/models/customer.model';
import { GenericModalComponent } from '../../../../shared/components/generic-modal/generic-modal';

interface ItemRow {
  partName: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  notes: string;
}

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, GenericModalComponent, RouterLink],
  templateUrl: './order-form.component.html',
})
export class OrderFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private svc = inject(ServiceOrdersService);
  private router = inject(Router);
  private customerService = inject(CustomerService);
  @ViewChild('customerModal') customerModal!: GenericModalComponent;

  form!: FormGroup;
  customers: Customer[] = [];
  rows: ItemRow[] = [];
  submitted = false;
  saving = false;
  errorMsg = '';

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.buildForm();
    this.loadCustomers();
    this.addRow();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      customerId: ['', Validators.required],
      device: this.fb.group({
        type: ['', Validators.required],
        model: ['', Validators.required],
        imei: [''],
        serial: [''],
        aestheticCondition: [''],
        accessoriesLeft: [[]],
      }),
      symptom: ['', Validators.required],
      description: [''],
      laborCost: [0, [Validators.required, Validators.min(0)]],
      warrantyMonths: [3, [Validators.required, Validators.min(0)]],
      photos: [[]],
    });
  }

  private loadCustomers(): void {
    this.customerService.getCustomersForSelect()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customers) => this.customers = customers,
        error: (err) => console.error('Error cargando clientes:', err),
      });
  }

  /* ---------- helpers de filas ---------- */
  addRow(): void {
    this.rows.push({ partName: '', quantity: 1, unitCost: 0, unitPrice: 0, notes: '' });
  }

  removeRow(index: number): void {
    this.rows.splice(index, 1);
  }

  get validItemsCount(): number {
    return this.rows.filter(r => r.partName.trim().length > 0).length;
  }

  /* ---------- cálculos ---------- */
  getItemsTotal(): number {
    return this.rows
      .filter(r => r.partName.trim().length > 0)
      .reduce((sum, r) => sum + r.quantity * r.unitPrice, 0);
  }

  getGrandTotal(): number {
    return this.getItemsTotal() + (this.form.value.laborCost || 0);
  }

  /* ---------- envío ---------- */
  save(): void {
    this.submitted = true;
    this.errorMsg = '';

    if (this.form.invalid) return;

    const items = this.rows
      .filter(r => r.partName.trim().length > 0)
      .map(r => ({ ...r }));

    if (items.length === 0) {
      this.errorMsg = 'Debe agregar al menos un repuesto válido';
      return;
    }

    /* validar items antes de enviar */
    for (const item of items) {
      if (item.unitPrice < 0) {
        this.errorMsg = `El precio de "${item.partName}" no puede ser negativo`;
        return;
      }
      if (item.unitCost < 0) {
        this.errorMsg = `El costo de "${item.partName}" no puede ser negativo`;
        return;
      }
      if (item.quantity < 1) {
        this.errorMsg = `La cantidad de "${item.partName}" debe ser al menos 1`;
        return;
      }
    }

    const payload: any = { ...this.form.value, items };

    this.saving = true;
    this.svc.create(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/dashboard/service-orders']);
        },
        error: (err) => {
          this.saving = false;
          this.errorMsg = err.error?.message || 'Error al crear la orden de servicio';
          console.error('Error creando orden:', err);
        },
      });
  }

  /* ---------- modal cliente ---------- */
  openNewCustomerModal() {
    this.customerModal.open();
  }

  newCustomerForm = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
  });

  onSaveCustomer() {
    if (this.newCustomerForm.invalid) return;

    const raw = this.newCustomerForm.value;
    const newCustomer: Partial<Customer> = {
      fullName: raw.fullName!,
      email: raw.email!,
      phone: raw.phone!,
    };

    this.customerService.create(newCustomer)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (c) => {
          this.customers = [c, ...this.customers];
          this.form.get('customerId')?.setValue(c._id);
          this.newCustomerForm.reset();
          this.customerModal.close();
        },
        error: (err) => {
          console.error('Error creando cliente:', err);
          alert('Error al crear cliente');
        },
      });
  }
}