import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { User } from '../../models/user.model';
import { AuthService } from '../../../auth/services/auth.service';
import { UserRole } from '../../../auth/models/user.model';
import { UserService } from '../../services/users.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  user: User | null = null;
  loading = true;
  error = '';
  canEdit = false;

  ngOnInit() {
    this.checkPermissions();
    this.loadUser();
  }

  checkPermissions() {
    this.canEdit = this.authService.hasAnyRole([UserRole.ADMIN]);
  }

  loadUser() {
    const uid = this.route.snapshot.paramMap.get('uid');
    if (!uid) {
      this.error = 'UID de usuario no válido';
      this.loading = false;
      return;
    }

    this.userService.findOne(uid).subscribe({
      next: user => {
        this.user = user;
        this.loading = false;
      },
      error: () => {
        this.error = 'Usuario no encontrado';
        this.loading = false;
      }
    });
  }

  onEdit() {
    if (!this.user) return;
    this.router.navigate(['/dashboard', 'users', 'edit', this.user.uid]);
  }

  onToggleStatus() {
    if (!this.user) return;
    const action = this.user.isActive ? 'desactivar' : 'activar';
    if (!confirm(`¿${action} a ${this.user.displayName || this.user.email}?`)) return;

    const obs = this.user.isActive
      ? this.userService.deactivate(this.user.uid)
      : this.userService.activate(this.user.uid);

    obs.subscribe({
      next: () => this.loadUser(),
      error: () => alert('Error al actualizar estado')
    });
  }
}