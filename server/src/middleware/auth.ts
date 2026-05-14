import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errors';
import './types';

interface AccessTokenPayload {
  sub: string;
  role?: 'USER' | 'ADMIN';
  sid?: string;
  did?: string;
}

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) return next();

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new ApiError(500, 'AUTH_NOT_CONFIGURED', 'JWT_SECRET is not configured');

    const payload = jwt.verify(token, secret) as AccessTokenPayload;
    req.auth = {
      userId: payload.sub,
      role: payload.role ?? 'USER',
      sessionId: payload.sid,
      deviceId: payload.did,
    };
    return next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(401, 'INVALID_TOKEN', 'Access token is invalid or expired'));
  }
};

export const requireAuth: RequestHandler = (req, res, next) => {
  optionalAuth(req, res, (error) => {
    if (error) return next(error);
    if (!req.auth) return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required'));
    return next();
  });
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  requireAuth(req, res, (error) => {
    if (error) return next(error);
    if (req.auth?.role !== 'ADMIN') return next(new ApiError(403, 'FORBIDDEN', 'Admin access is required'));
    return next();
  });
};
