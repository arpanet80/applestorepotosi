// src/app/brands/pages/brands-page/brands-page.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { BrandService } from '../../services/brand.service';
import { BrandListComponent } from '../../components/brand-list/brand-list.component';
import { Brand, BrandStats, BrandQuery } from '../../models/brand.model';
import { AuthService } from '../../../auth/services/auth.service';
import { UserRole } from '../../../auth/models/user.model';

@Component({
  selector: 'app-brands-page',
  standalone: true,
  imports: [CommonModule, RouterModule, BrandListComponent],
  templateUrl: './brands-page.component.html',
  styleUrls: ['./brands-page.component.css']
})
export class BrandsPageComponent implements OnInit, OnDestroy {
  private brandService = inject(BrandService);
  private authService = inject(AuthService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  brands: Brand[] = [];
  stats: BrandStats | null = null;
  loading = true;
  error = '';

  searchTerm = '';
  activeFilter: 'all' | 'active' | 'inactive' = 'all';

  canCreate = false;
  canManage = false;

  ngOnInit() {
    this.checkPermissions();
    this.loadBrands();
    this.loadStats();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkPermissions() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.canCreate = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
    this.canManage = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
  }

  public loadBrands() {
    this.loading = true;
    this.error = '';
    const query: BrandQuery = {
      search: this.searchTerm || undefined,
      isActive: this.activeFilter === 'all' ? undefined : this.activeFilter === 'active'
    };
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

  private loadStats() {
    this.brandService.getStats().subscribe({
      next: s => this.stats = s,
      error: () => {}
    });
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.loadBrands();
  }

  onFilterChange(filter: 'all' | 'active' | 'inactive') {
    this.activeFilter = filter;
    this.loadBrands();
  }

  onSelectBrand(brand: Brand) {
    this.router.navigate(['/dashboard', 'brands', 'detail', brand._id]);
  }

  onEditBrand(brand: Brand) {
    this.router.navigate(['/dashboard', 'brands', 'edit', brand._id]);
  }

  onDeleteBrand(brand: Brand) {
    if (!confirm(`¿Eliminar marca "${brand.name}"?`)) return;
    this.brandService.delete(brand._id).subscribe({
      next: () => {
        this.loadBrands();
        this.loadStats();
      }
    });
  }

  onCreateBrand() {
    this.router.navigate(['/dashboard', 'brands', 'create']);
  }

  onManageBrands() {
    this.router.navigate(['/dashboard', 'brands', 'management']);
  }

  onRefresh() {
    this.loadBrands();
    this.loadStats();
  }

  getFilterClass(filter: string): string {
    return this.activeFilter === filter ? 'btn-filter active' : 'btn-filter';
    }
}