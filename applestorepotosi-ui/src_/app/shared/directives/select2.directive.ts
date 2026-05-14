import { Directive, ElementRef, AfterViewInit, OnDestroy, Input } from '@angular/core';

declare var $: any;

@Directive({
  selector: '[appSelect2]',
  standalone: true
})
export class Select2Directive implements AfterViewInit, OnDestroy {
  @Input() select2Options: any = {};

  ////////////////////////////////////////////////////////////////////////////////
  ///       PARA USAR EN EL COMPONENTE
  /// 1. Importar la directiva: imports: [Select2Directive],
  /// 2. Agregar al select: <select appSelect2></select>
  ///    Ej.:
  ///   <select class="form-select" appSelect2 data-control="select2" data-placeholder="Seleccione una opción">
  ///           <option></option>
  ///           <option value="1">Opción 1</option>
  ///           <option value="2">Opción 2</option>
  ///   </select>
////////////////////////////////////////////////////////////////////////////////

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.initSelect2();
  }

  ngOnDestroy(): void {
    this.destroySelect2();
  }

  private initSelect2(): void {
    if (typeof $ !== 'undefined' && $.fn.select2) {
      const $element = $(this.el.nativeElement);
      
      // Opciones por defecto
      const defaultOptions = {
        minimumResultsForSearch: Infinity,
        placeholder: $element.data('placeholder') || 'Seleccione una opción',
        allowClear: $element.data('allow-clear') === true,
        width: '100%'
      };

      // Combinar opciones por defecto con las personalizadas
      const options = { ...defaultOptions, ...this.select2Options };

      // Inicializar Select2
      $element.select2(options);
    }
  }

  private destroySelect2(): void {
    if (typeof $ !== 'undefined' && $.fn.select2) {
      const $element = $(this.el.nativeElement);
      if ($element.hasClass('select2-hidden-accessible')) {
        $element.select2('destroy');
      }
    }
  }
}