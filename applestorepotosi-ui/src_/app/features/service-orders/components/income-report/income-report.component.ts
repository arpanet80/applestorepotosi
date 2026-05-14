// service-orders/components/income-report/income-report.component.ts
// ============================================================
// REPORTE DE INGRESOS - Compatible con flujo simplificado
// ============================================================
// El backend filtra automáticamente por BILLED_STATUSES
// (solo órdenes en estado 'completada').
// ============================================================

// service-orders/components/income-report/income-report.component.ts
// ============================================================
// REPORTE DE INGRESOS - Compatible con flujo simplificado
// ============================================================
// ✅ FIX: Fechas convertidas a UTC ISO consistente para evitar
//    desfase de timezone. El input date genera "2024-01-15" que
//    al parsearse en el backend puede quedar en UTC-0 mientras
//    que createdAt está en UTC-4 (Bolivia), causando que las
//    órdenes no aparezcan en el rango.
// ============================================================

import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ServiceOrdersService } from '../../services/service-orders.service';
import { IncomeReport } from '../../models/income-report.interface';

@Component({
  selector: 'app-income-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './income-report.component.html',
})
export class IncomeReportComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private svc = inject(ServiceOrdersService);

  private destroy$ = new Subject<void>();

  form: FormGroup = this.fb.group({
    startDate: [this.firstDay()],
    endDate: [this.today()],
    technicianId: [''],
  });

  report: IncomeReport | null = null;
  loading = false;
  errorMsg = '';

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    const { startDate, endDate, technicianId } = this.form.value;
    this.loading = true;
    this.errorMsg = '';

    // ✅ FIX: Convertir fechas del input (YYYY-MM-DD) a ISO UTC consistente
    // El input date retorna "2024-01-15". Si lo enviamos así, el backend
    // hace new Date("2024-01-15") que asume UTC-0 (00:00:00Z), pero las
    // órdenes creadas en Bolivia (UTC-4) tienen hora 04:00:00Z del mismo día.
    // Esto causa que órdenes del "día actual" no aparezcan si se filtra
    // por ese mismo día.
    // 
    // Solución: convertir a Date local, setear UTC hours, y enviar ISO string.
    const startISO = startDate ? this.toStartOfDayUTC(startDate) : undefined;
    const endISO = endDate ? this.toEndOfDayUTC(endDate) : undefined;

    this.svc
      .incomeReport({
        startDate: startISO,
        endDate: endISO,
        technicianId: technicianId || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r) => {
          this.report = r;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg = err.error?.message || 'Error al cargar el reporte';
          console.error('Error cargando reporte:', err);
        },
      });
  }

  reset(): void {
    this.form.patchValue({
      startDate: this.firstDay(),
      endDate: this.today(),
      technicianId: '',
    });
    this.load();
  }

  // ✅ FIX: Convierte YYYY-MM-DD a inicio del día en UTC (00:00:00.000Z)
  private toStartOfDayUTC(dateString: string): string {
    const [year, month, day] = dateString.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    return d.toISOString();
  }

  // ✅ FIX: Convierte YYYY-MM-DD a fin del día en UTC (23:59:59.999Z)
  private toEndOfDayUTC(dateString: string): string {
    const [year, month, day] = dateString.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    return d.toISOString();
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }
  private firstDay(): string {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  }
}