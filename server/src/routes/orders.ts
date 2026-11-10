import { Router, Request, Response } from 'express';
import { orders, OrderRecord, products } from '../db/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const ordersRouter = Router();

// List all orders
ordersRouter.get('/', (req: Request, res: Response) => {
  const phone = req.query.phone as string;
  if (phone) {
    const userOrders = orders.filter((o) => o.customer_phone.includes(phone));
    return sendSuccess(res, userOrders);
  }
  return sendSuccess(res, orders);
});

// Track specific order by ID or phone
ordersRouter.get('/track/:query', (req: Request, res: Response) => {
  const query = req.params.query.trim().toLowerCase();
  const matched = orders.filter(
    (o) =>
      o.order_id.toLowerCase() === query ||
      o.customer_phone.includes(query) ||
      o.customer_name.toLowerCase().includes(query)
  );

  if (!matched.length) {
    return sendError(res, 'No orders found matching this Order ID or Phone number', 'ORDER_NOT_FOUND', 404);
  }

  return sendSuccess(res, matched);
});

// Create new sample or retail order
ordersRouter.post('/', (req: Request, res: Response) => {
  const {
    product_id,
    customer_name,
    customer_phone,
    shipping_address,
    quantity,
    payment_method,
  } = req.body;

  if (!product_id || !customer_name || !customer_phone || !shipping_address) {
    return sendError(res, 'All fields are required to place an order', 'VALIDATION_ERROR', 400);
  }

  const product = products.find((p) => p.product_id === product_id);
  const qty = Number(quantity) || 1;
  const unitPrice = product?.price?.suggested_price || product?.pricing?.suggested_price || 2500;
  const totalAmount = unitPrice * qty;

  const orderNum = Math.floor(10000 + Math.random() * 90000);
  const newOrder: OrderRecord = {
    order_id: `KS-${orderNum}`,
    product_id,
    product_name: product?.catalogue?.name || 'Handcrafted Heritage Piece',
    artisan_name: product?.artisan_name || 'Cluster Artisan Master',
    customer_name,
    customer_phone,
    shipping_address,
    quantity: qty,
    unit_price: unitPrice,
    total_amount: totalAmount,
    payment_method: payment_method || 'UPI / Instant Pay',
    payment_status: 'PAID',
    delivery_status: 'CRAFTING',
    created_at: new Date().toISOString(),
    estimated_delivery: new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  };

  orders.unshift(newOrder);
  return sendSuccess(res, newOrder, 201);
});

// Update order status
ordersRouter.patch('/:id/status', (req: Request, res: Response) => {
  const order = orders.find((o) => o.order_id === req.params.id);
  if (!order) {
    return sendError(res, 'Order not found', 'NOT_FOUND', 404);
  }

  if (req.body.delivery_status) {
    order.delivery_status = req.body.delivery_status;
  }
  if (req.body.payment_status) {
    order.payment_status = req.body.payment_status;
  }

  return sendSuccess(res, order);
});
