// src/modules/cash-sessions/cash-sessions.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { CashSession, CashSessionDocument } from './schemas/cash-session.schema';
import { CreateCashSessionDto } from './dto/create-cash-session.dto';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';
import { User, UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class CashSessionsService {
  constructor(
    @InjectModel(CashSession.name) private readonly model: Model<CashSessionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /* ========== OPEN ========== */
  async openSession(
    dto: CreateCashSessionDto,
    userId: string, // Firebase UID — se guarda como string
    session?: ClientSession,
  ): Promise<CashSessionDocument> {
    const exists = await this.model
      .findOne({ sessionId: dto.sessionId, isClosed: false })
      .session(session ?? null)
      .exec();
    if (exists) throw new ConflictException('Ya existe una sesión abierta con ese ID');

    // Verificar que el usuario existe antes de crear la sesión
    const user = await this.userModel
      .findOne({ uid: userId })
      .session(session ?? null)
      .exec();
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const created = new this.model({
      ...dto,
      openedBy: userId, // ← Firebase UID string directo
      sales: [],
      medios: { efectivo: 0, tarjeta: 0, transfer: 0, deposito: 0 },
    });
    return created.save({ session });
  }

  /* ========== GET OPEN ========== */
  async findOpen(session?: ClientSession): Promise<CashSessionDocument | null> {
    // Sin populate — openedBy es string, no ObjectId
    return this.model
      .findOne({ isClosed: false })
      .session(session ?? null)
      .exec();
  }

  /* ========== ADD CASH SALE ========== */
  async addCashSale(
    saleId: string,
    amount: number,
    session?: ClientSession,
  ): Promise<void> {
    const open = await this.findOpen(session);
    if (!open) throw new BadRequestException('No hay sesión de caja abierta');

    await this.model.updateOne(
      { _id: open._id },
      { $inc: { cashSales: amount } },
      { session },
    );
  }

  /* ========== ADD SALE TO SESSION (POST-COMMIT) ========== */
  async addSaleToSession(saleId: string): Promise<void> {
    const open = await this.findOpen();
    if (!open) return;
    await this.model.updateOne(
      { _id: open._id },
      { $addToSet: { sales: new Types.ObjectId(saleId) } },
    );
  }

  /* ========== ADD CASH REFUND ========== */
  async addCashRefund(amount: number, session?: ClientSession): Promise<void> {
    const open = await this.findOpen(session);
    if (!open) return;
    await this.model.updateOne(
      { _id: open._id },
      { $inc: { cashRefunds: amount } },
      { session },
    );
  }

  /* ========== CASH IN/OUT MANUAL ========== */
  async cashInOut(
    amount: number,
    motive: string,
    session?: ClientSession,
  ): Promise<CashSessionDocument> {
    const open = await this.findOpen(session);
    if (!open) throw new BadRequestException('No hay sesión abierta');

    await this.model.updateOne(
      { _id: open._id },
      { $inc: { cashInOut: amount } },
      { session },
    );

    const updated = await this.model
      .findById(open._id)
      .session(session ?? null)
      .exec();
    if (!updated) throw new NotFoundException();
    return updated;
  }

  /* ========== CLOSE ========== */
  async closeSession(
    sessionId: string,
    dto: CloseCashSessionDto,
    closedBy: string, // Firebase UID
    session?: ClientSession,
  ): Promise<CashSessionDocument> {
    const user = await this.userModel
      .findOne({ uid: closedBy })
      .session(session ?? null)
      .exec();
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const doc = await this.model
      .findById(sessionId)
      .session(session ?? null)
      .exec();
    if (!doc) throw new NotFoundException('Sesión no encontrada');
    if (doc.isClosed) throw new BadRequestException('Sesión ya cerrada');

    const expected =
      doc.openingBalance + doc.cashSales - doc.cashRefunds + doc.cashInOut;
    const discrepancy = dto.actualCash - expected;

    doc.isClosed   = true;
    doc.closedAt   = new Date();
    doc.closedBy   = closedBy; // ← Firebase UID string
    doc.closeType  = dto.closeType;
    doc.actualCash = dto.actualCash;
    doc.medios     = dto.medios;
    doc.notes      = dto.notes ?? '';

    if (discrepancy !== 0) {
      doc.discrepancy = { amount: discrepancy, reason: dto.notes };
    }

    return doc.save({ session });
  }

  /* ========== FIND BY ID ========== */
  async findById(id: string): Promise<any> {
    const doc = await this.model
      .findById(id)
      .populate('sales', 'saleNumber totals payment createdAt')
      .lean()
      .exec();
    if (!doc) throw new NotFoundException();
    return this._enrichWithUsers(doc);
  }

  /* ========== FIND ALL ========== */
  async findAll(dto: {
    page: number;
    limit: number;
    startDate?: Date;
    endDate?: Date;
    closeType?: 'X' | 'Z';
    user?: string;
  }) {
    const skip = (dto.page - 1) * dto.limit;
    const filter: Record<string, any> = {};

    if (dto.startDate) filter.openedAt = { $gte: dto.startDate };
    if (dto.endDate)   filter.openedAt = { ...filter.openedAt, $lte: dto.endDate };
    if (dto.closeType) filter.closeType = dto.closeType;
    if (dto.user)      filter.openedBy  = dto.user; // filtro por UID string

    const [sessions, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ openedAt: -1 })
        .skip(skip)
        .limit(dto.limit)
        .lean()
        .exec(),
      this.model.countDocuments(filter),
    ]);

    const enriched = await this._enrichManyWithUsers(sessions);

    return {
      sessions: enriched,
      total,
      page: dto.page,
      totalPages: Math.ceil(total / dto.limit),
    };
  }

  /* ========== HELPERS PRIVADOS ========== */

  /**
   * Adjunta name/email de openedBy y closedBy a un documento lean.
   */
  private async _enrichWithUsers(doc: any): Promise<any> {
    const uids = [doc.openedBy, doc.closedBy].filter(Boolean) as string[];
    const userMap = await this._buildUserMap(uids);
    return {
      ...doc,
      openedByUser: userMap.get(doc.openedBy) ?? null,
      closedByUser: doc.closedBy ? (userMap.get(doc.closedBy) ?? null) : null,
    };
  }

  /**
   * Versión batch: resuelve todos los UIDs de múltiples sesiones
   * en UNA sola query a la colección users.
   */
  private async _enrichManyWithUsers(docs: any[]): Promise<any[]> {
    const uids = [
      ...new Set(
        docs.flatMap((d) => [d.openedBy, d.closedBy].filter(Boolean) as string[]),
      ),
    ];
    const userMap = await this._buildUserMap(uids);

    return docs.map((doc) => ({
      ...doc,
      openedByUser: userMap.get(doc.openedBy) ?? null,
      closedByUser: doc.closedBy ? (userMap.get(doc.closedBy) ?? null) : null,
    }));
  }

  /** Construye un Map<uid, {uid, name, email}> con una sola query */
  private async _buildUserMap(
    uids: string[],
  ): Promise<Map<string, { uid: string; name: string; email: string }>> {
    if (!uids.length) return new Map();
    const users = await this.userModel
      .find({ uid: { $in: uids } })
      .select('uid name email')
      .lean()
      .exec();
    return new Map(users.map((u: any) => [u.uid, { uid: u.uid, name: u.name, email: u.email }]));
  }
}