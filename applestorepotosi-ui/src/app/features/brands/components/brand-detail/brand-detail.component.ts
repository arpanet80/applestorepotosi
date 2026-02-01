import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { BrandService } from '../../services/brand.service';
import { Brand } from '../../models/brand.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';

@Component({
  selector: 'app-brand-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './brand-detail.component.html',
  styleUrls: ['./brand-detail.component.css']
})
export class BrandDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private brandService = inject(BrandService);
  private authService = inject(AuthService);

  brand: Brand | null = null;
  loading = true;
  error = '';
  canEdit = false;

  ngOnInit(): void {
    this.canEdit = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
    this.loadBrand();
  }

  private loadBrand(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID de marca no válido';
      this.loading = false;
      return;
    }

    this.brandService.findOne(id).subscribe({
      next: (data) => {
        this.brand = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Marca no encontrada';
        this.loading = false;
      }
    });
  }

  onEdit(): void {
    if (!this.brand) return;
    this.router.navigate([ '/dashboard', 'brands', 'edit', this.brand._id]);
  }

  onToggleActive(): void {
    if (!this.brand) return;
    this.brandService.toggleActive(this.brand._id).subscribe({
      next: (updated) => (this.brand = updated)
    });
  }

  // onDelete(): void {
  //   if (!this.brand) return;
  //   if (confirm(`¿Eliminar marca "${this.brand.name}"?`)) {
  //     this.brandService.delete(this.brand._id).subscribe({
  //       next: () => this.router.navigate(['/brands']),
  //       error: () => alert('Error al eliminar la marca')
  //     });
  //   }
  // }

  onBack(): void {
    if (!this.brand) return;
    this.router.navigate([ '/dashboard', 'brands']);
  }
}