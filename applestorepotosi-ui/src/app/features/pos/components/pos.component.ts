import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Observable, map, startWith, combineLatest, shareReplay, Subject, takeUntil, BehaviorSubject, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';

import { ProductService } from '../../products/services/product.service';
import { CustomerService } from '../../customers/services/customer.service';
import { PosService } from '../services/pos.service';
import { TicketPrintService, PrintableSale } from '../../../shared/services/ticket-print.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component'; // Ajusta la ruta según tu estructura

import { Product } from '../../products/models/product.model';
import { Customer } from '../../customers/models/customer.model';
import { PaymentMethod } from '../../sales/models/sale.model';
import { PosCartItemForm } from '../models/pos-cart-item.form';
import { ToastrAlertService } from '../../../shared/services/toastr-alert.service';
import { TaxConfigService } from '../../../shared/services/tax-config.service';

// 🆕 TIPO DE ESTADO DE SESIÓN
type SessionState = 'loading' | 'active' | 'closed';

@Component({
  selector: 'app-pos',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SpinnerComponent], // 🆕 Importar SpinnerComponent
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.css'],
})
export class PosComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private posService = inject(PosService);
  private productService = inject(ProductService);
  private customerService = inject(CustomerService);
  private toastrAlertService = inject(ToastrAlertService);
  private ticketService = inject(TicketPrintService);
  private taxConfig = inject(TaxConfigService);

  // 🆕 ESTADO DE SESIÓN CON VALOR INICIAL 'loading'
  sessionState: SessionState = 'loading';
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

  isSelling = false;
  lastSaleForTicket: PrintableSale | null = null;
  currentUserName = 'Vendedor';

  private sessionCache: any = null;
  private sessionCacheTime = 0;
  private readonly CACHE_TTL = 5000;

  private refreshProducts$ = new BehaviorSubject<void>(undefined);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadSession(); // Ahora maneja el estado 'loading' internamente
    this.setupFilters();
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== SESIÓN CON ESTADO DE CARGA ==========
  loadSession() {
    const now = Date.now();
    
    // Si hay caché válido, usarlo inmediatamente sin mostrar spinner
    if (this.sessionCache && (now - this.sessionCacheTime) < this.CACHE_TTL) {
      this.session = this.sessionCache;
      this.sessionState = this.session ? 'active' : 'closed';
      return;
    }

    // 🆕 SIEMPRE empezar en loading cuando se consulta al servidor
    this.sessionState = 'loading';

    this.posService.getCurrentSession().subscribe({
      next: (s) => {
        this.session = s;
        this.sessionCache = s;
        this.sessionCacheTime = Date.now();
        // 🆕 Transicionar a 'active' o 'closed' según respuesta real
        this.sessionState = s ? 'active' : 'closed';
      },
      error: () => {
        // 🆕 En error, asumir cerrado pero tras mostrar el estado de carga
        this.sessionState = 'closed';
        this.toastrAlertService.error('Error al verificar el estado de la caja');
      }
    });
  }

  // ========== CLIENTES ==========
  loadCustomers() {
    this.customerService.findAll({ isActive: true, limit: 100 }).subscribe(res => {
      this.customers = res.customers;
    });
  }

  // ========== FILTROS ==========
  setupFilters() {
    const productsSource$ = this.refreshProducts$.pipe(
      switchMap(() => this.productService.getProductsPaginated(this.page, this.limit)),
      map(res => {
        this.totalPages = res.totalPages;
        this.products = res.products;
        return res.products;
      }),
      shareReplay(1),
      takeUntil(this.destroy$)
    );

    this.filteredProducts$ = combineLatest([
      productsSource$,
      this.productSearchControl.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([products, val]) =>
        products.filter(
          (p: Product) =>
            p.name.toLowerCase().includes((val ?? '').toLowerCase()) ||
            p.sku.toLowerCase().includes((val ?? '').toLowerCase())
        )
      ),
      takeUntil(this.destroy$)
    );

    this.filteredCustomers$ = this.customerSearchControl.valueChanges.pipe(
      startWith(''),
      map(val =>
        this.customers.filter(
          c =>
            c.fullName.toLowerCase().includes((val ?? '').toLowerCase()) ||
            c.email.toLowerCase().includes((val ?? '').toLowerCase())
        )
      ),
      takeUntil(this.destroy$)
    );
  }

  // ========== CARRITO (sin cambios) ==========
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

  // ========== VENTA ==========
  sell() {
    if (!this.session || this.cart.length === 0 || this.isSelling) return;

    this.isSelling = true;
    const cartSnapshot = this.cart.value.map(i => ({ ...i }));
    const selectedCustomerSnapshot = this.selectedCustomer;

    const payload = {
      customerId: this.selectedCustomer?._id || null,
      paymentMethod: this.paymentMethod,
      paymentReference: this.paymentReference,
      items: cartSnapshot.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
      })),
      notes: 'Venta desde POS',
    };

    this.posService.sell(payload).subscribe({
      next: (response: any) => {
        const printableSale = this.buildPrintableSale(response, payload, cartSnapshot, selectedCustomerSnapshot);

        this.lastSaleForTicket = printableSale;
        this.resetCart();
        this.isSelling = false;
        this.toastrAlertService.success('Venta realizada correctamente.');

        this.refreshProducts$.next();
        this.loadSession();
        this.ticketService.processSaleComplete(printableSale, {
          ticketWidth: 80,
          includeQR: true
        });
      },
      error: (err) => {
        this.isSelling = false;
        this.toastrAlertService.error(err.error?.message || 'Error al finalizar la venta');
      },
    });
  }

  private buildPrintableSale(
    response: any, 
    payload: any, 
    cartItems: any[],
    customer: Customer | null
  ): PrintableSale {
    
    const items = cartItems.map(item => {
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
    const taxAmount = this.taxConfig.calculateTax(subtotal);
    const totalAmount = this.taxConfig.calculateTotal(subtotal);

    const customerPhone = (customer as any)?.phone || (customer as any)?.mobile || '';
    const customerEmail = (customer as any)?.email || '';

    return {
      saleNumber: response.saleNumber || 'SIN-NUMERO',
      saleDate: new Date(),
      customerName: customer?.fullName || 'PÚBLICO GENERAL',
      customerNIT: (customer as any)?.nit || (customer as any)?.document || undefined,
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
    
    // 🆕 Mostrar spinner mientras se abre
    this.sessionState = 'loading';
    
    this.posService.openSession(parseFloat(opening)).subscribe({
      next: () => {
        this.sessionCache = null;
        this.loadSession(); // Esto pondrá 'active' al recibir la sesión
      },
      error: (err) => {
        this.sessionState = 'closed';
        this.toastrAlertService.error(err.error?.message || 'Error al abrir caja');
      }
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
          this.sessionState = 'closed'; // 🆕 Estado explícito
        },
        error: (err) => {
          this.toastrAlertService.error(err.error?.message || 'Error al cerrar la caja');
        }
      });
  }

  // ========== PAGINACIÓN ==========
  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.refreshProducts$.next();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.refreshProducts$.next();
    }
  }
}