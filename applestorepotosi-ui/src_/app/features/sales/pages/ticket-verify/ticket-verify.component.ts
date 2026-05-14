import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SaleService } from '../../services/sale.service';
import { Sale } from '../../models/sale.model';
import { TaxConfigService } from '../../../../shared/services/tax-config.service';


@Component({
  selector: 'app-ticket-verify',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-verify.component.html',
  styleUrl: './ticket-verify.component.css'
})
export class TicketVerifyComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private saleService = inject(SaleService);
  private taxConfig = inject(TaxConfigService);
  
  taxLabel = this.taxConfig.label;  
  

  sale: Sale | null = null;
  loading = true;
  error = '';
  currentDate = new Date();

  ngOnInit(): void {
    // El parámetro 'sale' contiene el saleNumber tal como lo devuelve el backend.
    // No se asume ningún formato de guiones — se busca directamente.
    const saleNumber = this.route.snapshot.queryParamMap.get('sale');

    if (!saleNumber) {
      this.error = 'No se proporcionó número de venta.';
      this.loading = false;
      return;
    }

    this.verifySale(saleNumber);
  }

  private verifySale(saleNumber: string): void {
    this.saleService.findAll({ search: saleNumber, limit: 1 }).subscribe({
      next: (res) => {
        if (res.sales?.length) {
          this.saleService.findOne(res.sales[0]._id).subscribe({
            next: (fullSale) => {
              this.sale = fullSale;
              this.loading = false;
            },
            error: () => {
              this.error = 'No se pudieron cargar los detalles de la venta.';
              this.loading = false;
            }
          });
        } else {
          this.error = `No se encontró la venta: ${saleNumber}`;
          this.loading = false;
        }
      },
      error: () => {
        this.error = 'Error al buscar la venta. Intenta de nuevo.';
        this.loading = false;
      }
    });
  }
}