import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MySalesService, PaginatedResponse } from '../../services/my-sales.service';
import { Sale } from '../../models/sale.model';
import { SaleStatus } from '../../../sales/models/sale.model';
import { TicketPrintService } from '../../../../shared/services/ticket-print.service';
import { ToastrAlertService } from '../../../../shared/services/toastr-alert.service';

@Component({
  selector: 'app-my-sales-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './my-sales-list.component.html'
})
export class MySalesListComponent implements OnInit {
  private service = inject(MySalesService);
  private ticketService = inject(TicketPrintService);
  private toastrAlertService = inject(ToastrAlertService);

  saleStatus = SaleStatus;

  data: Sale[] = [];
  total = 0;
  page = 1;
  limit = 5;
  totalPages = 0;

  startDate = '';
  endDate = '';
  selectedStatus = '';
  search = '';

  ngOnInit() {
    this.load();
  }

  load() {
    const start = this.startDate ? new Date(this.startDate) : undefined;
    const end = this.endDate ? new Date(this.endDate) : undefined;

    this.service.list(this.page, this.limit, start, end, this.search, this.selectedStatus)
      .subscribe({
        next: (res: PaginatedResponse<Sale>) => {
          this.data = res.data;
          this.total = res.total;
          this.totalPages = res.totalPages;
        }
      });
  }

  resetPage() {
    this.page = 1;
    this.load();
  }

  prev() {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }

  next() {
    if (this.page < this.totalPages) {
      this.page++;
      this.load();
    }
  }

  // NUEVO: Imprimir ticket de venta
  printTicket(sale: Sale): void {
    this.service.one(sale._id).subscribe({
      next: (fullSale) => {
        const printable = this.buildPrintableSale(fullSale);
        this.ticketService.generateAndPrint(printable);
        this.toastrAlertService.success('Ticket enviado a impresión');
      },
      error: () => {
        this.toastrAlertService.error('No se pudo cargar la venta para imprimir');
      }
    });
  }

  // NUEVO: Construir objeto imprimible
  private buildPrintableSale(sale: Sale): any {
    const items = sale.items?.map(item => ({
      name: item.productId?.name || 'Producto',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      subtotal: item.subtotal
    })) || [];

    const subtotal = sale.totals.subtotal;
    const taxAmount = sale.totals.taxAmount;
    const totalAmount = sale.totals.totalAmount;

    return {
      saleNumber: sale.saleNumber,
      saleDate: new Date(sale.saleDate),
      customerName: sale.customerId?.fullName || 'PÚBLICO GENERAL',
      items: items,
      subtotal: subtotal,
      taxAmount: taxAmount,
      discountAmount: sale.totals.discountAmount || 0,
      totalAmount: totalAmount,
      paymentMethod: sale.payment?.method || 'cash',
      paymentReference: sale.payment?.reference,
      cashierName: 'Vendedor', // MySales es solo del vendedor actual
      notes: sale.notes
    };
  }
}