import { Request, Response } from 'express';
import { User } from '@supabase/supabase-js';

// Extend Express Request to include user from auth middleware
export interface AuthenticatedRequest extends Request {
  user: User;
  userId: string;
}

// Custom Response interface with standardized response format
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp?: string;
  };
}

// Middleware types
export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: any;
  timestamp: string;
}

// Request validation types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Custom Express types for better type safety
export type AsyncRequestHandler<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ApiResponse<ResBody>>,
  next: any
) => Promise<void>;

export type AuthenticatedRequestHandler<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> = (
  req: AuthenticatedRequest & Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ApiResponse<ResBody>>,
  next: any
) => Promise<void>;

// Rate limiting types
export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}