import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { analyticsLimiter } from '../middleware/rateLimits';
import { validate } from '../middleware/validate';
import { notImplemented } from '../middleware/errors';
import { analyticsSchemas } from './schemas';

export const analyticsRouter = Router();

analyticsRouter.post('/events', requireAuth, analyticsLimiter, validate({ body: analyticsSchemas.ingest }), notImplemented);
analyticsRouter.get('/admin/overview', requireAdmin, validate({ query: analyticsSchemas.adminQuery }), notImplemented);
analyticsRouter.get('/admin/usage', requireAdmin, validate({ query: analyticsSchemas.adminQuery }), notImplemented);
analyticsRouter.get('/admin/sync', requireAdmin, validate({ query: analyticsSchemas.adminQuery }), notImplemented);
analyticsRouter.get('/admin/security', requireAdmin, validate({ query: analyticsSchemas.adminQuery }), notImplemented);
analyticsRouter.get('/admin/reports/export', requireAdmin, validate({ query: analyticsSchemas.adminQuery }), notImplemented);
