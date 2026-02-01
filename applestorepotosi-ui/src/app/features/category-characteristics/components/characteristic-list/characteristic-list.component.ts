// src/app/category-characteristics/components/characteristic-list/characteristic-list.component.ts
import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryCharacteristic } from '../../models/category-characteristic.model';
import { CategoryCharacteristicService } from '../../services/category-characteristic.service';

@Component({
  selector: 'app-characteristic-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './characteristic-list.component.html',
  styleUrls: ['./characteristic-list.component.css'],
})
export class CategoryCharacteristicListComponent {
  private service = inject(CategoryCharacteristicService);

  // Entradas
  characteristics = input.required<CategoryCharacteristic[]>();
  showActions = input(true);

  // Salidas
  characteristicSelected = output<CategoryCharacteristic>();
  characteristicEdit = output<CategoryCharacteristic>();
  characteristicDelete = output<CategoryCharacteristic>();

  // Helpers
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
        const idx = this.characteristics().findIndex(ch => ch._id === updated._id);
        if (idx !== -1) {
          // Actualiza el elemento en el array (referencia nueva para OnPush)
          const arr = [...this.characteristics()];
          arr[idx] = updated;
          // Opción 1: emitir el array actualizado al padre
          // this.characteristicsChange.emit(arr);
          // Opción 2: dejar que el padre refresque con su propia carga
        }
      },
    });
  }
}