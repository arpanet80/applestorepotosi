// src/app/brands/pages/brand-management/brand-management.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BrandService } from '../../services/brand.service';
import { Brand } from '../../models/brand.model';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { ToastrAlertService } from '../../../../shared/services/toastr-alert.service';

@Component({
  selector: 'app-brand-management',
  standalone: true,
  imports: [CommonModule, RouterModule], // ← Eliminado NgIf redundante
  templateUrl: './brand-management.component.html',
  styleUrls: ['./brand-management.component.css']
})
export class BrandManagementComponent implements OnInit, OnDestroy {
  private brandService = inject(BrandService);
  private router = inject(Router);
  public sweetAlertService = inject(SweetAlertService);
  public toastrAlertService = inject(ToastrAlertService);
  private destroy$ = new Subject<void>();

  brands: Brand[] = [];
  loading = true;
  error = '';

  ngOnInit() {
    this.loadBrands();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBrands() {
    this.loading = true;
    this.error = '';
    this.brandService.findAll({}).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: res => {
        this.brands = res.brands;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Error al cargar marcas';
        this.loading = false;
        this.toastrAlertService.error(this.error, 'Error');
      }
    });
  }

  trackByBrandId(index: number, brand: Brand): string {
    return brand._id;
  }

  getLogoUrl(brand: Brand): string {
    // Si no hay logoUrl, retorna vacío para mostrar el placeholder
    if (!brand.logoUrl) return '';
    
    // Si ya es una URL completa (http/https), usarla directamente
    if (brand.logoUrl.startsWith('http')) {
      return brand.logoUrl;
    }
    
    // Si es una ruta relativa, construir la URL completa
    return brand.logoUrl;
  }

  onEdit(brand: Brand) {
    this.router.navigate(['/dashboard', 'brands', 'edit', brand._id]);
  }

  onCreate() {
    this.router.navigate(['/dashboard', 'brands', 'create']);
  }

  onDetail(brand: Brand) {
    this.router.navigate(['/dashboard', 'brands', 'detail', brand._id]);
  }

  onToggleStatus(brand: Brand): void {
    if (!brand) return;
    const action = brand.isActive ? 'desactivar' : 'activar';

    this.sweetAlertService
      .confirm(
        `¿Está seguro de <b>${action}</b> la marca <b>${brand.name}</b>?`,
        `Confirmar ${action}`,
        'Sí, ' + action,
        'Cancelar',
        true
      )
      .then(res => {
        if (!res.isConfirmed) return;
        this.sweetAlertService.loading('Procesando...');

        const obs = brand.isActive
          ? this.brandService.deactivate(brand._id)
          : this.brandService.activate(brand._id);

        obs.pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.sweetAlertService.close();
            this.toastrAlertService.success(
              `Marca ${brand.name} ${action}da correctamente`,
              'Operación completada'
            );
            this.loadBrands();
          },
          error: (err) => {
            this.sweetAlertService.close();
            const msg = err?.error?.message || `No se pudo ${action} la marca ${brand.name}`;
            this.toastrAlertService.error(msg, 'Error');
          }
        });
      });
  }
}