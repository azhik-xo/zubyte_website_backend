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

// ─── 1. TRUST PROXY FOR HOSTING (RENDER / REVERSE PROXIES) ───────────────────
app.set('trust proxy', 1);

// ─── 2. GLOBAL SECURITY & LOGGING MIDDLEWARES ────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Flexible CORS Configuration supporting Render & Vercel
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, '');

      // Allow wildcard or explicit allowed list
      if (process.env.CLIENT_URL === '*' || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(normalizedOrigin) ||
        normalizedOrigin.startsWith('http://localhost:') ||
        normalizedOrigin.startsWith('http://127.0.0.1:') ||
        normalizedOrigin.endsWith('.vercel.app') ||
        normalizedOrigin.endsWith('.onrender.com')
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
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

// ─── 3. HEALTH & ROOT STATUS CHECKS ──────────────────────────────────────────
app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: '🚀 Zubyte Solution REST API is running online',
    health: '/api/health',
    docs: '/api',
    environment: process.env.NODE_ENV || 'production',
  });
});

app.get('/api/health', (req, res) => {
  return ApiResponse.success(res, {
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Zubyte Backend API',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
  });
});

// ─── 4. MOUNT API ROUTES ─────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api', demoRoutes);
app.use('/api', companyRoutes);

// Fallback aliases without /api prefix (for flexible client requests)
app.use('/auth', authRoutes);
app.use('/contact', contactRoutes);
app.use('/services', serviceRoutes);
app.use('/products', productRoutes);
app.use('/portfolio', portfolioRoutes);
app.use('/', demoRoutes);
app.use('/', companyRoutes);

// ─── 5. 404 NOT FOUND HANDLER ────────────────────────────────────────────────
app.use((req, res) => {
  return ApiResponse.notFound(res, `API route '${req.originalUrl}' does not exist`);
});


// ─── 6. CENTRALIZED ERROR HANDLER ────────────────────────────────────────────
app.use(errorHandler);

export default app;
