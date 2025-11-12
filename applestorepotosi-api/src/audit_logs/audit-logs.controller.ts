// src/audit-logs/audit-logs.controller.ts (VERSIÓN CORREGIDA)
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards,ParseIntPipe,DefaultValuePipe,HttpCode,HttpStatus,Req,Header} from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditStatsQueryDto } from './dto/audit-stats-query.dto';
import { UpdateAuditNotesDto } from './dto/update-audit-notes.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('audit-logs')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(
    private readonly auditLogsService: AuditLogsService
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createAuditLogDto: CreateAuditLogDto) {
    return this.auditLogsService.create(createAuditLogDto);
  }

  @Post('log-action')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  logAction(
    @Body('userId') userId: string,
    @Body('collection') collection: string,
    @Body('action') action: string,
    @Body('documentId') documentId?: string,
    @Body('before') before?: any,
    @Body('after') after?: any,
    @Body('notes') notes?: string,
    @Body('ipAddress') ipAddress?: string,
    @Body('userAgent') userAgent?: string
  ) {
    return this.auditLogsService.logAction(
      userId,
      collection as any,
      action as any,
      documentId,
      before,
      after,
      notes,
      ipAddress,
      userAgent
    );
  }

  @Post('log-login')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN, UserRole.CUSTOMER)
  logLogin(
    @Body('userId') userId: string,
    @Body('ipAddress') ipAddress?: string,
    @Body('userAgent') userAgent?: string
  ) {
    return this.auditLogsService.logLogin(userId, ipAddress, userAgent);
  }

  @Post('log-logout')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN, UserRole.CUSTOMER)
  logLogout(
    @Body('userId') userId: string,
    @Body('ipAddress') ipAddress?: string,
    @Body('userAgent') userAgent?: string
  ) {
    return this.auditLogsService.logLogout(userId, ipAddress, userAgent);
  }

  @Post('log-create')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  logCreate(
    @Body('userId') userId: string,
    @Body('collection') collection: string,
    @Body('documentId') documentId: string,
    @Body('after') after: any,
    @Body('notes') notes?: string
  ) {
    return this.auditLogsService.logCreate(
      userId,
      collection as any,
      documentId,
      after,
      notes
    );
  }

  @Post('log-update')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  logUpdate(
    @Body('userId') userId: string,
    @Body('collection') collection: string,
    @Body('documentId') documentId: string,
    @Body('before') before: any,
    @Body('after') after: any,
    @Body('notes') notes?: string
  ) {
    return this.auditLogsService.logUpdate(
      userId,
      collection as any,
      documentId,
      before,
      after,
      notes
    );
  }

  @Post('log-delete')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN)
  logDelete(
    @Body('userId') userId: string,
    @Body('collection') collection: string,
    @Body('documentId') documentId: string,
    @Body('before') before: any,
    @Body('notes') notes?: string
  ) {
    return this.auditLogsService.logDelete(
      userId,
      collection as any,
      documentId,
      before,
      notes
    );
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query() query: AuditLogQueryDto) {
    return this.auditLogsService.findAll(query);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  getStats(@Query() query: AuditStatsQueryDto) {
    return this.auditLogsService.getStats(query);
  }

  @Get('recent')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getRecentActivity(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ) {
    return this.auditLogsService.getRecentActivity(limit);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN)
  findByUser(@Param('userId') userId: string) {
    return this.auditLogsService.findByUser(userId);
  }

  @Get('collection/:collection')
  @Roles(UserRole.ADMIN)
  findByCollection(@Param('collection') collection: string) {
    return this.auditLogsService.findByCollection(collection as any);
  }

  @Get('action/:action')
  @Roles(UserRole.ADMIN)
  findByAction(@Param('action') action: string) {
    return this.auditLogsService.findByAction(action as any);
  }

  @Get('document/:collection/:documentId')
  @Roles(UserRole.ADMIN)
  findByDocument(
    @Param('collection') collection: string,
    @Param('documentId') documentId: string
  ) {
    return this.auditLogsService.findByDocument(collection as any, documentId);
  }

  @Get('my-activity')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN, UserRole.CUSTOMER)
  getMyActivity(@Req() req: any) {
    const userId = req.user.uid || req.user._id;
    return this.auditLogsService.findByUser(userId);
  }

  @Get('export')
  @Roles(UserRole.ADMIN)
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="audit-logs.json"')
  async exportLogs(@Query() query: AuditLogQueryDto) {
    const logs = await this.auditLogsService.exportLogs(query);
    return JSON.stringify(logs, null, 2);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.auditLogsService.findOne(id);
  }

  @Get('dashboard/summary')
  @Roles(UserRole.ADMIN)
  async getDashboardSummary() {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - 7));
    const startOfMonth = new Date(today.setDate(today.getDate() - 30));

    const [todayStats, weekStats, monthStats, topUsers, recentSensitive] = await Promise.all([
      this.auditLogsService.getStats({ startDate: startOfToday }),
      this.auditLogsService.getStats({ startDate: startOfWeek }),
      this.auditLogsService.getStats({ startDate: startOfMonth }),
      this.auditLogsService.findAll({ 
        limit: 5, 
        page: 1 
      }),
      this.auditLogsService.findAll({ 
        isSensitive: true, 
        limit: 10, 
        page: 1 
      })
    ]);

    return {
      today: todayStats.total,
      week: weekStats.total,
      month: monthStats.total,
      topActions: todayStats.byAction,
      topCollections: todayStats.byCollection,
      topUsers: weekStats.byUser.slice(0, 5),
      recentSensitive: recentSensitive.auditLogs
    };
  }

  @Get('security/alerts')
  @Roles(UserRole.ADMIN)
  getSecurityAlerts(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ) {
    return this.auditLogsService.findAll({
      severity: 'high',
      isSensitive: true,
      limit,
      page: 1
    });
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string, 
    @Body() updateAuditLogDto: UpdateAuditLogDto
  ) {
    return this.auditLogsService.update(id, updateAuditLogDto);
  }

  @Put(':id/notes')
  @Roles(UserRole.ADMIN)
  updateNotes(
    @Param('id') id: string,
    @Body() updateNotesDto: UpdateAuditNotesDto
  ) {
    const updateDto: UpdateAuditLogDto = {
      notes: updateNotesDto.notes,
      isSensitive: updateNotesDto.isSensitive,
      severity: updateNotesDto.severity
    };
    
    return this.auditLogsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.auditLogsService.remove(id);
  }

  @Delete('cleanup/old-logs')
  @Roles(UserRole.ADMIN)
  async cleanupOldLogs(
    @Query('days', new DefaultValuePipe(365), ParseIntPipe) days: number
  ) {
    const result = await this.auditLogsService.cleanupOldLogs(days);
    return { 
      message: `Se eliminaron ${result.deletedCount} registros antiguos`,
      deletedCount: result.deletedCount 
    };
  }
}