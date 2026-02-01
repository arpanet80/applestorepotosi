import { Component, OnInit, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SaleService } from '../../services/sale.service';
import { Sale, SaleQuery } from '../../models/sale.model';

@Component({
  selector: 'app-sale-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sale-list.component.html',
  styleUrls: ['./sale-list.component.css']
})
export class SaleListComponent implements OnInit {
  private saleService = inject(SaleService);

  filters = input<Partial<SaleQuery>>({});
  showActions = input(true);

  saleSelected = output<Sale>();
  saleEdit = output<Sale>();
  saleDelete = output<Sale>();

  sales: Sale[] = [];
  loading = false;
  error = '';

  ngOnInit() {
    this.loadSales();
  }

  loadSales() {
    this.loading = true;
    this.error = '';
    const query = this.filters() as SaleQuery;
    this.saleService.findAll(query).subscribe({
      next: res => {
        this.sales = res.sales;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar ventas';
        this.loading = false;
      }
    });
  }

  onSelectSale(sale: Sale) {
    this.saleSelected.emit(sale);
  }

  onEditSale(sale: Sale) {
    this.saleEdit.emit(sale);
  }

  onDeleteSale(sale: Sale) {
    if (confirm(`¿Eliminar venta ${sale.saleNumber}?`)) {
      this.saleDelete.emit(sale);
    }
  }
}