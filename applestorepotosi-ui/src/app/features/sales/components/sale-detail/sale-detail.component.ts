import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SaleService } from '../../services/sale.service';
import { Sale } from '../../models/sale.model';
import { ProductPopulated, SaleItem } from '../../models/sale-item.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf],
  templateUrl: './sale-detail.component.html',
  styleUrls: ['./sale-detail.component.css']
})
export class SaleDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private saleService = inject(SaleService);
  private authService = inject(AuthService);

  sale: Sale | null = null;
  items: SaleItem[] = [];
  loading = true;
  error = '';

  canEdit = false;

  ngOnInit() {
    this.checkPermissions();
    this.loadSale();
  }

  private checkPermissions() {
    this.canEdit = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
  }

  private loadSale() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID de venta no válido';
      this.loading = false;
      return;
    }

    // Primero obtenemos la venta
    this.saleService.findOne(id).subscribe({
      next: (sale) => {
        this.sale = sale;
        // Luego los ítems
        this.loadItems(id);
        this.loading = false;
      },
      error: () => {
        this.error = 'Venta no encontrada';
        this.loading = false;
      }
    });
  }

  private loadItems(saleId: string) {
    this.saleService.findItemsBySale(saleId).subscribe({
      next: (items) => this.items = items,
      error: () => this.items = []
    });
  }

  onEdit() {
    if (!this.sale) return;
    this.router.navigate(['/dashboard', 'sales', 'edit', this.sale._id]);
  }

  onCancel() {
    if (!this.sale) return;
    const notes = prompt('Motivo de cancelación (opcional):');
    this.saleService.cancelSale(this.sale._id, notes || undefined).subscribe({
      next: () => this.loadSale(),
      error: () => alert('Error al cancelar la venta')
    });
  }

  getProduct(item: SaleItem): ProductPopulated | null {
    const prod = item.productId;
    return typeof prod === 'object' ? (prod as ProductPopulated) : null;
  }
}