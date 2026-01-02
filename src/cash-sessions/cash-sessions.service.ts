// src/modules/cash-sessions/cash-sessions.service.ts
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose'; // ← agrega ClientSession
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
    userId: string,
    session?: ClientSession,
  ): Promise<CashSessionDocument> {
    const exists = await this.model
      .findOne({ sessionId: dto.sessionId, isClosed: false })
      .session(session || null)
      .exec();
    if (exists) throw new ConflictException('Ya existe una sesión abierta con ese ID');

    const created = new this.model({
      ...dto,
      openedBy: userId,
      sales: [],
      medios: { efectivo: 0, tarjeta: 0, transfer: 0, deposito: 0 },
    });
    return created.save({ session });
  }

  /* ========== GET OPEN ========== */
  async findOpen(session?: ClientSession): Promise<CashSessionDocument | null> {
    return this.model
      .findOne({ isClosed: false })
      .session(session || null)
      .populate('openedBy', 'name email')
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
      {
        $inc: { cashSales: amount },
        // $push: { sales: new Types.ObjectId(saleId) },
      },
      { session },
    );
  }

  /* ========== ADD SALE TO SESSION (POST-COMMIT) ========== */
  async addSaleToSession(saleId: string): Promise<void> {
    const open = await this.findOpen();
    if (!open) return;

    await this.model.updateOne(
      { _id: open._id },
      { $push: { sales: new Types.ObjectId(saleId) } },
    );
  }

  /* ========== ADD CASH REFUND ========== */
  async addCashRefund(
    amount: number,
    session?: ClientSession,
  ): Promise<void> {
    const open = await this.findOpen(session);
    if (!open) return; // no hay caja abierta, no impacta
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
      .session(session || null)
      .exec();
    if (!updated) throw new NotFoundException();
    return updated;
  }

  /* ========== CLOSE ========== */
  async closeSession(
    sessionId: string,
    dto: CloseCashSessionDto,
    closedBy: string,
    session?: ClientSession,
  ): Promise<CashSessionDocument> {
    
    const user = await this.userModel.findOne({ uid: closedBy });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const doc = await this.model
      .findById(sessionId)
      .session(session || null)
      .exec();
    if (!doc) throw new NotFoundException('Sesión no encontrada');
    if (doc.isClosed) throw new BadRequestException('Sesión ya cerrada');

    const expected =
      doc.openingBalance + doc.cashSales - doc.cashRefunds + doc.cashInOut;
    const discrepancy = dto.actualCash - expected;

    doc.isClosed = true;
    doc.closedAt = new Date();
    doc.closedBy = user._id;
    doc.closeType = dto.closeType;
    doc.actualCash = dto.actualCash;
    doc.medios = dto.medios;
    doc.notes = dto.notes || '';
    if (discrepancy !== 0) {
      doc.discrepancy = { amount: discrepancy, reason: dto.notes };
    }

    return doc.save({ session });
  }

  /* ========== UTILS ========== */
  async findById(id: string): Promise<CashSessionDocument> {
    const doc = await this.model
      .findById(id)
      .populate('openedBy closedBy', 'name email')
      .populate('sales', 'folio total paymentMethod createdAt');
    if (!doc) throw new NotFoundException();
    return doc;
  }

  async findAll(dto: {
    page: number;
    limit: number;
    startDate?: Date;
    endDate?: Date;
    closeType?: 'X' | 'Z';
    user?: string;
  }) {
    const skip = (dto.page - 1) * dto.limit;
    const filter: any = {};
    if (dto.startDate) filter.openedAt = { $gte: dto.startDate };
    if (dto.endDate)   filter.openedAt = { ...filter.openedAt, $lte: dto.endDate };
    if (dto.closeType) filter.closeType = dto.closeType;
    if (dto.user)      filter.openedBy = dto.user;

    const [sessions, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('openedBy closedBy', 'name email')
        .sort({ openedAt: -1 })
        .skip(skip)
        .limit(dto.limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return { sessions, total, page: dto.page, totalPages: Math.ceil(total / dto.limit) };
  }
}