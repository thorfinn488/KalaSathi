import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { toOpportunityRecord } from '../db/products.js';
import { estimateWholesaleQuote, WHOLESALE_PACKAGING_OPTIONS } from '../domain/wholesale-quote.js';
import { sendError, sendSuccess } from '../utils/response.js';

export const opportunitiesRouter = Router();

const requestSchema = z.object({
  buyer_name: z.string().trim().min(2).max(255),
  contact_info: z.string().trim().min(5).max(255),
  company_name: z.string().trim().max(255).optional(),
  requirement: z.string().trim().min(5).max(5000),
  product_id: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(100000),
  budget: z.string().max(100).optional(),
  packaging: z.enum(WHOLESALE_PACKAGING_OPTIONS).optional(),
});

opportunitiesRouter.get('/', async (_req, res, next) => {
  try {
    const records = await db.selectFrom('opportunities')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
    return sendSuccess(res, records.map(toOpportunityRecord));
  } catch (error) {
    next(error);
  }
});

opportunitiesRouter.post('/', async (req, res, next) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, parsed.error.issues[0]?.message ?? 'Invalid quotation request.', 'VALIDATION_ERROR', 400);
  }

  try {
    const { buyer_name, contact_info, company_name, requirement, product_id, quantity, budget, packaging } = parsed.data;
    const product = await db.selectFrom('products')
      .select(['product_id', 'moq', 'lead_time_days', 'price', 'pricing'])
      .where('product_id', '=', product_id)
      .executeTakeFirst();
    if (!product) return sendError(res, 'Product not found.', 'NOT_FOUND', 404);
    const moq = product.moq ?? 1;
    if (quantity < moq) {
      return sendError(res, `Requested quantity is below the minimum order quantity of ${moq} units.`, 'MOQ_NOT_MET', 400);
    }

    const priceValue = product.pricing?.suggested_price ?? product.price?.suggested_price;
    if (typeof priceValue !== 'number' || !Number.isFinite(priceValue) || priceValue <= 0) {
      return sendError(res, 'This product has no valid published price yet.', 'PRODUCT_UNPRICED', 409);
    }
    const estimate = estimateWholesaleQuote({
      quantity,
      base_price: priceValue,
      base_lead_days: product.lead_time_days ?? 14,
      packaging,
    });
    const fullRequirement = [
      requirement,
      packaging ? `Packaging: ${packaging}` : '',
      `Quantity: ${quantity} units`,
      `Estimated production: ${estimate.estimated_lead_days} days`,
    ].filter(Boolean).join(' · ');
    const id = `opp_${randomUUID()}`;
    const record = await db.insertInto('opportunities').values({
      opportunity_id: id,
      product_id,
      buyer_name,
      buyer_contact: contact_info,
      company_name: company_name || 'Retail / Enterprise Partner',
      match_score: 90,
      status: 'ACTIVE',
      requirement: fullRequirement,
      quantity,
      budget: budget ?? null,
    }).returningAll().executeTakeFirstOrThrow();

    return sendSuccess(res, {
      ...toOpportunityRecord(record),
      moq,
      ...estimate,
    }, 201);
  } catch (error) {
    next(error);
  }
});
