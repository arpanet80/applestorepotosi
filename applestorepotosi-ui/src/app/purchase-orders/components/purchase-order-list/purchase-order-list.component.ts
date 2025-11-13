// src/app/purchase-orders/components/purchase-order-list/purchase-order-list.component.ts
import { Component, OnInit, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { PurchaseOrder, PurchaseOrderQuery } from '../../models/purchase-order.model';

@Component({
  selector: 'app-purchase-order-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-order-list.component.html',
  styleUrls: ['./purchase-order-list.component.css'],
})
export class PurchaseOrderListComponent implements OnInit {
  private service = inject(PurchaseOrderService);

  filters = input<Partial<PurchaseOrderQuery>>({});
  showActions = input(true);

  orderSelected = output<PurchaseOrder>();
  orderEdit = output<PurchaseOrder>();
  orderDelete = output<PurchaseOrder>();

  orders: PurchaseOrder[] = [];
  loading = false;
  error = '';

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.error = '';
    const query = this.filters() as PurchaseOrderQuery;
    this.service.findAll(query).subscribe({
      next: (res) => {
        this.orders = res.purchaseOrders;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar órdenes';
        this.loading = false;
      },
    });
  }

  onSelect(order: PurchaseOrder) {
    this.orderSelected.emit(order);
  }

  onEdit(order: PurchaseOrder) {
    this.orderEdit.emit(order);
  }

  onDelete(order: PurchaseOrder) {
    this.orderDelete.emit(order);
  }
}