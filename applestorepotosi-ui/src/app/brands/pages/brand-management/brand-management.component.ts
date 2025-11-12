// src/app/brands/pages/brand-management/brand-management.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BrandService } from '../../services/brand.service';
import { Brand } from '../../models/brand.model';

@Component({
  selector: 'app-brand-management',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './brand-management.component.html',
  styleUrls: ['./brand-management.component.css']
})
export class BrandManagementComponent implements OnInit {
  private brandService = inject(BrandService);
  private router = inject(Router);

  brands: Brand[] = [];
  loading = true;

  ngOnInit() {
    this.loadBrands();
  }

  loadBrands() {
    this.loading = true;
    this.brandService.findAll({}).subscribe({
      next: res => {
        this.brands = res.brands;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  onEdit(brand: Brand) {
    this.router.navigate(['/dashboard', 'brands', 'edit', brand._id]);
  }

  onDelete(brand: Brand) {
    if (!confirm(`¿Eliminar marca "${brand.name}"?`)) return;
    this.brandService.delete(brand._id).subscribe(() => this.loadBrands());
  }

  onCreate() {
    this.router.navigate(['/dashboard', 'brands', 'create']);
  }
}