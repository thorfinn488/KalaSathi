import { Router, Request, Response } from 'express';
import { products, opportunities } from '../db/store.js';
import { sendSuccess } from '../utils/response.js';

export const dashboardRouter = Router();

dashboardRouter.get('/', (_req: Request, res: Response) => {
  const readyCount = products.filter((p) => p.status === 'READY' || p.status === 'PUBLISHED').length;
  const processingCount = products.filter((p) => p.status === 'PROCESSING').length;
  const draftCount = products.filter((p) => p.status === 'DRAFT').length;

  const prices = products
    .map((p) => p.price?.suggested_price)
    .filter((price): price is number => typeof price === 'number');

  const averagePrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

  // Category grouping
  const categoryMap = new Map<string, { count: number; sum: number }>();
  products.forEach((p) => {
    const cat = p.catalogue?.category || 'General Crafts';
    const price = p.price?.suggested_price || 0;
    const existing = categoryMap.get(cat) || { count: 0, sum: 0 };
    categoryMap.set(cat, { count: existing.count + 1, sum: existing.sum + price });
  });

  const categories = Array.from(categoryMap.entries()).map(([name, data]) => ({
    name,
    products: data.count,
    average_suggested_price: data.count > 0 ? Math.round(data.sum / data.count) : null,
  }));

  const summary = {
    total_products: products.length,
    catalogue_status: {
      ready: readyCount,
      processing: processingCount,
      draft: draftCount,
    },
    recent_products: products.slice(-5).reverse(),
    trends: {
      monthly_activity: [
        { month: 'Jan', count: 4 },
        { month: 'Feb', count: 8 },
        { month: 'Mar', count: 12 },
        { month: 'Apr', count: 15 },
      ],
      categories,
      average_suggested_price: Math.round(averagePrice),
      priced_products: prices.length,
      open_opportunities: opportunities.length,
      average_match_score: 93,
    },
  };

  return sendSuccess(res, summary);
});

dashboardRouter.get('/insights', (_req: Request, res: Response) => {
  const insights = [
    {
      type: 'GROWTH',
      message: 'High demand for handcrafted organic cotton textiles & Madhubani home decor in European boutique markets.',
    },
    {
      type: 'PRICING',
      message: 'Artisan pieces with GI Tag badges receive 28% higher quotation acceptance rates from retail buyers.',
    },
    {
      type: 'OPPORTUNITY',
      message: 'FabIndia and Cottage Emporium have published 3 high-volume procurement requests for festive collections.',
    },
  ];

  return sendSuccess(res, { insights });
});
