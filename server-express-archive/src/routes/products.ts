import { randomUUID } from 'node:crypto';
import { Router, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { db } from '../db/database.js';
import { getProduct, listProducts } from '../db/products.js';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth.js';
import { enqueueImageEnhancement } from '../queue/image-queue.js';
import { saveProductMedia } from '../storage/object-storage.js';
import { sendError, sendSuccess } from '../utils/response.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const audioTypes = new Set(['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/x-wav']);
const priceRequest = z.object({
  material_cost: z.number().finite().min(50).max(200000),
  days_to_make: z.number().int().min(1).max(365),
  complexity: z.enum(['low', 'medium', 'high']),
});
const catalogueRequest = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(5000).optional(),
  category: z.string().trim().min(1).max(255).optional(),
  craft: z.string().trim().min(1).max(255).optional(),
  material: z.string().trim().min(1).max(1000).optional(),
  tags: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
}).refine((value) => Object.values(value).some((item) => item !== undefined), {
  message: 'At least one catalogue field must be provided.',
});

export const productsRouter = Router();

async function ownedProduct(req: AuthenticatedRequest, res: Response, productId: string) {
  const product = await db.selectFrom('products')
    .select(['product_id', 'artisan_id'])
    .where('product_id', '=', productId)
    .executeTakeFirst();
  if (!product) {
    sendError(res, 'Product not found', 'NOT_FOUND', 404);
    return false;
  }
  if (req.user?.role !== 'ADMIN' && product.artisan_id !== req.user?.user_id) {
    sendError(res, 'You do not own this product.', 'FORBIDDEN', 403);
    return false;
  }
  return true;
}

productsRouter.get('/', async (_req, res, next) => {
  try {
    return sendSuccess(res, await listProducts());
  } catch (error) {
    next(error);
  }
});

productsRouter.post('/', authMiddleware, requireRole('ARTISAN', 'ADMIN'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = z.object({ artisan_id: z.string().optional() }).safeParse(req.body ?? {});
    if (!body.success) return sendError(res, 'Invalid product draft.', 'VALIDATION_ERROR', 400);
    const artisanId = req.user?.role === 'ADMIN' ? body.data.artisan_id ?? req.user.user_id : req.user?.user_id;
    if (!artisanId) return sendError(res, 'Artisan identity is required.', 'VALIDATION_ERROR', 400);
    const user = await db.selectFrom('users').select('user_id').where('user_id', '=', artisanId).executeTakeFirst();
    if (!user) return sendError(res, 'Artisan account not found.', 'NOT_FOUND', 404);
    const productId = `prod_${randomUUID()}`;
    await db.insertInto('products').values({
      product_id: productId,
      artisan_id: artisanId,
      status: 'DRAFT',
      processing_step: 'draft',
      processing_progress: 0,
    }).execute();
    return sendSuccess(res, { product_id: productId, status: 'DRAFT' }, 201);
  } catch (error) {
    next(error);
  }
});

productsRouter.get('/:id', async (req, res, next) => {
  try {
    const product = await getProduct(req.params.id);
    if (!product) return sendError(res, 'Product not found', 'NOT_FOUND', 404);
    return sendSuccess(res, product);
  } catch (error) {
    next(error);
  }
});

productsRouter.get('/:id/opportunities', async (req, res, next) => {
  try {
    const rows = await db.selectFrom('opportunities').selectAll()
      .where('product_id', '=', req.params.id)
      .orderBy('created_at', 'desc')
      .execute();
    return sendSuccess(res, {
      opportunities: rows.map((row) => ({
        buyer_name: row.company_name ?? row.buyer_name,
        match_score: row.match_score,
        location: 'Verified Procurement Lead',
        requirement: row.requirement,
      })),
    });
  } catch (error) {
    next(error);
  }
});

