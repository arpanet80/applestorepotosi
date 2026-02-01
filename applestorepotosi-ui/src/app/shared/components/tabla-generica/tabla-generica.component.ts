import { Component, Input, output, ChangeDetectionStrategy, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableColumnSchema, TablaOpciones } from './tabla-column.model';

type SortDirection = 'asc' | 'desc' | '';
interface SortState { column: string; direction: SortDirection }

@Component({
  selector: 'app-tabla-generica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabla-generica.component.html',
  styleUrls: ['./tabla-generica.component.css']
})
export class TablaGenericaComponent<T extends Record<string, any>> implements OnChanges {
  /* ---------- entradas ---------- */
  @Input() data: T[] = [];
  @Input() tablaColumns: TableColumnSchema<T>[] = [];
  @Input() tablaOpciones: TablaOpciones = {};

  /* ---------- salidas ---------- */
  btnInlineEditRow = output<T>();
  btnTableAction   = output<{ action: string; row: T }>();
  btnExtra         = output<string>();

  /* ---------- señales ---------- */
  private rawData      = signal<T[]>([]);
  private originalData = new Map<T, T>();   // backup fila original
  public  sortState    = signal<SortState>({ column: '', direction: '' });
  private searchTerm   = signal<string>('');



  /* ---------- derivadas ---------- */
  columnasMostradas = computed(() => this.tablaColumns.map(c => c.key));
  filteredData      = computed(() => {
    let rows = this.rawData();
    const term = this.searchTerm().toLowerCase();
    if (term) {
      rows = rows.filter(r =>
        this.tablaColumns.some(col => {
          const v = col.keysubnivel ? r[col.key]?.[col.keysubnivel] : r[col.key];
          return String(v).toLowerCase().includes(term);
        })
      );
    }
    return this.sortRows(rows);
  });

  paginatedData = signal<T[]>([]);
  currentPage   = signal<number>(1);
  pageSize      = signal<number>(10);
  totalPages    = computed(() => Math.ceil(this.filteredData().length / this.pageSize()));

  /* ---------- visibilidad de elementos ---------- */
  showBtnNuevo = computed(() => this.tablaOpciones.btnNuevo === true);
  showBuscador = computed(() => this.tablaOpciones.buscador !== false);
  showBtnEdit  = computed(() => this.tablaOpciones.inlineEdit === true);

  /* botones extra */
  botonesExtra = computed(() => (this.tablaOpciones.botones ?? []).filter(
    b => (typeof b.show === 'function' ? b.show() : b.show !== false)
  ));

  /* ---------- ciclo de vida ---------- */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.rawData.set(this.data);
      this.originalData.clear();
    }
    if (changes['tablaColumns']) this.resetSort();

    // página size
    this.pageSize.set(this.tablaOpciones.registrosPorPagina ?? 10);
    this.currentPage.set(1);
    this.updatePaginator();
  }

  /* ---------- paginación ---------- */
  private updatePaginator(): void {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end   = start + this.pageSize();
    this.paginatedData.set(this.filteredData().slice(start, end));
  }

  goPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.updatePaginator();
  }

  /* ---------- ordenación ---------- */
  sort(column: string): void {
    const col = this.tablaColumns.find(c => c.key === column);
    const path = col?.type === 'subnivel' && col.keysubnivel
              ? `${column}.${col.keysubnivel}`
              : column;

    const current = this.sortState();
    let direction: SortDirection = 'asc';
    if (current.column === path && current.direction === 'asc') direction = 'desc';
    if (current.column === path && current.direction === 'desc') direction = '';
    this.sortState.set({ column: direction ? path : '', direction });
    this.updatePaginator();
  }

  private sortRows(rows: T[]): T[] {
    const { column, direction } = this.sortState();
    if (!direction) return rows;

    return [...rows].sort((a, b) => {
      /* valor crudo (puede ser Date, objeto, string, number) */
      const av = column.includes('.') ? this.deepValue(a, column) : a[column];
      const bv = column.includes('.') ? this.deepValue(b, column) : b[column];

      /* convertimos a primitivo comparable */
      let aNorm: string | number = av instanceof Date ? av.getTime() : av;
      let bNorm: string | number = bv instanceof Date ? bv.getTime() : bv;
      if (typeof aNorm === 'string') aNorm = aNorm.toLowerCase();
      if (typeof bNorm === 'string') bNorm = bNorm.toLowerCase();

      const res = aNorm > bNorm ? 1 : aNorm < bNorm ? -1 : 0;
      return direction === 'asc' ? res : -res;
    });
  }

  private deepValue(obj: any, path: string): any {
    return path.split('.').reduce((o, k) => o?.[k], obj);
  }

  private resetSort(): void {
    this.sortState.set({ column: '', direction: '' });
  }

  /* ---------- filtros ---------- */
  onSearch(val: string): void {
    this.searchTerm.set(val);
    this.currentPage.set(1);
    this.updatePaginator();
  }

  /* ---------- utilitarios ---------- */
  trackByFn(index: number, item: T): any {
    return item['id'] || item['_id'] || index;
  }

  /* ---------- edición inline ---------- */
  startEdit(row: T): void {
    if (!this.tablaOpciones.inlineEdit) return;
    this.originalData.set(row, { ...row });
    (row as any).isEdit = true;
  }

  cancelRow(row: T): void {
    const original = this.originalData.get(row);
    if (original) {
      Object.assign(row, original);
      this.originalData.delete(row);
    }
    (row as any).isEdit = false;
  }

  saveRow(row: T): void {
    this.originalData.delete(row);
    this.btnInlineEditRow.emit(row);
    (row as any).isEdit = false;
  }

  isEditing(row: T): boolean {
    return (row as any).isEdit === true;
  }

  /* devuelve string YYYY-MM-DD para el input date */
  toInputDate(val: any): string {
    if (!val) return '';
    const d = new Date(val);
    return d.toISOString().split('T')[0];   // "2023-10-05"
  }

  /* opcional: de string a Date para tu modelo */
  fromInputDate(str: string): Date {
    return str ? new Date(str + 'T00:00:00') : new Date();
  }

  updateDate(row: T, key: string, value: string): void {
    (row as any)[key] = this.fromInputDate(value);
  }
}