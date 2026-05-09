import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MySalesService } from '../../services/my-sales.service';
import { Sale } from '../../models/sale.model';
import { TicketPrintService } from '../../../../shared/services/ticket-print.service';
import { ToastrAlertService } from '../../../../shared/services/toastr-alert.service';
import { TaxConfigService } from '../../../../shared/services/tax-config.service';
import { TelegramService } from '../../../../shared/services/telegram.service';

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
  private telegramService = inject(TelegramService);

  sale: Sale | null = null;
  notes = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.service.one(id).subscribe(s => this.sale = s);
  }

  cancel() {
    const sale = this.sale; 
    if (!sale) return;

    this.service.cancel(sale._id, this.notes).subscribe({
      next: async (res) => {
        // 1. Imprimimos la respuesta en consola como pediste
        // console.log('Respuesta de la API:', res);

        // 2. Enviamos notificación a Telegram
        // Usamos el valor de la API o la fecha actual como respaldo para evitar el error de TS
        const fechaCancelacion = new Date(res.cancelledAt ?? new Date());
        
        const fechaStr = fechaCancelacion.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        const horaStr = fechaCancelacion.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });

        const mensaje = 
          `🚫 <b>APPLE STORE POTOSÍ — VENTA CANCELADA</b>\n\n` +
          `<b>N°:</b> ${res.saleNumber}\n` +
          `<b>Fecha:</b> ${fechaStr}\n` +
          `<b>Hora:</b> ${horaStr}\n\n` +
          `💵 <b>SUBTOTAL:</b> $${res.totals?.subtotal?.toFixed(2) ?? '0.00'}\n\n` +
          `#venta #cancelada #applestore`;

        // Invocamos el servicio de telegram cargado previamente
        await this.telegramService.sendHtmlMessage(mensaje);

        // 3. Navegamos al finalizar
        this.router.navigate(['/dashboard/my-sales']);
      },
      error: (err) => {
        // 1. Imprimimos el error para depuración
        console.error('Error al cancelar venta:', err);

        // 2. Mostramos el Toast de error usando tu servicio
        const errorMsg = err.error?.message || 'No se pudo cancelar la venta en el servidor.';
        this.toastrAlertService.error(errorMsg, 'Error al Cancelar');
      }
    });
  }

  // cancel() {
  //   const sale = this.sale; 
  //   if (!sale) return;

  //   this.service.cancel(sale._id, this.notes).subscribe({
  //     next: async (res) => {
  //       // 1. Imprimimos la respuesta en consola como pediste
  //       // console.log('Respuesta de la API:', res);

  //       // 2. Enviamos notificación a Telegram
  //       // Puedes personalizar el mensaje con datos de la respuesta 'res' si los tiene
  //       const mensaje = `🚫 Venta Cancelada\nID: ${this.sale!._id}\nNotas: ${this.notes || 'Sin notas'}`;
  //       await this.telegramService.sendMessage(mensaje);

  //       // 3. Navegamos al finalizar
  //       this.router.navigate(['/dashboard/my-sales']);
  //     },
  //     error: (err) => {
  //       // 1. Imprimimos el error para depuración
  //       console.error('Error al cancelar venta:', err);

  //       // 2. Mostramos el Toast de error usando tu servicio
  //       const errorMsg = err.error?.message || 'No se pudo cancelar la venta en el servidor.';
  //       this.toastrAlertService.error(errorMsg, 'Error al Cancelar');
  //     }
  //   });
  // }

  // cancel() {
  //   if (!this.sale) return;

  //   this.service.cancel(this.sale._id, this.notes).subscribe({
  //     next: (res) => {
  //       console.log('=====>> Respuesta de la API:', res); 
  //       this.router.navigate(['/dashboard/my-sales']);
  //     },
  //     error: (err) => {
  //       console.error('Error en la API:', err);
  //     }
  //   });
  // }

  // cancel() {
  //   if (!this.sale) return;
    
  //   this.service.cancel(this.sale._id, this.notes).subscribe((res) => {
  //     console.log('=====>> Respuesta de la API:', res); 
  //     this.router.navigate(['/dashboard/my-sales']);
  //   });
  // }

  // cancel() {
  //   if (!this.sale) return;
  //   this.service.cancel(this.sale._id, this.notes).subscribe(() => {
  //     this.router.navigate(['/dashboard/my-sales']);
  //   });
  // }

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
    subtotal: sale.totals.subtotal,        // ← del backend
    taxAmount: sale.totals.taxAmount,      // ← del backend
    discountAmount: sale.totals.discountAmount || 0,
    totalAmount: sale.totals.totalAmount,  // ← del backend
    paymentMethod: sale.payment?.method || 'cash',
    paymentReference: sale.payment?.reference,
    cashierName: 'Vendedor',
    notes: sale.notes
  };
}
}