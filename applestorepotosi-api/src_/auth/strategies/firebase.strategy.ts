import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-firebase-jwt';
import * as firebase from 'firebase-admin';
import { UsersService } from '../../users/users.service';

@Injectable()
export class FirebaseAuthStrategy extends PassportStrategy(Strategy, 'firebase') {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(token: string) {
    try {
      const decodedToken = await firebase.auth().verifyIdToken(token, true);

      // Datos específicos de Google
      const isGoogleUser = decodedToken.firebase?.sign_in_provider === 'google.com';
      const googleProfile = isGoogleUser
        ? {
            picture: decodedToken.picture,
            emailVerified: decodedToken.email_verified,
          }
        : {};

      const user = await this.usersService.createOrUpdateUser({
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email,
        phoneNumber: decodedToken.phone_number,
        ...googleProfile,
      });

      return user;
    } catch (error) {
      // FIX #4: Se relanza como UnauthorizedException para que el filtro global
      // de NestJS lo trate correctamente (HTTP 401), en lugar de un Error genérico
      // que NestJS convertiría en HTTP 500.
      // El error original se loggea internamente para facilitar la auditoría.
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Error validando token Firebase:', message);
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}