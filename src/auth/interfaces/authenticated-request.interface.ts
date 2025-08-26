import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: string;
    clientId: string;
    [key: string]: any;
  };
}
