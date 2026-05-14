// src/app/category-characteristics/components/characteristic-form/characteristic-form.component.ts
import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder,FormGroup,ReactiveFormsModule,Validators,} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryCharacteristicService } from '../../services/category-characteristic.service';
import { CategoryCharacteristic } from '../../models/category-characteristic.model';
import { CategoryService } from '../../../categories/services/categories.service';
import { Select2Directive } from '../../../../shared/directives/select2.directive';

@Component({
  selector: 'app-characteristic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Select2Directive],
  templateUrl: './characteristic-form.component.html',
  styleUrls: ['./characteristic-form.component.css'],
})
export class CategoryCharacteristicFormComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private service = inject(CategoryCharacteristicService);
  private categoryService = inject(CategoryService);

  form!: FormGroup;
  isEditMode = false;
  characteristicId?: string;
  submitting = false;
  error = '';

  categories: { _id: string; name: string }[] = [];

  ngOnInit() {
    this.initForm();
    this.checkEditMode();
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    // espera a que select2 esté montado
    setTimeout(() => {
      ($('select[formControlName="categoryId"]') as any).on('change', (e: any) => {
        const val = e.target.value || null;
        this.form.get('categoryId')?.setValue(val);
        this.form.get('categoryId')?.markAsTouched();
      });
    }, 300);
  }

  private loadCategories() {
    this.categoryService.findAll({ page: 1, limit: 999 }).subscribe({
      next: (res) => {
        this.categories = res.categories.map((c) => ({ _id: c._id, name: c.name }));
      },
      error: () => {
        // fallback vacío si falla
        this.categories = [];
      },
    });
  }

  initForm() {
    this.form = this.fb.group({
      categoryId: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(2)]],
      type: ['text', Validators.required],
      possibleValues: [[]],
      isRequired: [false],
      isActive: [true],
      description: [''],
      sortOrder: [0],
    });
  }

  checkEditMode() {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.characteristicId = params['id'];
        this.loadCharacteristic();
      }
    });
  }

  loadCharacteristic() {
    if (!this.characteristicId) return;
    this.service.findOne(this.characteristicId).subscribe({
      next: (c) => this.form.patchValue(c),
      error: () => (this.error = 'Error al cargar la característica'),
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.submitting = true;
    const payload = this.form.value;

    const op = this.isEditMode
      ? this.service.update(this.characteristicId!, payload)
      : this.service.create(payload);

    op.subscribe({
      next: () => this.router.navigate(['/dashboard', 'category-characteristics']),
      error: () => {
        this.error = this.isEditMode
          ? 'Error al actualizar'
          : 'Error al crear';
        this.submitting = false;
      },
    });
  }

  onCancel() {
    this.router.navigate(['/dashboard', 'category-characteristics']);
  }

  onTypeChange(): void {
    // (opcional) resetea valores cuando cambia el tipo
    const type = this.form.get('type')?.value;
    if (type !== 'select' && type !== 'multiselect') {
      this.form.get('possibleValues')?.setValue([]);
    }
  }

  get needsPossibleValues(): boolean {
    const type = this.form.get('type')?.value;
    return type === 'select' || type === 'multiselect';
  }


}