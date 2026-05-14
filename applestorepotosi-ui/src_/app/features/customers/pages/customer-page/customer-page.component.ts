// src/app/customers/pages/customer-page/customer-page.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { CustomerService } from '../../services/customer.service';
import { CustomerListComponent } from '../../components/customer-list/customer-list.component';
import { Customer, CustomerStats, CustomerQuery } from '../../models/customer.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';

@Component({
  selector: 'app-customer-page',
  standalone: true,
  imports: [CommonModule, RouterModule, CustomerListComponent],
  templateUrl: './customer-page.component.html',
  styleUrls: ['./customer-page.component.css'],
})
export class CustomerPageComponent implements OnInit, OnDestroy {
  private customerService = inject(CustomerService);
  private authService = inject(AuthService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  customers: Customer[] = [];
  stats: CustomerStats | null = null;
  loading = true;
  error = '';

  searchTerm = '';
  activeFilter: 'all' | 'active' | 'inactive' = 'all';

  canCreate = false;
  canManage = false;

  ngOnInit() {
    this.checkPermissions();
    this.loadCustomers();
    this.loadStats();
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

  public loadCustomers() {
    this.loading = true;
    this.error = '';
    const query: CustomerQuery = {
      search: this.searchTerm || undefined,
      isActive: this.activeFilter === 'all' ? undefined : this.activeFilter === 'active',
    };
    this.customerService.findAll(query).subscribe({
      next: (res) => {
        this.customers = res.customers;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar clientes';
        this.loading = false;
      },
    });
  }

  private loadStats() {
    this.customerService.getStats().subscribe({
      next: (s) => (this.stats = s),
      error: () => {},
    });
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.loadCustomers();
  }

  onFilterChange(filter: 'all' | 'active' | 'inactive') {
    this.activeFilter = filter;
    this.loadCustomers();
  }

  onSelectCustomer(c: Customer) {
    this.router.navigate(['/dashboard', 'customers', 'detail', c._id]);
  }

  onEditCustomer(c: Customer) {
    this.router.navigate(['/dashboard', 'customers', 'edit', c._id]);
  }

  onDeleteCustomer(c: Customer) {
    if (!confirm(`¿Eliminar cliente "${c.fullName}"?`)) return;
    this.customerService.delete(c._id).subscribe({
      next: () => {
        this.loadCustomers();
        this.loadStats();
      },
    });
  }

  onCreateCustomer() {
    this.router.navigate(['/dashboard', 'customers', 'create']);
  }

  onManageCustomers() {
    this.router.navigate(['/dashboard', 'customers', 'management']);
  }

  onRefresh() {
    this.loadCustomers();
    this.loadStats();
  }

  getFilterClass(filter: string): string {
    return this.activeFilter === filter ? 'btn-filter active' : 'btn-filter';
  }
}