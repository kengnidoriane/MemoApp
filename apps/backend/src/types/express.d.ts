import { User } from '@memo-app/shared/types';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      id: string;
    }
  }
}