productsRouter.put(
  '/:id/catalogue',
  authMiddleware,
  requireRole('ARTISAN', 'ADMIN'),
  async (req: AuthenticatedRequest, res, next) => {
    const parsed = catalogueRequest.safeParse(req.body);
    if (!parsed.success) return sendError(res, parsed.error.issues[0]?.message ?? 'Invalid catalogue.', 'VALIDATION_ERROR', 400);
    try {
      if (!(await ownedProduct(req, res, req.params.id))) return;
      const current = await db.selectFrom('products').select('catalogue')
        .where('product_id', '=', req.params.id).executeTakeFirst();
      const catalogue = {
        ...(current?.catalogue ?? {}),
        ...parsed.data,
        id: `cat_${req.params.id}`,
        product_id: req.params.id,
      };
      await db.updateTable('products')
        .set({ catalogue: JSON.stringify(catalogue), status: 'READY', processing_step: 'done', processing_progress: 100 })
        .where('product_id', '=', req.params.id)
        .execute();
      return sendSuccess(res, { product_id: req.params.id, updated: true });
    } catch (error) {
      next(error);
    }
  },
);

productsRouter.post(
  '/:id/recalculate-price',
  authMiddleware,
  requireRole('ARTISAN', 'ADMIN'),
  async (req: AuthenticatedRequest, res, next) => {
    const parsed = priceRequest.safeParse(req.body);
    if (!parsed.success) return sendError(res, parsed.error.issues[0]?.message ?? 'Invalid pricing inputs.', 'VALIDATION_ERROR', 400);
    try {
      if (!(await ownedProduct(req, res, req.params.id))) return;
      const { material_cost: materialCost, days_to_make: daysToMake, complexity } = parsed.data;
      const dailyWage = 480;
      const multiplier = { low: 1.15, medium: 1.28, high: 1.45 }[complexity];
      const labor = daysToMake * dailyWage;
      const suggested = Math.round((materialCost + labor) * multiplier);
      const low = Math.round(suggested * 0.9);
      const high = Math.round(suggested * 1.15);
      const explanation = `Material ₹${materialCost.toLocaleString('en-IN')} + ${daysToMake} artisan days at ₹${dailyWage}/day, adjusted for ${complexity} complexity.`;
      const price = { suggested_price: suggested, price_range: [low, high] as [number, number], explanation };
      const pricing = {
        id: `prc_${randomUUID()}`,
        suggested_price: suggested,
        price_range_low: low,
        price_range_high: high,
        explanation,
      };
      await db.updateTable('products')
        .set({
          material_cost: materialCost,
          price: JSON.stringify(price),
          pricing: JSON.stringify(pricing),
        })
        .where('product_id', '=', req.params.id)
        .execute();
      return sendSuccess(res, price);
    } catch (error) {
      next(error);
    }
  },
);

productsRouter.post(
  '/:id/image',
  authMiddleware,
  requireRole('ARTISAN', 'ADMIN'),
  upload.single('file'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!(await ownedProduct(req, res, req.params.id))) return;
      const file = req.file;
      if (!file || !imageTypes.has(file.mimetype)) {
        return sendError(res, 'Upload a JPEG, PNG, or WebP product image.', 'INVALID_MEDIA', 400);
      }
      const uploaded = await saveProductMedia(req.params.id, 'IMAGE', file);
      const url = `/media/${encodeURIComponent(uploaded.mediaId)}`;
      await db.updateTable('products').set({ image_url: url }).where('product_id', '=', req.params.id).execute();
      return sendSuccess(res, { product_id: req.params.id, image_url: url }, 201);
    } catch (error) {
      next(error);
    }
  },
);

productsRouter.post(
  '/:id/audio',
  authMiddleware,
  requireRole('ARTISAN', 'ADMIN'),
  upload.single('file'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!(await ownedProduct(req, res, req.params.id))) return;
      const file = req.file;
      if (!file || !audioTypes.has(file.mimetype)) {
        return sendError(res, 'Upload a supported MP3, MP4, WAV, or WebM audio recording.', 'INVALID_MEDIA', 400);
      }
      const uploaded = await saveProductMedia(req.params.id, 'AUDIO', file);
      return sendSuccess(res, { product_id: req.params.id, audio_url: `/media/${encodeURIComponent(uploaded.mediaId)}` }, 201);
    } catch (error) {
      next(error);
    }
  },
);

