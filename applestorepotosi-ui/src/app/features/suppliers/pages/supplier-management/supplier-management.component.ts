// src/app/suppliers/pages/supplier-management/supplier-management.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupplierService } from '../../services/supplier.service';
import { Supplier, SupplierQuery } from '../../models/supplier.model';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { ToastrAlertService } from '../../../../shared/services/toastr-alert.service';

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
  private authService = inject(AuthService);
  public  sweetAlertService = inject(SweetAlertService);
  public  toastrAlertService = inject(ToastrAlertService);

  suppliers: Supplier[] = [];
  loading = true;

  // Paginación
  page = 1;
  pageSize = 10;
  total = 0;

  // Filtros
  searchTerm = '';
  isActiveFilter: boolean | null = null;

  canManage = false;

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

  onDetail(s: Supplier) {
    this.router.navigate(['/dashboard', 'suppliers', 'detail', s._id]);
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

  onExport() {
    alert('Funcionalidad de exportar no implementada aún.');
  }

  onRefresh() {
    this.loadPage();
  }

  checkPermissions(): void {
      const user = this.authService.getCurrentUser();
      if (!user) return;
      this.canManage = this.authService.hasAnyRole([UserRole.ADMIN]);
  }

  onToggleStatus(supplier: Supplier): void {
    if (!supplier) return;
    const action = supplier.isActive ? 'desactivar' : 'activar';

    this.sweetAlertService
      .confirm(
        `¿Está seguro de <b>${action}</b> el producto <b>${supplier.name}</b>?`,
        `Confirmar ${action}`,
        'Sí, ' + action,
        'Cancelar',
        true
      )
      .then(res => {
        if (!res.isConfirmed) return;
        this.sweetAlertService.loading('Procesando...');

        const obs = supplier.isActive
          ? this.supplierService.deactivate(supplier._id)
          : this.supplierService.activate(supplier._id);

        obs.subscribe({
          next: () => {
            this.sweetAlertService.close();
            this.toastrAlertService.success(
              `Producto ${supplier.name} ${action}do correctamente`,
              'Operación completada'
            );
            this.loadPage();
          },
          error: () => {
            this.sweetAlertService.close();
            this.toastrAlertService.error(
              `No se pudo ${action} al usuario ${supplier.name}`,
              'Error'
            );
          }
        });
      });
  }

}