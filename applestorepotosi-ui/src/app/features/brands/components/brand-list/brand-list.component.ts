// src/app/brands/components/brand-list/brand-list.component.ts
import { Component, OnInit, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BrandService } from '../../services/brand.service';
import { Brand, BrandQuery } from '../../models/brand.model';

@Component({
  selector: 'app-brand-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './brand-list.component.html',
  styleUrls: ['./brand-list.component.css']
})
export class BrandListComponent implements OnInit {
  private brandService = inject(BrandService);

  filters = input<Partial<BrandQuery>>({});
  showActions = input(true);

  brandSelected = output<Brand>();
  brandEdit = output<Brand>();
  brandDelete = output<Brand>();

  brands: Brand[] = [];
  loading = false;
  error = '';

  ngOnInit() {
    this.loadBrands();
  }

  loadBrands() {
    this.loading = true;
    this.error = '';
    const query = this.filters() as BrandQuery;
    this.brandService.findAll(query).subscribe({
      next: res => {
        this.brands = res.brands;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar marcas';
        this.loading = false;
      }
    });
  }

  onSelectBrand(brand: Brand) {
    this.brandSelected.emit(brand);
  }

  onEditBrand(brand: Brand) {
    this.brandEdit.emit(brand);
  }

  onDeleteBrand(brand: Brand) {
    if (confirm(`¿Eliminar marca "${brand.name}"?`)) {
      this.brandDelete.emit(brand);
    }
  }

  toggleActive(brand: Brand) {
    this.brandService.toggleActive(brand._id).subscribe({
      next: updated => {
        const idx = this.brands.findIndex(b => b._id === updated._id);
        if (idx !== -1) this.brands[idx] = updated;
      }
    });
  }
}