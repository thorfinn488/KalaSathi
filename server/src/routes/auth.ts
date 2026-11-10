import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { users, UserRecord } from '../db/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ARTISAN', 'BUYER'], {
    errorMap: () => ({ message: 'Public registration is only available for ARTISAN or BUYER roles' }),
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
authRouter.post('/register', async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => e.message).join(', ');
    return sendError(res, errorMsg, 'VALIDATION_ERROR', 400);
  }

  const { name, phone, password, role, region, craft_specialty, company_name, requirements } = result.data;

  // Check if phone already registered
  const existingUser = users.find((u) => u.phone === phone);
  if (existingUser) {
    return sendError(res, 'An account with this phone number already exists', 'USER_EXISTS', 409);
  }

  const password_hash = await bcrypt.hash(password, 10);
  const newUser: UserRecord = {
    user_id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name,
    phone,
    password_hash,
    role,
    region,
    craft_specialty,
    company_name,
    requirements,
    created_at: new Date().toISOString(),
  };

  users.push(newUser);

  const token = jwt.sign({ user_id: newUser.user_id, role: newUser.role }, env.JWT_SECRET, {
    expiresIn: '7d',
  });

  return sendSuccess(res, {
    user_id: newUser.user_id,
    name: newUser.name,
    role: newUser.role,
    token,
  }, 201);
});

// Login
authRouter.post('/login', async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return sendError(res, 'Please provide valid phone and password', 'VALIDATION_ERROR', 400);
  }

  const { phone, password } = result.data;
  const user = users.find((u) => u.phone === phone);

  if (!user) {
    return sendError(res, 'Invalid phone number or password', 'INVALID_CREDENTIALS', 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return sendError(res, 'Invalid phone number or password', 'INVALID_CREDENTIALS', 401);
  }

  const token = jwt.sign({ user_id: user.user_id, role: user.role }, env.JWT_SECRET, {
    expiresIn: '7d',
  });

  return sendSuccess(res, {
    user_id: user.user_id,
    name: user.name,
    role: user.role,
    token,
  });
});

// Current User Profile
authRouter.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, req.user);
});
