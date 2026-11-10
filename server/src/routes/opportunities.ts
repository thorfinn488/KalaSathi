import { Router, Request, Response } from 'express';
import { opportunities, OpportunityRecord, products } from '../db/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const opportunitiesRouter = Router();

opportunitiesRouter.get('/', (_req: Request, res: Response) => {
  return sendSuccess(res, opportunities);
});

// Create inquiry / wholesale quote request
opportunitiesRouter.post('/', (req: Request, res: Response) => {
  const { buyer_name, company_name, requirement, product_id, quantity, budget, packaging } = req.body;
  if (!buyer_name || !requirement) {
    return sendError(res, 'Buyer name and requirement are required', 'VALIDATION_ERROR', 400);
  }

  const matchedProduct = products.find((p) => p.product_id === product_id);
  const requestedQty = Number(quantity) || 50;

  // Server-side MOQ validation
  if (matchedProduct && matchedProduct.moq && requestedQty < matchedProduct.moq) {
    return sendError(
      res,
      `Requested quantity (${requestedQty}) is below the artisan guild minimum order quantity (MOQ: ${matchedProduct.moq} units).`,
      'MOQ_NOT_MET',
      400
    );
  }

  const estimatedLeadDays = Math.max(
    matchedProduct?.lead_time_days || 14,
    Math.ceil(requestedQty / 4)
  );

  const newOpp: OpportunityRecord = {
    opportunity_id: `opp_${Date.now()}`,
    product_id: product_id || 'prod_general',
    buyer_name,
    company_name: company_name || 'Retail / Enterprise Partner',
    match_score: Math.floor(91 + Math.random() * 8),
    status: 'ACTIVE',
    requirement: packaging
      ? `${requirement} (Packaging: ${packaging}, Quantity: ${requestedQty} units, Est. Production: ${estimatedLeadDays} days)`
      : `${requirement} (Quantity: ${requestedQty} units, Est. Production: ${estimatedLeadDays} days)`,
    quantity: requestedQty,
    budget: budget || 'Price by Quote',
  };

  opportunities.unshift(newOpp);

  // Also link to product if exists
  if (matchedProduct) {
    matchedProduct.opportunities.unshift({
      buyer_name: `${buyer_name} (${company_name || 'Enterprise'})`,
      match_score: newOpp.match_score,
      location: 'Verified Procurement Lead',
      requirement: newOpp.requirement,
    });
  }

  return sendSuccess(res, newOpp, 201);
});
