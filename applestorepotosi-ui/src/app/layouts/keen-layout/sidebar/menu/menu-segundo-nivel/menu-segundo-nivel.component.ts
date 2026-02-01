// src/app/shared/components/menu-segundo-nivel/menu-segundo-nivel.component.ts
import { Component, inject, input, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { RoleService } from '../services/role.service';
import { MenuSegundoNivel } from '../interfaces/menu.interface';

@Component({
  selector: 'app-menu-segundo-nivel',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu-segundo-nivel.component.html',
  styleUrls: ['./menu-segundo-nivel.component.css']
})
export class MenuSegundoNivelComponent implements OnInit {
  private roleService = inject(RoleService);

  segundonivel = input<MenuSegundoNivel[]>(); // ✅ acepta undefined
  menusVisibles: MenuSegundoNivel[] = [];

  ngOnInit() {
    const menus = this.segundonivel();
    if (!menus) return;

    this.menusVisibles = menus
      .filter(menu => this.roleService.hasAnyRole(menu.roles || []))
      .map(menu => ({
        ...menu,
        opcionSimple: (menu.opcionSimple || []).filter(simple =>
          this.roleService.hasAnyRole(simple.roles || [])
        ),
        menuPrimerNivel: (menu.menuPrimerNivel || [])
          .filter(primerNivel => this.roleService.hasAnyRole(primerNivel.roles || []))
          .map(primerNivel => ({
            ...primerNivel,
            opcionSimple: (primerNivel.opcionSimple || []).filter(sub =>
              this.roleService.hasAnyRole(sub.roles || [])
            )
          }))
          .filter(primerNivel => primerNivel.opcionSimple.length > 0)
      }))
      .filter(menu => menu.opcionSimple.length > 0 || menu.menuPrimerNivel.length > 0);
  }
}