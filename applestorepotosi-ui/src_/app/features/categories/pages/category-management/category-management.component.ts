// src/app/categories/pages/category-management/category-management.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { CategoryService } from '../../services/categories.service';
import { Category } from '../../models/categories.model';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.css'],
})
export class CategoryManagementComponent implements OnInit, OnDestroy {
  private categoryService = inject(CategoryService);
  private router = inject(Router);

  categories: Category[] = [];
  loading = true;
  searchControl = new FormControl<string>('');

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.setupSearch();
    this.loadCategories();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.loadCategories());
  }

  loadCategories() {
    this.loading = true;
    const search = this.searchControl.value?.trim() || undefined;
    this.categoryService.findAll({ search }).subscribe({
      next: (res) => {
        this.categories = res.categories;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  clearSearch() {
    this.searchControl.setValue('');
  }

  onEdit(category: Category) {
    this.router.navigate(['/dashboard', 'categories', 'edit', category._id]);
  }

  onView(category: Category) {
    this.router.navigate(['/dashboard', 'categories', 'detail', category._id]);
  }

  onDelete(category: Category) {
    if (!confirm(`¿Eliminar categoría "${category.name}"?`)) return;
    this.categoryService.delete(category._id).subscribe(() => this.loadCategories());
  }

  onCreate() {
    this.router.navigate(['/dashboard', 'categories', 'create']);
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