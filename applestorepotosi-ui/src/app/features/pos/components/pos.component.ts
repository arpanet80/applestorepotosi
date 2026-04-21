import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Observable, map, startWith, combineLatest, shareReplay } from 'rxjs';
import { CommonModule } from '@angular/common';

import { ProductService } from '../../products/services/product.service';
import { CustomerService } from '../../customers/services/customer.service';
import { PosService } from '../services/pos.service';
import { TicketPrintService, PrintableSale } from '../../../shared/services/ticket-print.service';

import { Product } from '../../products/models/product.model';
import { Customer } from '../../customers/models/customer.model';
import { PaymentMethod } from '../../sales/models/sale.model';
import { PosCartItemForm } from '../models/pos-cart-item.form';
import { ToastrAlertService } from '../../../shared/services/toastr-alert.service';
import { TaxConfigService } from '../../../shared/services/tax-config.service';

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
  private ticketService = inject(TicketPrintService);
  private taxConfig = inject(TaxConfigService);

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

  // NUEVAS PROPIEDADES PARA TICKET
  isSelling = false;
  lastSaleForTicket: PrintableSale | null = null;
  currentUserName = 'Vendedor';

  // CACHE DE SESIÓN
  private sessionCache: any = null;
  private sessionCacheTime = 0;
  private readonly CACHE_TTL = 5000; // 5 segundos

  // CACHE DE PRODUCTOS (evita recrear el observable)
  private productsCache$: Observable<Product[]> | null = null;

  ngOnInit(): void {
    this.loadSession();
    this.setupFilters();
    this.loadCustomers();
  }

  // ========== SESIÓN CON CACHE ==========
  loadSession() {
    const now = Date.now();
    if (this.sessionCache && (now - this.sessionCacheTime) < this.CACHE_TTL) {
      this.session = this.sessionCache;
      return;
    }

    this.posService.getCurrentSession().subscribe(s => {
      this.session = s;
      this.sessionCache = s;
      this.sessionCacheTime = now;
    });
  }

  // ========== CLIENTES ==========
  loadCustomers() {
    this.customerService.findAll({ isActive: true, limit: 100 }).subscribe(res => {
      this.customers = res.customers;
    });
  }

  // ========== FILTROS OPTIMIZADOS (sin recrear observables) ==========
  setupFilters() {
    // Cachear el observable de productos para no recrearlo en cada venta
    if (!this.productsCache$) {
      this.productsCache$ = this.productService.getProductsPaginated(this.page, this.limit).pipe(
        map(res => {
          this.totalPages = res.totalPages;
          this.products = res.products; // Guardar referencia local
          return res.products;
        }),
        shareReplay(1) // Compartir resultado entre suscriptores
      );
    }

    this.filteredProducts$ = combineLatest([
      this.productsCache$,
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

  // ========== CARRITO ==========
  addProduct(product: Product) {
    const available = product.availableQuantity ?? 0;
    if (available <= 0) {
      this.toastrAlertService.warning('Producto sin stock disponible');
      return;
    }

    const existing = this.cart.controls.find(c => c.get('productId')?.value === product._id);
    const currentInCart = existing ? existing.get('quantity')?.value || 0 : 0;
    const requested = currentInCart + 1;

    if (requested > available) {
      this.toastrAlertService.warning(`Solo puede agregar ${available} unidad(es)`);
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
      this.resetCart();
    }
  }

  resetCart() {
    this.cart.clear();
    this.selectedCustomer = null;
    this.paymentReference = '';
    this.paymentMethod = PaymentMethod.CASH;
    this.customerSearchControl.setValue('');
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

  // ========== VENTA OPTIMIZADA ==========
  sell() {
    if (!this.session || this.cart.length === 0 || this.isSelling) return;

    this.isSelling = true;

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
      next: (response: any) => {
        const printableSale = this.buildPrintableSale(response, payload);

        // 1. LIMPIAR UI INMEDIATAMENTE (< 50ms)
        this.lastSaleForTicket = printableSale;
        this.resetCart();
        this.isSelling = false;
        this.toastrAlertService.success('Venta realizada correctamente.');

        // 2. Actualizar caja (rápido, cacheado)
        this.loadSession();

        // 3. PDF + Telegram: Fire-and-forget REAL
        // El método ahora es paralelo internamente, retorna inmediatamente
        this.ticketService.processSaleComplete(printableSale, {
          ticketWidth: 80,
          includeQR: true
        });
        // ↑ No .then(), no .catch(), no await — totalmente desacoplado
      },
      error: (err) => {
        this.isSelling = false;
        this.toastrAlertService.error(err.error?.message || 'Error al finalizar la venta');
      },
    });
  }

  // ========== CONSTRUIR OBJETO IMPRIMIBLE (con TaxConfigService) ==========
  private buildPrintableSale(response: any, payload: any): PrintableSale {
    const items = this.cart.value.map(item => {
      const quantity = item.quantity ?? 0;
      const unitPrice = item.unitPrice ?? 0;
      const discount = item.discount ?? 0;
      const name = item.name ?? 'Producto sin nombre';

      return {
        name: name,
        quantity: quantity,
        unitPrice: unitPrice,
        discount: discount,
        subtotal: (quantity * unitPrice) - discount
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const taxAmount = this.taxConfig.calculateTax(subtotal); // ← Usa configuración
    const totalAmount = this.taxConfig.calculateTotal(subtotal); // ← Sin impuesto = subtotal

    const customerPhone = (this.selectedCustomer as any)?.phone ||
                          (this.selectedCustomer as any)?.mobile ||
                          '';
    const customerEmail = (this.selectedCustomer as any)?.email || '';

    return {
      saleNumber: response.saleNumber || 'SIN-NUMERO',
      saleDate: new Date(),
      customerName: this.selectedCustomer?.fullName || 'PÚBLICO GENERAL',
      customerNIT: (this.selectedCustomer as any)?.nit ||
                  (this.selectedCustomer as any)?.document ||
                  undefined,
      customerPhone: customerPhone,
      customerEmail: customerEmail,
      items: items,
      subtotal: subtotal,
      taxAmount: taxAmount,
      discountAmount: 0,
      totalAmount: totalAmount,
      paymentMethod: payload.paymentMethod,
      paymentReference: payload.paymentReference || undefined,
      cashierName: this.currentUserName,
      notes: payload.notes
    };
  }

  // ========== REIMPRIMIR ÚLTIMO TICKET ==========
  reprintLastTicket(): void {
    if (this.lastSaleForTicket) {
      this.ticketService.generateAndPrint(this.lastSaleForTicket, { ticketWidth: 80, includeQR: true });
    } else {
      this.toastrAlertService.warning('No hay venta reciente para reimprimir');
    }
  }

  // ========== APERTURA/CIERRE DE CAJA ==========
  openSession() {
    const opening = prompt('Monto de apertura:');
    if (opening === null) return;
    this.posService.openSession(parseFloat(opening)).subscribe(() => {
      this.sessionCache = null; // Invalidar cache
      this.loadSession();
    });
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
      .subscribe({
        next: () => {
          this.toastrAlertService.success('Se cerro la caja correctamente');
          this.session = null;
          this.sessionCache = null;
        },
        error: (err) => {
          this.toastrAlertService.error(err.error?.message || 'Error al cerrar la caja');
        }
      });
  }

  // ========== PAGINACIÓN (sin recargar todo) ==========
  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.productsCache$ = null; // Invalidar cache de productos
      this.setupFilters();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.productsCache$ = null; // Invalidar cache de productos
      this.setupFilters();
    }
  }
}