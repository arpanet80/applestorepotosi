// src/app/categories/components/category-form/category-form.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CategoryService } from '../../services/categories.service';
import { Category } from '../../models/categories.model';
import { AuthService } from '../../../auth/services/auth.service';
import { UserRole } from '../../../auth/models/user.model';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.css'],
})
export class CategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);

  form!: FormGroup;
  isEditMode = false;
  categoryId?: string;
  submitting = false;
  error = '';

  ngOnInit() {
    this.initForm();
    this.checkEditMode();
  }

  initForm() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      slug: ['', Validators.required],
      parentId: [null],
      imageUrl: [''],
      isActive: [true],
    });
  }

  checkEditMode() {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.categoryId = params['id'];
        this.loadCategory();
      }
    });
  }

  loadCategory() {
    if (!this.categoryId) return;
    this.categoryService.findOne(this.categoryId).subscribe({
      next: (cat) => this.form.patchValue(cat),
      error: () => (this.error = 'Error al cargar la categoría'),
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.submitting = true;
    const payload = this.form.value;

    const op = this.isEditMode
      ? this.categoryService.update(this.categoryId!, payload)
      : this.categoryService.create(payload);

    op.subscribe({
      next: () => this.router.navigate(['/dashboard', 'categories']),
      error: () => {
        this.error = this.isEditMode
          ? 'Error al actualizar'
          : 'Error al crear';
        this.submitting = false;
      },
    });
  }

  onCancel() {
    this.router.navigate(['/dashboard', 'categories']);
  }
}