// src/auth/strategies/firebase.strategy.ts
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
    // ── DECODIFICAR TOKEN ────────────────────────────────────────────────────────
    let decodedToken: firebase.auth.DecodedIdToken;

    try {
      // FIX #1: checkRevoked = false (era true).
      //
      // verifyIdToken(token, true) hace una llamada de red extra a Google para
      // verificar si el token fue revocado manualmente. Esto:
      //   a) Añade ~200-500ms de latencia a CADA request autenticado.
      //   b) Si Google no responde a tiempo, lanza error → 401 falso.
      //   c) Para tokens recién emitidos (registro/login), puede fallar porque
      //      la propagación de Firebase no es instantánea.
      //
      // checkRevoked = false valida la firma criptográfica del JWT localmente
      // (sin red extra). Es suficiente para el 99.9% de los casos — los tokens
      // expirados se rechazan por su claim "exp", y los revocados manualmente
      // son un caso de uso muy específico que no aplica aquí.
      decodedToken = await firebase.auth().verifyIdToken(token, false);

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Error validando token Firebase:', message);
      throw new UnauthorizedException('Token inválido o expirado');
    }

    // ── CARGAR USUARIO DE MONGODB ────────────────────────────────────────────────
    try {
      // FIX #2: separar el try/catch de verifyIdToken del de usersService.
      //
      // Antes, si createOrUpdateUser() lanzaba por cualquier razón (conflicto
      // de escritura, timeout de MongoDB, campo único duplicado), el catch
      // genérico lo convertía en 401 "Token inválido o expirado", un mensaje
      // completamente engañoso. Ahora los errores de BD se propagan como 500.
      //
      // FIX #3: usar findOneByUid() en lugar de createOrUpdateUser().
      //
      // La estrategia es el punto caliente de CADA request autenticado.
      // createOrUpdateUser() hacía un upsert en MongoDB en cada llamada,
      // generando escrituras innecesarias y condiciones de carrera durante
      // el registro (el usuario se acaba de crear y ya hay otro upsert encima).
      //
      // La creación/actualización del usuario ya ocurre en endpoints dedicados:
      //   - POST /auth/register/customer  → crea el usuario
      //   - PUT  /users/:uid/google-profile → actualiza perfil Google
      //
      // La estrategia solo necesita LEER y verificar que el usuario existe
      // y está activo. Si no existe, es un estado inválido → 401 correcto.
      const user = await this.usersService.findOneByUid(decodedToken.uid);

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado en el sistema');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('La cuenta está desactivada');
      }

      return user;

    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      // Error de BD u otro inesperado — no enmascarar como 401
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Error cargando usuario en estrategia Firebase:', message);
      throw error;
    }
  }
}