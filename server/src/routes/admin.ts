import { Router, Response } from 'express';
import { users, products, opportunities } from '../db/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const adminRouter = Router();

// Middleware: Require ADMIN role
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  if (req.user?.role !== 'ADMIN') {
    return sendError(res, 'Access forbidden. Administrator role required.', 'FORBIDDEN', 403);
  }
  next();
};

adminRouter.use(authMiddleware);
adminRouter.use(requireAdmin);

// List registered artisans
adminRouter.get('/artisans', (_req: AuthenticatedRequest, res: Response) => {
  const artisans = users
    .filter((u) => u.role === 'ARTISAN')
    .map((u) => ({
      artisan_id: u.user_id,
      name: u.name,
      phone: u.phone,
      craft_specialty: u.craft_specialty || 'Traditional Artisan Craft',
      region: u.region || 'India',
    }));
  return sendSuccess(res, artisans);
});

// List catalogued products for admin overview
adminRouter.get('/products', (_req: AuthenticatedRequest, res: Response) => {
  const adminProducts = products.map((p) => ({
    product_id: p.product_id,
    catalogue_name: p.catalogue?.name || 'Untitled Craft Piece',
    artisan_name: p.artisan_name || 'Cluster Artisan',
    status: p.status,
    suggested_price: p.price?.suggested_price || p.pricing?.suggested_price || 2500,
  }));
  return sendSuccess(res, adminProducts);
});

// List opportunities
adminRouter.get('/opportunities', (_req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, opportunities);
});
