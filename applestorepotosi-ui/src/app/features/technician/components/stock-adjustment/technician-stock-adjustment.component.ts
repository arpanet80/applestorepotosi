import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StockMovementsService } from '../../../stock-movements/services/stock-movements.service';
import { ProductService } from '../../../products/services/product.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { Product } from '../../../products/models/product.model';

@Component({
  selector: 'app-technician-stock-adjustment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './technician-stock-adjustment.component.html',
})
// BUG FIX 14 (CRÍTICO): La clase declaraba implements OnInit pero NO tenía
// la interfaz importada ni listada en el decorador. ngOnInit() existía como
// método suelto sin el contrato de la interfaz, lo que puede causar que
// Angular no lo ejecute en algunos escenarios de detección de cambios.
export class TechnicianStockAdjustmentComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private service = inject(StockMovementsService);
  private productService = inject(ProductService);
  private auth = inject(AuthService);

  form: FormGroup = this.fb.group({
    productId: ['', Validators.required],
    // BUG FIX 15: newQuantity con valor inicial null en lugar de 0 para
    // forzar al usuario a ingresar un valor explícito. Con 0 el campo
    // pasa validación sin que el usuario lo toque, lo cual es confuso.
    newQuantity: [null, [Validators.required, Validators.min(0)]],
    reason: ['manual', Validators.required],
    notes: [''],
  });

  products: Product[] = [];
  submitting = false;
  // BUG FIX 16: Se añade flag de error para feedback al usuario cuando
  // el envío falla, en lugar de simplemente resetear submitting en silencio.
  submitError = false;

  ngOnInit(): void {
    // BUG FIX 17: getProducts() no existe en ProductService según el backend.
    // El método correcto es findAll() que acepta un ProductQuery y retorna
    // { products: Product[], total: number, ... }. Se pasa isActive:true
    // para solo mostrar productos activos en el selector.
    this.productService
      .findAll({ page: 1, limit: 200, isActive: true, sortBy: 'name', sortOrder: 'asc' })
      .subscribe({
        next: (res) => (this.products = res.products),
        error: () => {
          // Si no se cargan productos, deshabilitamos el submit para evitar
          // enviar un ajuste sin producto válido.
          this.form.get('productId')?.disable();
        },
      });
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting) return;

    this.submitting = true;
    this.submitError = false;

    // El DTO del backend (StockAdjustmentDto) espera exactamente estos campos:
    // productId, newQuantity (no 'quantity'), reason, notes?, userId?
    const { productId, newQuantity, reason, notes } = this.form.value;
    const payload = {
      productId,
      newQuantity,                                   // ← nombre exacto del DTO backend
      reason,
      notes: notes || undefined,
      userId: this.auth.getCurrentUser()!.uid,        // ← non-null assertion: el guard garantiza usuario autenticado
    };

    this.service.createAdjustment(payload).subscribe({
      next: () =>
        this.router.navigate(['/dashboard/technician-stock-movements']),
      error: () => {
        this.submitting = false;
        this.submitError = true;
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/technician-stock-movements']);
  }
}