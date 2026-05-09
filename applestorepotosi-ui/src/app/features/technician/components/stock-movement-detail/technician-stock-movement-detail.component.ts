import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StockMovementsService } from '../../../stock-movements/services/stock-movements.service';
import { StockMovement } from '../../../stock-movements/models/stock-movement.model';

@Component({
  selector: 'app-technician-stock-movement-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './technician-stock-movement-detail.component.html',
})
export class TechnicianStockMovementDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(StockMovementsService);

  movement: StockMovement | null = null;
  loading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.goBack();
      return;
    }
    this.service.findOne(id).subscribe({
      next: (m) => {
        this.movement = m;
        this.loading = false;
      },
      // BUG FIX 7: El error no reseteaba loading = false antes de navegar,
      // dejando el spinner activo si goBack() fallase por alguna razón.
      error: () => {
        this.loading = false;
        this.goBack();
      },
    });
  }

  goBack(): void {
    // BUG FIX 8 (CRÍTICO): La ruta de regreso apuntaba a
    // '/dashboard/stock-movements' (ruta del módulo admin/sales),
    // en lugar de '/dashboard/technician-stock-movements' (ruta del técnico).
    // Esto causaba que al pulsar "Volver" o cuando fallaba la carga,
    // el técnico era redirigido fuera de su módulo.
    this.router.navigate(['/dashboard/technician-stock-movements']);
  }
}