import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger/config';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

// Routes
import authRoutes from './routes/auth';
import businessRoutes from './routes/business';
import customerRoutes from './routes/customers';
import productRoutes from './routes/products';
import invoiceRoutes from './routes/invoices';
import paymentRoutes from './routes/payments';
import reportRoutes from './routes/reports';
import subscriptionRoutes from './routes/subscriptions';
import moduleRoutes from './routes/modules';
import webhookRoutes from './routes/webhooks';
import adminRoutes from './routes/admin';
import planRoutes from './routes/plans';
import expenseRoutes from './routes/expenses';
import inventoryRoutes from './routes/inventory';
import hrmRoutes from './routes/hrm';
import crmRoutes from './routes/crm';
import toolsRoutes from './routes/tools';
import contactRoutes from './routes/contact';
import settingsRoutes from './routes/settings';
import blogRoutes from './routes/blog';
import faqRoutes from './routes/faq';

const app = express();

// Trust the first proxy so req.ip reflects the real client IP, not the
// proxy's loopback address.  Without this, every user behind a reverse
// proxy (or in Docker/nginx) would share the same rate-limit bucket.
app.set('trust proxy', 1);

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Business-Id'],
}));

// ─── General Middleware ─────────────────────────────────────────────────────
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Raw body for webhooks (must be before json parser)
app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate Limiting ──────────────────────────────────────────────────────────
// Auth endpoints get a stricter, dedicated limiter.
const authLimiter = rateLimiter({ max: 20, windowMs: 15 * 60 * 1000 });
// General limiter is instantiated once and reused for all non-auth routes.
const generalLimiter = rateLimiter({ max: 200, windowMs: 60 * 1000 });

app.use('/api/v1/auth', authLimiter);
// Skip auth paths so those requests are only counted once (against authLimiter).
app.use('/api/v1', (req, res, next) => {
  if (req.path.startsWith('/auth')) return next();
  return generalLimiter(req, res, next);
});

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'yantrix-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── API Documentation ──────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Yantrix API Docs',
  customCss: '.swagger-ui .topbar { background-color: #4f46e5; }',
}));

app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── Static file serving (uploaded media) ───────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/modules', moduleRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/plans', planRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/hrm', hrmRoutes);
app.use('/api/v1/crm', crmRoutes);
app.use('/api/v1/tools', toolsRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/blog', blogRoutes);
app.use('/api/v1/faqs', faqRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

export default app;
