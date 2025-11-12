// src/app/category-characteristics/components/characteristic-form/characteristic-form.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryCharacteristicService } from '../../services/category-characteristic.service';
import { CategoryCharacteristic } from '../../models/category-characteristic.model';

@Component({
  selector: 'app-characteristic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './characteristic-form.component.html',
  styleUrls: ['./characteristic-form.component.css'],
})
export class CategoryCharacteristicFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private service = inject(CategoryCharacteristicService);

  form!: FormGroup;
  isEditMode = false;
  characteristicId?: string;
  submitting = false;
  error = '';

  ngOnInit() {
    this.initForm();
    this.checkEditMode();
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
}