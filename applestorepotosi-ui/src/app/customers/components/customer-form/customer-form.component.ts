// src/app/customers/components/customer-form/customer-form.component.ts
import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import {FormBuilder,FormGroup,ReactiveFormsModule,Validators,  FormControl,} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, of, Observable } from 'rxjs';
import { CustomerService } from '../../services/customer.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user-select.model';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIf],
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.css'],
})
export class CustomerFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private customerService = inject(CustomerService);
  private userService = inject(UserService);

  form!: FormGroup;
  isEditMode = false;
  customerId?: string;
  submitting = false;
  error = '';

  // Dropdown
  dropdownOpen = false;
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  searchCtrl = new FormControl('');

  ngOnInit() {
    this.initForm();
    this.setupSearch();
    this.checkEditMode();
  }

  initForm() {
    this.form = this.fb.group({
      userId: [null],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      taxId: [''],
      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        zipCode: [''],
        country: [''],
      }),
      loyaltyPoints: [0],
      isActive: [true],
    });
  }

  setupSearch() {
    this.searchCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        if (typeof value === 'string' && value.length > 1) {
          this.userService.searchUsers(value, 10).subscribe((list) => {
            this.filteredUsers = list;
            this.dropdownOpen = true;
          });
        } else {
          this.filteredUsers = [];
          this.dropdownOpen = false;
        }
      });
  }

  // Dropdown
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen && this.searchCtrl.value) {
      this.setupSearch();
    }
  }
  openDropdown() {
    this.dropdownOpen = true;
  }
  closeDropdown() {
    this.dropdownOpen = false;
  }
  selectUser(u: User) {
    this.selectedUser = u;
    this.form.patchValue({ userId: u._id });
    this.searchCtrl.setValue(u.displayName);
    this.closeDropdown();
  }
  clearUser() {
    this.selectedUser = null;
    this.form.patchValue({ userId: null });
    this.searchCtrl.setValue('');
  }

  // Cerrar al hacer click fuera
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.closeDropdown();
    }
  }

  checkEditMode() {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.customerId = params['id'];
        this.loadCustomer();
      }
    });
  }

  loadCustomer() {
    if (!this.customerId) return;
    this.customerService.findOne(this.customerId).subscribe({
      next: (c) => {
        this.form.patchValue(c);
        if (c.userId) {
          // Simula objeto mínimo
          this.selectedUser = {
            _id: c.userId,
            displayName: (c as any).userId?.displayName || '',
            email: (c as any).userId?.email || '',
            phoneNumber: (c as any).userId?.phoneNumber || '',
          };
          this.searchCtrl.setValue(this.selectedUser.displayName);
        }
      },
      error: () => (this.error = 'Error al cargar el cliente'),
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.submitting = true;
    const dto = this.form.value;

    const op = this.isEditMode
      ? this.customerService.update(this.customerId!, dto)
      : this.customerService.create(dto);

    op.subscribe({
      next: () => this.router.navigate(['/dashboard', 'customers']),
      error: () => {
        this.error = this.isEditMode ? 'Error al actualizar' : 'Error al crear';
        this.submitting = false;
      },
    });
  }

  onCancel() {
    this.router.navigate(['/dashboard', 'customers']);
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchCtrl.setValue(value);
  }
}