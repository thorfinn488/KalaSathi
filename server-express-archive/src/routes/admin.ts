import { Router } from 'express';
import { db } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { sendSuccess } from '../utils/response.js';

export const adminRouter = Router();

adminRouter.use(authMiddleware, requireRole('ADMIN'));

adminRouter.get('/artisans', async (_req, res, next) => {
  try {
    const artisans = await db.selectFrom('users')
      .select(['user_id', 'name', 'phone', 'region', 'craft_specialty', 'created_at'])
      .where('role', '=', 'ARTISAN')
      .orderBy('created_at', 'desc')
      .execute();
    return sendSuccess(res, artisans.map((artisan) => ({
      artisan_id: artisan.user_id,
      user_id: artisan.user_id,
      name: artisan.name,
      phone: artisan.phone,
      region: artisan.region ?? 'India',
      craft_specialty: artisan.craft_specialty ?? 'Traditional Artisan Craft',
      created_at: artisan.created_at.toISOString(),
    })));
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/products', async (_req, res, next) => {
  try {
    const products = await db.selectFrom('products')
      .leftJoin('users', 'users.user_id', 'products.artisan_id')
      .select([
        'products.product_id',
        'products.artisan_id',
        'products.status',
        'products.created_at',
        'products.catalogue',
        'products.pricing',
        'users.name as artisan_name',
      ])
      .orderBy('products.created_at', 'desc')
      .execute();
    return sendSuccess(res, products.map((product) => ({
      product_id: product.product_id,
      artisan_id: product.artisan_id,
      artisan_name: product.artisan_name ?? 'N/A',
      status: product.status,
      created_at: product.created_at.toISOString(),
      catalogue_name: product.catalogue?.name ?? null,
      suggested_price: product.pricing?.suggested_price ?? null,
    })));
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/opportunities', async (_req, res, next) => {
  try {
    const opportunities = await db.selectFrom('opportunities')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
    return sendSuccess(res, opportunities);
  } catch (error) {
    next(error);
  }
});
