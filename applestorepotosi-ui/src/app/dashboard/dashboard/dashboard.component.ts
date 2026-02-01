import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  
  userName = 'Usuario';
  userRole = '';
  userAvatar = 'U';
  showUserMenu = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  private loadUserData(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.displayName || user.email || 'Usuario';
      this.userRole = user.role;
      this.userAvatar = this.generateAvatar(user.displayName || user.email);
    }
  }

  private generateAvatar(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    this.authService.logout();
  }
}