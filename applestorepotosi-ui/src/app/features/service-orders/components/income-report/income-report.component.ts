import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceOrdersService } from '../../services/service-orders.service';

interface Report {
  orderCount: number;
  totalLabor: number;
  totalParts: number;
  totalInvoiced: number;
  grossMargin: number;
}

@Component({
  selector: 'app-income-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './income-report.component.html',
})
export class IncomeReportComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private svc = inject(ServiceOrdersService);

  form: FormGroup = this.fb.group({
    startDate: [this.firstDay()],
    endDate: [this.today()],
    technicianId: [''],
  });

  report$: Observable<Report> | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const { startDate, endDate, technicianId } = this.form.value;
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (technicianId) params.technicianId = technicianId;

    this.report$ = this.svc.getIncomeReport({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      technicianId: technicianId || undefined,
    });
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