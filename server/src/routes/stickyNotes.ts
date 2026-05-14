import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimits';
import { validate } from '../middleware/validate';
import { notImplemented } from '../middleware/errors';
import { idParams, stickyNoteSchemas } from './schemas';

export const stickyNotesRouter = Router();

stickyNotesRouter.use(requireAuth);

stickyNotesRouter.get('/', validate({ query: stickyNoteSchemas.listQuery }), notImplemented);
stickyNotesRouter.post('/', writeLimiter, validate({ body: stickyNoteSchemas.create }), notImplemented);
stickyNotesRouter.get('/:id', validate({ params: idParams }), notImplemented);
stickyNotesRouter.patch('/:id', writeLimiter, validate({ params: idParams, body: stickyNoteSchemas.update }), notImplemented);
stickyNotesRouter.delete('/:id', writeLimiter, validate({ params: idParams }), notImplemented);
stickyNotesRouter.post('/:id/reminders', writeLimiter, validate({ params: idParams }), notImplemented);
