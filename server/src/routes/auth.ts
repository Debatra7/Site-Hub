import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimits';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { notImplemented } from '../middleware/errors';
import { authSchemas } from './schemas';

export const authRouter = Router();

authRouter.post('/refresh', authLimiter, validate({ body: authSchemas.refresh }), notImplemented);
authRouter.post('/logout', requireAuth, validate({ body: authSchemas.logout }), notImplemented);
authRouter.post('/logout-all', requireAuth, authLimiter, notImplemented);
authRouter.get('/me', requireAuth, notImplemented);
authRouter.get('/sessions', requireAuth, notImplemented);
authRouter.delete('/sessions/:id', requireAuth, notImplemented);
authRouter.get('/:provider', authLimiter, notImplemented);
authRouter.get('/:provider/callback', authLimiter, notImplemented);
