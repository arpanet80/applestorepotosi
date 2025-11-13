// src/app/customers/pages/customer-management/customer-management.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-customer-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './customer-management.component.html',
  styleUrls: ['./customer-management.component.css'],
})
export class CustomerManagementComponent implements OnInit {
  private customerService = inject(CustomerService);
  private router = inject(Router);

  customers: Customer[] = [];
  loading = true;

  // Paginación local
  page = 1;
  pageSize = 10;
  total = 0;

  ngOnInit() {
    this.loadPage();
  }

  loadPage() {
    this.loading = true;
    this.customerService.findAll({ page: this.page, limit: this.pageSize }).subscribe({
      next: (res) => {
        this.customers = res.customers;
        this.total = res.total;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onEdit(c: Customer) {
    this.router.navigate(['/dashboard', 'customers', 'edit', c._id]);
  }

  onDelete(c: Customer) {
    if (!confirm(`¿Eliminar cliente "${c.fullName}"?`)) return;
    this.customerService.delete(c._id).subscribe(() => this.loadPage());
  }

  onCreate() {
    this.router.navigate(['/dashboard', 'customers', 'create']);
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.loadPage();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
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