import express from 'express';
import dotenv from 'dotenv';
import { apiRouter } from './routes';
import { errorHandler, notFound, requestId } from './middleware/errors';
import { standardLimiter } from './middleware/rateLimits';
import { corsMiddleware, securityHeaders } from './middleware/security';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.disable('x-powered-by');
app.use(requestId);
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(standardLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1', apiRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
