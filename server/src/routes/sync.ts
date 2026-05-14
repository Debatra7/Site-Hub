import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { syncLimiter, writeLimiter } from '../middleware/rateLimits';
import { validate } from '../middleware/validate';
import { notImplemented } from '../middleware/errors';
import { idParams, syncSchemas } from './schemas';

export const syncRouter = Router();

syncRouter.use(requireAuth);

syncRouter.post('/push', syncLimiter, validate({ body: syncSchemas.push }), notImplemented);
syncRouter.get('/pull', syncLimiter, validate({ query: syncSchemas.pullQuery }), notImplemented);
syncRouter.get('/status', syncLimiter, notImplemented);
syncRouter.post('/devices/register', writeLimiter, validate({ body: syncSchemas.registerDevice }), notImplemented);
syncRouter.post('/conflicts/:id/resolve', writeLimiter, validate({ params: idParams, body: syncSchemas.resolveConflict }), notImplemented);
