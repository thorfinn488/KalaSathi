import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { db } from '../db/database.js';
import { sendError } from '../utils/response.js';

export interface AuthenticatedUser {
  user_id: string;
  name: string;
  role: 'ARTISAN' | 'ADMIN' | 'BUYER';
  phone: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication token missing or invalid', 'AUTH_REQUIRED', 401);
    return;
  }

  const token = authHeader.substring(7);
  let userId: string;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || typeof payload.user_id !== 'string') {
      sendError(res, 'Token payload is invalid', 'INVALID_TOKEN', 401);
      return;
    }
    userId = payload.user_id;
  } catch {
    sendError(res, 'Token expired or invalid', 'INVALID_TOKEN', 401);
    return;
  }

  try {
    const user = await db.selectFrom('users').select([
      'user_id',
      'name',
      'role',
      'phone',
    ]).where('user_id', '=', userId).executeTakeFirst();
    if (!user) {
      sendError(res, 'User session not found', 'USER_NOT_FOUND', 401);
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: AuthenticatedUser['role'][]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendError(res, 'Access forbidden for this account role.', 'FORBIDDEN', 403);
      return;
    }
    next();
  };
}
