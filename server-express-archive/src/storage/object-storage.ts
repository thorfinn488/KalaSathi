import { randomUUID } from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { db } from '../db/database.js';

const s3 = new S3Client({
  region: env.AWS_REGION,
  endpoint: env.S3_ENDPOINT_URL,
  forcePathStyle: Boolean(env.S3_ENDPOINT_URL),
  credentials: env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
    ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
    : undefined,
});

export async function saveProductMedia(
  productId: string,
  mediaType: 'IMAGE' | 'AUDIO',
  file: Express.Multer.File,
): Promise<{ mediaId: string; objectKey: string }> {
  if (!env.S3_BUCKET) {
    throw new Error('S3_BUCKET is not configured; media upload is unavailable.');
  }
  const mediaId = randomUUID();
  const extension = file.mimetype.split('/')[1]?.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
  const objectKey = `products/${productId}/${mediaType.toLowerCase()}/${mediaId}.${extension}`;
  await s3.send(new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: objectKey,
    Body: file.buffer,
    ContentType: file.mimetype,
    ServerSideEncryption: 'AES256',
  }));
  try {
    await db.insertInto('product_media').values({
      media_id: mediaId,
      product_id: productId,
      media_type: mediaType,
      object_key: objectKey,
      external_url: null,
      content_type: file.mimetype,
    }).execute();
  } catch (error) {
    await s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: objectKey }));
    throw error;
  }
  return { mediaId, objectKey };
}

export async function createMediaDownloadUrl(mediaId: string): Promise<string | undefined> {
  const media = await db.selectFrom('product_media')
    .select(['object_key'])
    .where('media_id', '=', mediaId)
    .executeTakeFirst();
  if (!media?.object_key || !env.S3_BUCKET) return undefined;
  return getSignedUrl(s3, new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: media.object_key,
  }), { expiresIn: 300 });
}

export async function readObject(objectKey: string): Promise<{ body: Buffer; contentType: string }> {
  if (!env.S3_BUCKET) throw new Error('S3_BUCKET is not configured.');
  const response = await s3.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: objectKey }));
  if (!response.Body) throw new Error(`Object ${objectKey} has no readable body.`);
  const bytes = await response.Body.transformToByteArray();
  return {
    body: Buffer.from(bytes),
    contentType: response.ContentType ?? 'application/octet-stream',
  };
}

export async function saveEnhancedImage(
  productId: string,
  sourceMediaId: string,
  sourceContentType: string,
  body: Buffer,
): Promise<string> {
  if (!env.S3_BUCKET) throw new Error('S3_BUCKET is not configured.');
  const mediaId = randomUUID();
  const objectKey = `products/${productId}/enhanced/${mediaId}.jpg`;
  await s3.send(new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: objectKey,
    Body: body,
    ContentType: 'image/jpeg',
    ServerSideEncryption: 'AES256',
    Metadata: { 'source-media-id': sourceMediaId, 'source-content-type': sourceContentType },
  }));
  await db.insertInto('product_media').values({
    media_id: mediaId,
    product_id: productId,
    media_type: 'IMAGE',
    object_key: objectKey,
    external_url: null,
    content_type: 'image/jpeg',
  }).execute();
  return mediaId;
}
