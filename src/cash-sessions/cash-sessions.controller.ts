// src/modules/cash-sessions/cash-sessions.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { CashSessionsService } from './cash-sessions.service';
import { CreateCashSessionDto } from './dto/create-cash-session.dto';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { UserRequest } from '../auth/interfaces/user-request.interface';
import { UserRole } from '../users/schemas/user.schema';

@Controller('cash-sessions')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class CashSessionsController {
  constructor(private readonly service: CashSessionsService) {}

  @Post('open')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  open(@Body() dto: CreateCashSessionDto, @Req() req: UserRequest) {
    return this.service.openSession(dto, req.user.uid);
  }

  @Get('open')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getOpen() {
    return this.service.findOpen();
  }

  @Post(':id/close')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  close(
    @Param('id') id: string,
    @Body() dto: CloseCashSessionDto,
    @Req() req: UserRequest,
  ) {
    return this.service.closeSession(id, dto, req.user.uid);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('closeType') closeType?: 'X' | 'Z',
    @Query('user') user?: string,
  ) {
    return this.service.findAll({
      page: +page,
      limit: +limit,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      closeType,
      user,
    });
  }
}