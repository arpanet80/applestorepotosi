// src/pos/pos.controller.ts
import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PosService } from './pos.service';
import { OpenPosSessionDto } from './dto/open-pos-session.dto';
import { PosSaleDto } from './dto/pos-sale.dto';
import { ClosePosSessionDto } from './dto/close-pos-session.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('pos')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('open')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  openSession(@Body() dto: OpenPosSessionDto, @Req() req: any) {
    return this.posService.openSession(req.user.uid, dto);
  }

  @Get('current')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getCurrentSession() {
    return this.posService.getCurrentSession();
  }

  @Post('sell')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  sell(@Body() dto: PosSaleDto, @Req() req: any) {
    return this.posService.sell(req.user.uid, dto);
  }

  @Post('close')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  closeSession(@Body() dto: ClosePosSessionDto, @Req() req: any) {
    return this.posService.closeSession(req.user.uid, dto);
  }

  @Get('report/:id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getSessionReport(@Param('id') id: string) {
    return this.posService.getSessionReport(id);
  }
}