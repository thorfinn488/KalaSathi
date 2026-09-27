import { ApiResponseEnvelope } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const API_CONFIGURATION_ERROR = import.meta.env.PROD && !/^https:\/\//i.test(API_BASE_URL)
  ? 'Production API URL is not configured. Set VITE_API_BASE_URL in Vercel to the HTTPS backend URL ending in /api.'
  : null;

export function resolveAssetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^(?:[a-z]+:)?\/\//i.test(path) || /^(?:data|blob):/i.test(path)) return path;

  const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin;
  return new URL(path, apiOrigin).toString();
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (API_CONFIGURATION_ERROR) {
    throw new Error(API_CONFIGURATION_ERROR);
  }

  const token = localStorage.getItem('sih_auth_token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set JSON content-type if body is JSON string
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const responseBody = await response.text();
  let json: ApiResponseEnvelope<T> | null = null;
  try {
    json = responseBody ? JSON.parse(responseBody) as ApiResponseEnvelope<T> : null;
  } catch {
    json = null;
  }

  if (!json || typeof json !== 'object') {
    const message = response.ok
      ? 'The service returned an unexpected response. Please try again.'
      : `The API service is unavailable (HTTP ${response.status}). Check the backend deployment and try again.`;
    const errorObj: any = new Error(message);
    errorObj.code = 'INVALID_API_RESPONSE';
    errorObj.status = response.status;
    throw errorObj;
  }

  if (!response.ok || !json.success) {
    const errorMsg = json.error?.message || `HTTP ${response.status}: Request failed`;
    const errorObj: any = new Error(errorMsg);
    errorObj.code = json.error?.code || 'API_ERROR';
    errorObj.status = response.status;
    throw errorObj;
  }

  return json.data as T;
}
