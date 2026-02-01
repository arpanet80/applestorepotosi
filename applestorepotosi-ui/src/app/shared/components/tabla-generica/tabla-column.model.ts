// Genérico por defecto para que TableColumnSchema funcione fuera del componente
export interface TableColumnSchema<T = any> {
  key: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'avatar' | 'title' | 'subnivel' | 'button' | 'badge';
  keysubnivel?: string;
  buttons?: TableButton<T>[];
  label: string;
  style?: string;               // clases CSS para el <td>
  hidden?: boolean;
  disabled?: boolean;
  required?: boolean;
  badgeStyle?: (value: any, row: T) => BadgeStyle | null; // <-- T ya está definido
  readonly?: boolean;  
}

export interface BadgeStyle {
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  icon?: string; // clase Keen, ej. 'ki-duotone ki-check-circle'
  text?: string; // texto alternativo (si no quieres mostrar el valor original)
}

export interface TableButton<T = any> {
  id: string;
  icon: string;
  colorClass: string;
  tooltip?: string;
  show?: (row: T) => boolean;
  action?: (row: T) => void; 
}

export interface OpcionCustom {
  icono: string;
  colorClass: string;
  tooltip: string;
}

export interface TablaOpciones {
  btnNuevo?: boolean;
  btnEditarEnTabla?: boolean;   // ← ya existía, ahora solo lo usaremos como flag
  inlineEdit?: boolean;          // ← NUEVO  habilita/deshabilita el botón “editar”
  registrosPorPagina?: number;   // ← NUEVO  si no viene → 10
  buscador?: boolean;            // ← NUEVO  muestra/oculta caja de búsqueda
  /* botones extra configurables (despúés del Nuevo) */
  botones?: BotonExtra[];
}

export interface BotonExtra {
  id: string;                // identificador único
  icon?: string;              // clase de icono (bi, ki, fa...)
  colorClass: string;        // clase de color btn-* (btn-success, btn-outline-danger...)
  label?: string;             // texto alternativo
  tooltip?: string;
  show?: boolean | (() => boolean); // opcional: mostrar/ocultar dinámicamente
}