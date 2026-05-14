import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, TemplateRef, OnInit } from '@angular/core';

declare const bootstrap: any; // Bootstrap 5 global

@Component({
  selector: 'app-generic-modal',
  imports: [CommonModule],
  templateUrl: './generic-modal.html',
  styleUrls: ['./generic-modal.css']
})
export class GenericModalComponent implements OnInit {
  @Input() modalId = 'keenModal'; // ID único por instancia
  @Input() title = 'Modal';
  @Input() width = '650px'; // ancho deseado ej: "800px"
  @Input() height = 'auto'; // alto ej: "600px"
  @Input() contentTemplate!: TemplateRef<any>; // Template con el contenido
  @Input() showSaveButton = true;

  @Output() saveClicked = new EventEmitter<void>();

  private modalInstance: any;
  private trigger?: HTMLElement;

  ngOnInit() {
    // Opcional: ajustar tamaño con variables CSS
    setTimeout(() => {
      const el = document.getElementById(this.modalId);
      if (el) {
        (el.querySelector('.modal-dialog') as HTMLElement).style.maxWidth = this.width;
        (el.querySelector('.modal-content') as HTMLElement).style.height = this.height;
      }
    });
  }

  open() {
    this.trigger = document.activeElement as HTMLElement; 
    const el = document.getElementById(this.modalId);
    if (el) {
      this.modalInstance = new bootstrap.Modal(el);
      this.modalInstance.show();
    }
  }

  close(): void {
    (document.activeElement as HTMLElement)?.blur();
    if (!this.modalInstance) return;

    // restaurar scroll cuando el modal ya esté oculto
    this.modalInstance._element.addEventListener(
      'hidden.bs.modal',
      () => {
        document.body.classList.remove('modal-open', 'kt-modal-open', 'kt-scroll-lock');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'auto';
        this.trigger?.focus();
      },
      { once: true }
    );

    this.modalInstance.hide();
    this.modalInstance = null;
  }

  /* ---- helpers ---- */
  private getActiveElement(): Element | null {
    return document.activeElement;
  }

  private elementContains(el: Element): boolean {
    const modalEl = document.getElementById(this.modalId);
    return modalEl ? modalEl.contains(el) : false;
  }

  onSave() {
    this.saveClicked.emit();
    this.close();
  }
}