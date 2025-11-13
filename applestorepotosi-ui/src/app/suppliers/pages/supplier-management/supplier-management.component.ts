// src/app/suppliers/pages/supplier-management/supplier-management.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupplierService } from '../../services/supplier.service';
import { Supplier, SupplierQuery } from '../../models/supplier.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-supplier-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './supplier-management.component.html',
  styleUrls: ['./supplier-management.component.css'],
})
export class SupplierManagementComponent implements OnInit {
  private supplierService = inject(SupplierService);
  private router = inject(Router);

  suppliers: Supplier[] = [];
  loading = true;

  // Paginación
  page = 1;
  pageSize = 10;
  total = 0;

  // Filtros
  searchTerm = '';
  isActiveFilter: boolean | null = null;

  ngOnInit() {
    this.loadPage();
  }

  loadPage() {
    this.loading = true;
    const query: SupplierQuery = {
      search: this.searchTerm || undefined,
      isActive: this.isActiveFilter ?? undefined,
      page: this.page,
      limit: this.pageSize,
    };

    this.supplierService.findAll(query).subscribe({
      next: (res) => {
        this.suppliers = res.suppliers;
        this.total = res.total;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onEdit(s: Supplier) {
    this.router.navigate(['/dashboard', 'suppliers', 'edit', s._id]);
  }

  onDelete(s: Supplier) {
    if (!confirm(`¿Eliminar proveedor "${s.name}"?`)) return;
    this.supplierService.delete(s._id).subscribe(() => this.loadPage());
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.loadPage();
  }

  onSearch() {
    this.page = 1;
    this.loadPage();
  }

  onFilterChange() {
    this.page = 1;
    this.loadPage();
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}