import { NgIf } from '@angular/common';
// src/app/purchase-orders/components/purchase-order-detail/purchase-order-detail.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { PurchaseOrder } from '../../models/purchase-order.model';
import { AuthService } from '../../../auth/services/auth.service';
import { UserRole } from '../../../auth/models/user.model';

@Component({
  selector: 'app-purchase-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf],
  templateUrl: './purchase-order-detail.component.html',
  styleUrls: ['./purchase-order-detail.component.css'],
})
export class PurchaseOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private purchaseOrderService = inject(PurchaseOrderService);
  private authService = inject(AuthService);

  order: PurchaseOrder | null = null;
  loading = true;
  error = '';
  canEdit = false;

  ngOnInit() {
    this.canEdit = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
    this.loadOrder();
  }

  loadOrder() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID inválido';
      this.loading = false;
      return;
    }

    this.purchaseOrderService.findOne(id).subscribe({
      next: (o) => {
        this.order = o;
        this.loading = false;
      },
      error: () => {
        this.error = 'Orden no encontrada';
        this.loading = false;
      },
    });
  }

  onEdit() {
    if (!this.order) return;
    this.router.navigate(['/dashboard', 'purchase-orders', 'edit', this.order._id]);
  }

  onDelete() {
    if (!this.order) return;
    if (!confirm(`¿Eliminar orden "${this.order._id}"?`)) return;
    this.purchaseOrderService.delete(this.order._id).subscribe({
      next: () => this.router.navigate(['/dashboard', 'purchase-orders']),
      error: () => alert('Error al eliminar'),
    });
  }

  onApprove() {
    if (!this.order) return;
    const reason = prompt('Motivo (opcional):');
    this.purchaseOrderService.approveOrder(this.order._id, reason || undefined).subscribe({
      next: () => this.loadOrder(),
    });
  }

  onReject() {
    if (!this.order) return;
    const reason = prompt('Motivo (opcional):');
    this.purchaseOrderService.rejectOrder(this.order._id, reason || undefined).subscribe({
      next: () => this.loadOrder(),
    });
  }

  onComplete() {
    if (!this.order) return;
    this.purchaseOrderService.completeOrder(this.order._id).subscribe({
      next: () => this.loadOrder(),
    });
  }

  onCancel() {
    if (!this.order) return;
    const reason = prompt('Motivo (opcional):');
    this.purchaseOrderService.cancelOrder(this.order._id, reason || undefined).subscribe({
      next: () => this.loadOrder(),
    });
  }
}