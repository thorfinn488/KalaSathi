import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { users } from '../db/store.js';
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

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication token missing or invalid', 'AUTH_REQUIRED', 401);
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { user_id: string };
    const user = users.find((u) => u.user_id === payload.user_id);
    if (!user) {
      return sendError(res, 'User session not found', 'USER_NOT_FOUND', 401);
    }

    req.user = {
      user_id: user.user_id,
      name: user.name,
      role: user.role,
      phone: user.phone,
    };
    next();
  } catch (err) {
    return sendError(res, 'Token expired or invalid', 'INVALID_TOKEN', 401);
  }
}
