import { Injectable } from '@angular/core';

export interface ShareOptions {
  phone?: string;
  email?: string;
  subject?: string;
  body?: string;
  file?: File;
  fileName?: string;
}

@Injectable({ providedIn: 'root' })
export class ShareService {
  
  /**
   * Comparte por WhatsApp Web (abre nueva ventana)
   */
  shareViaWhatsApp(options: ShareOptions): void {
    const { phone, body, file } = options;
    
    // Si hay archivo, primero subir a cloud temporal o usar data URL
    if (file) {
      // Crear URL temporal para el archivo
      const fileUrl = URL.createObjectURL(file);
      
      // Mensaje con link (nota: WhatsApp Web no permite adjuntos directos desde web)
      const message = encodeURIComponent(`${body}\n\nTicket: ${fileUrl}`);
      
      // Abrir WhatsApp Web
      const whatsappUrl = phone 
        ? `https://wa.me/${this.cleanPhone(phone)}?text=${message}`
        : `https://web.whatsapp.com/send?text=${message}`;
      
      window.open(whatsappUrl, '_blank');
    } else {
      // Solo texto
      const message = encodeURIComponent(body || '');
      const whatsappUrl = phone 
        ? `https://wa.me/${this.cleanPhone(phone)}?text=${message}`
        : `https://web.whatsapp.com/send?text=${message}`;
      
      window.open(whatsappUrl, '_blank');
    }
  }

  /**
   * Comparte por Email (mailto)
   */
  shareViaEmail(options: ShareOptions): void {
    const { email, subject, body, file } = options;
    
    if (file) {
      // Para archivos, usar Web Share API si está disponible
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: subject || 'Ticket de Venta',
          text: body || 'Adjunto encontrarás tu ticket de compra.'
        });
        return;
      }
      
      // Fallback: abrir Gmail con datos
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email || ''}&su=${encodeURIComponent(subject || 'Ticket de Venta')}&body=${encodeURIComponent(body || '')}`;
      window.open(gmailUrl, '_blank');
    } else {
      // Mailto tradicional
      const mailtoUrl = `mailto:${email || ''}?subject=${encodeURIComponent(subject || 'Ticket de Venta')}&body=${encodeURIComponent(body || '')}`;
      window.location.href = mailtoUrl;
    }
  }

  /**
   * Web Share API nativa (móvil/desktop moderno)
   */
  async nativeShare(file: File, title: string, text: string): Promise<boolean> {
    if (!navigator.share) return false;
    
    try {
      await navigator.share({
        files: [file],
        title: title,
        text: text
      });
      return true;
    } catch (err) {
      console.log('Share cancelled or failed:', err);
      return false;
    }
  }

  /**
   * Descargar archivo
   */
  downloadFile(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private cleanPhone(phone: string): string {
    return phone.replace(/\D/g, '').replace(/^0/, '');
  }
}