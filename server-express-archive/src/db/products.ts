import { db } from './database.js';
import { OpportunityRecord, ProductRecord } from './store.js';

type ProductRow = Awaited<ReturnType<ReturnType<typeof selectProducts>['execute']>>[number];

function selectProducts() {
  return db.selectFrom('products')
    .leftJoin('users', 'users.user_id', 'products.artisan_id')
    .select([
      'products.product_id',
      'products.artisan_id',
      'products.artisan_name',
      'products.region',
      'products.status',
      'products.image_url',
      'products.heritage_story',
      'products.moq',
      'products.lead_time_days',
      'products.stock',
      'products.low_stock_threshold',
      'products.material_cost',
      'products.processing_step',
      'products.processing_progress',
      'products.processing_error',
      'products.catalogue',
      'products.price',
      'products.pricing',
      'products.created_at',
      'users.name as user_name',
    ]);
}

export async function listProducts(): Promise<ProductRecord[]> {
  const rows = await selectProducts().orderBy('products.created_at', 'desc').execute();
  return hydrateProducts(rows);
}

export async function getProduct(productId: string): Promise<ProductRecord | undefined> {
  const row = await selectProducts()
    .where('products.product_id', '=', productId)
    .executeTakeFirst();
  if (!row) return undefined;
  return (await hydrateProducts([row]))[0];
}

async function hydrateProducts(rows: ProductRow[]): Promise<ProductRecord[]> {
  if (rows.length === 0) return [];
  const productIds = rows.map((row) => row.product_id);
  const [media, opportunities] = await Promise.all([
    db.selectFrom('product_media')
      .selectAll()
      .where('product_id', 'in', productIds)
      .orderBy('created_at', 'asc')
      .execute(),
    db.selectFrom('opportunities')
      .selectAll()
      .where('product_id', 'in', productIds)
      .orderBy('created_at', 'desc')
      .execute(),
  ]);

  const mediaByProduct = new Map<string, typeof media>();
  for (const item of media) {
    const items = mediaByProduct.get(item.product_id) ?? [];
    items.push(item);
    mediaByProduct.set(item.product_id, items);
  }
  const opportunitiesByProduct = new Map<string, OpportunityRecord[]>();
  for (const item of opportunities) {
    if (!item.product_id) continue;
    const items = opportunitiesByProduct.get(item.product_id) ?? [];
    items.push({
      opportunity_id: item.opportunity_id,
      product_id: item.product_id,
      buyer_name: item.buyer_name,
      company_name: item.company_name ?? '',
      match_score: item.match_score,
      status: item.status,
      requirement: item.requirement,
      quantity: item.quantity ?? undefined,
      budget: item.budget ?? undefined,
    });
    opportunitiesByProduct.set(item.product_id, items);
  }

  return rows.map((row) => {
    const productMedia = mediaByProduct.get(row.product_id) ?? [];
    const images = productMedia.filter((item) => item.media_type === 'IMAGE').map((item) => ({
      id: item.media_id,
      url: item.external_url ?? `/media/${encodeURIComponent(item.media_id)}`,
    }));
    const audio = productMedia.filter((item) => item.media_type === 'AUDIO').map((item) => ({
      id: item.media_id,
      url: item.external_url ?? `/media/${encodeURIComponent(item.media_id)}`,
    }));

    return {
      product_id: row.product_id,
      artisan_id: row.artisan_id ?? '',
      artisan_name: row.artisan_name ?? row.user_name ?? undefined,
      region: row.region ?? undefined,
      status: row.status,
      created_at: row.created_at.toISOString(),
      image_url: images[0]?.url ?? row.image_url ?? undefined,
      images,
      audio,
      heritage_story: row.heritage_story ?? undefined,
      moq: row.moq ?? undefined,
      lead_time_days: row.lead_time_days ?? undefined,
      catalogue: row.catalogue ?? undefined,
      price: row.price ?? undefined,
      pricing: row.pricing ?? undefined,
      opportunities: (opportunitiesByProduct.get(row.product_id) ?? []).map((item) => ({
        buyer_name: item.company_name || item.buyer_name,
        match_score: item.match_score,
        location: 'Verified Procurement Lead',
        requirement: item.requirement,
      })),
    };
  });
}

export function toOpportunityRecord(row: {
  opportunity_id: string;
  product_id: string | null;
  buyer_name: string;
  company_name: string | null;
  match_score: number;
  status: string;
  requirement: string;
  quantity: number | null;
  budget: string | null;
}): OpportunityRecord {
  return {
    opportunity_id: row.opportunity_id,
    product_id: row.product_id ?? '',
    buyer_name: row.buyer_name,
    company_name: row.company_name ?? '',
    match_score: row.match_score,
    status: row.status,
    requirement: row.requirement,
    quantity: row.quantity ?? undefined,
    budget: row.budget ?? undefined,
  };
}
