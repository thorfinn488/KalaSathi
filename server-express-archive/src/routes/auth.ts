import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { db } from '../db/database.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ARTISAN', 'BUYER'], {
    message: 'Public registration is only available for ARTISAN or BUYER roles',
  }),
  region: z.string().optional(),
  craft_specialty: z.string().optional(),
  company_name: z.string().optional(),
  requirements: z.string().optional(),
});

const loginSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

// Register
authRouter.post('/register', async (req: Request, res: Response, next) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    const errorMsg = result.error.issues.map((issue) => issue.message).join(', ');
    return sendError(res, errorMsg, 'VALIDATION_ERROR', 400);
  }

  const { name, phone, password, role, region, craft_specialty, company_name, requirements } = result.data;

  // Check if phone already registered
  try {
    const newUser = {
      user_id: `usr_${randomUUID()}`,
      name,
      phone,
      password_hash: await bcrypt.hash(password, 10),
      role,
      region: region ?? null,
      craft_specialty: craft_specialty ?? null,
      company_name: company_name ?? null,
      requirements: requirements ?? null,
    };
    await db.insertInto('users').values(newUser).execute();
    const token = jwt.sign({ user_id: newUser.user_id, role: newUser.role }, env.JWT_SECRET, {
      expiresIn: '7d',
      algorithm: 'HS256',
    });

    return sendSuccess(res, {
      user_id: newUser.user_id,
      name: newUser.name,
      role: newUser.role,
      token,
    }, 201);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      return sendError(res, 'An account with this phone number already exists', 'USER_EXISTS', 409);
    }
    next(error);
  }
});

// Login
authRouter.post('/login', async (req: Request, res: Response, next) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return sendError(res, 'Please provide valid phone and password', 'VALIDATION_ERROR', 400);
  }

  const { phone, password } = result.data;
  try {
    const user = await db.selectFrom('users').selectAll().where('phone', '=', phone).executeTakeFirst();
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return sendError(res, 'Invalid phone number or password', 'INVALID_CREDENTIALS', 401);
    }

    const token = jwt.sign({ user_id: user.user_id, role: user.role }, env.JWT_SECRET, {
      expiresIn: '7d',
      algorithm: 'HS256',
    });

    return sendSuccess(res, {
      user_id: user.user_id,
      name: user.name,
      role: user.role,
      token,
    });
  } catch (error) {
    next(error);
  }
});

// Current User Profile
authRouter.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, req.user);
});
