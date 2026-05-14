// avatar.service.ts - NUEVO SERVICIO
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AvatarService {

  /**
   * Generar avatar con iniciales y color de fondo
   */
  generateAvatar(displayName: string, size: number = 40): string {
    if (!displayName) return this.getDefaultAvatar();

    // Obtener iniciales
    const initials = this.getInitials(displayName);
    
    // Generar color basado en el nombre (siempre el mismo color para la misma persona)
    const color = this.generateColorFromName(displayName);
    
    // Crear SVG con las iniciales
    return this.createSvgAvatar(initials, color, size);
  }

  /**
   * Obtener iniciales del nombre
   */
  private getInitials(displayName: string): string {
    const names = displayName.trim().split(' ');
    
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    } else {
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
  }

  /**
   * Generar color consistente basado en el nombre
   */
  private generateColorFromName(name: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
      '#F9E79F', '#A9DFBF', '#F5B7B1', '#AED6F1', '#D2B4DE'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  /**
   * Crear SVG del avatar
   */
  private createSvgAvatar(initials: string, color: string, size: number): string {
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}" rx="8"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
              fill="white" font-family="Arial, sans-serif" font-size="${size * 0.4}" 
              font-weight="bold">${initials}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Avatar por defecto (silueta)
   */
  getDefaultAvatar(): string {
    const svg = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" fill="#e0e0e0" rx="8"/>
        <circle cx="20" cy="15" r="6" fill="#9e9e9e"/>
        <path d="M12 28c0-4.4 3.6-8 8-8s8 3.6 8 8v4H12v-4z" fill="#9e9e9e"/>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Obtener la URL del avatar a mostrar
   */
  getAvatarUrl(user: any): string {
    // 1. Foto de Google (ahora sí existe)
    
    if (user.photoURL) return user.photoURL;
    
    // 2. Avatar guardado en perfil
    if (user?.profile?.avatar) return user.profile.avatar;

    // 3. Generar con iniciales
    const displayName = user?.displayName ||
                      (user?.profile?.firstName && user?.profile?.lastName
                        ? `${user.profile.firstName} ${user.profile.lastName}`
                        : '') ||
                      user?.email || 'Usuario';

    return this.generateAvatar(displayName);
  }

  /**
   * Verificar si el usuario tiene foto de Google
   */
  hasGooglePhoto(user: any): boolean {
    return !!user?.photoURL && user?.provider === 'google';
  }

  /**
   * Obtener texto alternativo para el avatar
   */
  getAltText(user: any): string {
    if (user?.displayName) {
      return `Avatar de ${user.displayName}`;
    }
    if (user?.email) {
      return `Avatar de ${user.email}`;
    }
    return 'Avatar del usuario';
  }
}