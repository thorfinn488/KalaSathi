import { ImageEnhancementJob } from '../queue/image-queue.js';
import { env } from '../config/env.js';
import { db } from '../db/database.js';
import { readObject, saveEnhancedImage } from '../storage/object-storage.js';

async function requestEnhancedImage(image: Buffer, contentType: string): Promise<Buffer> {
  if (!env.IMAGE_ENHANCEMENT_URL) {
    throw new Error('IMAGE_ENHANCEMENT_URL is not configured; no image enhancement provider is available.');
  }

  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(env.IMAGE_ENHANCEMENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          Accept: 'image/jpeg, image/png, image/webp',
          ...(env.IMAGE_ENHANCEMENT_API_KEY
            ? { Authorization: `Bearer ${env.IMAGE_ENHANCEMENT_API_KEY}` }
            : {}),
        },
        body: new Uint8Array(image),
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 300);
        throw new Error(`Image enhancement provider returned HTTP ${response.status}: ${detail}`);
      }
      const resultType = response.headers.get('content-type')?.split(';')[0].trim();
      if (!resultType || !['image/jpeg', 'image/png', 'image/webp'].includes(resultType)) {
        throw new Error('Image enhancement provider returned an unsupported content type.');
      }
      const output = Buffer.from(await response.arrayBuffer());
      if (output.length === 0 || output.length > 25 * 1024 * 1024) {
        throw new Error('Image enhancement provider returned an empty or oversized image.');
      }
      return output;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Image enhancement request failed.');
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw lastError ?? new Error('Image enhancement failed.');
}

export async function enhanceProductImage(job: ImageEnhancementJob): Promise<void> {
  try {
    await db.updateTable('products')
      .set({ processing_step: 'enhancing_image', processing_progress: 30, processing_error: null })
      .where('product_id', '=', job.productId)
      .execute();
    const source = await readObject(job.objectKey);
    const enhanced = await requestEnhancedImage(source.body, source.contentType);
    const enhancedMediaId = await saveEnhancedImage(
      job.productId,
      job.mediaId,
      source.contentType,
      enhanced,
    );
    await db.updateTable('products')
      .set({
        image_url: `/media/${encodeURIComponent(enhancedMediaId)}`,
        status: 'READY',
        processing_step: 'done',
        processing_progress: 100,
        processing_error: null,
      })
      .where('product_id', '=', job.productId)
      .execute();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image enhancement failed.';
    await db.updateTable('products')
      .set({
        status: 'FAILED',
        processing_step: 'failed',
        processing_progress: 0,
        processing_error: message.slice(0, 1000),
      })
      .where('product_id', '=', job.productId)
      .execute();
    throw error;
  }
}
