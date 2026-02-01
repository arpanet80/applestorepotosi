// src/app/shared/components/menu-primer-nivel/menu-primer-nivel.component.ts

import { Component, inject, input, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { RoleService } from '../services/role.service';
import { MenuPrimerNivel } from '../interfaces/menu.interface';

@Component({
  selector: 'app-menu-primer-nivel',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu-primer-nivel.component.html',
  styleUrls: ['./menu-primer-nivel.component.css']
})
export class MenuPrimerNivelComponent implements OnInit {
  private roleService = inject(RoleService);

  primerNivel = input<MenuPrimerNivel[]>(); // ✅ acepta undefined
  itemsVisibles: MenuPrimerNivel[] = [];

  ngOnInit() {
    const items = this.primerNivel();
    if (!items) return;

    this.itemsVisibles = items
      .filter(item => this.roleService.hasAnyRole(item.roles || []))
      .map(item => ({
        ...item,
        opcionSimple: item.opcionSimple.filter(sub =>
          this.roleService.hasAnyRole(sub.roles || [])
        )
      }))
      .filter(item => item.opcionSimple.length > 0);
  }
}