import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SaleService } from '../../services/sale.service';
import { Sale } from '../../models/sale.model';

@Component({
  selector: 'app-sale-management',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sale-management.component.html',
  styleUrls: ['./sale-management.component.css']
})
export class SaleManagementComponent implements OnInit {
  private saleService = inject(SaleService);
  private router = inject(Router);

  sales: Sale[] = [];
  loading = true;

  ngOnInit() {
    this.loadSales();
  }

  loadSales() {
    this.loading = true;
    this.saleService.findAll({}).subscribe({
      next: res => {
        this.sales = res.sales;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  onEdit(sale: Sale) {
    this.router.navigate(['/dashboard', 'sales', 'edit', sale._id]);
  }

  onDelete(sale: Sale) {
    if (!confirm(`¿Eliminar venta ${sale.saleNumber}?`)) return;
    this.saleService.delete(sale._id).subscribe(() => this.loadSales());
  }

  onCreate() {
    this.router.navigate(['/dashboard', 'sales', 'create']);
  }
}