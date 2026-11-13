import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { estimateWholesaleQuote } from './wholesale-quote.js';

describe('estimateWholesaleQuote', () => {
  it('applies the 10% volume tier and production lead-time floor', () => {
    assert.deepEqual(estimateWholesaleQuote({
      quantity: 50,
      base_price: 3850,
      base_lead_days: 14,
      packaging: 'Sustainable Jute Keepsake Bag',
    }), {
      discount_percent: 10,
      unit_price: 3465,
      estimated_total: 173250,
      estimated_lead_days: 14,
    });
  });

  it('applies the highest tier and wooden packaging surcharge server-side', () => {
    assert.deepEqual(estimateWholesaleQuote({
      quantity: 200,
      base_price: 3850,
      base_lead_days: 14,
      packaging: 'Laser-Engraved Corporate Wooden Box',
    }), {
      discount_percent: 18,
      unit_price: 3277,
      estimated_total: 655400,
      estimated_lead_days: 50,
    });
  });
});
