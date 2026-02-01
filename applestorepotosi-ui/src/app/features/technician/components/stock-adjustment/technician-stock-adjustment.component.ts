import { Component, inject } from '@angular/core';
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
  templateUrl: './technician-stock-adjustment.component.html'
})
export class TechnicianStockAdjustmentComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private service = inject(StockMovementsService);
  private productService = inject(ProductService);
  private auth = inject(AuthService);

  form: FormGroup = this.fb.group({
    productId: ['', Validators.required],
    newQuantity: [0, [Validators.required, Validators.min(0)]],
    reason: ['manual', Validators.required],
    notes: ['']
  });

  products: Product[] = [];
  submitting = false;

  ngOnInit() {
    this.productService.getProducts().subscribe(list => this.products = list.products);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.submitting = true;
    // const payload = { ...this.form.value, userId: this.auth.getCurrentUser()?.uid };
    const payload = { ...this.form.value };
    this.service.createAdjustment(payload).subscribe({
      next: () => this.router.navigate(['/dashboard/technician-stock-movements']),
      error: () => (this.submitting = false)
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/technician-stock-movements']);
  }
}