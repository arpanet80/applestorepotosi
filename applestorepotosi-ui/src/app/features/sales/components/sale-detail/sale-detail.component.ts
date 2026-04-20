import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SaleService } from '../../services/sale.service';
import { Sale } from '../../models/sale.model';
import { ProductPopulated, SaleItem } from '../../models/sale-item.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';
import { PrintableSale, TicketPrintService } from '../../../../shared/services/ticket-print.service';
import { TicketPreviewComponent } from "../../../../shared/components/ticket-preview/ticket-preview.component";

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf, TicketPreviewComponent],
  templateUrl: './sale-detail.component.html',
  styleUrls: ['./sale-detail.component.css']
})
export class SaleDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private saleService = inject(SaleService);
  private authService = inject(AuthService);
  private ticketService = inject(TicketPrintService);

  sale: Sale | null = null;
  items: SaleItem[] = [];
  loading = true;
  error = '';
  showTicketPreview = false;
  printableSale: PrintableSale | null = null;

  canEdit = false;
  

  ngOnInit() {
    this.checkPermissions();
    this.loadSale();
  }

  private checkPermissions() {
    this.canEdit = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
  }

  private loadSale() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID de venta no válido';
      this.loading = false;
      return;
    }

    // Primero obtenemos la venta
    this.saleService.findOne(id).subscribe({
      next: (sale) => {
        this.sale = sale;
        // Luego los ítems
        this.loadItems(id);
        this.loading = false;
      },
      error: () => {
        this.error = 'Venta no encontrada';
        this.loading = false;
      }
    });
  }

  private loadItems(saleId: string) {
    this.saleService.findItemsBySale(saleId).subscribe({
      next: (items) => this.items = items,
      error: () => this.items = []
    });
  }

  onEdit() {
    if (!this.sale) return;
    this.router.navigate(['/dashboard', 'sales', 'edit', this.sale._id]);
  }

  onCancel() {
    if (!this.sale) return;
    const notes = prompt('Motivo de cancelación (opcional):');
    this.saleService.cancelSale(this.sale._id, notes || undefined).subscribe({
      next: () => this.loadSale(),
      error: () => alert('Error al cancelar la venta')
    });
  }

  getProduct(item: SaleItem): ProductPopulated | null {
    const prod = item.productId;
    return typeof prod === 'object' ? (prod as ProductPopulated) : null;
  }

  printTicket() {
    if (!this.sale) return;
    
    this.printableSale = this.convertToPrintable(this.sale, this.items);
    this.showTicketPreview = true;
  }

  private convertToPrintable(sale: Sale, items: SaleItem[]): PrintableSale {
    return {
      saleNumber: sale.saleNumber,
      saleDate: new Date(sale.saleDate),
      customerName: sale.customerId?.fullName || 'PÚBLICO GENERAL',
      customerNIT: undefined,  // Agregar a modelo si existe
      items: items.map(item => {
        const product = typeof item.productId === 'object' 
          ? item.productId 
          : { name: 'Producto' };
        return {
          name: product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          subtotal: item.subtotal
        };
      }),
      subtotal: sale.totals.subtotal,
      taxAmount: sale.totals.taxAmount,
      discountAmount: sale.totals.discountAmount,
      totalAmount: sale.totals.totalAmount,
      paymentMethod: sale.payment.method,
      paymentReference: sale.payment.reference,
      cashierName: sale.salesPersonId?.displayName || 'Vendedor',
      notes: sale.notes
    };
  }

  onTicketClose() {
    this.showTicketPreview = false;
  }
}