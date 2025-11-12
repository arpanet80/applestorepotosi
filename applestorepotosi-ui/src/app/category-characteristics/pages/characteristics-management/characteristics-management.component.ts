// src/app/category-characteristics/pages/characteristics-management/characteristics-management.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CategoryCharacteristicService } from '../../services/category-characteristic.service';
import { CategoryCharacteristic } from '../../models/category-characteristic.model';

@Component({
  selector: 'app-characteristics-management',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './characteristics-management.component.html',
  styleUrls: ['./characteristics-management.component.css'],
})
export class CategoryCharacteristicsManagementComponent implements OnInit {
  private service = inject(CategoryCharacteristicService);
  private router = inject(Router);

  characteristics: CategoryCharacteristic[] = [];
  loading = true;

  ngOnInit() {
    this.loadCharacteristics();
  }

  loadCharacteristics() {
    this.loading = true;
    this.service.findAll({}).subscribe({
      next: (res) => {
        this.characteristics = res.characteristics;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onEdit(c: CategoryCharacteristic) {
    this.router.navigate(['/dashboard', 'category-characteristics', 'edit', c._id]);
  }

  onDelete(c: CategoryCharacteristic) {
    if (!confirm(`¿Eliminar característica "${c.name}"?`)) return;
    this.service.delete(c._id).subscribe(() => this.loadCharacteristics());
  }

  onCreate() {
    this.router.navigate(['/dashboard', 'category-characteristics', 'create']);
  }
}