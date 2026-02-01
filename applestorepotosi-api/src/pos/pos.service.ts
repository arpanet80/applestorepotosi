// src/pos/pos.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CashSessionsService } from '../cash-sessions/cash-sessions.service';
import { SalesService } from '../sales/sales.service';
import { CustomersService } from '../customers/customers.service';
import { PosSaleDto } from './dto/pos-sale.dto';
import { OpenPosSessionDto } from './dto/open-pos-session.dto';
import { ClosePosSessionDto } from './dto/close-pos-session.dto';
import { PaymentStatus } from '../sales/schemas/sale.schema';
import { StockMovementsService } from 'src/stock_movements/stock-movements.service';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection } from 'mongoose';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class PosService {
 constructor(
    @InjectConnection() private connection: Connection,
    private readonly cashSessionsService: CashSessionsService,
    private readonly salesService: SalesService,
    private readonly stockMovementsService: StockMovementsService,
    private readonly productsService: ProductsService,
    private readonly customersService: CustomersService,
    ) {}

  async openSession(userId: string, dto: OpenPosSessionDto) {
    const sessionId = `POS-${Date.now()}`;
    return this.cashSessionsService.openSession(
      { sessionId, openingBalance: dto.openingBalance },
      userId,
    );
  }

  async getCurrentSession() {
    return this.cashSessionsService.findOpen();
  }

  async sell(userId: string, dto: PosSaleDto) {
    const session: ClientSession = await this.connection.startSession();

    session.startTransaction();

    try {
        const openCash = await this.cashSessionsService.findOpen();
        if (!openCash) throw new BadRequestException('No hay caja abierta');

        // cliente por defecto
        let customerId = dto.customerId;
        if (!customerId) {
        const publicCust = await this.customersService.findPublicGeneral();
        customerId = publicCust._id.toString();
        }

        // 1.  descontar stock (con roll-back si falla)
        for (const item of dto.items) {
        const ok = await this.productsService.decrementStockIfAvailable(
            item.productId,
            item.quantity,
            session,
        );
        if (!ok)
            throw new BadRequestException(
            `Stock disponible insuficiente. Producto: ${item.productId}`,
            );
        }

        // 2.  crear venta
        const sale = await this.salesService.create(
          {
              customerId,
              saleDate: new Date(),
              payment: {
              method: dto.paymentMethod,
              status: PaymentStatus.COMPLETED,
              reference: dto.paymentReference || '',
              },
              items: dto.items,
              notes: dto.notes || 'Venta desde POS',
          },
          userId,
          session,
        );

        // 3.  movimientos de stock
        for (const item of dto.items) {
          const product = await this.productsService.findOne(item.productId);
          
          await this.stockMovementsService.create(
            {
              productId: item.productId,
              type: 'out',
              quantity: item.quantity,
              reason: 'sale',
              previousStock: product.stockQuantity,
              newStock: product.stockQuantity - item.quantity,
              userId,
              notes: `Venta POS - Sale ${sale.saleNumber}`,
              reservedAtMovement: product.reservedQuantity,
              unitCostAtMovement: product.costPrice,
            },
            session,
          );
        }

        // 4.  si es efectivo → sumar a caja
        if (dto.paymentMethod === 'cash') {
        const cashAmount = dto.items.reduce(
            (sum, i) => sum + i.unitPrice * i.quantity - (i.discount || 0),
            0,
        );
        await this.cashSessionsService.addCashSale(sale._id.toString(), cashAmount, session);
        }

        await session.commitTransaction();

        // ✅ Agregar saleId a la caja después del commit
        await this.cashSessionsService.addSaleToSession(sale._id.toString());
        return sale;
    } catch (e) {
        await session.abortTransaction();
        throw e; // Nest maneja el error 400/500
    } finally {
        session.endSession();
    }
  }

  async closeSession(userId: string, dto: ClosePosSessionDto) {
    const session = await this.cashSessionsService.findOpen();
    if (!session) throw new NotFoundException('No hay caja abierta');

    return this.cashSessionsService.closeSession(
      session._id.toString(),
      {
        actualCash: dto.actualCash,
        closeType: dto.closeType,
        medios: {
          efectivo: session.cashSales,
          tarjeta: dto.cardTotal,
          transfer: dto.transferTotal,
          deposito: 0,
        },
        notes: dto.notes,
      },
      userId,
    );
  }

  async getSessionReport(sessionId: string) {
    return this.cashSessionsService.findById(sessionId);
  }
}