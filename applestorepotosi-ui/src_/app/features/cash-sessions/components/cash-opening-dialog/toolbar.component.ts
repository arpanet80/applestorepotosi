// src/app/core/components/toolbar/toolbar.component.ts
import { Component, OnInit, ViewContainerRef, ComponentRef } from '@angular/core';
import { CashSessionService } from '../../services/cash-session.service';
import { CashOpeningDialogComponent } from './cash-opening-dialog.component';
import { CashClosingDialogComponent } from './cash-closing-dialog.component';
import { CashSession } from '../../models/cash-session.model';
import { CashStatusBadgeComponent } from './cash-status-badge.component';

@Component({
    imports: [CashStatusBadgeComponent],
  selector: 'app-toolbar',
  template: `
    <header class="toolbar">
      <div class="brand">Apple Store Potosí</div>

      <nav class="nav">
        <a routerLink="/products"  routerLinkActive="active">Productos</a>
        <a routerLink="/sales"     routerLinkActive="active">Ventas</a>
        <a routerLink="/customers" routerLinkActive="active">Clientes</a>
      </nav>

      <div class="cash-zone">
        <app-cash-status-badge
          *ngIf="session"
          (close)="showClosing()">
        </app-cash-status-badge>
        <!-- diálogos se renderizan aquí -->
        <ng-container></ng-container>
      </div>

      <div class="user">
        <span>{{ userName }}</span>
        <button (click)="logout()">Salir</button>
      </div>
    </header>
  `,
  styles: [`
    :host { display: block; }
    .toolbar {
      display: flex;
      align-items: center;
      padding: 0.5rem 1rem;
      background: #fafafa;
      border-bottom: 1px solid #ddd;
      gap: 1rem;
    }
    .brand { font-weight: 600; }
    .nav {
      display: flex;
      gap: 1rem;
    }
    .nav a {
      text-decoration: none;
      color: #333;
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
    }
    .nav a.active { background: #e0e0e0; }
    .cash-zone { margin-left: auto; }
    .user { display: flex; align-items: center; gap: 0.5rem; }
  `],
})
export class ToolbarComponent implements OnInit {
  session: CashSession | null = null;
  userName = 'Usuario';   // conecta con tu AuthService real

  private openingRef?: ComponentRef<CashOpeningDialogComponent>;
  private closingRef?: ComponentRef<CashClosingDialogComponent>;

  constructor(
    private cashService: CashSessionService,
    private vcr: ViewContainerRef,
  ) {}

  ngOnInit(): void {
    this.loadSession();
  }

  private loadSession(): void {
    this.cashService.getOpen().subscribe((s) => {
      this.session = s;
      if (!s) this.showOpening();
    });
  }

  showOpening(): void {
    this.clear();
    this.openingRef = this.vcr.createComponent(CashOpeningDialogComponent);
    this.openingRef.instance.closed.subscribe((s) => {
      this.session = s;
      this.clear();
    });
  }

  showClosing(): void {
    if (!this.session) return;
    this.clear();
    this.closingRef = this.vcr.createComponent(CashClosingDialogComponent);
    this.closingRef.instance.data = this.session;
    this.closingRef.instance.closed.subscribe((s) => {
      this.session = s ? null : this.session;
      this.clear();
    });
  }

  private clear(): void {
    this.openingRef?.destroy();
    this.closingRef?.destroy();
    this.openingRef = undefined;
    this.closingRef = undefined;
  }

  logout(): void {
    // tu lógica de logout
  }
}