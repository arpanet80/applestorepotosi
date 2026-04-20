import { Sale } from '../models/sale.model';
import { SaleItem, ProductPopulated } from '../models/sale-item.model';
import { PrintableSale } from '../../../shared/services/ticket-print.service';

/**
 * Convierte una Sale del backend a formato imprimible
 */
export function convertSaleToPrintable(
  sale: Sale, 
  items: SaleItem[], 
  cashierName: string = 'Vendedor'
): PrintableSale {
  
  // Mapear items con productos poblados
  const printableItems = items.map(item => {
    const product = typeof item.productId === 'object' 
      ? (item.productId as ProductPopulated) 
      : null;
    
    return {
      name: product?.name || 'Producto',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      subtotal: item.subtotal
    };
  });

  // Extraer NIT/CI del cliente si existe
  const customerNIT = (sale.customerId as any)?.nit || 
                      (sale.customerId as any)?.document || 
                      (sale.customerId as any)?.ci ||
                      undefined;

  return {
    saleNumber: sale.saleNumber,
    saleDate: new Date(sale.saleDate),
    customerName: sale.customerId?.fullName || 'PÚBLICO GENERAL',
    customerNIT: customerNIT,
    items: printableItems,
    subtotal: sale.totals.subtotal,
    taxAmount: sale.totals.taxAmount,
    discountAmount: sale.totals.discountAmount,
    totalAmount: sale.totals.totalAmount,
    paymentMethod: sale.payment.method,
    paymentReference: sale.payment.reference,
    cashierName: sale.salesPersonId?.displayName || cashierName,
    notes: sale.notes
  };
}