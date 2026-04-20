import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SaleService } from '../../services/sale.service';
import { Sale } from '../../models/sale.model';

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

  sale: Sale | null = null;
  loading = true;
  error = '';
  currentDate = new Date();

  ngOnInit() {
    const saleNumber = this.route.snapshot.queryParamMap.get('sale');
    
    if (!saleNumber) {
      this.error = 'No se proporcionó número de venta';
      this.loading = false;
      return;
    }

    this.verifySale(saleNumber);
  }

  private verifySale(saleNumber: string) {
    // Buscar por número de venta usando el endpoint existente
    this.saleService.findAll({ search: saleNumber, limit: 1 }).subscribe({
      next: (res) => {
        if (res.sales && res.sales.length > 0) {
          // Obtener venta completa con items
          const saleId = res.sales[0]._id;
          this.saleService.findOne(saleId).subscribe({
            next: (fullSale) => {
              this.sale = fullSale;
              this.loading = false;
            },
            error: () => {
              this.error = 'No se pudo cargar los detalles de la venta';
              this.loading = false;
            }
          });
        } else {
          this.error = `No se encontró la venta: ${saleNumber}`;
          this.loading = false;
        }
      },
      error: () => {
        this.error = 'Error al buscar la venta';
        this.loading = false;
      }
    });
  }
}