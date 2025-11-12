// src/app/category-characteristics/components/characteristic-detail/characteristic-detail.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CategoryCharacteristicService } from '../../services/category-characteristic.service';
import { CategoryCharacteristic } from '../../models/category-characteristic.model';
import { AuthService } from '../../../auth/services/auth.service';
import { UserRole } from '../../../auth/models/user.model';

@Component({
  selector: 'app-characteristic-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './characteristic-detail.component.html',
  styleUrls: ['./characteristic-detail.component.css'],
})
export class CategoryCharacteristicDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(CategoryCharacteristicService);
  private authService = inject(AuthService);

  characteristic: CategoryCharacteristic | null = null;
  loading = true;
  error = '';
  canEdit = false;

  ngOnInit() {
    this.canEdit = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
    this.loadCharacteristic();
  }

  loadCharacteristic() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID inválido';
      this.loading = false;
      return;
    }
    this.service.findOne(id).subscribe({
      next: (c) => {
        this.characteristic = c;
        this.loading = false;
      },
      error: () => {
        this.error = 'Característica no encontrada';
        this.loading = false;
      },
    });
  }

  onEdit() {
    if (!this.characteristic) return;
    this.router.navigate(['/dashboard', 'category-characteristics', 'edit', this.characteristic._id]);
  }

  onDelete() {
    if (!this.characteristic) return;
    if (!confirm(`¿Eliminar característica "${this.characteristic.name}"?`)) return;
    this.service.delete(this.characteristic._id).subscribe({
      next: () => this.router.navigate(['/dashboard', 'category-characteristics']),
      error: () => alert('Error al eliminar'),
    });
  }

  onToggleActive() {
    if (!this.characteristic) return;
    this.service.toggleActive(this.characteristic._id).subscribe({
      next: (updated) => (this.characteristic = updated),
    });
  }
}