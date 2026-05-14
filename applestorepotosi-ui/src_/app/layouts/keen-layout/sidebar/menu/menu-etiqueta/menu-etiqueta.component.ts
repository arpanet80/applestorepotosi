// src/app/shared/components/menu-etiqueta/menu-etiqueta.component.ts
import { Component, inject, input, OnInit } from '@angular/core';
import { RoleService } from '../services/role.service';
import { Etiqueta } from '../interfaces/menu.interface';

@Component({
  selector: 'app-menu-etiqueta',
  standalone: true,
  templateUrl: './menu-etiqueta.component.html',
  styleUrl: './menu-etiqueta.component.css'
})
export class MenuEtiquetaComponent implements OnInit {
  private roleService = inject(RoleService);

  // ✅ acepta undefined
  etiqueta = input<Etiqueta>();

  tienePermiso = false;

  ngOnInit() {
    // ✅ protección interna
    if (this.etiqueta()) {
      this.tienePermiso = this.roleService.hasAnyRole(this.etiqueta()!.roles || []);
    }
  }
}