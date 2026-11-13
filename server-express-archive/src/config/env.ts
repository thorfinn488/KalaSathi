import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_POOL_MAX: z.coerce.number().int().min(2).max(50).default(10),
  DATABASE_SSL: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  SEED_DEMO_DATA: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  PAYMENT_MODE: z.enum(['sandbox', 'razorpay']).default('sandbox'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  AWS_REGION: z.string().default('ap-south-1'),
  S3_BUCKET: z.string().optional(),
  S3_ENDPOINT_URL: z.string().url().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  IMAGE_ENHANCEMENT_URL: z.string().url().optional(),
  IMAGE_ENHANCEMENT_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

if (Boolean(parsed.data.RAZORPAY_KEY_ID) !== Boolean(parsed.data.RAZORPAY_KEY_SECRET)) {
  throw new Error('Configure both RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET together.');
}
if (parsed.data.PAYMENT_MODE === 'razorpay' && !parsed.data.RAZORPAY_KEY_ID) {
  throw new Error('Razorpay test checkout requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
}
if (parsed.data.PAYMENT_MODE === 'razorpay' && !parsed.data.RAZORPAY_KEY_ID?.startsWith('rzp_test_')) {
  throw new Error('Only Razorpay test credentials (rzp_test_...) are supported by this pilot.');
}
if (parsed.data.NODE_ENV === 'production' && parsed.data.SEED_DEMO_DATA) {
  throw new Error('SEED_DEMO_DATA must be disabled in production because demo accounts use public credentials.');
}
if (parsed.data.NODE_ENV === 'production' && parsed.data.PAYMENT_MODE !== 'razorpay') {
  throw new Error('Production requires Razorpay test checkout; simulated sandbox payments are development-only.');
}

export const env = parsed.data;
