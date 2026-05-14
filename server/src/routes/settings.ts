import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimits';
import { validate } from '../middleware/validate';
import { notImplemented } from '../middleware/errors';
import { settingsSchemas } from './schemas';

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

settingsRouter.get('/', notImplemented);
settingsRouter.patch('/', writeLimiter, validate({ body: settingsSchemas.update }), notImplemented);
settingsRouter.get('/privacy', notImplemented);
settingsRouter.patch('/privacy', writeLimiter, validate({ body: settingsSchemas.update.pick({ privacyDefaults: true }) }), notImplemented);
