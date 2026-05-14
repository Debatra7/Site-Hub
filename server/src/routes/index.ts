import { Router } from 'express';
import { authRouter } from './auth';
import { categoriesRouter } from './categories';
import { websitesRouter } from './websites';
import { stickyNotesRouter } from './stickyNotes';
import { tagsRouter } from './tags';
import { syncRouter } from './sync';
import { sharingRouter } from './sharing';
import { analyticsRouter } from './analytics';
import { importExportRouter } from './importExport';
import { settingsRouter } from './settings';

export const apiRouter = Router();

apiRouter.get('/status', (_req, res) => {
  res.json({
    apiVersion: 'v1',
    status: 'ok',
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/websites', websitesRouter);
apiRouter.use('/sticky-notes', stickyNotesRouter);
apiRouter.use('/tags', tagsRouter);
apiRouter.use('/sync', syncRouter);
apiRouter.use('/sharing', sharingRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/', importExportRouter);
apiRouter.use('/settings', settingsRouter);
