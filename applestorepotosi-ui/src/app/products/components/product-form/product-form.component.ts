// src/app/products/components/product-form/product-form.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, finalize, forkJoin } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { Product, ProductImage } from '../../models/product.model';
import { AuthService } from '../../../auth/services/auth.service';
import { ImageUploadComponent } from '../image-upload/image-upload';
import { ObjectUrlPipe } from '../../pipes/object-url.pipe';

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
  
  
  private destroy$ = new Subject<void>();
  previewImages: string[] = [];
  // existingImages: ProductImage[] = [];
  // imagesToDelete: string[] = [];
  imagesToUpload: string[] = []; // URLs temporales
  newImageFiles: File[] = [];          // archivos nuevos (create o edit)
  existingImages: ProductImage[] = []; // solo en edit
  imagesToDelete: string[] = [];       // ids a borrar (edit)

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
  
  // Datos para selects (en un sistema real estos vendrían de servicios)
  /*categories = [
    { _id: '1', name: 'Smartphones' },
    { _id: '2', name: 'Laptops' },
    { _id: '3', name: 'Tablets' },
    { _id: '4', name: 'Wearables' },
    { _id: '5', name: 'Accessories' }
  ];
  
  brands = [
    { _id: '1', name: 'Apple' },
    { _id: '2', name: 'Samsung' },
    { _id: '3', name: 'Huawei' },
    { _id: '4', name: 'Xiaomi' }
  ];
  
  suppliers = [
    { _id: '1', name: 'Distribuidor Oficial Apple' },
    { _id: '2', name: 'TecnoImport' },
    { _id: '3', name: 'ElectroSupply' }
  ];

  */

  categories: any[] = [];
  brands: any[] = [];
  suppliers: any[] = [];

  loadingSelects = false;

  ngOnInit() {
    this.initForm();
    this.loadSelectData();
    this.checkEditMode();
    this.setupSkuValidation();
    this.setupBarcodeValidation();
  }

  private loadSelectData() {
    this.loadingSelects = true;

    // Carga en paralelo
    this.productService.getCategories()
      .pipe(finalize(() => this.checkLoadingComplete()))
      .subscribe({
        next: (data) => {
          this.categories = data,
          console.log(this.categories);
        },
        error: (err) => console.error('❌ Error categorías:', err)
      });

    this.productService.getBrands()
      .pipe(finalize(() => this.checkLoadingComplete()))
      .subscribe({
        next: (data) => {
          this.brands = data
          console.log(this.brands);
        },
        error: (err) => console.error('❌ Error marcas:', err)
      });

    this.productService.getSuppliers()
      .pipe(finalize(() => this.checkLoadingComplete()))
      .subscribe({
        next: (data) => {
          this.suppliers = data
          console.log(this.suppliers);

        },
        error: (err) => console.error('❌ Error proveedores:', err)
      });
  }

  private checkLoadingComplete() {
    if (this.categories.length && this.brands.length && this.suppliers.length) {
      this.loadingSelects = false;
    }
  }
 

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public initForm() {
    this.productForm = this.fb.group({
      // Información básica
      sku: ['', [Validators.required, Validators.minLength(3)]],
      barcode: [''],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      
      // Relaciones
      categoryId: ['', Validators.required],
      brandId: ['', Validators.required],
      supplierId: ['', Validators.required],
      
      // Especificaciones
      specifications: this.fb.group({
        color: [''],
        storage: [''],
        memory: [''],
        screenSize: [''],
        processor: ['']
      }),
      
      // Precios
      costPrice: [0, [Validators.required, Validators.min(0)]],
      salePrice: [0, [Validators.required, Validators.min(0)]],
      
      // Garantía
      warrantyMonths: [0, [Validators.min(0)]],
      
      // Stock
      stockQuantity: [0, [Validators.min(0)]],
      minStock: [0, [Validators.min(0)]],
      maxStock: [0, [Validators.min(0)]],
      
      // Ubicación
      location: [''],
      
      // Estados
      isActive: [true],
      isFeatured: [false]
    }, { validators: this.priceValidator });

    // Sincronizar precios para validación
    this.productForm.get('costPrice')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.productForm.get('salePrice')?.updateValueAndValidity();
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

  private setupSkuValidation() {
    this.productForm.get('sku')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(sku => {
          if (sku && sku.length >= 3) {
            this.skuChecking = true;
            const excludeId = this.isEditMode ? this.productId : undefined;
            return this.productService.checkSku(sku, excludeId);
          } else {
            this.skuChecking = false;
            this.skuAvailable = true;
            return [];
          }
        })
      )
      .subscribe({
        next: (response) => {
          this.skuChecking = false;
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

  private setupBarcodeValidation() {
    this.productForm.get('barcode')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(barcode => {
          if (barcode && barcode.length >= 3) {
            this.barcodeChecking = true;
            const excludeId = this.isEditMode ? this.productId : undefined;
            return this.productService.checkBarcode(barcode, excludeId);
          } else {
            this.barcodeChecking = false;
            this.barcodeAvailable = true;
            return [];
          }
        })
      )
      .subscribe({
        next: (response) => {
          this.barcodeChecking = false;
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

  private checkEditMode() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.productId = params['id'];
        this.loadProductData();
      }
    });
  }

  public loadProductData() {
    if (!this.productId) return;
    
    this.loading = true;
    this.productService.findOne(this.productId).subscribe({
      next: (product) => {
        this.populateForm(product);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el producto';
        this.loading = false;
        console.error('Error loading product:', err);
      }
    });

    this.productService.getProductImages(this.productId!).subscribe(images => {
      this.existingImages = images;
    });
  }

  private populateForm(product: Product) {
    this.productForm.patchValue({
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId?._id || product.categoryId,
      brandId: product.brandId?._id || product.brandId,
      supplierId: product.supplierId?._id || product.supplierId,
      specifications: product.specifications || {},
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      warrantyMonths: product.warrantyMonths,
      stockQuantity: product.stockQuantity,
      minStock: product.minStock,
      maxStock: product.maxStock,
      location: product.location,
      isActive: product.isActive,
      isFeatured: product.isFeatured
    });
  }

  onSubmit() {

    console.log('📋 FORMDATA:', this.productForm.value);

    if (this.productForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    
    this.submitting = true;
    this.error = '';

    const formValue = this.productForm.value;
    const user = this.authService.getCurrentUser();
    const userId = user?.uid || 'system';
    
    const productData = this.productForm.value;

    const save$ = this.isEditMode
      ? this.productService.update(this.productId!, productData)
      : this.productService.create(productData);

    save$.subscribe(product => {
      const productId = this.productId || product._id;

      // 1. Subir imágenes nuevas (create o edit)
      if (this.newImageFiles.length) {
        const uploads = this.newImageFiles.map(file =>
          this.productService.uploadImage(productId, file)
        );
        forkJoin(uploads).subscribe(() => {
          this.router.navigate(['/products', 'detail', productId]);
        });
      }

      // 2. Eliminar imágenes marcadas (solo edit)
      if (this.isEditMode && this.imagesToDelete.length) {
        const deletions = this.imagesToDelete.map(id =>
          this.productService.removeProductImage(id)
        );
        forkJoin(deletions).subscribe();
      }

      // 3. Si no hay imágenes, solo navegar
      if (!this.newImageFiles.length && !this.imagesToDelete.length) {
        this.router.navigate(['/products', 'detail', productId]);
      }
    });


    // const productData = {
    //   ...formValue,
    //   categoryId: formValue.categoryId,
    //   brandId: formValue.brandId,
    //   supplierId: formValue.supplierId
    // };

    const operation = this.isEditMode 
      ? this.productService.update(this.productId!, productData)
      : this.productService.create(productData);

    operation.subscribe({
      next: (product) => {
        this.submitting = false;
        this.router.navigate(['/dashboard/products'], {
          queryParams: this.isEditMode 
            ? { updated: 'true' } 
            : { created: 'true' }
        });
        /*
        this.router.navigate(['/dashboard/products'], {
          queryParams: { created: !this.isEditMode }
        });
        */
      },
      error: (err) => {
        this.submitting = false;
        this.error = this.isEditMode 
          ? 'Error al actualizar el producto' 
          : 'Error al crear el producto';
        console.error('Error saving product:', err);
      }
    });
  }

  get imageUploadProductId(): string {
    return this.isEditMode ? this.productId || '' : '';
  }

  onCancel() {
    if (this.isEditMode && this.productId) {
      this.router.navigate(['/products', 'detail', this.productId]);
    } else {
      this.router.navigate(['/products']);
    }
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helpers para el template
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

  // Calculados para el template
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

  onImagesUploaded(files: File[]) {
    this.newImageFiles.push(...files);
  }

  /*onImagesUploaded(urls: string[]) {
    if (this.isEditMode) {
      urls.forEach(url => this.addImageToProduct(url));
    } else {
      // En create, solo preview
      this.imagesToUpload.push(...urls);
    }
  }*/

  private addImageToProduct(url: string) {
    const productId = this.productId || this.productForm.get('_id')?.value;
    if (!productId) return;

    this.productService.addProductImage({
      productId,
      url,
      isPrimary: false,
      sortOrder: 0
    }).subscribe({
      next: () => {
        console.log('✅ Imagen guardada en DB');
      },
      error: (err) => {
        console.error('❌ Error guardando imagen:', err);
      }
    });
  }

  removePreviewImage(index: number) {
    this.previewImages.splice(index, 1);
  }

  onRemoveImage(image: ProductImage) {
    // ❌ no llamamos al backend
    // ✅ solo quitamos de la vista y marcamos para borrar
    this.existingImages = this.existingImages.filter(img => img._id !== image._id);
    this.imagesToDelete.push(image._id!);
  }

  // onRemoveImage(imageId: string) {
  // if (!confirm('¿Eliminar esta imagen?')) return;

  // this.productService.removeProductImage(imageId).subscribe(() => {
  //   this.existingImages = this.existingImages.filter(img => img._id !== imageId);
  // });
  // }
}