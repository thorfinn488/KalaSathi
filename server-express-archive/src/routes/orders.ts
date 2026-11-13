import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { env } from '../config/env.js';
import { db } from '../db/database.js';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

export const ordersRouter = Router();

const checkoutRequest = z.object({
  product_id: z.string().min(1),
  customer_name: z.string().trim().min(2).max(255),
  customer_phone: z.string().trim().min(10).max(20),
  shipping_address: z.string().trim().min(8).max(1000),
  quantity: z.coerce.number().int().min(1).max(100),
});

const razorpay = env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
  : undefined;

function publicOrder(order: {
  order_id: string;
  product_name: string;
  artisan_name: string;
  quantity: number;
  unit_price: string | number;
  total_amount: string | number;
  payment_method: string | null;
  payment_status: string;
  delivery_status: string;
  created_at: Date;
  estimated_delivery: string | null;
}) {
  return {
    order_id: order.order_id,
    product_name: order.product_name,
    artisan_name: order.artisan_name,
    quantity: order.quantity,
    unit_price: Number(order.unit_price),
    total_amount: Number(order.total_amount),
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    delivery_status: order.delivery_status,
    created_at: order.created_at.toISOString(),
    estimated_delivery: order.estimated_delivery,
  };
}

ordersRouter.get('/', authMiddleware, requireRole('BUYER', 'ADMIN'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const phone = typeof req.query.phone === 'string' ? req.query.phone : undefined;
    const query = db.selectFrom('orders').selectAll().orderBy('created_at', 'desc');
    const orders = phone && req.user?.role === 'ADMIN'
      ? await query.where('customer_phone', '=', phone).execute()
      : await query.where('customer_phone', '=', req.user?.phone ?? '').execute();
    return sendSuccess(res, orders.map(publicOrder));
  } catch (error) {
    next(error);
  }
});

ordersRouter.get('/track/:query', async (req, res, next) => {
  try {
    const query = req.params.query.trim();
    const order = await db.selectFrom('orders')
      .selectAll()
      .where((eb) => eb.or([
        eb('order_id', '=', query.toUpperCase()),
        eb('customer_phone', '=', query),
      ]))
      .orderBy('created_at', 'desc')
      .execute();
    if (order.length === 0) return sendError(res, 'No order found. Check the exact order ID or registered phone number.', 'ORDER_NOT_FOUND', 404);
    return sendSuccess(res, order.map(publicOrder));
  } catch (error) {
    next(error);
  }
});

