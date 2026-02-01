import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { User, UserQuery } from '../../models/user.model';
import { UserService } from '../../services/users.service';
import { AuthService } from '../../../auth/services/auth.service';
import { AvatarService } from '../../../auth/services/avatar.service';
import { UserRole } from '../../../auth/models/user.model';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { ToastrAlertService } from '../../../shared/services/toastr-alert.service';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './users-page.component.html',
  styleUrls: ['./users-page.component.css']
})
export class UsersPageComponent implements OnInit, OnDestroy {
  /* ----------  SERVICES  ---------- */
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  public  avatarService = inject(AvatarService);
  public  sweetAlertService = inject(SweetAlertService);
  public  toastrAlertService = inject(ToastrAlertService);

  /* ----------  UI STATE  ---------- */
  users: User[] = [];
  loading = true;
  searchTerm = '';
  selectedRole: UserRole | undefined = undefined; 
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 0;

  UserRole = UserRole;
  canCreate = false;
  canManage = false;

  /* ----------  SEARCH WITH DEBOUNCE  ---------- */
  searchControl = new FormControl('');
  private destroy$ = new Subject<void>();
  roleControl = new FormControl<UserRole | undefined>(undefined);


  ngOnInit(): void {
    this.checkPermissions();
    this.setupSearchDebouncer();
    this.setupRoleFilter();   // <-- aquí
    this.loadUsers();
  }

  private setupRoleFilter(): void {
    this.roleControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(role => {
        this.selectedRole = role || undefined; // "" → undefined
        this.page = 1;
        this.loadUsers();
    });
}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ----------  PERMISOS  ---------- */
  checkPermissions(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.canCreate = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
    this.canManage = this.authService.hasAnyRole([UserRole.ADMIN]);
  }

  /* ----------  DEBOUNCE  ---------- */
  private setupSearchDebouncer(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(term => {
        this.searchTerm = term ?? '';
        this.onSearch();
      });
  }

  /* ----------  LOAD  ---------- */
  async loadUsers(): Promise<void> {
    this.loading = true;

    const query: UserQuery = {
      search: this.searchTerm.trim() || undefined,
      role: this.selectedRole, // ← puede ser undefined
      page: this.page,
      limit: this.limit
    };

    this.userService.findAll(query).subscribe({
      next: res => {
        this.users      = res.users;
        this.total      = res.total;
        this.totalPages = res.totalPages;
        this.loading    = false;
      },
      error: () => {
        this.users   = [];
        this.loading = false;
      }
    });

    /*this.userService.findAll(query).subscribe({
      next: (res: any) => {
        // 🔥 Guarda-null
        if (!res) {
          this.users = [];
          this.total = 0;
          this.totalPages = 0;
          this.loading = false;
          return;
        }

        const usersRaw = Array.isArray(res) ? res : res.users ?? [];
        this.users = usersRaw;
        this.total = Array.isArray(res) ? usersRaw.length : (res.total ?? 0);
        this.totalPages = Array.isArray(res) ? 1 : (res.totalPages ?? 0);
        this.loading = false;
      },
      error: () => {
        this.users = [];
        this.loading = false;
      }
    });*/
  }

  /* ----------  EVENTS  ---------- */
  onSearch(): void {
    this.page = 1;
    this.loadUsers();
  }

  onFilterRole(): void {
    this.page = 1;
    this.loadUsers();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadUsers();
  }

  onToggleStatus(user: User): void {
    if (!user) return;
    const action = user.isActive ? 'desactivar' : 'activar';

    this.sweetAlertService
      .confirm(
        `¿Está seguro de <b>${action}</b> al usuario <b>${user.displayName || user.email}</b>?`,
        `Confirmar ${action}`,
        'Sí, ' + action,
        'Cancelar',
        true
      )
      .then(res => {
        if (!res.isConfirmed) return;
        this.sweetAlertService.loading('Procesando...');

        const obs = user.isActive
          ? this.userService.deactivate(user.uid)
          : this.userService.activate(user.uid);

        obs.subscribe({
          next: () => {
            this.sweetAlertService.close();
            this.toastrAlertService.success(
              `Usuario ${user.displayName || user.email} ${action}do correctamente`,
              'Operación completada'
            );
            this.loadUsers();
          },
          error: () => {
            this.sweetAlertService.close();
            this.toastrAlertService.error(
              `No se pudo ${action} al usuario ${user.displayName || user.email}`,
              'Error'
            );
          }
        });
      });
  }

  onRefresh(): void {
    this.loadUsers();
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }
}