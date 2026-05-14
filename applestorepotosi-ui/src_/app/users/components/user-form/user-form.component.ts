import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/users.service';
import { User } from '../../models/user.model';
import { UpdateProfile } from '../../models/update-profile.interface';
import { CommonModule } from '@angular/common';
import { ToastrAlertService } from '../../../shared/services/toastr-alert.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  public  toastrAlertService = inject(ToastrAlertService);

  form!: FormGroup;
  user: User | null = null;
  uid = '';
  loading = true;
  isEdit = false;

  ngOnInit() {
    this.uid = this.route.snapshot.paramMap.get('uid') || '';
    this.isEdit = !!this.uid;
    this.initForm();
    if (this.isEdit) {
      this.loadUser();
    } else {
      this.loading = false;
    }
  }

  initForm() {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: [''],
      dateOfBirth: [''],
      gender: [''],
      avatar: [''],
      role: [''] 
    });
  }

  loadUser() {
    this.userService.findOne(this.uid).subscribe({
      next: (user) => {
        this.user = user;
        this.form.patchValue({
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          phone: user.profile?.phone || '',
          dateOfBirth: user.profile?.dateOfBirth || '',
          gender: user.profile?.gender || '',
          avatar: user.profile?.avatar || '',
          role: user.role || 'customer'
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    const dto: UpdateProfile = {
      profile: {
        firstName: this.form.value.firstName,
        lastName: this.form.value.lastName,
        phone: this.form.value.phone,
        dateOfBirth: this.form.value.dateOfBirth,
        gender: this.form.value.gender,
        avatar: this.form.value.avatar
      },
      role: this.form.value.role
    };

    this.userService.updateUserProfile(this.uid, dto).subscribe({
      next: () => {
        this.toastrAlertService.success(
          `Los cambios se guardaron correctamente`,
          'Operación completada'
        );
        this.router.navigate(['/dashboard', 'users', 'detail', this.uid]);
      },
      error: () => {
        this.toastrAlertService.error(
          `Error al guardar los cambios`,
          'Error'
        );
      }
    });
  }
  onCancel() {
    this.router.navigate(['/dashboard', 'users']);
  }
}