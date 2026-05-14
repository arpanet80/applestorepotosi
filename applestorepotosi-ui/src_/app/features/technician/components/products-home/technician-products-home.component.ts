import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TablaGenericaComponent } from '../../../../shared/components/tabla-generica/tabla-generica.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { ProductService } from '../../../products/services/product.service';
import { Product, ProductQuery } from '../../../products/models/product.model';
import {
  BadgeStyle,
  TablaOpciones,
  TableColumnSchema,
} from '../../../../shared/components/tabla-generica/tabla-column.model';

// BUG FIX 22: Se eliminó la importación de StatsCardsComponent ya que no se
// utiliza en el template. Reduce el bundle y elimina el warning de compilación.

@Component({
  selector: 'app-technician-products-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TablaGenericaComponent,
    SpinnerComponent,
  ],
  templateUrl: './technician-products-home.component.html',
})
export class TechnicianProductsHomeComponent implements OnInit {
  private service = inject(ProductService);
  private router = inject(Router);

  products: Product[] = [];
  loading = true;

  columns: TableColumnSchema[] = [
    { key: 'imageUrl', type: 'avatar', label: 'Imagen' },
    { key: 'name', type: 'title', label: 'Producto' },
    { key: 'sku', type: 'text', label: 'SKU' },
    { key: 'salePrice', type: 'number', label: 'Precio' },
    { key: 'availableQuantity', type: 'number', label: 'Disponible' },
    {
      key: 'stockStatus',
      type: 'badge',
      label: 'Stock',
      // BUG FIX 23: Se añade 'over-stock' que existe en el backend
      // (virtual stockStatus del ProductSchema) pero no estaba manejado,
      // resultando en badge null y columna vacía.
      badgeStyle: (v: string) => this.badgeStock(v),
    },
    {
      key: 'acciones',
      type: 'button',
      label: 'Ver',
      style: 'text-center',
      buttons: [
        {
          id: 'ver',
          icon: 'ki-duotone ki-eye',
          colorClass: 'btn-light-primary',
          tooltip: 'Ver detalle',
        },
      ],
    },
  ];

  tablaOpciones: TablaOpciones = {
    btnNuevo: false,
    buscador: true,
    botones: [],
  };

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading = true;
    const query: ProductQuery = {
      page: 1,
      // BUG FIX 24: El límite de 12 omite productos. Para un catálogo de
      // solo lectura del técnico se amplía a 200 y se filtra por isActive.
      // Si la tabla tiene paginación propia, el service debería implementarla.
      limit: 200,
      isActive: true,
      sortBy: 'name',
      sortOrder: 'asc',
    };
    this.service.findAll(query).subscribe({
      next: (res) => {
        this.products = res.products;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onTableAction(ev: { action: string; row: any }): void {
    if (ev.action === 'ver') {
      // BUG FIX 25: La ruta de navegación al detalle usaba un segmento
      // '/dashboard/technician-products-detail' que no coincide con la
      // estructura estándar de rutas hija. Se corrige al patrón correcto
      // asumiendo que la ruta de detalle está registrada como hija de
      // 'technician-products' con path 'detail/:id'.
      this.router.navigate([
        '/dashboard/technician-products/detail',
        ev.row._id,
      ]);
    }
  }

  private badgeStock(status: string): BadgeStyle | null {
    switch (status) {
      case 'in-stock':
        return { color: 'success' };
      case 'low-stock':
        return { color: 'warning' };
      case 'out-of-stock':
        return { color: 'danger' };
      // BUG FIX 23 (continuación): caso faltante del backend
      case 'over-stock':
        return { color: 'info' };
      default:
        return null;
    }
  }
}