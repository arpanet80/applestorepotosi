import { NgIf } from '@angular/common';
// src/app/brands/pages/brand-management/brand-management.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BrandService } from '../../services/brand.service';
import { Brand } from '../../models/brand.model';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { ToastrAlertService } from '../../../../shared/services/toastr-alert.service';

@Component({
  selector: 'app-brand-management',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf],
  templateUrl: './brand-management.component.html',
  styleUrls: ['./brand-management.component.css']
})
export class BrandManagementComponent implements OnInit {
  private brandService = inject(BrandService);
  private router = inject(Router);
  public  sweetAlertService = inject(SweetAlertService);
  public  toastrAlertService = inject(ToastrAlertService);

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

  // onDelete(brand: Brand) {
  //   if (!confirm(`¿Eliminar marca "${brand.name}"?`)) return;
  //   this.brandService.delete(brand._id).subscribe(() => this.loadBrands());
  // }

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
            `¿Está seguro de <b>${action}</b> el producto <b>${brand.name}</b>?`,
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
    
            obs.subscribe({
              next: () => {
                this.sweetAlertService.close();
                this.toastrAlertService.success(
                  `Producto ${brand.name} ${action}do correctamente`,
                  'Operación completada'
                );
                this.loadBrands();
              },
              error: () => {
                this.sweetAlertService.close();
                this.toastrAlertService.error(
                  `No se pudo ${action} al usuario ${brand.name}`,
                  'Error'
                );
              }
            });
          });
      }
}