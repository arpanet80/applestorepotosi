// src/app/purchase-orders/components/purchase-order-list/purchase-order-list.component.ts
import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { PurchaseOrder, PurchaseOrderQuery } from '../../models/purchase-order.model';

@Component({
  selector: 'app-purchase-order-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-order-list.component.html',
  styleUrls: ['./purchase-order-list.component.css'],
})
export class PurchaseOrderListComponent implements OnInit, OnChanges {
  private service = inject(PurchaseOrderService);
  private destroy$ = new Subject<void>();

  filters = input<Partial<PurchaseOrderQuery>>({});
  showActions = input(true);

  orderSelected = output<PurchaseOrder>();
  orderEdit = output<PurchaseOrder>();
  orderDelete = output<PurchaseOrder>();
  orderCreateNew = output<void>();


  orders: PurchaseOrder[] = [];
  loading = false;
  error = '';

  ngOnInit() {
    this.loadOrders();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filters'] && !changes['filters'].firstChange) {
      this.loadOrders();
    }
  }

  loadOrders() {
    this.loading = true;
    this.error = '';
    const query = this.filters() as PurchaseOrderQuery;
    this.service
      .findAll(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.orders = res.purchaseOrders;
          this.loading = false;
        },
        error: (err) => {
          this.error =
            err?.error?.message || 'Error al cargar órdenes de compra';
          this.loading = false;
        },
      });
  }

  trackByOrderId(index: number, order: PurchaseOrder): string {
    return order._id;
  }

  onSelect(order: PurchaseOrder) {
    this.orderSelected.emit(order);
  }

  onEdit(order: PurchaseOrder) {
    this.orderEdit.emit(order);
  }

  onDelete(order: PurchaseOrder) {
    Swal.fire({
      title: '¿Eliminar orden de compra?',
      text: `Orden #${order.orderNumber || order._id} será eliminada permanentemente`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#95a5a6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.orderDelete.emit(order);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCreateNew() {
    this.orderCreateNew.emit();
  }

}