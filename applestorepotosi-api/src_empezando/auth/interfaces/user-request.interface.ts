import { UserDocument } from '../../users/schemas/user.schema';

export interface UserRequest extends Request {
  user: UserDocument;
}
/*
import type { Request } from 'express';
import type { UserDocument } from '../../users/schemas/user.schema';

export type UserRequest = Request & {
  user: UserDocument;
};
*/