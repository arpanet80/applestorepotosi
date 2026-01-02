// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';

import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseAuthStrategy } from './strategies/firebase.strategy';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    FirebaseAuthStrategy,
    FirebaseAuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    FirebaseAuthGuard,
    RolesGuard,
    PassportModule,
  ],
})
export class AuthModule {}