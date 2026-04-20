import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TelegramMessage {
  chatId: string;
  text?: string;
  file?: Blob;
  fileName?: string;
  caption?: string;
}

export interface SaleNotification {
  saleNumber: string;
  saleDate: Date;
  customerName: string;
  cashierName: string;
  subtotal: number;
  qrUrl: string;  // Enlace con QR para ver detalles
}

@Injectable({ providedIn: 'root' })
export class TelegramService {
  private readonly botToken = environment.telegramBotToken;
  private readonly chatId = environment.telegramChatId;
  
  private readonly apiUrl = `https://api.telegram.org/bot${this.botToken}`;

  constructor(private http: HttpClient) {}

  /**
   * Envía mensaje de texto simple
   */
  async sendMessage(text: string): Promise<boolean> {
    try {
      const url = `${this.apiUrl}/sendMessage`;
      const body = {
        chat_id: this.chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: false  // Permitir preview del link
      };
      
      await lastValueFrom(this.http.post(url, body));
      console.log('✅ Mensaje enviado a Telegram');
      return true;
    } catch (error) {
      console.error('❌ Error enviando a Telegram:', error);
      return false;
    }
  }

  /**
   * Envía notificación de venta al grupo
   */
  async sendSaleNotification(sale: SaleNotification): Promise<boolean> {
    const fecha = new Date(sale.saleDate);
    const fechaStr = fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const horaStr = fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const message = 
      `🍎 <b>APPLE STORE POTOSÍ - TICKET DE VENTA</b>\n\n` +
      `<b>N°:</b> <code>${sale.saleNumber}</code>\n` +
      `<b>Fecha:</b> ${fechaStr}\n` +
      `<b>Hora:</b> ${horaStr}\n` +
      `<b>Cliente:</b> ${sale.customerName}\n` +
      `<b>Cajero:</b> ${sale.cashierName}\n\n` +
      `💵 <b>SUBTOTAL:</b> $${sale.subtotal.toFixed(2)}\n\n` +
      `🔗 <b>COMPROBANTE:</b> <a href="${sale.qrUrl}">Ver detalles con QR</a>\n\n` +
      `#venta #applestore`;

    return await this.sendMessage(message);
  }
}