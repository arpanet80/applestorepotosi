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
  businessRUC?: string;
  ticketWidth: 58 | 80;
  logoBase64?: string;
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
    businessAddress: 'Calle Litoral #123, Potosí - Bolivia',
    businessPhone: '+591 78712089',
    businessRUC: '123456789',
    ticketWidth: 80,
    includeQR: true,
    qrUrl: environment.telegramBotToken
      ? `https://api.telegram.org/bot${environment.telegramBotToken}`
      : 'https://applestorepotosi.com/verify'
  };

  constructor() {}

  /**
   * Genera URL pública de verificación
   */
  generateVerificationUrl(sale: PrintableSale): string {
    const baseUrl = environment.publicUrl || window.location.origin;
    return `${baseUrl}/verify?sale=${encodeURIComponent(sale.saleNumber)}`;
  }

  /**
   * 🚀 VERSIÓN ULTRARRÁPIDA: Todo en paralelo, sin bloqueos
   * Tiempo objetivo: < 500ms para liberar la UI
   */
  async processSaleComplete(
    sale: PrintableSale,
    config?: Partial<TicketConfig>
  ): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const verificationUrl = this.generateVerificationUrl(sale);

    // === ESTRATEGIA: Todo se dispara INMEDIATAMENTE, sin await entre sí ===

    // 1. TELEGRAM: Fire-and-forget real (no esperamos respuesta)
    this.telegramService.sendSaleNotification({
      saleNumber: sale.saleNumber,
      saleDate: sale.saleDate,
      customerName: sale.customerName,
      cashierName: sale.cashierName,
      subtotal: sale.subtotal,
      qrUrl: verificationUrl
    }).then(sent => {
      if (sent) console.log('✅ Telegram enviado');
    }).catch(() => {
      // Silencioso — no afecta al usuario
    });

    // 2. PDF + IMPRESIÓN: En paralelo a Telegram, sin esperar
    this.generateAndPrint(sale, {
      ...finalConfig,
      qrUrl: verificationUrl
    }).catch(err => {
      console.error('Error generando ticket:', err);
    });

    // 3. Retornar INMEDIATAMENTE — la UI ya está liberada
    return;
  }

  /**
   * Genera QR como data URL — OPTIMIZADO para velocidad
   */
  async generateQRDataURL(text: string): Promise<string> {
    return new Promise((resolve) => {
      QRCode.toDataURL(text, {
        width: 80,
        margin: 0,
        errorCorrectionLevel: 'L',
        rendererOpts: { quality: 0.3 }
      }, (err, url) => {
        if (err) {
          console.error('QR generation failed:', err);
          resolve('');
        } else {
          resolve(url);
        }
      });
    });
  }

  /**
   * Genera y abre el ticket para impresión
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
   * Genera el PDF y retorna el Blob
   */
  async generateBlob(sale: PrintableSale, config?: Partial<TicketConfig>): Promise<Blob> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const doc = await this.createTicketPDF(sale, finalConfig);
    return doc.output('blob');
  }

  /**
   * Descarga el ticket como archivo PDF
   */
  async downloadTicket(sale: PrintableSale, config?: Partial<TicketConfig>): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const doc = await this.createTicketPDF(sale, finalConfig);
    const fileName = `TICKET-${sale.saleNumber}-${this.formatDateFile(sale.saleDate)}.pdf`;
    doc.save(fileName);
  }

  /**
   * Imprime directamente
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
   * OPTIMIZADO: QR se genera en paralelo al cálculo de altura
   */
  private async createTicketPDF(sale: PrintableSale, config: TicketConfig): Promise<jsPDF> {
    const pageWidth = config.ticketWidth === 58 ? 58 : 80;

    // === OPTIMIZACIÓN: Generar QR EN PARALELO con el cálculo de altura ===
    let qrPromise: Promise<string> | null = null;
    if (config.includeQR && config.qrUrl) {
      qrPromise = this.generateQRDataURL(config.qrUrl);
    }

    // Calcular altura (síncrono, rápido)
    let h = this.calculateHeight(sale, config);

    let qrDataUrl = '';
    if (qrPromise) {
      qrDataUrl = await qrPromise; // Esperar solo el QR, ya se generó en paralelo
      if (qrDataUrl) {
        h += 5 + 25 + 2 + 4; // QR + espacio
      }
    }
    h += 5 + 5;

    // Crear PDF
    const doc = new jsPDF({
      unit: 'mm',
      format: [pageWidth, h],
      orientation: 'portrait',
      putOnlyUsedFonts: true,
      floatPrecision: 16
    });

    let yPosition = 5;
    const margin = 3;

    // ENCABEZADO
    doc.setFontSize(10);
    doc.setFont('courier', 'bold');
    const businessNameLines = this.wrapText(config.businessName, 16);
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
      this.wrapText(config.businessAddress, 25).forEach(line => {
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
    doc.text(`N°: ${sale.saleNumber}`, margin, yPosition); yPosition += 4;
    doc.text(`Fecha: ${this.formatDate(sale.saleDate)}`, margin, yPosition); yPosition += 4;
    doc.text(`Hora: ${this.formatTime(sale.saleDate)}`, margin, yPosition); yPosition += 4;
    doc.text(`Cliente: ${this.truncate(sale.customerName, 20)}`, margin, yPosition); yPosition += 4;
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
      doc.text(`${qty}  ${name}`, margin, yPosition); yPosition += 3.5;
      doc.text(`      ${price}  ${total}`, margin, yPosition); yPosition += 4;
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

    // IMPUESTO: Solo si hay monto
    if (sale.taxAmount > 0) {
      doc.text('IMPUESTO:', margin, yPosition);
      doc.text(this.formatCurrency(sale.taxAmount), colValue, yPosition, { align: 'right' });
      yPosition += 4;
    }

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
    this.centerText(doc, 'GRACIAS POR SU COMPRA', yPosition, pageWidth); yPosition += 4;
    this.centerText(doc, 'Apple Store Potosí - Calidad Garantizada', yPosition, pageWidth); yPosition += 4;

    if (sale.notes) {
      yPosition += 2;
      this.wrapText(sale.notes, 30).forEach(line => {
        this.centerText(doc, line, yPosition, pageWidth);
        yPosition += 3;
      });
    }

    // QR
    if (qrDataUrl) {
      yPosition += 5;
      const qrSize = 25;
      doc.addImage(qrDataUrl, 'PNG', (pageWidth - qrSize) / 2, yPosition, qrSize, qrSize);
      yPosition += qrSize + 2;
      doc.setFontSize(6);
      this.centerText(doc, 'Escanea para verificar tu compra', yPosition, pageWidth);
      yPosition += 4;
    }

    doc.setFontSize(8);
    this.centerText(doc, `| ${sale.saleNumber} |`, yPosition, pageWidth);

    return doc;
  }

  // === CÁLCULO DE ALTURA SEPARADO (síncrono, rápido) ===
  private calculateHeight(sale: PrintableSale, config: TicketConfig): number {
    const businessNameLines = this.wrapText(config.businessName, 16);
    let h = 5;
    h += businessNameLines.length * 4;
    if (config.businessRUC) h += 3;
    if (config.businessAddress) h += this.wrapText(config.businessAddress, 25).length * 3;
    if (config.businessPhone) h += 3;
    h += 6 + 5 + 4 * 4 + 4 + 4 + 5;
    h += 5 + 4;
    sale.items.forEach(i => { h += 7.5 + (i.discount > 0 ? 3 : 0); });
    h += 5 + 4 + 4 + 5 + 4 + 4 + 5;
    if (sale.taxAmount > 0) h += 4; // Solo si hay impuesto
    h += 5 + 4 + 4;
    if (sale.notes) h += 2 + this.wrapText(sale.notes, 30).length * 3;
    // QR se añade después si existe
    return h;
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
      console.log('USB device connected:', device);
    } catch (e) {
      console.error('USB printing failed:', e);
    }
  }
}