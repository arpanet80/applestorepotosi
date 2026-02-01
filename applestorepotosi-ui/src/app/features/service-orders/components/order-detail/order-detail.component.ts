// src/app/features/service-orders/components/order-detail/order-detail.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServiceOrdersService } from '../../services/service-orders.service';
import { ServiceOrder, ServiceItem, ServiceOrderStatus } from '../../models/service-order.model';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './order-detail.component.html',
})
export class OrderDetailComponent implements OnInit {

    private route = inject(ActivatedRoute);
    private router = inject( Router);
    private svc = inject(ServiceOrdersService);
    private fb = inject(FormBuilder);

  order!: ServiceOrder;
  statuses: ServiceOrderStatus[] = [
    'ingresado',
    'diagnosticado',
    'aprobado',
    'reparado',
    'entregado',
    'finalizado',
    'cancelado',
  ];
  

  statusForm: FormGroup = this.fb.group({
    status: ['', Validators.required],
    notes: [''],
  });

  itemForm: FormGroup = this.fb.group({
    partName: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    unitCost: [0, Validators.required],
    unitPrice: [0, Validators.required],
    notes: [''],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadOrder(id);
  }

  loadOrder(id: string) {
    this.svc.getOne(id).subscribe((o) => {
      this.order = o;
      this.statusForm.patchValue({ status: o.status });
    });
  }

  updateStatus() {
    if (this.statusForm.invalid) return;
    const { status, notes } = this.statusForm.value;
    this.svc.changeStatus(this.order._id!, status, notes).subscribe((updated) => {
      this.order = updated;
      this.statusForm.reset({ status: updated.status, notes: '' });
    });
  }

  addItem() {
    if (this.itemForm.invalid) return;
    const item: ServiceItem = this.itemForm.value;
    this.svc.addItem(this.order._id!, item).subscribe((updated) => {
      this.order = updated;
      this.itemForm.reset({
        partName: '',
        quantity: 1,
        unitCost: 0,
        unitPrice: 0,
        notes: '',
      });
    });
  }

  getTotalItems() {
    return this.order.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  }

  getCustomerName() {
    return (this.order.customerId as any)?.fullName || '—';
  }

  getTechnicianName() {
    return (this.order.technicianId as any)?.displayName || '—';
  }

  mapColor(status: ServiceOrderStatus): string {
    const map: Record<ServiceOrderStatus, string> = {
        ingresado: 'warning',
        diagnosticado: 'info',
        aprobado: 'primary',
        reparado: 'success',
        entregado: 'secondary',
        finalizado: 'dark',
        cancelado: 'danger',
    };
    return map[status] || 'secondary';
}

get safeStatus(): ServiceOrderStatus {
  return this.order?.status || 'ingresado';
}

}