import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, status: number = 200) {
  return res.status(status).json({
    success: true,
    data,
    error: null,
  });
}

export function sendError(res: Response, message: string, code: string = 'API_ERROR', status: number = 400) {
  return res.status(status).json({
    success: false,
    data: null,
    error: {
      code,
      message,
    },
  });
}
