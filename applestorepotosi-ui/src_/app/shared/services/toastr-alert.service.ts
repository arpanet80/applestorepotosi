import { inject, Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

export interface ToastConfig {
  title?: string;
  message: string;
  options?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ToastrAlertService {
    private toastr = inject ( ToastrService )

    /*///////// COMO USAR /////////////////
    /*

    private alertService = inject(ToastrAlertService);

    <button (click)="showSuccess()">Success</button>
    <button (click)="showError()">Error</button>
    <button (click)="showWarning()">Warning</button>
    
    showSuccess() {
        this.alertService.success('Operación exitosa');
    }

    showError() {
        this.alertService.error('Ha ocurrido un error');
    }

    showWarning() {
        this.alertService.warning('Ten cuidado con esta acción');
    }
    */

  /**
   * Muestra una alerta de éxito
   */
  success(message: string, title: string = 'Éxito'): void {
    this.toastr.success(message, title, {
      timeOut: 3000,
      progressBar: true,
      closeButton: true
    });
  }

  /**
   * Muestra una alerta de error
   */
  error(message: string, title: string = 'Error'): void {
    this.toastr.error(message, title, {
      timeOut: 5000,
      progressBar: true,
      closeButton: true,
      enableHtml: true
    });
  }

  /**
   * Muestra una alerta de advertencia
   */
  warning(message: string, title: string = 'Advertencia'): void {
    this.toastr.warning(message, title, {
      timeOut: 4000,
      progressBar: true,
      closeButton: true
    });
  }

  /**
   * Muestra una alerta informativa
   */
  info(message: string, title: string = 'Información'): void {
    this.toastr.info(message, title, {
      timeOut: 3500,
      progressBar: true,
      closeButton: true
    });
  }

  /**
   * Muestra una alerta personalizada con configuración específica
   */
  custom(config: ToastConfig, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    const defaultOptions = {
      timeOut: 3000,
      progressBar: true,
      closeButton: true
    };

    const options = { ...defaultOptions, ...config.options };

    this.toastr[type](config.message, config.title || '', options);
  }

  /**
   * Limpia todas las alertas activas
   */
  clear(): void {
    this.toastr.clear();
  }

  /**
   * Muestra una alerta de confirmación de operación
   */
  confirmAction(message: string): void {
    this.success(message, 'Acción completada');
  }

  /**
   * Muestra un error de validación
   */
  validationError(message: string = 'Por favor, verifica los campos del formulario'): void {
    this.error(message, 'Error de validación');
  }

  /**
   * Muestra un error de servidor
   */
  serverError(message: string = 'Ha ocurrido un error en el servidor'): void {
    this.error(message, 'Error del servidor');
  }

  /**
   * Muestra un error de red
   */
  networkError(message: string = 'No se pudo conectar con el servidor'): void {
    this.error(message, 'Error de conexión');
  }

  /**
   * Muestra alerta de sesión expirada
   */
  sessionExpired(): void {
    this.warning('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'Sesión expirada');
  }

  /**
   * Muestra alerta de permisos insuficientes
   */
  unauthorized(): void {
    this.warning('No tienes permisos para realizar esta acción.', 'Acceso denegado');
  }
}