import { Component, Input, Output, EventEmitter, inject, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { TicketPrintService, PrintableSale } from '../../services/ticket-print.service';
import { ShareService } from '../../services/share.service';

@Component({
  selector: 'app-ticket-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ticket-modal-overlay" *ngIf="isOpen" (click)="close.emit()">
      <div class="ticket-modal-content" (click)="$event.stopPropagation()">
        <div class="ticket-header">
          <h3>Vista Previa del Ticket</h3>
          <button class="btn-close" (click)="close.emit()">×</button>
        </div>
        
        <div class="ticket-preview-area">
          <iframe 
            [src]="pdfUrl" 
            width="100%" 
            height="400px"
            style="border: 1px solid #ddd; border-radius: 4px;"
          ></iframe>
        </div>
        
        <!-- NUEVO: Sección de compartir -->
        <div class="share-section">
          <h4>Compartir Ticket</h4>
          <div class="share-inputs">
            <div class="input-group">
              <label>WhatsApp:</label>
              <div class="input-with-btn">
                <input 
                  type="tel" 
                  [(ngModel)]="whatsAppNumber" 
                  placeholder="591XXXXXXXX"
                  class="form-control"
                />
                <button 
                  class="btn btn-whatsapp" 
                  (click)="shareViaWhatsApp()"
                  [disabled]="!whatsAppNumber">
                  <span>📱</span> Enviar
                </button>
              </div>
            </div>
            
            <div class="input-group">
              <label>Email:</label>
              <div class="input-with-btn">
                <input 
                  type="email" 
                  [(ngModel)]="emailAddress" 
                  placeholder="cliente@email.com"
                  class="form-control"
                />
                <button 
                  class="btn btn-email" 
                  (click)="shareViaEmail()"
                  [disabled]="!emailAddress">
                  <span>✉️</span> Enviar
                </button>
              </div>
            </div>
          </div>
          
          <div class="share-native">
            <button class="btn btn-native" (click)="nativeShare()">
              <span>📤</span> Compartir nativo
            </button>
          </div>
        </div>
        
        <div class="ticket-actions">
          <button class="btn btn-secondary" (click)="download()">
            <span>💾</span> Descargar PDF
          </button>
          <button class="btn btn-primary" (click)="print()">
            <span>🖨️</span> Imprimir
          </button>
          <button class="btn btn-success" (click)="printSilently()">
            <span>⚡</span> Impresión Rápida
          </button>
        </div>
        
        <div class="ticket-config">
          <label>
            Ancho:
            <select [(ngModel)]="selectedWidth" (change)="regenerate()">
              <option [value]="58">58mm</option>
              <option [value]="80">80mm</option>
            </select>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="includeQR" (change)="regenerate()">
            Incluir código QR
          </label>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ticket-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    
    .ticket-modal-content {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 450px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 1.5rem;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    
    .ticket-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      border-bottom: 2px solid #eee;
      padding-bottom: 0.75rem;
    }
    
    .ticket-header h3 {
      margin: 0;
      font-size: 1.25rem;
      color: #333;
    }
    
    .btn-close {
      background: none;
      border: none;
      font-size: 1.75rem;
      cursor: pointer;
      color: #666;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s;
    }
    
    .btn-close:hover {
      background: #f0f0f0;
    }
    
    .ticket-preview-area {
      margin-bottom: 1rem;
    }
    
    /* NUEVO: Sección de compartir */
    .share-section {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    
    .share-section h4 {
      margin: 0 0 0.75rem 0;
      font-size: 0.95rem;
      color: #555;
    }
    
    .share-inputs {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .input-group {
      display: flex;
      flex-direction: column;
    }
    
    .input-group label {
      font-size: 0.8rem;
      color: #666;
      margin-bottom: 0.25rem;
    }
    
    .input-with-btn {
      display: flex;
      gap: 0.5rem;
    }
    
    .input-with-btn input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.9rem;
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }
    
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .btn-whatsapp {
      background: #25D366;
      color: white;
    }
    
    .btn-whatsapp:hover:not(:disabled) {
      background: #128C7E;
    }
    
    .btn-email {
      background: #EA4335;
      color: white;
    }
    
    .btn-email:hover:not(:disabled) {
      background: #D33B28;
    }
    
    .btn-native {
      background: #4285F4;
      color: white;
      width: 100%;
      justify-content: center;
      margin-top: 0.75rem;
    }
    
    .btn-native:hover {
      background: #3367D6;
    }
    
    .share-native {
      margin-top: 0.5rem;
    }
    
    .ticket-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .ticket-actions .btn {
      justify-content: center;
    }
    
    .btn-secondary { background: #6c757d; color: white; }
    .btn-secondary:hover { background: #5a6268; }
    
    .btn-primary { background: #3498db; color: white; }
    .btn-primary:hover { background: #2980b9; }
    
    .btn-success { background: #27ae60; color: white; }
    .btn-success:hover { background: #219a52; }
    
    .ticket-config {
      display: flex;
      gap: 1rem;
      align-items: center;
      justify-content: center;
      padding-top: 0.75rem;
      border-top: 1px solid #eee;
    }
    
    .ticket-config label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #555;
    }
    
    .ticket-config select {
      padding: 0.25rem;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
    
    .checkbox-label {
      cursor: pointer;
    }
    
    .checkbox-label input {
      cursor: pointer;
    }
  `]
})
export class TicketPreviewComponent implements OnChanges {
  private ticketService = inject(TicketPrintService);
  private sanitizer = inject(DomSanitizer);
  private shareService = inject(ShareService);
  
  @Input() sale: PrintableSale | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  
  pdfUrl: SafeResourceUrl | null = null;
  selectedWidth: 58 | 80 = 80;
  includeQR = true;
  
  // NUEVO: Campos para compartir
  whatsAppNumber = '';
  emailAddress = '';
  
  private currentBlob: Blob | null = null;
  
  ngOnChanges() {
    if (this.isOpen && this.sale) {
      this.regenerate();
    }
  }
  
  async regenerate() {
    if (!this.sale) return;
    
    const blob = await this.ticketService.generateBlob(this.sale, {
      ticketWidth: this.selectedWidth,
      includeQR: this.includeQR
    });
    this.currentBlob = blob;
    const url = URL.createObjectURL(blob);
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  
  async print() {
    if (!this.sale) return;
    await this.ticketService.generateAndPrint(this.sale, {
      ticketWidth: this.selectedWidth,
      includeQR: this.includeQR
    });
  }
  
  async printSilently() {
    if (!this.sale) return;
    await this.ticketService.printSilently(this.sale, {
      ticketWidth: this.selectedWidth,
      includeQR: this.includeQR
    });
  }
  
  async download() {
    if (!this.sale) return;
    await this.ticketService.downloadTicket(this.sale, {
      ticketWidth: this.selectedWidth,
      includeQR: this.includeQR
    });
  }
  
  // NUEVO: Compartir por WhatsApp
  async shareViaWhatsApp(): Promise<void> {
    if (!this.sale || !this.currentBlob) return;
    
    const file = new File([this.currentBlob], `TICKET-${this.sale.saleNumber}.pdf`, {
      type: 'application/pdf'
    });
    
    this.shareService.shareViaWhatsApp({
      phone: this.whatsAppNumber,
      body: `Hola ${this.sale.customerName}, aquí está tu ticket de compra en Apple Store Potosí.\n\n` +
            `Venta: ${this.sale.saleNumber}\n` +
            `Total: $${this.sale.totalAmount.toFixed(2)}\n` +
            `Fecha: ${new Date(this.sale.saleDate).toLocaleDateString()}`,
      file: file
    });
  }
  
  // NUEVO: Compartir por Email
  async shareViaEmail(): Promise<void> {
    if (!this.sale || !this.currentBlob) return;
    
    const file = new File([this.currentBlob], `TICKET-${this.sale.saleNumber}.pdf`, {
      type: 'application/pdf'
    });
    
    this.shareService.shareViaEmail({
      email: this.emailAddress,
      subject: `Ticket de Compra - ${this.sale.saleNumber} - Apple Store Potosí`,
      body: `Estimado(a) ${this.sale.customerName},\n\n` +
            `Adjunto encontrarás el ticket de tu compra.\n\n` +
            `Detalles:\n` +
            `- Número: ${this.sale.saleNumber}\n` +
            `- Total: $${this.sale.totalAmount.toFixed(2)}\n` +
            `- Fecha: ${new Date(this.sale.saleDate).toLocaleDateString()}\n\n` +
            `Gracias por tu preferencia.\nApple Store Potosí`,
      file: file
    });
  }
  
  // NUEVO: Compartir nativo
  async nativeShare(): Promise<void> {
    if (!this.sale || !this.currentBlob) return;
    
    const file = new File([this.currentBlob], `TICKET-${this.sale.saleNumber}.pdf`, {
      type: 'application/pdf'
    });
    
    const success = await this.shareService.nativeShare(
      file,
      `Ticket ${this.sale.saleNumber}`,
      `Ticket de compra - Total: $${this.sale.totalAmount.toFixed(2)}`
    );
    
    if (!success) {
      alert('Tu dispositivo no soporta compartir archivos nativamente. Usa WhatsApp o Email.');
    }
  }
  
  ngOnDestroy() {
    if (this.currentBlob) {
      URL.revokeObjectURL(URL.createObjectURL(this.currentBlob));
    }
  }
}