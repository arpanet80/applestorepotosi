import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Observable, map, startWith, combineLatest } from 'rxjs';
import { CommonModule } from '@angular/common';

import { ProductService } from '../../products/services/product.service';
import { CustomerService } from '../../customers/services/customer.service';
import { PosService } from '../services/pos.service';

import { Product } from '../../products/models/product.model';
import { Customer } from '../../customers/models/customer.model';
import { PaymentMethod } from '../../sales/models/sale.model';
import { PosCartItemForm } from '../models/pos-cart-item.form';
import { ToastrAlertService } from '../../../shared/services/toastr-alert.service';

@Component({
  selector: 'app-pos',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.css'],
})
export class PosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private posService = inject(PosService);
  private productService = inject(ProductService);
  private customerService = inject(CustomerService);
  private toastrAlertService = inject(ToastrAlertService);

  session: any = null;
  products: Product[] = [];
  customers: Customer[] = [];
  PaymentMethod = PaymentMethod;

  page = 1;
  limit = 8;
  totalPages = 0;

  cart = this.fb.array<FormGroup<PosCartItemForm>>([]);
  productSearchControl = this.fb.control('');
  customerSearchControl = this.fb.control('');

  paymentMethod: PaymentMethod = PaymentMethod.CASH;
  paymentReference = '';
  selectedCustomer: Customer | null = null;
  customerDropdownOpen = false;

  filteredProducts$: Observable<Product[]> | null = null;
  filteredCustomers$: Observable<Customer[]> | null = null;

  ngOnInit(): void {
    this.loadSession();
    this.setupFilters();
    this.loadCustomers();
  }

  loadSession() {
    this.posService.getCurrentSession().subscribe(s => this.session = s);
  }

  loadCustomers() {
    this.customerService.findAll({ isActive: true, limit: 100 }).subscribe(res => {
      this.customers = res.customers;
    });
  }

  setupFilters() {
    const products$ = this.productService.getProductsPaginated(this.page, this.limit).pipe(
      map(res => {
        this.totalPages = res.totalPages;
        return res.products;
      })
    );

    this.filteredProducts$ = combineLatest([
      products$,
      this.productSearchControl.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([products, val]) =>
        products.filter(
          (p: Product) =>
            p.name.toLowerCase().includes((val ?? '').toLowerCase()) ||
            p.sku.toLowerCase().includes((val ?? '').toLowerCase())
        )
      )
    );

    this.filteredCustomers$ = this.customerSearchControl.valueChanges.pipe(
      startWith(''),
      map(val =>
        this.customers.filter(
          c =>
            c.fullName.toLowerCase().includes((val ?? '').toLowerCase()) ||
            c.email.toLowerCase().includes((val ?? '').toLowerCase())
        )
      )
    );
  }

  addProduct(product: Product) {

    const available = product.availableQuantity ?? 0;
    if (available <= 0) {
      alert('Producto sin stock disponible');
      return;
    }

    
    const existing = this.cart.controls.find(c => c.get('productId')?.value === product._id);
    const currentInCart = existing ? existing.get('quantity')?.value || 0 : 0;
    const requested = currentInCart + 1;

    if (requested > available) {
      alert(`Solo puede agregar ${available} unidad(es)`);
      return;
    }

    if (existing) {
      existing.get('quantity')?.setValue(requested);
    } else {
      const group = this.fb.group<PosCartItemForm>({
        productId: this.fb.control<string>(product._id, { nonNullable: true }),
        name: this.fb.control<string>(product.name, { nonNullable: true }),
        sku: this.fb.control<string>(product.sku, { nonNullable: true }),
        quantity: this.fb.control<number>(1, { nonNullable: true }),
        unitPrice: this.fb.control<number>(product.salePrice, { nonNullable: true }),
        discount: this.fb.control<number>(0, { nonNullable: true }),
        subtotal: this.fb.control<number>(product.salePrice, { nonNullable: true }),
      });
      this.cart.push(group);
    }
    this.updateSubtotals();
  }

  removeItem(index: number) {
    this.cart.removeAt(index);
    this.updateSubtotals();
  }

  removeLastItem() {
    if (this.cart.length === 0) return;
    this.cart.removeAt(this.cart.length - 1);
    this.updateSubtotals();
  }

  cancelSale() {
    if (confirm('¿Seguro de cancelar la venta actual?')) {
      this.cart.clear();
      this.selectedCustomer = null;
      this.paymentReference = '';
      this.paymentMethod = PaymentMethod.CASH;
      this.customerSearchControl.setValue('');
    }
  }

  updateSubtotals() {
    this.cart.controls.forEach(control => {
      const q = control.value.quantity ?? 0;
      const p = control.value.unitPrice ?? 0;
      const d = control.value.discount ?? 0;
      control.get('subtotal')?.setValue(q * p - d);
    });
  }

  get cartTotal() {
    return this.cart.value.reduce((sum, i) => sum + (i.subtotal ?? 0), 0);
  }

  get expectedCash() {
    if (!this.session) return 0;
    return (
      (this.session.openingBalance ?? 0) +
      (this.session.cashSales ?? 0) -
      (this.session.cashRefunds ?? 0) +
      (this.session.cashInOut ?? 0)
    );
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomer = customer;
    this.customerSearchControl.setValue(customer.fullName);
  }

  sell() {
    if (!this.session || this.cart.length === 0) return;

    const payload = {
      customerId: this.selectedCustomer?._id || null,
      paymentMethod: this.paymentMethod,
      paymentReference: this.paymentReference,
      items: this.cart.value.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
      })),
      notes: 'Venta desde POS',
    };

    

    this.posService.sell(payload).subscribe({
      next: () => {
        this.cart.clear();
        this.selectedCustomer = null;
        this.paymentReference = '';
        this.loadSession();
        this.setupFilters()
        this.toastrAlertService.success('Operación exitosa');
      },
      error: (err) => {
        alert(err.error?.message || 'Error al finalizar la venta');
      },
    });
  }

  openSession() {
    const opening = prompt('Monto de apertura:');
    if (opening === null) return;
    this.posService.openSession(parseFloat(opening)).subscribe(() => this.loadSession());
  }

  closeSession() {
    const actualCash = prompt('Ingrese el monto real en caja:');
    if (actualCash === null) return;

    this.posService
      .closeSession({
        actualCash: parseFloat(actualCash),
        closeType: 'Z',
        cardTotal: 0,
        transferTotal: 0,
      })
      // .subscribe(() => (this.session = null));
      .subscribe({
        next: () => {
          this.toastrAlertService.success('Se cerro la caja correctamente');
          this.session = null
        },
        error: (err) => {
          this.toastrAlertService.error(err.error?.message || 'Error al cerrar la caja');
        }
      });
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.setupFilters();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.setupFilters();
    }
  }
}