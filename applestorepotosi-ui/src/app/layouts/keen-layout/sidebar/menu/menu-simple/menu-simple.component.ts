// src/app/shared/components/menu-simple/menu-simple.component.ts
import { Component, inject, input, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { RoleService } from '../services/role.service';
import { OpcionSimple } from '../interfaces/menu.interface';

@Component({
  selector: 'app-menu-simple',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu-simple.component.html',
  styleUrls: ['./menu-simple.component.css']
})
export class MenuSimpleComponent implements OnInit {
  private roleService = inject(RoleService);

  menusimple = input<OpcionSimple>(); // ✅ acepta undefined
  tienePermiso = false;

  ngOnInit() {
    const menu = this.menusimple();
    if (!menu) return;

    this.tienePermiso = this.roleService.hasAnyRole(menu.roles || []);
  }
}