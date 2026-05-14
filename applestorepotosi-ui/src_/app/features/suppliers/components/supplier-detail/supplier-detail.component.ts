// src/app/suppliers/components/supplier-detail/supplier-detail.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupplierService } from '../../services/supplier.service';
import { Supplier } from '../../models/supplier.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './supplier-detail.component.html',
  styleUrls: ['./supplier-detail.component.css'],
})
export class SupplierDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supplierService = inject(SupplierService);
  private authService = inject(AuthService);

  supplier: Supplier | null = null;
  loading = true;
  error = '';
  canEdit = false;

  ngOnInit() {
    this.canEdit = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
    this.loadSupplier();
  }

  loadSupplier() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID inválido';
      this.loading = false;
      return;
    }

    this.supplierService.findOne(id).subscribe({
      next: (s) => {
        this.supplier = s;
        this.loading = false;
      },
      error: () => {
        this.error = 'Proveedor no encontrado';
        this.loading = false;
      },
    });
  }

  onEdit() {
    if (!this.supplier) return;
    this.router.navigate(['/dashboard', 'suppliers', 'edit', this.supplier._id]);
  }

  // onDelete() {
  //   if (!this.supplier) return;
  //   if (!confirm(`¿Eliminar proveedor "${this.supplier.name}"?`)) return;
  //   this.supplierService.delete(this.supplier._id).subscribe({
  //     next: () => this.router.navigate(['/dashboard', 'suppliers']),
  //     error: () => alert('Error al eliminar'),
  //   });
  // }

  onToggleActive() {
    if (!this.supplier) return;
    this.supplierService.toggleActive(this.supplier._id).subscribe({
      next: (updated) => {
        this.supplier = updated;
      },
    });
  }

  onVolver() {
    this.router.navigate(['/dashboard', 'suppliers']);
  }
}