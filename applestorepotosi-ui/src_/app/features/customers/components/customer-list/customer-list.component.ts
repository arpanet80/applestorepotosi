import { Component, OnInit, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../services/customer.service';
import { Customer, CustomerQuery } from '../../models/customer.model';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css'],
})
export class CustomerListComponent implements OnInit {
  private service = inject(CustomerService);

  filters = input<Partial<CustomerQuery>>({});
  showActions = input(true);

  customerSelected = output<Customer>();
  customerEdit = output<Customer>();
  customerDelete = output<Customer>();

  customers: Customer[] = [];
  loading = false;
  error = '';

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading = true;
    this.error = '';
    const query = this.filters() as CustomerQuery;
    this.service.findAll(query).subscribe({
      next: (res) => {
        this.customers = res.customers;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar clientes';
        this.loading = false;
      },
    });
  }

  onSelect(c: Customer) {
    this.customerSelected.emit(c);
  }

  onEdit(c: Customer) {
    this.customerEdit.emit(c);
  }

  onDelete(c: Customer) {
    if (confirm(`¿Eliminar cliente "${c.fullName}"?`)) {
      this.customerDelete.emit(c);
    }
  }

  toggleActive(c: Customer) {
    this.service.toggleActive(c._id).subscribe({
      next: (updated) => {
        const idx = this.customers.findIndex((x) => x._id === updated._id);
        if (idx !== -1) this.customers[idx] = updated;
      },
    });
  }
}