ordersRouter.post('/', async (req, res, next) => {
  const parsed = checkoutRequest.safeParse(req.body);
  if (!parsed.success) return sendError(res, parsed.error.issues[0]?.message ?? 'Invalid order details.', 'VALIDATION_ERROR', 400);

  try {
    const { product_id, customer_name, customer_phone, shipping_address, quantity } = parsed.data;
    const product = await db.selectFrom('products')
      .leftJoin('users', 'users.user_id', 'products.artisan_id')
      .select([
        'products.product_id',
        'products.artisan_name',
        'products.catalogue',
        'products.price',
        'products.pricing',
        'products.material_cost',
        'users.name as user_name',
      ])
      .where('products.product_id', '=', product_id)
      .executeTakeFirst();
    if (!product) return sendError(res, 'Product not found.', 'NOT_FOUND', 404);
    const priceValue = product.pricing?.suggested_price ?? product.price?.suggested_price;
    if (typeof priceValue !== 'number' || !Number.isFinite(priceValue) || priceValue <= 0) {
      return sendError(res, 'This product has no valid published price yet.', 'PRODUCT_UNPRICED', 409);
    }

    const orderId = `KS-${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
    const estimatedDelivery = new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const totalAmount = Math.round(priceValue * quantity * 100) / 100;
    const materialCost = Number(product.material_cost);
    let razorpayOrderId: string | null = null;
    let paymentResponse: { payment_mode: 'sandbox' | 'razorpay'; checkout?: { key_id: string; order_id: string; amount: number; currency: string } };

    if (env.PAYMENT_MODE === 'razorpay') {
      if (!razorpay || !env.RAZORPAY_KEY_ID) {
        return sendError(res, 'Razorpay test checkout is not configured.', 'PAYMENT_UNAVAILABLE', 503);
      }
      const gatewayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        receipt: orderId,
        notes: { product_id, quantity: String(quantity) },
      });
      razorpayOrderId = gatewayOrder.id;
      paymentResponse = {
        payment_mode: 'razorpay',
        checkout: {
          key_id: env.RAZORPAY_KEY_ID,
          order_id: gatewayOrder.id,
          amount: Number(gatewayOrder.amount),
          currency: gatewayOrder.currency,
        },
      };
    } else {
      paymentResponse = { payment_mode: 'sandbox' };
    }

    const order = await db.insertInto('orders').values({
      order_id: orderId,
      product_id,
      product_name: product.catalogue?.name ?? 'Handcrafted Heritage Piece',
      artisan_name: product.artisan_name ?? product.user_name ?? 'Cluster Artisan',
      customer_name,
      customer_phone,
      shipping_address,
      quantity,
      unit_price: priceValue,
      total_amount: totalAmount,
      payment_method: env.PAYMENT_MODE === 'razorpay' ? 'Razorpay Test Checkout' : 'Sandbox Checkout',
      payment_status: 'PENDING',
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: null,
      material_expense: materialCost > 0 ? Math.round(materialCost * quantity * 100) / 100 : null,
      delivery_status: 'CRAFTING',
      estimated_delivery: estimatedDelivery,
    }).returningAll().executeTakeFirstOrThrow();

    return sendSuccess(res, { ...publicOrder(order), ...paymentResponse }, 201);
  } catch (error) {
    next(error);
  }
});

ordersRouter.post('/:id/payment/verify', async (req, res, next) => {
  const parsed = z.object({
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i),
  }).safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Invalid Razorpay payment confirmation.', 'VALIDATION_ERROR', 400);
  if (!env.RAZORPAY_KEY_SECRET) return sendError(res, 'Razorpay checkout is not configured.', 'PAYMENT_UNAVAILABLE', 503);

  try {
    const order = await db.selectFrom('orders').select(['order_id', 'payment_status', 'razorpay_order_id'])
      .where('order_id', '=', req.params.id)
      .executeTakeFirst();
    if (!order) return sendError(res, 'Order not found.', 'NOT_FOUND', 404);
    if (order.razorpay_order_id !== parsed.data.razorpay_order_id) {
      return sendError(res, 'Payment does not match this order.', 'PAYMENT_MISMATCH', 400);
    }
    const expected = createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${parsed.data.razorpay_order_id}|${parsed.data.razorpay_payment_id}`)
      .digest();
    const received = Buffer.from(parsed.data.razorpay_signature, 'hex');
    if (received.length !== expected.length || !timingSafeEqual(expected, received)) {
      return sendError(res, 'Payment signature verification failed.', 'INVALID_PAYMENT_SIGNATURE', 400);
    }
    if (order.payment_status !== 'PAID') {
      await db.updateTable('orders').set({
        payment_status: 'PAID',
        razorpay_payment_id: parsed.data.razorpay_payment_id,
      }).where('order_id', '=', order.order_id).execute();
    }
    const updated = await db.selectFrom('orders').selectAll().where('order_id', '=', order.order_id).executeTakeFirstOrThrow();
    return sendSuccess(res, publicOrder(updated));
  } catch (error) {
    next(error);
  }
});

ordersRouter.post('/:id/payment/sandbox-confirm', async (req, res, next) => {
  if (env.NODE_ENV === 'production' || env.PAYMENT_MODE !== 'sandbox') {
    return sendError(res, 'Sandbox payment confirmation is disabled.', 'SANDBOX_DISABLED', 403);
  }
  try {
    const updated = await db.updateTable('orders')
      .set({ payment_status: 'PAID' })
      .where('order_id', '=', req.params.id)
      .where('payment_status', '=', 'PENDING')
      .returningAll()
      .executeTakeFirst();
    if (updated) return sendSuccess(res, publicOrder(updated));
    const existing = await db.selectFrom('orders').selectAll().where('order_id', '=', req.params.id).executeTakeFirst();
    if (!existing) return sendError(res, 'Order not found.', 'NOT_FOUND', 404);
    if (existing.payment_status !== 'PAID') return sendError(res, 'Order cannot be confirmed in the current state.', 'INVALID_ORDER_STATE', 409);
    return sendSuccess(res, publicOrder(existing));
  } catch (error) {
    next(error);
  }
});

ordersRouter.patch(
  '/:id/status',
  authMiddleware,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res, next) => {
    const parsed = z.object({
      delivery_status: z.enum(['CRAFTING', 'QUALITY_CHECK', 'SHIPPED', 'DELIVERED']).optional(),
    }).safeParse(req.body);
    if (!parsed.success || !parsed.data.delivery_status) {
      return sendError(res, 'A valid delivery_status is required.', 'VALIDATION_ERROR', 400);
    }
    try {
      const updated = await db.updateTable('orders')
        .set({ delivery_status: parsed.data.delivery_status })
        .where('order_id', '=', req.params.id)
        .returningAll()
        .executeTakeFirst();
      if (!updated) return sendError(res, 'Order not found.', 'NOT_FOUND', 404);
      return sendSuccess(res, publicOrder(updated));
    } catch (error) {
      next(error);
    }
  },
);
