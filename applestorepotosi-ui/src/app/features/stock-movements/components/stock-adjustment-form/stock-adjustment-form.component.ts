import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StockMovementsService } from '../../services/stock-movements.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { Product } from '../../../products/models/product.model';
import { ProductService } from '../../../products/services/product.service';

@Component({
  selector: 'app-stock-adjustment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stock-adjustment-form.component.html',
  styleUrls: ['./stock-adjustment-form.component.css']
})
export class StockAdjustmentFormComponent implements OnInit{
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private stockService = inject(StockMovementsService);
  private productService = inject(ProductService);

  products: Product[] = [];

  adjustmentForm: FormGroup = this.fb.group({
    productId: ['', Validators.required],
    newQuantity: [0, [Validators.required, Validators.min(0)]],
    reason: ['manual', Validators.required],
    notes: ['']
  });

  submitting = false;
  error = '';

  ngOnInit() {
    this.loadProducts(); // ← carga la lista
  }

  private loadProducts() {
    this.productService.getProducts().subscribe({
      next: (list) => {
        this.products = list.products;
      },
      error: () => (this.products = [])
    });
  }

  onSubmit() {
    if (this.adjustmentForm.invalid) return;

    this.submitting = true;
    this.error = '';

    const payload = {
      ...this.adjustmentForm.value,
      // userId: this.authService.getCurrentUser()?.uid
    };

    this.stockService.createAdjustment(payload).subscribe({
      next: () => this.router.navigate(['/dashboard', 'stock-movements']),
      error: () => {
        this.error = 'Error al crear ajuste';
        this.submitting = false;
      }
    });
  }

  onCancel() {
    this.router.navigate(['/dashboard', 'stock-movements']);
  }
}