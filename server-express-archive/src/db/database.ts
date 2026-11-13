import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Generated, JSONColumnType, Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { env } from '../config/env.js';
import {
  ProductRecord,
  seedOpportunities,
  seedOrders,
  seedProducts,
  seedUsers,
} from './store.js';

interface UsersTable {
  user_id: string;
  name: string;
  phone: string;
  password_hash: string;
  role: 'ARTISAN' | 'ADMIN' | 'BUYER';
  region: string | null;
  craft_specialty: string | null;
  company_name: string | null;
  requirements: string | null;
  created_at: Generated<Date>;
}

interface ProductsTable {
  product_id: string;
  artisan_id: string | null;
  artisan_name: string | null;
  region: string | null;
  status: 'DRAFT' | 'PROCESSING' | 'READY' | 'PUBLISHED' | 'FAILED';
  image_url: string | null;
  heritage_story: string | null;
  moq: number | null;
  lead_time_days: number | null;
  stock: Generated<number>;
  low_stock_threshold: Generated<number>;
  material_cost: Generated<string | number>;
  processing_step: string | null;
  processing_progress: Generated<number>;
  processing_error: string | null;
  catalogue: JSONColumnType<NonNullable<ProductRecord['catalogue']> | null, string | null, string | null>;
  price: JSONColumnType<NonNullable<ProductRecord['price']> | null, string | null, string | null>;
  pricing: JSONColumnType<NonNullable<ProductRecord['pricing']> | null, string | null, string | null>;
  created_at: Generated<Date>;
}

interface ProductMediaTable {
  media_id: string;
  product_id: string;
  media_type: 'IMAGE' | 'AUDIO';
  object_key: string | null;
  external_url: string | null;
  content_type: string;
  created_at: Generated<Date>;
}

interface OrdersTable {
  order_id: string;
  product_id: string;
  product_name: string;
  artisan_name: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  quantity: number;
  unit_price: string | number;
  total_amount: string | number;
  payment_method: string | null;
  payment_status: 'PAID' | 'ESCROW_HELD' | 'PENDING';
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  material_expense: string | number | null;
  delivery_status: 'CRAFTING' | 'QUALITY_CHECK' | 'SHIPPED' | 'DELIVERED';
  created_at: Generated<Date>;
  estimated_delivery: string | null;
}

interface OpportunitiesTable {
  opportunity_id: string;
  product_id: string | null;
  buyer_name: string;
  buyer_contact: Generated<string | null>;
  company_name: string | null;
  match_score: number;
  status: string;
  requirement: string;
  quantity: number | null;
  budget: string | null;
  created_at: Generated<Date>;
}

interface Database {
  users: UsersTable;
  products: ProductsTable;
  product_media: ProductMediaTable;
  orders: OrdersTable;
  opportunities: OpportunitiesTable;
}

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DATABASE_POOL_MAX,
  ssl: env.DATABASE_SSL ? { rejectUnauthorized: true } : undefined,
});

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});

export async function initializeDatabase(): Promise<void> {
  const connection = await pool.connect();
  try {
    await connection.query('SELECT pg_advisory_lock(7748115532)');
    try {
      const schema = await readFile(fileURLToPath(new URL('./schema.sql', import.meta.url)), 'utf8');
      await connection.query(schema);
      if (env.SEED_DEMO_DATA) await seedDemoData();
    } finally {
      await connection.query('SELECT pg_advisory_unlock(7748115532)');
    }
  } finally {
    connection.release();
  }
}

async function seedDemoData(): Promise<void> {
  await db.transaction().execute(async (trx) => {
    for (const user of seedUsers) {
      await trx.insertInto('users').values({
        ...user,
        region: user.region ?? null,
        craft_specialty: user.craft_specialty ?? null,
        company_name: user.company_name ?? null,
        requirements: user.requirements ?? null,
        created_at: new Date(user.created_at),
      }).onConflict((conflict) => conflict.column('user_id').doNothing()).execute();
    }

    for (const product of seedProducts) {
      await trx.insertInto('products').values({
        product_id: product.product_id,
        artisan_id: product.artisan_id,
        artisan_name: product.artisan_name ?? null,
        region: product.region ?? null,
        status: product.status,
        image_url: product.image_url ?? null,
        heritage_story: product.heritage_story ?? null,
        moq: product.moq ?? 10,
        lead_time_days: product.lead_time_days ?? 14,
        stock: product.product_id === 'prod_blue_pottery_vase' ? 4
          : product.product_id === 'prod_channapatna_toy' ? 7
            : product.product_id === 'prod_dhokra_horse' ? 2 : 25,
        low_stock_threshold: product.product_id === 'prod_blue_pottery_vase' ? 15
          : product.product_id === 'prod_channapatna_toy' ? 20
            : product.product_id === 'prod_dhokra_horse' ? 10 : 10,
        material_cost: 0,
        processing_step: 'done',
        processing_progress: 100,
        processing_error: null,
        catalogue: product.catalogue ? JSON.stringify(product.catalogue) : null,
        price: product.price ? JSON.stringify(product.price) : null,
        pricing: product.pricing ? JSON.stringify(product.pricing) : null,
        created_at: new Date(product.created_at),
      }).onConflict((conflict) => conflict.column('product_id').doNothing()).execute();

      for (const image of product.images) {
        await trx.insertInto('product_media').values({
          media_id: image.id,
          product_id: product.product_id,
          media_type: 'IMAGE',
          object_key: null,
          external_url: image.url,
          content_type: 'image/jpeg',
        }).onConflict((conflict) => conflict.column('media_id').doNothing()).execute();
      }

      for (const audio of product.audio) {
        await trx.insertInto('product_media').values({
          media_id: audio.id,
          product_id: product.product_id,
          media_type: 'AUDIO',
          object_key: null,
          external_url: audio.url,
          content_type: 'audio/mpeg',
        }).onConflict((conflict) => conflict.column('media_id').doNothing()).execute();
      }
    }

    for (const opportunity of seedOpportunities) {
      await trx.insertInto('opportunities').values({
        ...opportunity,
        quantity: opportunity.quantity ?? 50,
        budget: opportunity.budget ?? null,
        created_at: new Date(),
      }).onConflict((conflict) => conflict.column('opportunity_id').doNothing()).execute();
    }

    for (const order of seedOrders) {
      await trx.insertInto('orders').values({
        ...order,
        razorpay_order_id: null,
        razorpay_payment_id: null,
        material_expense: null,
        created_at: new Date(order.created_at),
      }).onConflict((conflict) => conflict.column('order_id').doNothing()).execute();
    }
  });
}

export async function closeDatabase(): Promise<void> {
  await db.destroy();
}
