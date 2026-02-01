import { Component, inject, OnInit } from '@angular/core';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CajaService } from '../services/caja.service';
import { OffCanvasSessionComponent } from './off-canvas-session.component';
import { CashSession } from '../modules/cash-session.model';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    OffCanvasSessionComponent 
  ],
  templateUrl: './caja.component.html'
})
export class CajaComponent implements OnInit {
  private service = inject(CajaService);
  private alert   = inject(SweetAlertService);

  /* ---------- vista ---------- */
  activeSession: CashSession | null = null;   // sesión abierta
  sessions: CashSession[] = [];             // histórico
  loading = false;

  /* ---------- filtros ---------- */
  filterStart?: Date;
  filterEnd?: Date;
  filterCloseType: 'X' | 'Z' | '' = '';
  filterUser = '';          // uid o displayName (busca en el listado)
  page = 1;
  pageSize = 20;
  total = 0;

  /* ---------- off-canvas ---------- */
  showCanvas = false;
  canvasSession: CashSession | null = null;

  ngOnInit(): void {
    this.loadActive();
    this.loadHistory();
  }

  /* ---------- sesión activa ---------- */
  private loadActive(): void {
    this.service.getOpen().subscribe({
      next: s => this.activeSession = s,
      error: () => this.activeSession = null
    });
  }

  /* ---------- histórico ---------- */
  private loadHistory(): void {
    this.loading = true;
    this.service.list({
      startDate: this.filterStart,
      endDate: this.filterEnd,
      closeType: this.filterCloseType || undefined,
      user: this.filterUser || undefined,
      page: this.page,
      limit: this.pageSize
    }).subscribe({
      next: res => {
        this.sessions = res.sessions;
        this.total = res.total;
        this.loading = false;          // ← apaga
      },
      error: () => {
        this.loading = false;          // ← apaga
        this.alert.serverError();
      }
    });
  }

  /* ---------- apertura ---------- */
  async abrir(): Promise<void> {
    const { value: monto } = await this.alert.input(
      'Monto de apertura (efectivo)',
      'Abrir caja',
      '0'
    );
    if (!monto || +monto <= 0) return;

    this.alert.loading('Abriendo caja…');
    this.service.open(+monto).subscribe({
      next: s => {
        this.alert.close();
        this.activeSession = s;
        this.alert.toastSuccess('Caja abierta');
        this.loadHistory();          // refresca listado
      },
      error: () => { this.alert.close(); this.alert.serverError(); }
    });
  }

  /* ---------- cierre ---------- */
  async cerrar(): Promise<void> {
    if (!this.activeSession) return;

    const { value: actual } = await this.alert.input(
      'Efectivo físico contado',
      'Cerrar caja',
      String(this.activeSession.expectedCash)
    );
    if (!actual) return;

    const { value: tarjeta } = await this.alert.input('Total tarjeta', 'Cierre', '0');
    const { value: transfer } = await this.alert.input('Total transferencia', 'Cierre', '0');
    const { value: notas } = await this.alert.textarea('Notas de cierre (opcional)', 'Cierre');

    this.alert.loading('Cerrando caja…');
    this.service.close(this.activeSession._id, {
      actualCash: +actual,
      cardTotal: +tarjeta,
      transferTotal: +transfer,
      closeType: 'Z',
      notes: notas || ''
    }).subscribe({
      next: rep => {
        this.alert.close();
        this.activeSession = null;
        this.alert.toastSuccess('Caja cerrada');
        this.printCorte(rep);
        this.loadHistory();          // aparece en el listado
      },
      error: () => { this.alert.close(); this.alert.serverError(); }
    });
  }

  /* ---------- movimiento manual ---------- */
  async movimiento(tipo: 'in' | 'out'): Promise<void> {
    const titulo = tipo === 'in' ? 'Ingreso de efectivo' : 'Retiro de efectivo';
    const { value: cantidad } = await this.alert.input(titulo, titulo, '0');
    if (!cantidad || +cantidad <= 0) return;

    const { value: motivo } = await this.alert.textarea('Motivo del movimiento', titulo);
    if (!motivo) return;

    this.alert.loading('Procesando…');
    this.service.cashInOut(tipo === 'in' ? +cantidad : -cantidad, motivo).subscribe({
      next: s => {
        this.alert.close();
        this.activeSession = s;
        this.alert.toastSuccess('Movimiento guardado');
      },
      error: () => { this.alert.close(); this.alert.serverError(); }
    });
  }

  /* ---------- off-canvas ---------- */
  verDetalle(s: CashSession): void {
    this.canvasSession = s;
    this.showCanvas = true;
  }
  closeCanvas(): void {
    this.showCanvas = false;
    this.canvasSession = null;
  }

  /* ---------- re-imprimir ---------- */
  reimprimir(s: CashSession): void {
    this.printCorte(s);
  }

  /* ---------- impresión ---------- */
  private printCorte(rep: CashSession): void {
    const win = window.open('', '', 'width=300,height=600')!;
    win.document.write(`
      <html>
        <head><title>Corte ${rep.closeType} ${rep.sessionId}</title></head>
        <body style="font-family:monospace;font-size:12px;margin:8px">
          <div style="text-align:center;font-weight:bold">Corte ${rep.closeType}</div>
          <div>ID: ${rep.sessionId}</div>
          <div>Apertura: ${new Date(rep.openedAt).toLocaleString()}</div>
          <div>Cierre: ${new Date(rep.closedAt!).toLocaleString()}</div>
          <hr>
          <div>Efectivo esperado: $${rep.expectedCash.toFixed(2)}</div>
          <div>Efectivo contado: $${rep.actualCash!.toFixed(2)}</div>
          <div>Diferencia: $${(rep.actualCash! - rep.expectedCash).toFixed(2)}</div>
          <hr>
          <div>Tarjeta: $${rep.medios.tarjeta.toFixed(2)}</div>
          <div>Transferencia: $${rep.medios.transfer.toFixed(2)}</div>
          <hr>
          <div style="text-align:center">¡Corte exitoso!</div>
        </body>
      </html>`);
    win.document.close();
    win.print();
    setTimeout(() => win.close(), 300);
  }

  /* ---------- paginación ---------- */
  goPage(p: number): void { this.page = p; this.loadHistory(); }

  /* ---------- filtros ---------- */
  onFilter(): void {
    /* si la fecha está vacía o incompleta no filtramos */
    if (this.filterStart && !(this.filterStart instanceof Date)) {
      this.filterStart = new Date(this.filterStart);
    }
    if (this.filterEnd && !(this.filterEnd instanceof Date)) {
      this.filterEnd = new Date(this.filterEnd);
    }

    /* validación simple */
    if (this.filterStart && this.filterEnd && this.filterStart > this.filterEnd) {
      this.alert.warning('La fecha “desde” debe ser anterior a “hasta”');
      return;
    }

    this.page = 1;
    this.loadHistory();
  }

  resetFilters(): void {
    this.filterStart = this.filterEnd = undefined;
    this.filterCloseType = '';
    this.filterUser = '';
    this.onFilter();
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  toInputDate(d: Date | undefined): string {
    if (!d) return '';
    const date = new Date(d);
    return date.toISOString().split('T')[0];   // "2025-12-28"
  }
}