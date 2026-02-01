import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashSession } from '../modules/cash-session.model';

@Component({
  selector: 'app-off-canvas-session',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './off-canvas-session.component.html'
})
export class OffCanvasSessionComponent {
  @Input() session: CashSession | null = null;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() print = new EventEmitter<CashSession>();

  get diferencia(): number {
    if (!this.session) return 0;
    return (this.session.actualCash || 0) - this.session.expectedCash;
  }

  close(): void {
    this.visibleChange.emit(false);
  }
}