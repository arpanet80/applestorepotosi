import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MySalesService } from '../../services/my-sales.service';
import { Sale } from '../../models/sale.model';
import { TicketPrintService } from '../../../../shared/services/ticket-print.service';
import { ToastrAlertService } from '../../../../shared/services/toastr-alert.service';

@Component({
  selector: 'app-my-sales-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-sales-detail.component.html'
})
export class MySalesDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(MySalesService);
  private ticketService = inject(TicketPrintService);
  private toastrAlertService = inject(ToastrAlertService);

  sale: Sale | null = null;
  notes = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.service.one(id).subscribe(s => this.sale = s);
  }

  cancel() {
    if (!this.sale) return;
    this.service.cancel(this.sale._id, this.notes).subscribe(() => {
      this.router.navigate(['/my-sales']);
    });
  }

  // NUEVO: Imprimir ticket
  printTicket(): void {
    if (!this.sale) return;
    
    const printable = this.buildPrintableSale(this.sale);
    this.ticketService.generateAndPrint(printable);
    this.toastrAlertService.success('Ticket enviado a impresión');
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

    return {
      saleNumber: sale.saleNumber,
      saleDate: new Date(sale.saleDate),
      customerName: sale.customerId?.fullName || 'PÚBLICO GENERAL',
      items: items,
      subtotal: sale.totals.subtotal,
      taxAmount: sale.totals.taxAmount,
      discountAmount: sale.totals.discountAmount || 0,
      totalAmount: sale.totals.totalAmount,
      paymentMethod: sale.payment?.method || 'cash',
      paymentReference: sale.payment?.reference,
      cashierName: 'Vendedor',
      notes: sale.notes
    };
  }
}