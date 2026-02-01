// sidebar.ts - ACTUALIZADO
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuPrincipalComponent } from './menu/menu-principal/menu-principal.component';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { AvatarService } from '../../../auth/services/avatar.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [MenuPrincipalComponent, CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit, OnDestroy {
  private userSubscription!: Subscription;
  
  // Datos del usuario
  currentUser: any = null;
  userDisplayName: string = 'Usuario';
  userPosition: string = '';

  constructor(
    private authService: AuthService,
    private avatarService: AvatarService
  ) {}

  ngOnInit() {
    // Suscribirse a cambios en el usuario
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.updateUserInfo();
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private updateUserInfo(): void {
    if (this.currentUser) {
      // Obtener nombre para mostrar
      this.userDisplayName = this.getUserDisplayName();
      
      // Obtener posición/cargo
      // this.userPosition = this.getUserPosition();
      this.userPosition = this.getUserRole();
    } else {
      // Valores por defecto
      this.userDisplayName = 'Usuario';
      this.userPosition = '';
    }
  }

  private getUserDisplayName(): string {
    if (this.currentUser?.displayName) {
      return this.currentUser.displayName;
    }
    
    if (this.currentUser?.profile?.firstName && this.currentUser?.profile?.lastName) {
      return `${this.currentUser.profile.firstName} ${this.currentUser.profile.lastName}`;
    }
    
    if (this.currentUser?.email) {
      return this.currentUser.email.split('@')[0];
    }
    
    return 'Usuario';
  }

  // private getUserPosition(): string {
  //   // Prioridad: profile.position → roleInfo.name → role
  //   return this.currentUser?.profile?.position || 
  //          this.currentUser?.roleInfo?.name || 
  //          this.getUserRole() || 
  //          'Usuario';
  // }

  private getUserRole(): string {
    const role = this.currentUser?.role;
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrador',
      'sales': 'Ventas', 
      'technician': 'Técnico',
      'customer': 'Cliente'
    };
    
    return roleMap[role] || role || '';
  }
}