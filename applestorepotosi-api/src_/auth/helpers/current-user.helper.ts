import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocument } from '../../users/schemas/user.schema';

// FIX #7: La clase @Injectable anterior no funcionaba como param decorator de NestJS
// porque no tenía acceso automático al ExecutionContext del request HTTP.
// La forma correcta es createParamDecorator, que extrae el usuario directamente
// del request que ya fue enriquecido por FirebaseAuthGuard.
//
// Uso en cualquier controller:
//   async miRuta(@CurrentUser() user: UserDocument) { ... }
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserDocument => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);