productsRouter.post(
  '/:id/process',
  authMiddleware,
  requireRole('ARTISAN', 'ADMIN'),
  async (req: AuthenticatedRequest, res, next) => {
    const parsed = z.object({ transcript: z.string().trim().max(5000).optional() }).safeParse(req.body ?? {});
    if (!parsed.success) return sendError(res, parsed.error.issues[0]?.message ?? 'Invalid processing request.', 'VALIDATION_ERROR', 400);
    try {
      if (!(await ownedProduct(req, res, req.params.id))) return;
      const image = await db.selectFrom('product_media')
        .select(['media_id', 'object_key'])
        .where('product_id', '=', req.params.id)
        .where('media_type', '=', 'IMAGE')
        .where('object_key', 'is not', null)
        .orderBy('created_at', 'desc')
        .executeTakeFirst();
      if (!image?.object_key) return sendError(res, 'Upload an image to S3 before starting image enhancement.', 'IMAGE_REQUIRED', 400);

      await db.updateTable('products').set({
        status: 'PROCESSING',
        processing_step: 'queued_for_image_enhancement',
        processing_progress: 5,
        processing_error: null,
        ...(parsed.data.transcript ? { heritage_story: parsed.data.transcript } : {}),
      }).where('product_id', '=', req.params.id).execute();
      let jobId: string;
      try {
        jobId = await enqueueImageEnhancement({
          productId: req.params.id,
          mediaId: image.media_id,
          objectKey: image.object_key,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Image enhancement could not be queued.';
        await db.updateTable('products').set({
          status: 'FAILED',
          processing_step: 'failed',
          processing_progress: 0,
          processing_error: message.slice(0, 1000),
        }).where('product_id', '=', req.params.id).execute();
        throw error;
      }
      return sendSuccess(res, { product_id: req.params.id, status: 'PROCESSING', job_id: jobId }, 202);
    } catch (error) {
      next(error);
    }
  },
);

productsRouter.get('/:id/processing-status', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!(await ownedProduct(req, res, req.params.id))) return;
    const product = await db.selectFrom('products')
      .select(['status', 'processing_step', 'processing_progress', 'processing_error'])
      .where('product_id', '=', req.params.id)
      .executeTakeFirst();
    if (!product) return sendError(res, 'Product not found', 'NOT_FOUND', 404);
    return sendSuccess(res, {
      product_id: req.params.id,
      status: product.status,
      step: product.processing_error ? 'failed' : product.processing_step ?? 'idle',
      progress_percent: product.processing_progress,
      error: product.processing_error,
    });
  } catch (error) {
    next(error);
  }
});

productsRouter.patch('/:id', authMiddleware, requireRole('ARTISAN', 'ADMIN'), async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!(await ownedProduct(req, res, req.params.id))) return;
    const body = z.object({
      price: z.record(z.string(), z.unknown()).optional(),
      catalogue: z.record(z.string(), z.unknown()).optional(),
      status: z.enum(['DRAFT', 'PROCESSING', 'READY', 'PUBLISHED', 'FAILED']).optional(),
    }).safeParse(req.body);
    if (!body.success) return sendError(res, 'Invalid product update.', 'VALIDATION_ERROR', 400);
    const changes = {
      ...(body.data.price ? { price: JSON.stringify(body.data.price) } : {}),
      ...(body.data.catalogue ? { catalogue: JSON.stringify(body.data.catalogue) } : {}),
      ...(body.data.status ? { status: body.data.status } : {}),
    };
    await db.updateTable('products').set(changes).where('product_id', '=', req.params.id).execute();
    return sendSuccess(res, await getProduct(req.params.id));
  } catch (error) {
    next(error);
  }
});

productsRouter.delete('/:id', authMiddleware, requireRole('ARTISAN', 'ADMIN'), async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!(await ownedProduct(req, res, req.params.id))) return;
    const result = await db.deleteFrom('products').where('product_id', '=', req.params.id).executeTakeFirst();
    return sendSuccess(res, { deleted: Number(result.numDeletedRows) === 1 });
  } catch (error) {
    next(error);
  }
});
