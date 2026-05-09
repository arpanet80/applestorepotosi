// src/app/products/components/product-form/product-form.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, finalize, forkJoin, of } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { Product, ProductImage } from '../../models/product.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { ImageUploadComponent } from '../image-upload/image-upload';
import { ObjectUrlPipe } from '../../pipes/object-url.pipe';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUploadComponent, ObjectUrlPipe],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  private destroy$ = new Subject<void>();

  // Imágenes
  newImageFiles: File[] = [];
  existingImages: ProductImage[] = [];
  imagesToDelete: string[] = [];

  productForm!: FormGroup;
  isEditMode = false;
  productId?: string;
  loading = false;
  submitting = false;
  error = '';

  // Estados de validación
  skuChecking = false;
  barcodeChecking = false;
  skuAvailable = true;
  barcodeAvailable = true;

  // Datos para selects
  categories: Array<{ _id: string; name: string }> = [];
  brands: Array<{ _id: string; name: string }> = [];
  suppliers: Array<{ _id: string; name: string }> = [];

  loadingSelects = false;
  selectsLoaded = false;

  ngOnInit(): void {
    this.initForm();
    this.loadSelectData();
    this.checkEditMode();
    this.setupSkuValidation();
    this.setupBarcodeValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== INICIALIZACIÓN ==========

  // FIX 1: Generar SKU que cumpla el patrón del backend /^[A-Za-z0-9_\-]+$/
  // Usar solo mayúsculas, números, guiones y guiones bajos
  private generateSku(): string {
    const prefix = 'PROD';
    const timestamp = Date.now().toString(36).toUpperCase(); // Base36 en MAYÚSCULAS
    const random = Math.floor(Math.random() * 9000 + 1000);
    return `${prefix}-${timestamp}-${random}`;
  }

  public initForm(): void {
    // FIX 2: Inicializar selects con null en lugar de '' para evitar enviar
    // strings vacíos al backend que valida @IsMongoId
    this.productForm = this.fb.group({
      sku: ['', [Validators.required, Validators.minLength(3)]],
      barcode: [''],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],

      categoryId: [null, Validators.required],
      brandId: [null, Validators.required],
      supplierId: [null, Validators.required],

      specifications: this.fb.group({
        color: [''],
        storage: [''],
        memory: [''],
        screenSize: [''],
        processor: ['']
      }),

      costPrice: [0, [Validators.required, Validators.min(0)]],
      salePrice: [0, [Validators.required, Validators.min(0)]],

      warrantyMonths: [0, [Validators.min(0)]],
      stockQuantity: [0, [Validators.min(0)]],
      minStock: [0, [Validators.min(0)]],
      maxStock: [0, [Validators.min(0)]],

      location: [''],

      isActive: [true],
      isFeatured: [false]
    }, { validators: this.priceValidator });

    // FIX 3: Sincronizar precios para validación cruzada
    this.productForm.get('costPrice')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.productForm.get('salePrice')?.updateValueAndValidity({ onlySelf: true });
      });
  }

  private priceValidator(control: AbstractControl): ValidationErrors | null {
    const costPrice = control.get('costPrice')?.value;
    const salePrice = control.get('salePrice')?.value;

    if (costPrice !== null && salePrice !== null && salePrice < costPrice) {
      return { salePriceLessThanCost: true };
    }
    return null;
  }

  // ========== CARGA DE SELECTS ==========

  private loadSelectData(): void {
    this.loadingSelects = true;
    let completed = 0;
    const total = 3;

    const checkComplete = () => {
      completed++;
      if (completed >= total) {
        this.loadingSelects = false;
        this.selectsLoaded = true;
        // FIX 4: Solo generar SKU automático DESPUÉS de confirmar que NO es modo edición
        // y después de que los selects estén cargados (evita race conditions)
        if (!this.isEditMode) {
          this.setAutoSku();
        }
      }
    };

    this.productService.getCategories()
      .pipe(finalize(checkComplete))
      .subscribe({
        next: (data) => { this.categories = data; },
        error: (err) => {
          console.error('Error categorías:', err);
          this.toastr.error('Error al cargar categorías', 'Error');
        }
      });

    this.productService.getBrands()
      .pipe(finalize(checkComplete))
      .subscribe({
        next: (data) => { this.brands = data; },
        error: (err) => {
          console.error('Error marcas:', err);
          this.toastr.error('Error al cargar marcas', 'Error');
        }
      });

    this.productService.getSuppliers()
      .pipe(finalize(checkComplete))
      .subscribe({
        next: (data) => { this.suppliers = data; },
        error: (err) => {
          console.error('Error proveedores:', err);
          this.toastr.error('Error al cargar proveedores', 'Error');
        }
      });
  }

  // ========== VALIDACIÓN SKU / BARCODE ==========

  private setupSkuValidation(): void {
    this.productForm.get('sku')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(sku => {
          if (!sku || sku.length < 3) {
            this.skuChecking = false;
            this.skuAvailable = true;
            return of(null);
          }
          this.skuChecking = true;
          const excludeId = this.isEditMode ? this.productId : undefined;
          return this.productService.checkSku(sku, excludeId);
        })
      )
      .subscribe({
        next: (response) => {
          this.skuChecking = false;
          if (!response) return;
          this.skuAvailable = response.available;
          if (!response.available) {
            this.productForm.get('sku')?.setErrors({ skuExists: true });
          }
        },
        error: () => {
          this.skuChecking = false;
        }
      });
  }

  private setupBarcodeValidation(): void {
    this.productForm.get('barcode')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(barcode => {
          if (!barcode || barcode.length < 3) {
            this.barcodeChecking = false;
            this.barcodeAvailable = true;
            return of(null);
          }
          this.barcodeChecking = true;
          const excludeId = this.isEditMode ? this.productId : undefined;
          return this.productService.checkBarcode(barcode, excludeId);
        })
      )
      .subscribe({
        next: (response) => {
          this.barcodeChecking = false;
          if (!response) return;
          this.barcodeAvailable = response.available;
          if (!response.available) {
            this.productForm.get('barcode')?.setErrors({ barcodeExists: true });
          }
        },
        error: () => {
          this.barcodeChecking = false;
        }
      });
  }

  // ========== MODO EDICIÓN ==========

  private checkEditMode(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.productId = id;
        this.loadProductData();
      }
    });
  }

  loadProductData(): void {
    if (!this.productId) return;

    this.loading = true;
    this.error = '';

    this.productService.findOne(this.productId).subscribe({
      next: (product) => {
        this.populateForm(product);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el producto. Intenta nuevamente.';
        this.loading = false;
        this.toastr.error(this.error, 'Error');
        console.error('Error loading product:', err);
      }
    });

    this.productService.getProductImages(this.productId).subscribe({
      next: (images) => {
        this.existingImages = images;
      },
      error: (err) => {
        console.error('Error cargando imágenes:', err);
      }
    });
  }

  private populateForm(product: Product): void {
    this.productForm.patchValue({
      sku: product.sku,
      barcode: product.barcode || '',
      name: product.name,
      description: product.description || '',
      categoryId: product.categoryId?._id || product.categoryId || null,
      brandId: product.brandId?._id || product.brandId || null,
      supplierId: product.supplierId?._id || product.supplierId || null,
      specifications: {
        color: product.specifications?.['color'] || '',
        storage: product.specifications?.['storage'] || '',
        memory: product.specifications?.['memory'] || '',
        screenSize: product.specifications?.['screenSize'] || '',
        processor: product.specifications?.['processor'] || ''
      },
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      warrantyMonths: product.warrantyMonths || 0,
      stockQuantity: product.stockQuantity || 0,
      minStock: product.minStock || 0,
      maxStock: product.maxStock || 0,
      location: product.location || '',
      isActive: product.isActive ?? true,
      isFeatured: product.isFeatured ?? false
    });
  }

  // FIX 5: Método público para generar SKU (llamado desde loadSelectData)
  private setAutoSku(): void {
    const sku = this.generateSku();
    this.productForm.patchValue({ sku }, { emitEvent: false });
    // No marcar como touched para evitar mostrar errores visuales al inicio
    this.productForm.get('sku')?.markAsUntouched();
  }

  // ========== SUBMIT ==========

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.markAllFieldsAsTouched();
      this.toastr.warning('Por favor corrige los errores del formulario', 'Validación');
      return;
    }

    if (!this.selectsLoaded) {
      this.toastr.warning('Espera a que carguen los datos auxiliares', 'Espere');
      return;
    }

    this.submitting = true;
    this.error = '';

    const raw = this.productForm.value;

    // Limpiar specifications vacíos
    const specs = raw.specifications || {};
    const cleanSpecs: Record<string, string> = {};
    Object.keys(specs).forEach(key => {
      if (specs[key] && specs[key].toString().trim()) {
        cleanSpecs[key] = specs[key].toString().trim();
      }
    });

    // Construir payload limpio
    const productData: any = {
      sku: raw.sku?.trim(),
      barcode: raw.barcode?.trim() || undefined,
      name: raw.name?.trim(),
      description: raw.description?.trim() || undefined,
      categoryId: raw.categoryId,
      brandId: raw.brandId,
      supplierId: raw.supplierId,
      costPrice: Number(raw.costPrice),
      salePrice: Number(raw.salePrice),
      stockQuantity: Number(raw.stockQuantity) || 0,
      minStock: Number(raw.minStock) || 0,
      maxStock: Number(raw.maxStock) || 0,
      warrantyMonths: Number(raw.warrantyMonths) || 0,
      location: raw.location?.trim() || undefined,
      isActive: !!raw.isActive,
      isFeatured: !!raw.isFeatured,
    };

    if (Object.keys(cleanSpecs).length > 0) {
      productData.specifications = cleanSpecs;
    }

    const op = this.isEditMode
      ? this.productService.update(this.productId!, productData)
      : this.productService.create(productData);

    op.subscribe({
      next: (product) => {
        const id = product._id;

        // FIX: Subir imágenes usando FormData al endpoint /upload correcto
        const uploads = this.newImageFiles.map(file =>
          this.productService.uploadProductImage(id, file)
        );

        const deletions = this.isEditMode
          ? this.imagesToDelete.map(imgId =>
              this.productService.removeProductImage(imgId)
            )
          : [];

        if (uploads.length === 0 && deletions.length === 0) {
          this.submitting = false;
          this.toastr.success(
            this.isEditMode ? 'Producto actualizado correctamente' : 'Producto creado correctamente',
            '¡Éxito!'
          );
          this.router.navigate(['/dashboard/products'], {
            queryParams: { [this.isEditMode ? 'updated' : 'created']: 'true' },
          });
          return;
        }

        forkJoin([...uploads, ...deletions]).subscribe({
          next: () => {
            this.submitting = false;
            this.toastr.success(
              this.isEditMode ? 'Producto e imágenes actualizados' : 'Producto e imágenes creados',
              '¡Éxito!'
            );
            this.router.navigate(['/dashboard/products'], {
              queryParams: { [this.isEditMode ? 'updated' : 'created']: 'true' },
            });
          },
          error: (err) => {
            this.submitting = false;
            console.error('Error procesando imágenes:', err);
            // FIX: Mostrar error específico del backend si existe
            const backendMsg = err?.error?.message || err?.error?.error || 'Error desconocido';
            this.toastr.warning(
              `Producto guardado pero hubo errores con las imágenes: ${backendMsg}`,
              'Advertencia'
            );
            this.router.navigate(['/dashboard/products'], {
              queryParams: { [this.isEditMode ? 'updated' : 'created']: 'true' },
            });
          },
        });
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.message || err?.message || (this.isEditMode
          ? 'Error al actualizar el producto'
          : 'Error al crear el producto');
        this.error = msg;
        this.toastr.error(msg, 'Error');
        console.error('Error completo:', err);
      },
    });
  }

  // ========== IMÁGENES ==========

  get imageUploadProductId(): string {
    return this.isEditMode ? this.productId || '' : '';
  }

  onImagesUploaded(files: File[]): void {
    this.newImageFiles.push(...files);
  }

  onRemoveImage(image: ProductImage): void {
    this.existingImages = this.existingImages.filter(img => img._id !== image._id);
    if (image._id) {
      this.imagesToDelete.push(image._id);
    }
  }

  // ========== NAVEGACIÓN ==========

  onCancel(): void {
    this.router.navigate(['/dashboard', 'products']);
  }

  // ========== HELPERS ==========

  private markAllFieldsAsTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach(nestedKey => {
          control.get(nestedKey)?.markAsTouched();
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;

    if (errors['required']) return 'Este campo es requerido';
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['min']) return `El valor debe ser mayor o igual a ${errors['min'].min}`;
    if (errors['skuExists']) return 'Este SKU ya está en uso';
    if (errors['barcodeExists']) return 'Este código de barras ya está en uso';
    if (errors['salePriceLessThanCost']) return 'El precio de venta debe ser mayor o igual al costo';

    return 'Campo inválido';
  }

  get profitMargin(): number {
    const cost = this.productForm.get('costPrice')?.value || 0;
    const sale = this.productForm.get('salePrice')?.value || 0;
    if (cost === 0) return 0;
    return ((sale - cost) / cost) * 100;
  }

  get profitAmount(): number {
    const cost = this.productForm.get('costPrice')?.value || 0;
    const sale = this.productForm.get('salePrice')?.value || 0;
    return sale - cost;
  }
}