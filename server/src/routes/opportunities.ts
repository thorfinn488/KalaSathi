import { Router, Request, Response } from 'express';
import { opportunities, OpportunityRecord } from '../db/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const opportunitiesRouter = Router();

opportunitiesRouter.get('/', (_req: Request, res: Response) => {
  return sendSuccess(res, opportunities);
});

opportunitiesRouter.post('/', (req: Request, res: Response) => {
  const { buyer_name, company_name, requirement, product_id } = req.body;
  if (!buyer_name || !requirement) {
    return sendError(res, 'Buyer name and requirement are required', 'VALIDATION_ERROR', 400);
  }

  const newOpp: OpportunityRecord = {
    opportunity_id: `opp_${Date.now()}`,
    product_id: product_id || 'prod_general',
    buyer_name,
    company_name: company_name || 'Retail Partner',
    match_score: Math.floor(85 + Math.random() * 14),
    status: 'ACTIVE',
    requirement,
  };

  opportunities.unshift(newOpp);
  return sendSuccess(res, newOpp, 201);
});
