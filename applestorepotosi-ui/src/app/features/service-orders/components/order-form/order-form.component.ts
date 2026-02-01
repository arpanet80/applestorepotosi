import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  templateUrl: './order-form.component.html'
})
export class OrderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private svc = inject(ServiceOrdersService);
  private router = inject(Router);
  private customerService = inject(CustomerService);
  @ViewChild('customerModal') customerModal!: GenericModalComponent;

  form!: FormGroup;
  customers: Customer[] = [];
  rows: ItemRow[] = [];          // <-- array plano
  submitted = false;

  ngOnInit(): void {
    this.buildForm();
    this.loadCustomers();
    this.addRow();               // primera línea por defecto
  }

  private buildForm(): void {
    this.form = this.fb.group({
      customerId: ['', Validators.required],
      device: this.fb.group({
        type: ['iPhone', Validators.required],
        model: ['17 Pro MAx', Validators.required],
        imei: ['135131351351'],
        serial: ['5a1351a351aaa'],
        aestheticCondition: ['Seminuevo'],
        accessoriesLeft: [[]],
      }),
      symptom: ['Síntoma por defecto', Validators.required],
      description: ['Descripción por defecto'],
      laborCost: [1500],
      warrantyMonths: [3],
    });
  }

  private loadCustomers(): void {
    this.customerService.getCustomersForSelect().subscribe({
      next: (customers) => {
        this.customers = customers;
        console.log("🚀 ~ OrderFormComponent ~ loadCustomers ~ customers:", this.customers)
      }
    });
  }

  /* ---------- helpers de filas ---------- */
  addRow(): void {
    this.rows.push({ partName: '', quantity: 1, unitCost: 0, unitPrice: 0, notes: '' });
  }

  removeRow(index: number): void {
    this.rows.splice(index, 1);
  }

  /* ---------- envío ---------- */
  save(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    const items = this.rows
      .filter(r => r.partName.trim().length > 0)
      .map(r => ({ ...r }));

    if (items.length === 0) {
      alert('Debe completar al menos un repuesto');
      return;
    }

    /* ---- 1. clona el valor del form ---- */
    const payload: any = { ...this.form.value };

    /* ---- 2. añade la propiedad que falta ---- */
    payload.items = items;

    // console.log(payload);   // <-- ya verás items aquí
    this.svc.create(payload).subscribe(() => this.router.navigate(['/dashboard/service-orders']));
  }

  get validItemsCount(): number {
    return this.rows.filter(r => r.partName.trim().length > 0).length;
  }

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

    this.customerService.create(newCustomer).subscribe(c => {
      this.customers = [c, ...this.customers];
      this.form.get('customerId')?.setValue(c._id);
      this.newCustomerForm.reset();
      this.customerModal.close();
    });
  }


}