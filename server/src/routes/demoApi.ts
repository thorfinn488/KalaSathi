import { Router, Request, Response } from 'express';

export const demoApiRouter = Router();

demoApiRouter.get('/artisans/profit', (_req: Request, res: Response) => {
  const profits = [
    {
      artisan_id: 'usr_artisan_sunita',
      artisan: 'Sunita Devi (Madhubani Cluster)',
      revenue: 148500,
      expenses: 42300,
      net_profit: 106200,
    },
    {
      artisan_id: 'usr_artisan_ramesh',
      artisan: 'Rameshwar Chitrakar (Patachitra)',
      revenue: 98000,
      expenses: 29500,
      net_profit: 68500,
    },
    {
      artisan_id: 'usr_artisan_ananya',
      artisan: 'Ananya Sahu (Dhokra Brass Craft)',
      revenue: 215000,
      expenses: 68000,
      net_profit: 147000,
    },
  ];

  return res.json(profits);
});

demoApiRouter.get('/products/low-stock', (_req: Request, res: Response) => {
  const lowStock = [
    {
      product_id: 'prod_blue_pottery_vase',
      product_name: 'Jaipur Blue Pottery Persian Floral Urn Vase',
      artisan_id: 'usr_artisan_sunita',
      artisan_name: 'Sunita Devi',
      stock: 4,
      low_stock_threshold: 15,
    },
    {
      product_id: 'prod_channapatna_toy',
      product_name: 'Channapatna Wooden Stacking Toy Train',
      artisan_id: 'usr_artisan_sunita',
      artisan_name: 'Sunita Devi',
      stock: 7,
      low_stock_threshold: 20,
    },
    {
      product_id: 'prod_dhokra_horse',
      product_name: 'Tribal Dhokra Bell-Metal Horse Figurine',
      artisan_id: 'usr_artisan_ananya',
      artisan_name: 'Ananya Sahu',
      stock: 2,
      low_stock_threshold: 10,
    },
  ];

  return res.json(lowStock);
});
