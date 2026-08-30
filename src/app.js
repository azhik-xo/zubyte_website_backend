import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import productRoutes from './routes/productRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import demoRoutes from './routes/demoRoutes.js';
import companyRoutes from './routes/companyRoutes.js';

import { errorHandler } from './middlewares/errorHandler.js';
import { generalApiLimiter } from './middlewares/rateLimiter.js';
import { ApiResponse } from './utils/apiResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ─── 1. GLOBAL SECURITY & LOGGING MIDDLEWARES ────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin === clientUrl ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// General API rate limiting
app.use('/api', generalApiLimiter);

// ─── 2. HEALTH CHECK ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  return ApiResponse.success(res, {
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Zubyte Backend API',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── 3. MOUNT API ROUTES ─────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api', demoRoutes);
app.use('/api', companyRoutes);

// ─── 4. 404 NOT FOUND HANDLER ────────────────────────────────────────────────
app.use((req, res) => {
  return ApiResponse.notFound(res, `API route '${req.originalUrl}' does not exist`);
});

// ─── 5. CENTRALIZED ERROR HANDLER ────────────────────────────────────────────
app.use(errorHandler);

export default app;
