import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimits';
import { validate } from '../middleware/validate';
import { notImplemented } from '../middleware/errors';
import { categorySchemas, idParams } from './schemas';

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get('/', validate({ query: categorySchemas.listQuery }), notImplemented);
categoriesRouter.post('/', writeLimiter, validate({ body: categorySchemas.create }), notImplemented);
categoriesRouter.get('/:id', validate({ params: idParams }), notImplemented);
categoriesRouter.patch('/:id', writeLimiter, validate({ params: idParams, body: categorySchemas.update }), notImplemented);
categoriesRouter.delete('/:id', writeLimiter, validate({ params: idParams }), notImplemented);
categoriesRouter.post('/reorder', writeLimiter, validate({ body: categorySchemas.reorder }), notImplemented);
categoriesRouter.get('/:id/export', validate({ params: idParams }), notImplemented);
