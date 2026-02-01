import { Component } from '@angular/core';
import { MenuSimpleComponent } from '../menu-simple/menu-simple.component';
import { MenuEtiquetaComponent } from '../menu-etiqueta/menu-etiqueta.component';
import { MENU_ADMIN } from '../interfaces/menu-opciones-sidebar';
import { MenuPrimerNivelComponent } from '../menu-primer-nivel/menu-primer-nivel.component';


@Component({
  selector: 'app-menu-principal',
  standalone: true,
  imports: [MenuSimpleComponent, MenuEtiquetaComponent, MenuPrimerNivelComponent],
  templateUrl: './menu-principal.component.html',
})
export class MenuPrincipalComponent {
  
  menuAdmin = MENU_ADMIN;

}
