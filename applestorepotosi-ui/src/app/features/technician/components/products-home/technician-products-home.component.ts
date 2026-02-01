import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TablaGenericaComponent } from '../../../../shared/components/tabla-generica/tabla-generica.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { StatsCardsComponent } from '../../../../shared/components/stats-cards/stats-cards.component';
import { ProductService } from '../../../products/services/product.service';
import { Product, ProductQuery } from '../../../products/models/product.model';
import { BadgeStyle, TablaOpciones, TableColumnSchema } from '../../../../shared/components/tabla-generica/tabla-column.model';

@Component({
  selector: 'app-technician-products-home',
  standalone: true,
  imports: [CommonModule,FormsModule,RouterModule,TablaGenericaComponent,SpinnerComponent],
  templateUrl: './technician-products-home.component.html'
})
export class TechnicianProductsHomeComponent implements OnInit {
  private service = inject(ProductService);
  private router = inject(Router);

  products: Product[] = [];
  loading = true;
//   statsCards: StatCard[] = [];

  /* tabla: solo lectura */
  columns: TableColumnSchema[] = [
    { key: 'imageUrl', type: 'avatar', label: 'Imagen' },
    { key: 'name', type: 'title', label: 'Producto' },
    { key: 'sku', type: 'text', label: 'SKU' },
    { key: 'salePrice', type: 'number', label: 'Precio' },
    { key: 'availableQuantity', type: 'number', label: 'Disponible' },
    { key: 'stockStatus', type: 'badge', label: 'Stock', badgeStyle: (v) => this.badgeStock(v) },
    { key: 'acciones', type: 'button', label: 'Ver', style: 'text-center',
      buttons: [{ id: 'ver', icon: 'ki-duotone ki-eye', colorClass: 'btn-light-primary', tooltip: 'Ver detalle' }]
    }
  ];

  tablaOpciones: TablaOpciones = {
    btnNuevo: false,
    buscador: true,
    botones: []
  };

  ngOnInit(): void {
    this.loadProducts();
    // this.loadStats();
  }

  private loadProducts(): void {
    this.loading = true;
    const query: ProductQuery = {
          page: 1,
          limit: 12,
          search: undefined,
          sortBy: 'name',
          sortOrder: 'asc'
        };
    // this.service.findAll({ isActive: true, page: 1, limit: 100 }).subscribe({
    this.service.findAll(query).subscribe({
      next: res => {
        this.products = res.products;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

//   private loadStats(): void {
//     this.service.getStats().subscribe(s => {
//       this.statsCards = [
//         { icon: 'bi bi-box', color: 'primary', label: 'Productos activos', value: s.active },
//         { icon: 'bi bi-exclamation-triangle', color: 'warning', label: 'Stock bajo', value: s.lowStock },
//         { icon: 'bi bi-bag-x', color: 'danger', label: 'Sin stock', value: s.outOfStock }
//       ];
//     });
//   }

  onTableAction(ev: { action: string; row: any }): void {
    if (ev.action === 'ver') this.router.navigate(['/dashboard/technician-products-detail', ev.row._id]);
  }

  /* helper badge */
  private badgeStock(status: string): BadgeStyle | null {
    switch (status) {
      case 'in-stock': return { color: 'success' };
      case 'low-stock': return { color: 'warning' };
      case 'out-of-stock': return { color: 'danger' };
      default: return null;
    }
  }
}