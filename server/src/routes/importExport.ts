import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { exportLimiter, writeLimiter } from '../middleware/rateLimits';
import { validate } from '../middleware/validate';
import { notImplemented } from '../middleware/errors';
import { idParams, importExportSchemas } from './schemas';

export const importExportRouter = Router();

importExportRouter.use(requireAuth);

importExportRouter.post('/import', writeLimiter, validate({ body: importExportSchemas.importBody }), notImplemented);
importExportRouter.get('/import/:id', validate({ params: idParams }), notImplemented);
importExportRouter.post('/import/:id/resolve', writeLimiter, validate({ params: idParams }), notImplemented);
importExportRouter.get('/export', exportLimiter, validate({ query: importExportSchemas.exportQuery }), notImplemented);
importExportRouter.get('/export/:id', exportLimiter, validate({ params: idParams }), notImplemented);
importExportRouter.get('/archive', exportLimiter, notImplemented);
