import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimits';
import { validate } from '../middleware/validate';
import { notImplemented } from '../middleware/errors';
import { idParams, sharingSchemas, tokenParams } from './schemas';

export const sharingRouter = Router();

sharingRouter.get('/public/:token', optionalAuth, validate({ params: tokenParams }), notImplemented);
sharingRouter.post('/', requireAuth, writeLimiter, validate({ body: sharingSchemas.create }), notImplemented);
sharingRouter.get('/', requireAuth, notImplemented);
sharingRouter.get('/:id', requireAuth, validate({ params: idParams }), notImplemented);
sharingRouter.patch('/:id', requireAuth, writeLimiter, validate({ params: idParams, body: sharingSchemas.update }), notImplemented);
sharingRouter.delete('/:id', requireAuth, writeLimiter, validate({ params: idParams }), notImplemented);
sharingRouter.post('/:id/members', requireAuth, writeLimiter, validate({ params: idParams, body: sharingSchemas.member }), notImplemented);
sharingRouter.delete('/:id/members/:memberId', requireAuth, writeLimiter, notImplemented);
