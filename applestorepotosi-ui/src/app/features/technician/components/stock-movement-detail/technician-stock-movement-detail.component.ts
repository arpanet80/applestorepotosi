import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StockMovementsService } from '../../../stock-movements/services/stock-movements.service';
import { StockMovement } from '../../../stock-movements/models/stock-movement.model';

@Component({
  selector: 'app-technician-stock-movement-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './technician-stock-movement-detail.component.html'
})
export class TechnicianStockMovementDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(StockMovementsService);

  movement: StockMovement | null = null;
  loading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return this.goBack();
    this.service.findOne(id).subscribe({
      next: m => { this.movement = m; this.loading = false; },
      error: () => this.goBack()
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/stock-movements']);
  }
}