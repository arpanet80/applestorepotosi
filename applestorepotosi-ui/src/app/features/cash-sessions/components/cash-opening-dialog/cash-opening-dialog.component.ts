// src/app/features/cash-sessions/cash-opening-dialog.component.ts
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CashSession } from '../../models/cash-session.model';
import { CashSessionService } from '../../services/cash-session.service';

@Component({
    imports: [ ReactiveFormsModule ],
  selector: 'app-cash-opening-dialog',
  standalone: true,
  template: `
    <div class="dialog-container">
      <h2>Abrir caja</h2>
      <form [formGroup]="form" (ngSubmit)="save()">
        <label>
          Fondo inicial (BS)
          <input type="number" step="0.01" formControlName="openingBalance" />
        </label>
        <div class="actions">
          <button type="button" (click)="cancel()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid">Abrir</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .dialog-container {
      background: #fff;
      border: 1px solid #ccc;
      padding: 1rem;
      max-width: 400px;
      margin: 2rem auto;
      border-radius: 4px;
    }
    label {
      display: block;
      margin-bottom: 1rem;
    }
    input {
      width: 100%;
      padding: 0.5rem;
      margin-top: 0.25rem;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `],
})
export class CashOpeningDialogComponent {
    private fb = inject ( FormBuilder);
    private service= inject ( CashSessionService);

  form = this.fb.group({
    openingBalance: [0, [Validators.required, Validators.min(0)]],
  });

  @Output() closed = new EventEmitter<CashSession | null>();

  constructor(
  ) {}

  save(): void {
    const value = this.form.value.openingBalance!;
    this.service.open(value).subscribe({
      next: (session) => this.closed.emit(session),
      error: (err) => console.error(err),
    });
  }

  cancel(): void {
    this.closed.emit(null);
  }
}