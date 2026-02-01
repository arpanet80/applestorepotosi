import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertResult } from 'sweetalert2';

export interface AlertConfig {
  title?: string;
  message: string;
  icon?: SweetAlertIcon;
  confirmButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SweetAlertService {

  constructor() {}

  /*/////// COMO SE USA /////////////////*/
  /*
    private sweetAlertService = inject(SweetAlertService);

    showSuccess() {
        this.alertService.success('Operación completada exitosamente');
    }

    async showConfirm() {
        const result = await this.alertService.confirm(
        '¿Deseas continuar con esta acción?'
        );
        
        if (result.isConfirmed) {
        this.alertService.toastSuccess('Acción confirmada');
        }
    }

    async showDelete() {
        const result = await this.alertService.confirmDelete(
        'Este registro será eliminado permanentemente'
        );
        
        if (result.isConfirmed) {
        // Lógica de eliminación
        this.alertService.success('Registro eliminado correctamente');
        }
    }

    showToast() {
        this.alertService.toastSuccess('Guardado correctamente');
    }

    async showInput() {
        const result = await this.alertService.input(
        'Por favor ingresa tu nombre',
        'Registro de usuario'
        );
        
        if (result.isConfirmed && result.value) {
        console.log('Nombre ingresado:', result.value);
        }
    }

    showLoading() {
        this.alertService.loading('Procesando datos...');
        
        // Simular proceso
        setTimeout(() => {
        this.alertService.close();
        this.alertService.success('Proceso completado');
        }, 2000);
    }
    */

  /**
   * Muestra una alerta de éxito
   */
  success(message: string, title: string = '¡Éxito!'): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#28a745',
      timer: 3000,
      timerProgressBar: true
    });
  }

  /**
   * Muestra una alerta de error
   */
  error(message: string, title: string = 'Error'): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#dc3545'
    });
  }

  /**
   * Muestra una alerta de advertencia
   */
  warning(message: string, title: string = 'Advertencia'): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'warning',
      title: title,
      text: message,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#ffc107'
    });
  }

  /**
   * Muestra una alerta informativa
   */
  info(message: string, title: string = 'Información'): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'info',
      title: title,
      text: message,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#17a2b8'
    });
  }

  /**
   * Muestra una alerta de confirmación con botones Sí/No
   */
  confirm(
    message: string,
    title: string = '¿Estás seguro?',
    confirmText: string = 'Sí, continuar',
    cancelText: string = 'Cancelar',
    html: boolean = false
  ): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'question',
      title: title,
      html: html ? message : undefined, // ← clave
      text: html ? undefined : message,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    });
  }

  /**
   * Muestra una confirmación de eliminación
   */
  confirmDelete(
    message: string = 'Esta acción no se puede deshacer',
    title: string = '¿Eliminar registro?'
  ): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'warning',
      title: title,
      text: message,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    });
  }

  /**
   * Muestra un toast (notificación pequeña)
   */
  toast(
    message: string, 
    icon: SweetAlertIcon = 'success',
    position: 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start' = 'top-end'
  ): Promise<SweetAlertResult> {
    const Toast = Swal.mixin({
      toast: true,
      position: position,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    return Toast.fire({
      icon: icon,
      title: message
    });
  }

  /**
   * Muestra un loading/cargando
   */
  loading(message: string = 'Cargando...', title: string = 'Por favor espera'): void {
    Swal.fire({
      title: title,
      text: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  /**
   * Cierra cualquier alerta abierta
   */
  close(): void {
    Swal.close();
  }

  /**
   * Alerta con HTML personalizado
   */
  html(htmlContent: string, title: string = '', icon?: SweetAlertIcon): Promise<SweetAlertResult> {
    return Swal.fire({
      title: title,
      html: htmlContent,
      icon: icon,
      confirmButtonText: 'Cerrar'
    });
  }

  /**
   * Alerta con input de texto
   */
  input(
    message: string,
    title: string = 'Ingresa un valor',
    inputPlaceholder: string = '',
    inputType: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' = 'text'
  ): Promise<SweetAlertResult> {
    return Swal.fire({
      title: title,
      text: message,
      input: inputType,
      inputPlaceholder: inputPlaceholder,
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      inputValidator: (value) => {
        if (!value) {
          return 'Este campo es requerido';
        }
        return null;
      }
    });
  }

  /**
   * Alerta con textarea
   */
  textarea(
    message: string,
    title: string = 'Escribe tu mensaje',
    inputPlaceholder: string = ''
  ): Promise<SweetAlertResult> {
    return Swal.fire({
      title: title,
      text: message,
      input: 'textarea',
      inputPlaceholder: inputPlaceholder,
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      inputValidator: (value) => {
        if (!value) {
          return 'Este campo es requerido';
        }
        return null;
      }
    });
  }

  /**
   * Alerta con select/dropdown
   */
  select(
    message: string,
    options: { [key: string]: string },
    title: string = 'Selecciona una opción',
    inputPlaceholder: string = 'Seleccionar...'
  ): Promise<SweetAlertResult> {
    return Swal.fire({
      title: title,
      text: message,
      input: 'select',
      inputOptions: options,
      inputPlaceholder: inputPlaceholder,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes seleccionar una opción';
        }
        return null;
      }
    });
  }

  /**
   * Alerta personalizada con configuración completa
   */
  custom(config: AlertConfig): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: config.icon || 'info',
      title: config.title || '',
      text: config.message,
      confirmButtonText: config.confirmButtonText || 'Aceptar',
      cancelButtonText: config.cancelButtonText || 'Cancelar',
      showCancelButton: config.showCancelButton || false,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d'
    });
  }

  /**
   * Toast de éxito rápido
   */
  toastSuccess(message: string): Promise<SweetAlertResult> {
    return this.toast(message, 'success');
  }

  /**
   * Toast de error rápido
   */
  toastError(message: string): Promise<SweetAlertResult> {
    return this.toast(message, 'error');
  }

  /**
   * Toast de advertencia rápido
   */
  toastWarning(message: string): Promise<SweetAlertResult> {
    return this.toast(message, 'warning');
  }

  /**
   * Toast informativo rápido
   */
  toastInfo(message: string): Promise<SweetAlertResult> {
    return this.toast(message, 'info');
  }

  /**
   * Alerta de sesión expirada
   */
  sessionExpired(): Promise<SweetAlertResult> {
    return this.warning(
      'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      'Sesión expirada'
    );
  }

  /**
   * Alerta de permisos insuficientes
   */
  unauthorized(): Promise<SweetAlertResult> {
    return this.warning(
      'No tienes permisos para realizar esta acción.',
      'Acceso denegado'
    );
  }

  /**
   * Alerta de validación de formulario
   */
  validationError(message: string = 'Por favor, verifica los campos del formulario'): Promise<SweetAlertResult> {
    return this.error(message, 'Error de validación');
  }

  /**
   * Alerta de error del servidor
   */
  serverError(message: string = 'Ha ocurrido un error en el servidor'): Promise<SweetAlertResult> {
    return this.error(message, 'Error del servidor');
  }

  /**
   * Alerta de error de red
   */
  networkError(message: string = 'No se pudo conectar con el servidor'): Promise<SweetAlertResult> {
    return this.error(message, 'Error de conexión');
  }
}