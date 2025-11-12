// src/app/brands/components/brand-form/brand-form.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, finalize } from 'rxjs';
import { BrandService } from '../../services/brand.service';
import { Brand } from '../../models/brand.model';
import { AuthService } from '../../../auth/services/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { COUNTRIES, CountryOption } from '../../../shared/constants/countries';
import { LogoUploadComponent } from '../logo-upload/logo-upload.component';

@Component({
  selector: 'app-brand-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LogoUploadComponent],
  templateUrl: './brand-form.component.html',
  styleUrls: ['./brand-form.component.css']
})
export class BrandFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private brandService = inject(BrandService);
  private authService = inject(AuthService);

  private destroy$ = new Subject<void>();

  countries: CountryOption[] = COUNTRIES;
  logoFile: File | null = null;
  currentLogoUrl: string | null = null;   // logo original
  newLogoFile: File | null = null;         // archivo nuevo (si eligió reemplazar)
  isReplacing = false;    

  brandForm!: FormGroup;
  isEditMode = false;
  brandId?: string;
  loading = false;
  submitting = false;
  error = '';

  // Estados de validación
  nameChecking = false;
  nameAvailable = true;

  ngOnInit() {
    this.initForm();
    this.checkEditMode();
    this.setupNameValidation();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public initForm() {
    this.brandForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      logoUrl: [''],
      website: [''],
      country: [''],
      supportUrl: [''],
      warrantyInfo: [''],
      isActive: [true]
    });
  }

  private checkEditMode() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.brandId = params['id'];
        this.loadBrand();
      }
    });
  }

  /*public loadBrand() {
    if (!this.brandId) return;
    this.loading = true;
    this.brandService.findOne(this.brandId).subscribe({
      next: (brand) => {
        this.brandForm.patchValue(brand);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar la marca';
        this.loading = false;
        console.error(err);
      }
    });
  }*/

  public loadBrand() {
    if (!this.brandId) return;
    this.loading = true;
    this.brandService.findOne(this.brandId).subscribe({
      next: (brand) => {
        this.brandForm.patchValue(brand);
        this.currentLogoUrl = brand.logoUrl || null; // ← mostrar logo actual
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar la marca';
        this.loading = false;
        console.error(err);
      }
    });
  }

  private setupNameValidation() {
    this.brandForm.get('name')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(name => {
          if (name && name.length >= 2) {
            this.nameChecking = true;
            const excludeId = this.isEditMode ? this.brandId : undefined;
            return this.brandService.checkName(name, excludeId);
          } else {
            this.nameChecking = false;
            this.nameAvailable = true;
            return [];
          }
        })
      )
      .subscribe({
        next: (response) => {
          this.nameChecking = false;
          this.nameAvailable = response.available;
          if (!response.available) {
            this.brandForm.get('name')?.setErrors({ nameExists: true });
          }
        },
        error: () => {
          this.nameChecking = false;
        }
      });
  }

  onSubmit() {
    if (this.brandForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.submitting = true;
    this.error = '';

    const raw = this.brandForm.value;

    const payload: Partial<Brand> = {
      name: raw.name ?? undefined,
      description: raw.description ?? undefined,
      website: raw.website ? this.sanitizeUrl(raw.website) : undefined,
      country: raw.country || undefined,
      supportUrl: raw.supportUrl ? this.sanitizeUrl(raw.supportUrl) : undefined,
      warrantyInfo: raw.warrantyInfo ?? undefined,
      isActive: raw.isActive ?? undefined,
    };

    // 1. Si eligió nuevo archivo → subir logo
    if (this.newLogoFile) {
      this.brandService.uploadLogo(this.newLogoFile).subscribe({
        next: (url) => {
          payload.logoUrl = url;
          this.saveBrand(payload);
        },
        error: () => {
          this.submitting = false;
          this.error = 'Error al subir el logo';
        }
      });
    }
    // 2. Si borró logo (vacío y tenía antes) → mandar null
    else if (raw.logoUrl === '' && this.currentLogoUrl) {
      payload.logoUrl = undefined;
      this.saveBrand(payload);
    }
    // 3. Si no tocó logo → dejar valor actual
    else {
      payload.logoUrl = raw.logoUrl || this.currentLogoUrl || undefined;
      this.saveBrand(payload);
    }

  }

  private saveBrand(payload: Partial<Brand>): void {
    const op = this.isEditMode
      ? this.brandService.update(this.brandId!, payload)
      : this.brandService.create(payload);

    op.subscribe({
      next: () => this.router.navigate(['/dashboard', 'brands']),
      error: (err) => {
        this.submitting = false;
        this.error = this.isEditMode
          ? 'Error al actualizar la marca'
          : 'Error al crear la marca';
        console.error(err);
      }
    });
  }


  onCancel() {
    this.router.navigate(['/dashboard', 'brands']);
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.brandForm.controls).forEach(key => {
      const control = this.brandForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helpers para el template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.brandForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.brandForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;

    if (errors['required']) return 'Este campo es requerido';
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['nameExists']) return 'Este nombre ya está en uso';

    return 'Campo inválido';
  }

  onLogoSelected(file: File): void {
    // Guardar archivo para subir después
    this.logoFile = file;

    // Opcional: previsualizar en el input externo
    this.brandForm.patchValue({ logoUrl: '' }); // limpiar URL externa si existe

    this.newLogoFile = file;
    this.isReplacing = true;
  }

  onLogoCancelled(): void {
    this.newLogoFile = null;
    this.isReplacing = false;
  }

  private sanitizeUrl(url: string): string {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    // Si no tiene protocolo, agregamos https://
    return trimmed.match(/^https?:\/\//) ? trimmed : `https://${trimmed}`;
  }
  

}