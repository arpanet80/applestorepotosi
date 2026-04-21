import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TaxConfigService {
  /** Tasa de impuesto (0 = sin impuestos, 0.16 = 16%) */
  readonly rate = environment.taxRate;
  
  /** Etiqueta para mostrar en tickets/UI */
  get label(): string {
    return this.rate > 0 ? `IMPUESTO (${(this.rate * 100).toFixed(0)}%)` : '';
  }
  
  /** Calcula impuesto dado un subtotal */
  calculateTax(subtotal: number): number {
    return subtotal * this.rate;
  }
  
  /** Calcula total con o sin impuesto */
  calculateTotal(subtotal: number, discount: number = 0): number {
    const tax = this.calculateTax(subtotal);
    return subtotal + tax - discount;
  }
}