// src/app/features/cash-sessions/cash-status-badge.component.ts
import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { CashSessionService } from '../../services/cash-session.service';

@Component({
  selector: 'app-cash-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="session" class="badge">
      <span>Efectivo esperado: {{ session.expectedCash | number:'1.2-2' }} BS</span>
      <button class="btn-icon" (click)="close.emit()">Cerrar</button>
    </div>
  `,
  styles: [`
    .badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f2f2f2;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
    }
    .btn-icon {
      background: transparent;
      border: 1px solid #999;
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      cursor: pointer;
    }
  `],
})
export class CashStatusBadgeComponent implements OnInit, OnDestroy {
  session: any = null;
  private destroy$ = new Subject<void>();
  @Output() close = new EventEmitter<void>();

  constructor(private service: CashSessionService) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private load(): void {
    this.service
      .getOpen()
      .pipe(takeUntil(this.destroy$))
      .subscribe((s) => (this.session = s));
  }
}