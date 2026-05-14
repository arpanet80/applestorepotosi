import type { Request } from 'express';
import type { UserDocument } from '../../users/schemas/user.schema';

// FIX #8: Se usa `Request` de Express explícitamente en lugar del `Request`
// global del DOM, evitando conflictos de tipos en proyectos con @types/node
// o entornos donde el tipo global difiere.
export type UserRequest = Request & {
  user: UserDocument;
};