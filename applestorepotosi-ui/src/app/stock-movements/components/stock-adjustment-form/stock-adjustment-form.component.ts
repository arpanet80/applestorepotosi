import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StockMovementsService } from '../../services/stock-movements.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-stock-adjustment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stock-adjustment-form.component.html',
  styleUrls: ['./stock-adjustment-form.component.css']
})
export class StockAdjustmentFormComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private stockService = inject(StockMovementsService);
  private authService = inject(AuthService);

  adjustmentForm: FormGroup = this.fb.group({
    productId: ['', Validators.required],
    newQuantity: [0, [Validators.required, Validators.min(0)]],
    reason: ['manual', Validators.required],
    notes: ['']
  });

  submitting = false;
  error = '';

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