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
  qrUrl: string;
}

@Injectable({ providedIn: 'root' })
export class TelegramService {
  private readonly botToken = environment.telegramBotToken;
  private readonly chatId = environment.telegramChatId;

  private readonly apiUrl = `https://api.telegram.org/bot${this.botToken}`;

  constructor(private http: HttpClient) {}

  /**
   * Envía mensaje de texto simple (sin formato)
   */
  async sendMessage(text: string): Promise<boolean> {
    try {
      const body = {
        chat_id: this.chatId,
        text,
        link_preview_options: { is_disabled: true }
      };
      await lastValueFrom(this.http.post(`${this.apiUrl}/sendMessage`, body));
      console.log('✅ Mensaje enviado a Telegram');
      return true;
    } catch (error) {
      console.error('❌ Error enviando a Telegram:', error);
      return false;
    }
  }

  /**
   * Envía notificación de venta con link clickeable.
   * Usa parse_mode HTML — más simple y robusto que MarkdownV2.
   * Solo requiere escapar & < > " en el texto; la URL va sin modificar.
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

    // En HTML mode solo hay que escapar estos 4 caracteres en texto plano.
    // La URL dentro de href NO se escapa (ya viene bien formada).
    const e = (t: string): string =>
      t.replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;');

    const message =
      `🍎 <b>APPLE STORE POTOSÍ — TICKET DE VENTA</b>\n\n` +
      `<b>N°:</b> ${e(sale.saleNumber)}\n` +
      `<b>Fecha:</b> ${e(fechaStr)}\n` +
      `<b>Hora:</b> ${e(horaStr)}\n` +
      `<b>Cliente:</b> ${e(sale.customerName)}\n` +
      `<b>Cajero:</b> ${e(sale.cashierName)}\n\n` +
      `💵 <b>SUBTOTAL:</b> $${sale.subtotal.toFixed(2)}\n\n` +
      `🔗 <b>COMPROBANTE:</b> <a href="${sale.qrUrl}">Ver detalles con QR</a>\n\n` +
      `#venta #applestore`;

    return await this.sendHtmlMessage(message);
  }

  /**
   * Envía mensaje con parse_mode HTML.
   * Soporta: <b>, <i>, <code>, <a href="...">, entre otros.
   */
  async sendHtmlMessage(text: string): Promise<boolean> {
    try {
      const body = {
        chat_id: this.chatId,
        text,
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true }
      };
      await lastValueFrom(this.http.post(`${this.apiUrl}/sendMessage`, body));
      console.log('✅ Mensaje HTML enviado a Telegram');
      return true;
    } catch (error: any) {
      console.error('❌ Error enviando HTML a Telegram:', error);
      if (error.error?.description) {
        console.error('Error Telegram:', error.error.description);
      }
      return false;
    }
  }
}