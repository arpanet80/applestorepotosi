// src/app/features/cash-sessions/cash-closing-dialog.component.ts
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CashSession } from '../../models/cash-session.model';
import { CashSessionService } from '../../services/cash-session.service';
import { DecimalPipe } from '@angular/common';

@Component({
    imports: [DecimalPipe, ReactiveFormsModule ],
  selector: 'app-cash-closing-dialog',
  standalone: true,
  template: `
    <div class="dialog-container">
      <h2>Cerrar caja</h2>
      <form [formGroup]="form" (ngSubmit)="save()">
        <p><strong>Efectivo esperado:</strong> {{ data.expectedCash | number:'1.2-2' }} BS</p>

        <label>
          Contado físico (BS)
          <input type="number" step="0.01" formControlName="actualCash" />
        </label>

        <label>
          Tipo de cierre
          <select formControlName="closeType">
            <option value="X">Parcial (X)</option>
            <option value="Z">Final del día (Z)</option>
          </select>
        </label>

        <details>
          <summary>Desglose medios de pago</summary>
          <div class="grid-2">
            <label>Efectivo<input type="number" step="0.01" formControlName="efectivo" /></label>
            <label>Tarjeta<input type="number" step="0.01" formControlName="tarjeta" /></label>
            <label>Transfer<input type="number" step="0.01" formControlName="transfer" /></label>
            <label>Depósito<input type="number" step="0.01" formControlName="deposito" /></label>
          </div>
        </details>

        <label>
          Notas (opcional)
          <textarea formControlName="notes" rows="2"></textarea>
        </label>

        <div class="actions">
          <button type="button" (click)="cancel()">Cancelar</button>
          <button type="submit" [disabled]="form.invalid">Cerrar</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .dialog-container {
      background: #fff;
      border: 1px solid #ccc;
      padding: 1rem;
      max-width: 500px;
      margin: 2rem auto;
      border-radius: 4px;
    }
    label {
      display: block;
      margin-bottom: 0.75rem;
    }
    input, select, textarea {
      width: 100%;
      padding: 0.4rem;
      margin-top: 0.25rem;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  `],
})
export class CashClosingDialogComponent {
    private service = inject ( CashSessionService);
    private fb = inject (  FormBuilder);
    @Input() data!: CashSession;
    @Output() closed = new EventEmitter<CashSession | null>();

  form = this.fb.group({
    actualCash: [0, [Validators.required, Validators.min(0)]],
    closeType: ['X' as 'X' | 'Z', Validators.required],
    efectivo: [0, Validators.min(0)],
    tarjeta: [0, Validators.min(0)],
    transfer: [0, Validators.min(0)],
    deposito: [0, Validators.min(0)],
    notes: [''],
  });

  constructor(
  ) {}

  save(): void {
    const { actualCash, closeType, notes, efectivo, tarjeta, transfer, deposito } =
      this.form.value;
    this.service
      .close(this.data._id!, {
        actualCash: actualCash!,
        closeType: closeType!,
        medios: { efectivo: efectivo!, tarjeta: tarjeta!, transfer: transfer!, deposito: deposito! },
        notes: notes || '',
      })
      .subscribe({
        next: (session) => this.closed.emit(session),
        error: (err) => console.error(err),
      });
  }

  cancel(): void {
    this.closed.emit(null);
  }
}