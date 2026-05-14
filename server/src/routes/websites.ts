import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimits';
import { validate } from '../middleware/validate';
import { notImplemented } from '../middleware/errors';
import { idParams, websiteSchemas } from './schemas';

export const websitesRouter = Router();

websitesRouter.use(requireAuth);

websitesRouter.get('/', validate({ query: websiteSchemas.listQuery }), notImplemented);
websitesRouter.post('/', writeLimiter, validate({ body: websiteSchemas.create }), notImplemented);
websitesRouter.post('/bulk', writeLimiter, validate({ body: websiteSchemas.bulk }), notImplemented);
websitesRouter.post('/metadata/fetch', writeLimiter, validate({ body: websiteSchemas.create.pick({ url: true }) }), notImplemented);
websitesRouter.get('/:id', validate({ params: idParams }), notImplemented);
websitesRouter.patch('/:id', writeLimiter, validate({ params: idParams, body: websiteSchemas.update }), notImplemented);
websitesRouter.delete('/:id', writeLimiter, validate({ params: idParams }), notImplemented);
