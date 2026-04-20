import { inject, Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as QRCode from 'qrcode';
import { TelegramService } from './telegram.service'; 
import { environment } from '../../../environments/environment';

export interface TicketConfig {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessRUC?: string;  // NIT/RUC para facturación
  ticketWidth: 58 | 80;  // mm - ancho de impresora térmica
  logoBase64?: string;   // Logo en base64 (opcional)
  includeQR?: boolean;
  qrUrl?: string;
}

export interface PrintableSale {
  saleNumber: string;
  saleDate: Date;
  customerName: string;
  customerNIT?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentReference?: string;
  cashierName: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class TicketPrintService {
  
  private telegramService = inject(TelegramService);
  
  private defaultConfig: TicketConfig = {
    businessName: 'APPLE STORE POTOSÍ',
    businessAddress: 'Calle Ayacucho #123, Potosí - Bolivia',
    businessPhone: '+591 2 6222222',
    businessRUC: '123456789',
    ticketWidth: 80,
    includeQR: true,
    qrUrl: environment.telegramBotToken ? 
      `https://api.telegram.org/bot${environment.telegramBotToken}` : 
      'https://applestorepotosi.com/verify'
  };

  constructor() {}

  /* Genera URL de verificación con QR
  * Usa la URL actual del frontend + /verify
  */
  generateVerificationUrl(sale: PrintableSale): string {
    // Obtener URL base actual (dominio donde está corriendo la app)
    const baseUrl = environment.publicUrl || window.location.origin;
    // const baseUrl = window.location.origin; // Ej: http://localhost:4200 o https://tudominio.com

    const params = new URLSearchParams({
      sale: sale.saleNumber,
      date: sale.saleDate.getTime().toString(),
      total: sale.totalAmount.toString(),
      customer: sale.customerName
    });
    
    // const params = new URLSearchParams({
    //   sale: sale.saleNumber
    // });
    
    return `${baseUrl}/verify?${params.toString()}`;
  }

  /**
   * Flujo completo: Imprimir + Notificar Telegram (solo mensaje, no PDF)
   */
  async processSaleComplete(
    sale: PrintableSale, 
    config?: Partial<TicketConfig>
  ): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // 1. Generar URL de verificación para el QR
    const verificationUrl = this.generateVerificationUrl(sale);
    
    // 2. ENVIAR NOTIFICACIÓN A TELEGRAM (solo mensaje, no PDF)
    // No esperamos la respuesta para no bloquear la impresión
    this.telegramService.sendSaleNotification({
      saleNumber: sale.saleNumber,
      saleDate: sale.saleDate,
      customerName: sale.customerName,
      cashierName: sale.cashierName,
      subtotal: sale.subtotal,
      qrUrl: verificationUrl
    }).then(sent => {
      if (sent) {
        console.log('✅ Notificación enviada al grupo de Telegram');
      }
    });

    // 3. Generar PDF con QR para impresión local
    const doc = await this.createTicketPDF(sale, {
      ...finalConfig,
      qrUrl: verificationUrl  // El QR del ticket apunta a la verificación
    });
    
    // 4. Abrir para impresión local
    const pdfUrl = doc.output('bloburl');
    const printWindow = window.open(pdfUrl, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }


  /**
   * Genera QR como data URL
   */
  async generateQRDataURL(text: string): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        width: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (err) {
      console.error('QR generation failed:', err);
      return '';
    }
  }

  /**
   * Genera y abre el ticket para impresión (async por el QR)
   */
  async generateAndPrint(sale: PrintableSale, config?: Partial<TicketConfig>): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const doc = await this.createTicketPDF(sale, finalConfig);
    
    const pdfUrl = doc.output('bloburl');
    const printWindow = window.open(pdfUrl, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }

  /**
   * Genera el PDF y retorna el Blob (async)
   */
  async generateBlob(sale: PrintableSale, config?: Partial<TicketConfig>): Promise<Blob> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const doc = await this.createTicketPDF(sale, finalConfig);
    return doc.output('blob');
  }

  /**
   * Descarga el ticket como archivo PDF (async)
   */
  async downloadTicket(sale: PrintableSale, config?: Partial<TicketConfig>): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const doc = await this.createTicketPDF(sale, finalConfig);
    const fileName = `TICKET-${sale.saleNumber}-${this.formatDateFile(sale.saleDate)}.pdf`;
    doc.save(fileName);
  }

  /**
   * Imprime directamente (async)
   */
  async printSilently(sale: PrintableSale, config?: Partial<TicketConfig>): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const doc = await this.createTicketPDF(sale, finalConfig);
    
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    iframe.src = pdfUrl;
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(pdfUrl);
      }, 1000);
    };
  }

  /**
   * Crea PDF con altura dinámica y QR opcional
   */
  private async createTicketPDF(sale: PrintableSale, config: TicketConfig): Promise<jsPDF> {
    const pageWidth = config.ticketWidth === 58 ? 58 : 80;
    
    // Generar QR si está habilitado
    let qrDataUrl = '';
    if (config.includeQR && config.qrUrl) {
      const verificationUrl = `${config.qrUrl}?sale=${sale.saleNumber}&total=${sale.totalAmount}&date=${sale.saleDate.getTime()}`;
      qrDataUrl = await this.generateQRDataURL(verificationUrl);
    }

    // Calcular altura necesaria
    const tempDoc = new jsPDF({
      unit: 'mm',
      format: [pageWidth, 1000],
      orientation: 'portrait'
    });

    let yPosition = 5;
    const margin = 3;

    tempDoc.setFont('courier', 'normal');

    // Encabezado
    tempDoc.setFontSize(10);
    tempDoc.setFont('courier', 'bold');
    const businessNameLines = this.wrapText(config.businessName, 16);
    yPosition += businessNameLines.length * 4;

    tempDoc.setFontSize(8);
    tempDoc.setFont('courier', 'normal');
    if (config.businessRUC) yPosition += 3;
    if (config.businessAddress) {
      const addressLines = this.wrapText(config.businessAddress, 25);
      yPosition += addressLines.length * 3;
    }
    if (config.businessPhone) yPosition += 3;
    yPosition += 6;

    // Info de venta
    yPosition += 5 + 4 * 4 + 4 + 4 + 5;

    // Items
    yPosition += 5 + 4;
    sale.items.forEach(() => {
      yPosition += 3.5 + 4 + 3;
    });

    // Totales
    yPosition += 5 + 4 + 4 + 5 + 4 + 4 + 5;

    // Pie de página
    yPosition += 5 + 4 + 4;
    if (sale.notes) {
      yPosition += 2;
      const noteLines = this.wrapText(sale.notes, 30);
      yPosition += noteLines.length * 3;
    }

    // ESPACIO PARA QR
    if (qrDataUrl) {
      yPosition += 5;
      yPosition += 30;
      yPosition += 4;
    }

    yPosition += 5;

    const finalHeight = yPosition + 5;

    // Crear documento final
    const doc = new jsPDF({
      unit: 'mm',
      format: [pageWidth, finalHeight],
      orientation: 'portrait',
      putOnlyUsedFonts: true,
      floatPrecision: 16
    });

    // Dibujar contenido
    yPosition = 5;
    
    // ENCABEZADO
    doc.setFontSize(10);
    doc.setFont('courier', 'bold');
    businessNameLines.forEach(line => {
      this.centerText(doc, line, yPosition, pageWidth);
      yPosition += 4;
    });

    doc.setFontSize(8);
    doc.setFont('courier', 'normal');
    if (config.businessRUC) {
      this.centerText(doc, `NIT: ${config.businessRUC}`, yPosition, pageWidth);
      yPosition += 3;
    }
    if (config.businessAddress) {
      const addressLines = this.wrapText(config.businessAddress, 25);
      addressLines.forEach(line => {
        this.centerText(doc, line, yPosition, pageWidth);
        yPosition += 3;
      });
    }
    if (config.businessPhone) {
      this.centerText(doc, `Tel: ${config.businessPhone}`, yPosition, pageWidth);
      yPosition += 3;
    }

    yPosition += 2;
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 4;

    // INFO VENTA
    doc.setFontSize(9);
    doc.setFont('courier', 'bold');
    doc.text('TICKET DE VENTA', margin, yPosition);
    yPosition += 5;

    doc.setFontSize(8);
    doc.setFont('courier', 'normal');
    doc.text(`N°: ${sale.saleNumber}`, margin, yPosition);
    yPosition += 4;
    doc.text(`Fecha: ${this.formatDate(sale.saleDate)}`, margin, yPosition);
    yPosition += 4;
    doc.text(`Hora: ${this.formatTime(sale.saleDate)}`, margin, yPosition);
    yPosition += 4;
    doc.text(`Cliente: ${this.truncate(sale.customerName, 20)}`, margin, yPosition);
    yPosition += 4;
    if (sale.customerNIT) {
      doc.text(`NIT/CI: ${sale.customerNIT}`, margin, yPosition);
      yPosition += 4;
    }
    doc.text(`Cajero: ${this.truncate(sale.cashierName, 20)}`, margin, yPosition);
    yPosition += 5;

    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 4;

    // ITEMS
    doc.setFont('courier', 'bold');
    doc.text('CANT  DESCRIPCION         P.U.   TOTAL', margin, yPosition);
    yPosition += 4;
    doc.setFont('courier', 'normal');

    sale.items.forEach(item => {
      const name = this.truncate(item.name, 18);
      const qty = item.quantity.toString().padStart(3);
      const price = this.formatCurrency(item.unitPrice).padStart(6);
      const total = this.formatCurrency(item.subtotal).padStart(7);
      
      doc.text(`${qty}  ${name}`, margin, yPosition);
      yPosition += 3.5;
      
      const priceLine = `      ${price}  ${total}`;
      doc.text(priceLine, margin, yPosition);
      yPosition += 4;

      if (item.discount > 0) {
        doc.text(`      (-${this.formatCurrency(item.discount)})`, margin, yPosition);
        yPosition += 3;
      }
    });

    // TOTALES
    yPosition += 1;
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 4;

    const colValue = pageWidth - margin - 15;
    
    doc.setFont('courier', 'normal');
    doc.text('SUBTOTAL:', margin, yPosition);
    doc.text(this.formatCurrency(sale.subtotal), colValue, yPosition, { align: 'right' });
    yPosition += 4;

    if (sale.discountAmount > 0) {
      doc.text('DESCUENTO:', margin, yPosition);
      doc.text(`-${this.formatCurrency(sale.discountAmount)}`, colValue, yPosition, { align: 'right' });
      yPosition += 4;
    }

    doc.text('IMPUESTO (16%):', margin, yPosition);
    doc.text(this.formatCurrency(sale.taxAmount), colValue, yPosition, { align: 'right' });
    yPosition += 5;

    doc.setFont('courier', 'bold');
    doc.text('TOTAL A PAGAR:', margin, yPosition);
    doc.text(this.formatCurrency(sale.totalAmount), colValue, yPosition, { align: 'right' });
    yPosition += 5;

    doc.setFont('courier', 'normal');
    doc.text(`Pago: ${this.formatPaymentMethod(sale.paymentMethod)}`, margin, yPosition);
    yPosition += 4;
    if (sale.paymentReference) {
      doc.text(`Ref: ${sale.paymentReference}`, margin, yPosition);
      yPosition += 4;
    }

    // PIE DE PÁGINA
    yPosition += 2;
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;

    doc.setFontSize(7);
    this.centerText(doc, 'GRACIAS POR SU COMPRA', yPosition, pageWidth);
    yPosition += 4;
    this.centerText(doc, 'Apple Store Potosí - Calidad Garantizada', yPosition, pageWidth);
    yPosition += 4;

    if (sale.notes) {
      yPosition += 2;
      const noteLines = this.wrapText(sale.notes, 30);
      noteLines.forEach(line => {
        this.centerText(doc, line, yPosition, pageWidth);
        yPosition += 3;
      });
    }

    // CÓDIGO QR
    if (qrDataUrl) {
      yPosition += 5;
      const qrSize = 25;
      const xPos = (pageWidth - qrSize) / 2;
      
      doc.addImage(qrDataUrl, 'PNG', xPos, yPosition, qrSize, qrSize);
      yPosition += qrSize + 2;
      
      doc.setFontSize(6);
      this.centerText(doc, 'Escanea para verificar tu compra', yPosition, pageWidth);
      yPosition += 4;
    }

    // Código de barras simple
    doc.setFontSize(8);
    this.centerText(doc, `| ${sale.saleNumber} |`, yPosition, pageWidth);

    return doc;
  }

  // === UTILIDADES ===

  private centerText(doc: jsPDF, text: string, y: number, pageWidth: number): void {
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
  }

  private wrapText(text: string, maxLength: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);

    return lines.length ? lines : [text.substring(0, maxLength)];
  }

  private truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }

  private formatTime(date: Date): string {
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  private formatDateFile(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`;
  }

  private formatCurrency(amount: number): string {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  private formatPaymentMethod(method: string): string {
    const methods: Record<string, string> = {
      'cash': 'EFECTIVO',
      'card': 'TARJETA',
      'transfer': 'TRANSFERENCIA',
      'digital_wallet': 'BILLETERA DIGITAL'
    };
    return methods[method] || method.toUpperCase();
  }

    /**
   * Genera ticket con corte de papel automático (ESC/POS)
   */
  async generateRawPrint(sale: PrintableSale, config?: Partial<TicketConfig>): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const doc = await this.createTicketPDF(sale, finalConfig);
    
    const pdfBlob = doc.output('blob');
    
    if ('usb' in navigator) {
      await this.printViaUSB(pdfBlob);
    } else {
      await this.generateAndPrint(sale, config);
    }
  }

  private async printViaUSB(blob: Blob): Promise<void> {
    try {
      const device = await (navigator as any).usb.requestDevice({
        filters: [{ vendorId: 0x1234 }]
      });
      // Lógica de impresión USB aquí
      console.log('USB device connected:', device);
    } catch (e) {
      console.error('USB printing failed:', e);
    }
  }


}