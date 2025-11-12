// src/app/category-characteristics/components/characteristic-list/characteristic-list.component.ts
import { Component, OnInit, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryCharacteristicService } from '../../services/category-characteristic.service';
import { CategoryCharacteristic, CategoryCharacteristicQuery } from '../../models/category-characteristic.model';

@Component({
  selector: 'app-characteristic-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './characteristic-list.component.html',
  styleUrls: ['./characteristic-list.component.css'],
})
export class CategoryCharacteristicListComponent implements OnInit {
  private service = inject(CategoryCharacteristicService);

  filters = input<Partial<CategoryCharacteristicQuery>>({});
  showActions = input(true);

  characteristicSelected = output<CategoryCharacteristic>();
  characteristicEdit = output<CategoryCharacteristic>();
  characteristicDelete = output<CategoryCharacteristic>();

  characteristics: CategoryCharacteristic[] = [];
  loading = false;
  error = '';

  ngOnInit() {
    this.loadCharacteristics();
  }

  loadCharacteristics() {
    this.loading = true;
    this.error = '';
    const query = this.filters() as CategoryCharacteristicQuery;
    this.service.findAll(query).subscribe({
      next: (res) => {
        this.characteristics = res.characteristics;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar características';
        this.loading = false;
      },
    });
  }

  onSelect(c: CategoryCharacteristic) {
    this.characteristicSelected.emit(c);
  }

  onEdit(c: CategoryCharacteristic) {
    this.characteristicEdit.emit(c);
  }

  onDelete(c: CategoryCharacteristic) {
    if (confirm(`¿Eliminar característica "${c.name}"?`)) {
      this.characteristicDelete.emit(c);
    }
  }

  toggleActive(c: CategoryCharacteristic) {
    this.service.toggleActive(c._id).subscribe({
      next: (updated) => {
        const idx = this.characteristics.findIndex(ch => ch._id === updated._id);
        if (idx !== -1) this.characteristics[idx] = updated;
      },
    });
  }
}