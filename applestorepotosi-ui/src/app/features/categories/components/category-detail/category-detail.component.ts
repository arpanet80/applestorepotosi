// src/app/categories/components/category-detail/category-detail.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CategoryService } from '../../services/categories.service';
import { Category } from '../../models/categories.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './category-detail.component.html',
  styleUrls: ['./category-detail.component.css'],
})
export class CategoryDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);

  category: Category | null = null;
  loading = true;
  error = '';
  canEdit = false;

  ngOnInit() {
    this.checkPermissions();
    this.loadCategory();
  }

  checkPermissions() {
    this.canEdit = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
  }

  loadCategory() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID inválido';
      this.loading = false;
      return;
    }

    this.categoryService.findOne(id).subscribe({
      next: (cat) => {
        this.category = cat;
        this.loading = false;
      },
      error: () => {
        this.error = 'Categoría no encontrada';
        this.loading = false;
      },
    });
  }

  onEdit() {
    if (!this.category) return;
    this.router.navigate(['/dashboard', 'categories', 'edit', this.category._id]);
  }

  onView() {
    this.router.navigate(['/dashboard', 'categories']);
  }

  onDelete() {
    if (!this.category) return;
    if (!confirm(`¿Eliminar categoría "${this.category.name}"?`)) return;

    this.categoryService.delete(this.category._id).subscribe({
      next: () => this.router.navigate(['/dashboard', 'categories']),
      error: () => alert('Error al eliminar'),
    });
  }

  onToggleActive() {
    if (!this.category) return;
    this.categoryService.toggleActive(this.category._id).subscribe({
      next: (updated) => {
        this.category = updated;
      },
    });
  }
}