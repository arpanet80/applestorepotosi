import { NgIf } from '@angular/common';
// src/app/categories/components/category-list/category-list.component.ts
import { Component, OnInit, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CategoryService } from '../../services/categories.service';
import { Category, CategoryQuery } from '../../models/categories.model';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css'],
})
export class CategoryListComponent implements OnInit {
  private categoryService = inject(CategoryService);

  filters = input<Partial<CategoryQuery>>({});
  showActions = input(true);

  categorySelected = output<Category>();
  categoryEdit = output<Category>();
  categoryDelete = output<Category>();

  categories: Category[] = [];
  loading = false;
  error = '';

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.error = '';
    const query = this.filters() as CategoryQuery;
    this.categoryService.findAll(query).subscribe({
      next: (res) => {
        this.categories = res.categories;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar categorías';
        this.loading = false;
      },
    });
  }

  onSelectCategory(category: Category) {
    this.categorySelected.emit(category);
  }

  onEditCategory(category: Category) {
    this.categoryEdit.emit(category);
  }

  onDeleteCategory(category: Category) {
    if (confirm(`¿Eliminar categoría "${category.name}"?`)) {
      this.categoryDelete.emit(category);
    }
  }

  toggleActive(category: Category) {
    this.categoryService.toggleActive(category._id).subscribe({
      next: (updated) => {
        const idx = this.categories.findIndex((c) => c._id === updated._id);
        if (idx !== -1) this.categories[idx] = updated;
      },
    });
  }
}