import { Router, Request, Response } from 'express';
import multer from 'multer';
import { products, ProductRecord, processingJobs } from '../db/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB
export const productsRouter = Router();

// List products
productsRouter.get('/', (_req: Request, res: Response) => {
  return sendSuccess(res, products);
});

// Create product draft
productsRouter.post('/', (_req: Request, res: Response) => {
  const newProduct: ProductRecord = {
    product_id: `prod_${Date.now()}`,
    artisan_id: 'usr_artisan_sunita',
    status: 'DRAFT',
    created_at: new Date().toISOString(),
    images: [],
    audio: [],
    opportunities: [],
  };

  products.push(newProduct);

  return sendSuccess(res, {
    product_id: newProduct.product_id,
    status: newProduct.status,
  }, 201);
});

// Get single product
productsRouter.get('/:id', (req: Request, res: Response) => {
  const product = products.find((p) => p.product_id === req.params.id);
  if (!product) {
    return sendError(res, 'Product not found', 'NOT_FOUND', 404);
  }
  return sendSuccess(res, product);
});

// Upload image
productsRouter.post('/:id/image', upload.single('file'), (req: Request, res: Response) => {
  const product = products.find((p) => p.product_id === req.params.id);
  if (!product) {
    return sendError(res, 'Product not found', 'NOT_FOUND', 404);
  }

  // Use uploaded file or high-quality craft placeholder
  const imageUrl = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80';
  const imgObj = { id: `img_${Date.now()}`, url: imageUrl };

  product.image_url = imageUrl;
  product.images.push(imgObj);

  return sendSuccess(res, {
    product_id: product.product_id,
    image_url: imageUrl,
  });
});

// Upload audio
productsRouter.post('/:id/audio', upload.single('file'), (req: Request, res: Response) => {
  const product = products.find((p) => p.product_id === req.params.id);
  if (!product) {
    return sendError(res, 'Product not found', 'NOT_FOUND', 404);
  }

  const audioUrl = '/static/audio/sample_audio.mp3';
  product.audio.push({ id: `aud_${Date.now()}`, url: audioUrl });

  return sendSuccess(res, {
    product_id: product.product_id,
    audio_url: audioUrl,
  });
});

// Start AI Pipeline processing
productsRouter.post('/:id/process', (req: Request, res: Response) => {
  const product = products.find((p) => p.product_id === req.params.id);
  if (!product) {
    return sendError(res, 'Product not found', 'NOT_FOUND', 404);
  }

  const transcript = req.body?.transcript || 'Handmade traditional artisan craft created with natural organic materials.';
  product.status = 'PROCESSING';

  const jobId = `job_${Date.now()}`;
  processingJobs.set(product.product_id, {
    step: 'Analyzing craft features & voice transcript...',
    progress: 25,
    status: 'PROCESSING',
  });

  // Simulate AI Pipeline progression asynchronously
  setTimeout(() => {
    processingJobs.set(product.product_id, {
      step: 'Enhancing photography, generating tags & market description...',
      progress: 60,
      status: 'PROCESSING',
    });
  }, 1000);

  setTimeout(() => {
    processingJobs.set(product.product_id, {
      step: 'Calculating fair-trade price benchmark and matching retail buyers...',
      progress: 90,
      status: 'PROCESSING',
    });
  }, 2200);

  setTimeout(() => {
    product.status = 'READY';
    product.catalogue = {
      id: `cat_${Date.now()}`,
      product_id: product.product_id,
      name: 'Heritage Handcrafted Artisan Craft',
      category: 'Home & Living Decor',
      material: 'Organic Wood, Natural Pigments & Vegetable Dye',
      craft: 'Traditional Indigenous Indian Craftsmanship',
      description: transcript.length > 20
        ? `Artisan verified creation: ${transcript}`
        : 'Authentic Indian artisanal treasure hand-shaped using indigenous ancestral techniques passed down through generations.',
      tags: ['GI Certified', '100% Handcrafted', 'Sustainable Materials', 'Fair Trade'],
    };

    product.price = {
      suggested_price: 2850,
      price_range: [2500, 3200],
      explanation: 'Calculated using artisan labor time (14 hours), raw material cost index, and fair-trade market premium.',
    };

    product.pricing = {
      id: `prc_${Date.now()}`,
      suggested_price: 2850,
      price_range_low: 2500,
      price_range_high: 3200,
      explanation: 'Optimal price corridor for export & boutique retail procurement.',
    };

    product.opportunities = [
      {
        buyer_name: 'FabIndia Lifestyle Sourcing',
        match_score: 94,
        location: 'New Delhi, India',
        requirement: 'Actively purchasing 100 units of authentic handmade craft items for festive gifting catalog.',
      },
    ];

    processingJobs.set(product.product_id, {
      step: 'done',
      progress: 100,
      status: 'READY',
    });
  }, 3500);

  return sendSuccess(res, {
    product_id: product.product_id,
    status: 'PROCESSING',
    job_id: jobId,
  });
});

// Processing status polling endpoint
productsRouter.get('/:id/processing-status', (req: Request, res: Response) => {
  const product = products.find((p) => p.product_id === req.params.id);
  if (!product) {
    return sendError(res, 'Product not found', 'NOT_FOUND', 404);
  }

  const job = processingJobs.get(product.product_id) || {
    step: product.status === 'READY' ? 'done' : 'Ready',
    progress: product.status === 'READY' ? 100 : 0,
    status: product.status,
  };

  return sendSuccess(res, {
    product_id: product.product_id,
    status: job.status,
    step: job.step,
    progress_percent: job.progress,
  });
});

// Update product
productsRouter.patch('/:id', (req: Request, res: Response) => {
  const product = products.find((p) => p.product_id === req.params.id);
  if (!product) {
    return sendError(res, 'Product not found', 'NOT_FOUND', 404);
  }

  if (req.body.price) {
    product.price = { ...product.price, ...req.body.price };
  }
  if (req.body.catalogue) {
    product.catalogue = { ...product.catalogue, ...req.body.catalogue };
  }
  if (req.body.status) {
    product.status = req.body.status;
  }

  return sendSuccess(res, product);
});

// Delete product
productsRouter.delete('/:id', (req: Request, res: Response) => {
  const index = products.findIndex((p) => p.product_id === req.params.id);
  if (index === -1) {
    return sendError(res, 'Product not found', 'NOT_FOUND', 404);
  }
  products.splice(index, 1);
  return sendSuccess(res, { deleted: true });
});
