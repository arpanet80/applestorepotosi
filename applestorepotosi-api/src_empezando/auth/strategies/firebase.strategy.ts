import { Injectable } from '@nestjs/common';
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
      console.log('🔍 Validando token Firebase...');
      const decodedToken = await firebase.auth().verifyIdToken(token, true);
      console.log('✅ Token válido para usuario:', decodedToken.email);
      
      // Datos específicos de Google
      const isGoogleUser = decodedToken.firebase?.sign_in_provider === 'google.com';
      const googleProfile = isGoogleUser ? {
        picture: decodedToken.picture,
        emailVerified: decodedToken.email_verified,
      } : {};
      
      const user = await this.usersService.createOrUpdateUser({
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email,
        phoneNumber: decodedToken.phone_number,
        ...googleProfile
      });
      
      console.log('👤 Usuario en BD:', user.email, 'Rol:', user.role, 'Google:', isGoogleUser);
      
      return user;
    } catch (error) {
      console.error('❌ Error validando token:', error.message);
      throw new Error('Token inválido');
    }
  }
}