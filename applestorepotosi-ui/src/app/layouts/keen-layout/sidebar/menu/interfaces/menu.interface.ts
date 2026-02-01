// src/app/core/interfaces/menu.interface.ts

import { UserRole } from "../../../../../auth/models/user.model";

export interface Etiqueta {
  titulo: string;
  roles?: UserRole[];
}

export interface OpcionSimple {
  titulo: string;
  icono?: string;
  url: string;
  roles?: UserRole[];
}

export interface MenuPrimerNivel {
  titulo: string;
  icono?: string;
  url: string;
  roles?: UserRole[];
  opcionSimple: OpcionSimple[];
}

export interface MenuSegundoNivel {
  titulo: string;
  icono?: string;
  url: string;
  roles?: UserRole[];
  opcionSimple?: OpcionSimple[];
  menuPrimerNivel?: MenuPrimerNivel[];
}

export interface MenuSidebar {
  etiqueta?: Etiqueta;
  opcionSimple?: OpcionSimple[];
  menuPrimerNivel?: MenuPrimerNivel[];
  menuSegundoNivel?: MenuSegundoNivel[];
}