import { Router } from 'express';
import { db } from '../db/database.js';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth.js';

export const demoApiRouter = Router();

demoApiRouter.use(authMiddleware, requireRole('ADMIN'));

demoApiRouter.get('/artisans/profit', async (_req: AuthenticatedRequest, res, next) => {
  try {
    const orders = await db.selectFrom('orders')
      .innerJoin('products', 'products.product_id', 'orders.product_id')
      .leftJoin('users', 'users.user_id', 'products.artisan_id')
      .select([
        'products.artisan_id',
        'products.artisan_name',
        'users.name as user_name',
        'orders.total_amount',
        'orders.material_expense',
      ])
      .where('orders.payment_status', '=', 'PAID')
      .execute();
    const byArtisan = new Map<string, {
      artisan: string;
      revenue: number;
      expenses: number;
      orders: number;
      costedOrders: number;
    }>();
    for (const order of orders) {
      const artisanId = order.artisan_id ?? 'unassigned';
      const summary = byArtisan.get(artisanId) ?? {
        artisan: order.artisan_name ?? order.user_name ?? 'Unassigned artisan',
        revenue: 0,
        expenses: 0,
        orders: 0,
        costedOrders: 0,
      };
      summary.revenue += Number(order.total_amount);
      summary.orders += 1;
      if (order.material_expense !== null) {
        summary.expenses += Number(order.material_expense);
        summary.costedOrders += 1;
      }
      byArtisan.set(artisanId, summary);
    }

    res.json([...byArtisan.entries()].map(([artisan_id, summary]) => ({
      artisan_id,
      artisan: summary.artisan,
      revenue: summary.revenue,
      expenses: summary.costedOrders === summary.orders ? summary.expenses : null,
      net_profit: summary.costedOrders === summary.orders ? summary.revenue - summary.expenses : null,
    })));
  } catch (error) {
    next(error);
  }
});

demoApiRouter.get('/products/low-stock', async (_req, res, next) => {
  try {
    const lowStock = await db.selectFrom('products')
      .leftJoin('users', 'users.user_id', 'products.artisan_id')
      .select([
        'products.product_id',
        'products.artisan_id',
        'products.artisan_name',
        'products.stock',
        'products.low_stock_threshold',
        'products.catalogue',
        'users.name as user_name',
      ])
      .whereRef('products.stock', '<=', 'products.low_stock_threshold')
      .where('products.status', 'in', ['READY', 'PUBLISHED'])
      .orderBy('products.stock', 'asc')
      .execute();
    res.json(lowStock.map((product) => ({
      product_id: product.product_id,
      product_name: product.catalogue?.name ?? 'Untitled craft piece',
      artisan_id: product.artisan_id ?? '',
      artisan_name: product.artisan_name ?? product.user_name ?? 'Unassigned artisan',
      stock: product.stock,
      low_stock_threshold: product.low_stock_threshold,
    })));
  } catch (error) {
    next(error);
  }
});
