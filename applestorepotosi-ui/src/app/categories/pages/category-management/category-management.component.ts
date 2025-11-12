// src/app/categories/pages/category-management/category-management.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CategoryService } from '../../services/categories.service';
import { Category } from '../../models/categories.model';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.css'],
})
export class CategoryManagementComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private router = inject(Router);

  categories: Category[] = [];
  loading = true;

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.categoryService.findAll({}).subscribe({
      next: (res) => {
        this.categories = res.categories;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onEdit(category: Category) {
    this.router.navigate(['/dashboard', 'categories', 'edit', category._id]);
  }

  onDelete(category: Category) {
    if (!confirm(`¿Eliminar categoría "${category.name}"?`)) return;
    this.categoryService.delete(category._id).subscribe(() => this.loadCategories());
  }

  onCreate() {
    this.router.navigate(['/dashboard', 'categories', 'create']);
  }
}