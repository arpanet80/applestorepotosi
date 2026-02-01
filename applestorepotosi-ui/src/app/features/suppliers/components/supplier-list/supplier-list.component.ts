
// src/app/suppliers/components/supplier-list/supplier-list.component.ts
import { Component, OnInit, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupplierService } from '../../services/supplier.service';
import { Supplier, SupplierQuery } from '../../models/supplier.model';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './supplier-list.component.html',
  styleUrls: ['./supplier-list.component.css'],
})
export class SupplierListComponent implements OnInit {
  private service = inject(SupplierService);

  filters = input<Partial<SupplierQuery>>({});
  showActions = input(true);

  supplierSelected = output<Supplier>();
  supplierEdit = output<Supplier>();
  supplierDelete = output<Supplier>();

  suppliers: Supplier[] = [];
  loading = false;
  error = '';

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.loading = true;
    this.error = '';
    const query = this.filters() as SupplierQuery;
    this.service.findAll(query).subscribe({
      next: (res) => {
        this.suppliers = res.suppliers;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar proveedores';
        this.loading = false;
      },
    });
  }

  onSelect(s: Supplier) {
    this.supplierSelected.emit(s);
  }

  onEdit(s: Supplier) {
    this.supplierEdit.emit(s);
  }

  onDelete(s: Supplier) {
    this.supplierDelete.emit(s);
  }
}