// src/app/customers/components/customer-detail/customer-detail.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user-select.model';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.css'],
})
export class CustomerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerService = inject(CustomerService);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  customer: Customer | null = null;
  loading = true;
  error = '';
  canEdit = false;

  // Usuario asociado
  user: User | null = null;
  userLoading = false;

  ngOnInit() {
    this.canEdit = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
    this.loadCustomer();
  }

  loadCustomer() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID inválido';
      this.loading = false;
      return;
    }

    this.customerService.findOne(id).subscribe({
      next: (c) => {
        this.customer = c;
        this.loading = false;
        if (c.userId) this.loadUser(c.userId);
      },
      error: () => {
        this.error = 'Cliente no encontrado';
        this.loading = false;
      },
    });
  }

  loadUser(userId: string) {
    this.userLoading = true;
    this.userService.searchUsers(userId, 1).subscribe({
      next: (list) => {
        this.user = list[0] || null;
        this.userLoading = false;
      },
      error: () => (this.userLoading = false),
    });
  }

  onEdit() {
    if (!this.customer) return;
    this.router.navigate(['/dashboard', 'customers', 'edit', this.customer._id]);
  }

  onVolver() {
    this.router.navigate(['/dashboard', 'customers']);
  }

  onDelete() {
    if (!this.customer) return;
    if (!confirm(`¿Eliminar cliente "${this.customer.fullName}"?`)) return;
    this.customerService.delete(this.customer._id).subscribe({
      next: () => this.router.navigate(['/dashboard', 'customers']),
      error: () => alert('Error al eliminar'),
    });
  }

  onToggleActive() {
    if (!this.customer) return;
    this.customerService.toggleActive(this.customer._id).subscribe({
      next: (updated) => {
        this.customer = updated;
      },
    });
  }

  onAssignUser() {
    // Redirige al formulario en modo edición y abre el selector
    this.router.navigate(['/dashboard', 'customers', 'edit', this.customer!._id], {
      queryParams: { focusUser: true },
    });
  }

  onRemoveUser() {
    if (!this.customer || !confirm('¿Quitar usuario asociado?')) return;
    this.customerService.update(this.customer._id, { userId: undefined }).subscribe({
        next: (updated) => {
            this.customer = updated;
            this.user = null;
        },
    });
  }
}