import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { SupplierService } from '../../services/supplier.service';
import { SupplierListComponent } from '../../components/supplier-list/supplier-list.component';
import { Supplier, SupplierQuery } from '../../models/supplier.model';
import { AuthService } from '../../../auth/services/auth.service';
import { UserRole } from '../../../auth/models/user.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-supplier-page',
  standalone: true,
  imports: [CommonModule, RouterModule, SupplierListComponent, FormsModule],
  templateUrl: './supplier-page.component.html',
  styleUrls: ['./supplier-page.component.css']
})
export class SupplierPageComponent implements OnInit, OnDestroy {
  private supplierService = inject(SupplierService);
  private authService = inject(AuthService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  suppliers: Supplier[] = [];
  loading = true;
  error = '';

  searchTerm = '';
  countryFilter: string | null = null;
  activeFilter: boolean | null = null;

  canCreate = false;
  canManage = false;

  countries: string[] = [];

  ngOnInit() {
    this.checkPermissions();
    this.loadSuppliers();
    this.loadCountries();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkPermissions() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.canCreate = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
    this.canManage = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
  }

  loadSuppliers() {
    this.loading = true;
    this.error = '';

    const query: SupplierQuery = {
      search: this.searchTerm || undefined,
      country: this.countryFilter || undefined,
      isActive: this.activeFilter ?? undefined,
      page: 1,
      limit: 50
    };

    this.supplierService.findAll(query).subscribe({
      next: res => {
        this.suppliers = res.suppliers;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar proveedores';
        this.loading = false;
      }
    });
  }

  loadCountries() {
    this.supplierService.getUniqueCountries().subscribe({
      next: countries => this.countries = countries,
      error: () => this.countries = []
    });
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.loadSuppliers();
  }

  onFilterChange() {
    this.loadSuppliers();
  }

  onSelectSupplier(supplier: Supplier) {
    this.router.navigate(['/dashboard', 'suppliers', 'detail', supplier._id]);
  }

  onEditSupplier(supplier: Supplier) {
    this.router.navigate(['/dashboard', 'suppliers', 'edit', supplier._id]);
  }

  onDeleteSupplier(supplier: Supplier) {
    if (!confirm(`¿Eliminar proveedor "${supplier.name}"?`)) return;
    this.supplierService.delete(supplier._id).subscribe(() => this.loadSuppliers());
  }

  onCreateSupplier() {
    this.router.navigate(['/dashboard', 'suppliers', 'create']);
  }

  onManageSuppliers() {
    this.router.navigate(['/dashboard', 'suppliers', 'management']);
  }

  onRefresh() {
    this.loadSuppliers();
  }
  getSupplierFilters(): Partial<SupplierQuery> {
  return {
    search: this.searchTerm || undefined,
    country: this.countryFilter ?? undefined,
    isActive: this.activeFilter ?? undefined
  };
}
}