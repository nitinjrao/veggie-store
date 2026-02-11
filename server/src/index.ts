import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import authRoutes from './routes/authRoutes';
import vegetableRoutes from './routes/vegetableRoutes';
import categoryRoutes from './routes/categoryRoutes';
import orderRoutes from './routes/orderRoutes';
import adminVegetableRoutes from './routes/adminVegetableRoutes';
import adminDashboardRoutes from './routes/adminDashboardRoutes';
import adminOrderRoutes from './routes/adminOrderRoutes';
import adminCustomerRoutes from './routes/adminCustomerRoutes';
import adminAnalyticsRoutes from './routes/adminAnalyticsRoutes';
import adminCategoryRoutes from './routes/adminCategoryRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    // Allow exact match or any Vercel preview URL
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.up.railway.app')) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts, please try again later.' },
});

app.use('/api/auth', authLimiter);

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vegetables', vegetableRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/vegetables', adminVegetableRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/customers', adminCustomerRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/favorites', favoriteRoutes);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  // Startup DB check
  try {
    const { prisma } = await import('./lib/prisma');
    const cats = await prisma.category.count();
    const vegs = await prisma.vegetable.count();
    console.log(`DB check: ${cats} categories, ${vegs} vegetables`);
  } catch (e) {
    console.error('DB check failed:', e);
  }
});
