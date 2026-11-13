import { Router } from 'express';
import { listProducts } from '../db/products.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { db } from '../db/database.js';
import { sendSuccess } from '../utils/response.js';

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);

dashboardRouter.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const allProducts = await listProducts();
    const products = req.user?.role === 'ARTISAN'
      ? allProducts.filter((product) => product.artisan_id === req.user?.user_id)
      : allProducts;
    const rows = await db.selectFrom('products')
      .select(['product_id', 'created_at', 'status', 'catalogue', 'pricing'])
      .where((eb) => req.user?.role === 'ARTISAN'
        ? eb('artisan_id', '=', req.user.user_id)
        : eb.val(true))
      .execute();
    const now = new Date();
    const monthKeys = Array.from({ length: 6 }, (_value, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
      return date.toISOString().slice(0, 7);
    });
    const activity = new Map<string, number>();
    const categories = new Map<string, { products: number; prices: number[] }>();
    const prices: number[] = [];

    for (const product of rows) {
      const month = product.created_at.toISOString().slice(0, 7);
      activity.set(month, (activity.get(month) ?? 0) + 1);
      const price = product.pricing?.suggested_price;
      if (typeof price === 'number' && Number.isFinite(price)) prices.push(price);
      const categoryName = product.catalogue?.category;
      if (categoryName) {
        const category = categories.get(categoryName) ?? { products: 0, prices: [] };
        category.products += 1;
        if (typeof price === 'number' && Number.isFinite(price)) category.prices.push(price);
        categories.set(categoryName, category);
      }
    }

    const opportunitiesQuery = db.selectFrom('opportunities')
      .innerJoin('products', 'products.product_id', 'opportunities.product_id')
      .select(['opportunities.match_score'])
      .where((eb) => req.user?.role === 'ARTISAN'
        ? eb('products.artisan_id', '=', req.user.user_id)
        : eb.val(true));
    const opportunityRows = await opportunitiesQuery.execute();
    const trendCategories = [...categories.entries()]
      .map(([name, value]) => ({
        name,
        products: value.products,
        average_suggested_price: value.prices.length
          ? value.prices.reduce((sum, price) => sum + price, 0) / value.prices.length
          : null,
      }))
      .sort((left, right) => right.products - left.products || left.name.localeCompare(right.name));

    return sendSuccess(res, {
      total_products: rows.length,
      catalogue_status: {
        ready: rows.filter((product) => product.status === 'READY' || product.status === 'PUBLISHED').length,
        processing: rows.filter((product) => product.status === 'PROCESSING').length,
        draft: rows.filter((product) => product.status === 'DRAFT').length,
      },
      recent_products: products.slice(0, 5),
      trends: {
        monthly_activity: monthKeys.map((key) => ({
          month: new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
          count: activity.get(key) ?? 0,
        })),
        categories: trendCategories,
        average_suggested_price: prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : null,
        priced_products: prices.length,
        open_opportunities: opportunityRows.length,
        average_match_score: opportunityRows.length
          ? opportunityRows.reduce((sum, item) => sum + item.match_score, 0) / opportunityRows.length
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

dashboardRouter.get('/insights', (_req, res) => {
  return sendSuccess(res, {
    insights: [
      { type: 'GROWTH', message: 'Track buyer requests and completed sales to identify seasonal demand.' },
      { type: 'PRICING', message: 'Review material costs and artisan work days before publishing a suggested price.' },
      { type: 'OPPORTUNITY', message: 'Respond promptly to wholesale quotation requests to build repeat buyer relationships.' },
    ],
  });
});
