// header.ts - COMPONENTE ACTUALIZADO
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/services/auth.service';
import { AvatarService } from '../../../auth/services/avatar.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private avatarService = inject(AvatarService);
  
  private userSubscription!: Subscription;
  currentUser: any = null;
  userAvatar: string = '';
  userDisplayName: string = 'Usuario';
  userRole: string = '';
  userPosition: string = '';

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
      // Obtener avatar usando el servicio
      this.userAvatar = this.avatarService.getAvatarUrl(this.currentUser);

      
      // Obtener nombre para mostrar
      this.userDisplayName = this.getUserDisplayName();
      
      // Obtener rol y posición
      this.userRole = this.getUserRole();
      this.userPosition = this.getUserPosition();
    } else {
      // Valores por defecto
      this.userAvatar = this.avatarService.getDefaultAvatar();
      this.userDisplayName = 'Usuario';
      this.userRole = '';
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

  private getUserRole(): string {
    const role = this.currentUser?.role;
    const roleMap: { [key: string]: string } = {
      'admin': 'Admin',
      'sales': 'Ventas', 
      'technician': 'Técnico',
      'customer': 'Cliente'
    };
    
    return roleMap[role] || role || '';
  }

  private getUserPosition(): string {
    // Prioridad: profile.position → roleInfo.name → role
    return this.currentUser?.profile?.position || 
           this.currentUser?.roleInfo?.name || 
           this.getUserRole() || 
           'Usuario';
  }

  logout(): void {
    this.authService.logout();
  }

  // Helper methods para el template
  getUserInitials(): string {
    const names = this.userDisplayName.split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  hasGooglePhoto(): boolean {
    return this.avatarService.hasGooglePhoto(this.currentUser);
  }

  getAltText(): string {
    return this.avatarService.getAltText(this.currentUser);
  }
}