import { UserDocument } from '../../users/schemas/user.schema';

export interface UserRequest extends Request {
  user: UserDocument;
}