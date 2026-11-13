import { Router } from 'express';
import { db } from '../db/database.js';
import { createMediaDownloadUrl } from '../storage/object-storage.js';
import { sendError } from '../utils/response.js';

export const mediaRouter = Router();

mediaRouter.get('/media/:id', async (req, res, next) => {
  try {
    const media = await db.selectFrom('product_media')
      .select(['media_id', 'external_url'])
      .where('media_id', '=', req.params.id)
      .executeTakeFirst();
    if (!media) return sendError(res, 'Media not found.', 'NOT_FOUND', 404);
    if (media.external_url) return res.redirect(302, media.external_url);
    const downloadUrl = await createMediaDownloadUrl(media.media_id);
    if (!downloadUrl) return sendError(res, 'Stored media is unavailable.', 'MEDIA_UNAVAILABLE', 404);
    return res.redirect(302, downloadUrl);
  } catch (error) {
    next(error);
  }
});
