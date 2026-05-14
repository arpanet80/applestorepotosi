// src/modules/cash-sessions/cash-sessions.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CashSession, CashSessionSchema } from './schemas/cash-session.schema';
import { CashSessionsService } from './cash-sessions.service';
import { CashSessionsController } from './cash-sessions.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CashSession.name, schema: CashSessionSchema }]),
    UsersModule
  ],
  controllers: [CashSessionsController],
  providers: [CashSessionsService],
  exports: [CashSessionsService], // lo usa SalesModule
})
export class CashSessionsModule {}
