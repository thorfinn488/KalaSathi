import { Router, Request, Response } from 'express';
import { users, products, opportunities } from '../db/store.js';
import { sendSuccess } from '../utils/response.js';

export const adminRouter = Router();

// List registered artisans
adminRouter.get('/artisans', (_req: Request, res: Response) => {
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
adminRouter.get('/products', (_req: Request, res: Response) => {
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
adminRouter.get('/opportunities', (_req: Request, res: Response) => {
  return sendSuccess(res, opportunities);
});
