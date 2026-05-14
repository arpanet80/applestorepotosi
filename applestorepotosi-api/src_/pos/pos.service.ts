// src/pos/pos.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CashSessionsService } from '../cash-sessions/cash-sessions.service';
import { SalesService } from '../sales/sales.service';
import { CustomersService } from '../customers/customers.service';
import { PosSaleDto } from './dto/pos-sale.dto';
import { OpenPosSessionDto } from './dto/open-pos-session.dto';
import { ClosePosSessionDto } from './dto/close-pos-session.dto';
import { PaymentStatus, PaymentMethod, SaleStatus } from '../sales/schemas/sale.schema';
import { StockMovementsService } from 'src/stock_movements/stock-movements.service';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection } from 'mongoose';
import { ProductsService } from 'src/products/products.service';
import { randomBytes } from 'crypto';

// Máximo de reintentos ante errores transitorios de MongoDB
const MAX_TX_RETRIES = 3;

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

  /* ========== OPEN SESSION ========== */
  async openSession(userId: string, dto: OpenPosSessionDto) {
    // ✅ FIX #7: nanoid en lugar de Date.now() para evitar colisiones bajo carga
    const sessionId = `POS-${randomBytes(6).toString('hex')}`; // 12 chars hex, sin dependencia externa
    return this.cashSessionsService.openSession(
      { sessionId, openingBalance: dto.openingBalance },
      userId,
    );
  }

  /* ========== GET CURRENT SESSION ========== */
  async getCurrentSession() {
    return this.cashSessionsService.findOpen();
  }

  /* ========== SELL ========== */
  async sell(userId: string, dto: PosSaleDto) {
    // ✅ FIX #8: Reintentos ante TransientTransactionError / WriteConflict
    for (let attempt = 1; attempt <= MAX_TX_RETRIES; attempt++) {
      const session: ClientSession = await this.connection.startSession();
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      });

      try {
        const sale = await this._executeSell(userId, dto, session);
        await session.commitTransaction();

        // ✅ FIX #1: addSaleToSession ocurre post-commit; $addToSet lo hace idempotente
        await this.cashSessionsService.addSaleToSession(sale._id.toString());

        return sale;
      } catch (e: any) {
        await session.abortTransaction();

        // ✅ FIX #8: Reintentar solo en errores transitorios de MongoDB
        const isTransient =
          e?.errorLabels?.includes('TransientTransactionError') ||
          e?.errorLabels?.includes('UnknownTransactionCommitResult');

        if (isTransient && attempt < MAX_TX_RETRIES) {
          continue; // reintenta
        }

        throw e; // error de negocio o reintentos agotados
      } finally {
        session.endSession();
      }
    }

    throw new InternalServerErrorException('No se pudo completar la venta tras varios intentos');
  }

  /* ========== SELL — lógica interna (dentro de transacción) ========== */
  private async _executeSell(userId: string, dto: PosSaleDto, session: ClientSession) {
    // ✅ FIX #1: findOpen con session → lectura consistente dentro de la transacción
    const openCash = await this.cashSessionsService.findOpen(session);
    if (!openCash) throw new BadRequestException('No hay caja abierta');

    // Cliente por defecto si no se especifica
    let customerId = dto.customerId;
    if (!customerId) {
      const publicCust = await this.customersService.findPublicGeneral();
      customerId = publicCust._id.toString();
    }

    // 1. Leer stock previo + decrementar atómicamente dentro de la transacción
    // Guardamos snapshot del stock ANTES del decremento para usarlo en los movimientos.
    const previousStockMap = new Map<string, number>();
    for (const item of dto.items) {
      // Leer stock actual antes de decrementar (dentro de la misma tx → lectura consistente)
      const snap = await this.productsService.findOne(item.productId, session, true);
      previousStockMap.set(item.productId, snap.stockQuantity);

      const ok = await this.productsService.decrementStockIfAvailable(
        item.productId,
        item.quantity,
        session,
      );
      if (!ok) {
        throw new BadRequestException(
          `Stock disponible insuficiente. Producto: ${item.productId}`,
        );
      }
    }

    // 2. Crear venta dentro de la transacción.
    //    ✅ FIX doble-decremento: skipStockOps=true porque PosService ya
    //    decrementó stock (paso 1) y creará los movimientos (paso 3).
    const sale = await this.salesService.create(
      {
        customerId,
        saleDate: new Date(),
        status: SaleStatus.CONFIRMED,
        payment: {
          method: dto.paymentMethod,
          status: PaymentStatus.COMPLETED,
          reference: dto.paymentReference ?? '',
        },
        items: dto.items,
        notes: dto.notes ?? 'Venta desde POS',
      },
      userId,
      session,
      true, // skipStockOps
    );

    // 3. Movimientos de stock dentro de la transacción
    //    previousStock viene del snapshot capturado en el paso 1 (valor exacto pre-decremento).
    //    skipImage=true evita la query extra a product_images en contexto transaccional.
    for (const item of dto.items) {
      const product = await this.productsService.findOne(item.productId, session, true);
      const prevStock = previousStockMap.get(item.productId) ?? product.stockQuantity + item.quantity;

      await this.stockMovementsService.create(
        {
          productId: item.productId,
          type: 'out',
          quantity: item.quantity,
          reason: 'sale',
          previousStock: prevStock,
          newStock: prevStock - item.quantity,
          userId,
          notes: `Venta POS - Sale ${sale.saleNumber}`,
          reservedAtMovement: product.reservedQuantity,
          unitCostAtMovement: product.costPrice,
        },
        session,
      );
    }

    // 4. Si es efectivo → acumular en caja (dentro de la transacción)
    if (dto.paymentMethod === PaymentMethod.CASH) {
      // ✅ FIX #3: usar sale.totals.total (dato del servidor) en lugar de recalcular desde el DTO
      await this.cashSessionsService.addCashSale(
        sale._id.toString(),
        sale.totals.totalAmount,
        session,
      );
    }

    return sale;
  }

  /* ========== CLOSE SESSION ========== */
  async closeSession(userId: string, dto: ClosePosSessionDto) {
    // ✅ FIX #4: Toda la operación de cierre dentro de una transacción
    const mongoSession: ClientSession = await this.connection.startSession();
    mongoSession.startTransaction({
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    });

    try {
      // ✅ FIX #4: findOpen con session → no hay gap entre lectura y escritura
      const openSession = await this.cashSessionsService.findOpen(mongoSession);
      if (!openSession) throw new NotFoundException('No hay caja abierta');

      // ✅ FIX #5: efectivo viene del DTO (conteo físico), no de cashSales
      const result = await this.cashSessionsService.closeSession(
        openSession._id.toString(),
        {
          actualCash: dto.actualCash,
          closeType: dto.closeType,
          medios: {
            efectivo: dto.actualCash,       // conteo físico real
            tarjeta: dto.cardTotal,
            transfer: dto.transferTotal,
            deposito: dto.depositTotal ?? 0, // ✅ FIX #5: ya no es siempre 0
          },
          notes: dto.notes,
        },
        userId,
        mongoSession,
      );

      await mongoSession.commitTransaction();
      return result;
    } catch (e) {
      await mongoSession.abortTransaction();
      throw e;
    } finally {
      mongoSession.endSession();
    }
  }

  /* ========== SESSION REPORT ========== */
  async getSessionReport(sessionId: string) {
    return this.cashSessionsService.findById(sessionId);
  }
}