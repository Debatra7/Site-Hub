import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimits';
import { validate } from '../middleware/validate';
import { notImplemented } from '../middleware/errors';
import { idParams, tagSchemas } from './schemas';

export const tagsRouter = Router();

tagsRouter.use(requireAuth);

tagsRouter.get('/', validate({ query: tagSchemas.listQuery }), notImplemented);
tagsRouter.post('/', writeLimiter, validate({ body: tagSchemas.create }), notImplemented);
tagsRouter.patch('/:id', writeLimiter, validate({ params: idParams, body: tagSchemas.update }), notImplemented);
tagsRouter.delete('/:id', writeLimiter, validate({ params: idParams }), notImplemented);
tagsRouter.post('/:id/merge', writeLimiter, validate({ params: idParams, body: tagSchemas.merge }), notImplemented);
tagsRouter.post('/assign', writeLimiter, validate({ body: tagSchemas.assignment }), notImplemented);
tagsRouter.post('/unassign', writeLimiter, validate({ body: tagSchemas.assignment }), notImplemented);
