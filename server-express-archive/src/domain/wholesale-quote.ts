export const WHOLESALE_PACKAGING_OPTIONS = [
  'Sustainable Jute Keepsake Bag',
  'Eco-Friendly Kraft Gift Box',
  'Laser-Engraved Corporate Wooden Box',
] as const;

export interface WholesaleQuoteEstimate {
  discount_percent: number;
  unit_price: number;
  estimated_total: number;
  estimated_lead_days: number;
}

export function estimateWholesaleQuote(input: {
  quantity: number;
  base_price: number;
  base_lead_days: number;
  packaging?: typeof WHOLESALE_PACKAGING_OPTIONS[number];
}): WholesaleQuoteEstimate {
  const discountPercent = input.quantity >= 200 ? 18 : input.quantity >= 50 ? 10 : 0;
  const packagingSurcharge = input.packaging === 'Laser-Engraved Corporate Wooden Box' ? 120 : 0;
  const unitPrice = Math.round(input.base_price * (1 - discountPercent / 100)) + packagingSurcharge;

  return {
    discount_percent: discountPercent,
    unit_price: unitPrice,
    estimated_total: unitPrice * input.quantity,
    estimated_lead_days: Math.max(input.base_lead_days, Math.ceil(input.quantity / 4)),
  };
}
