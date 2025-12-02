import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { borrowersRouter } from './routes/borrowers';
import { loansRouter } from './routes/loans';
import { authRouter } from './routes/auth';
import { settingsRouter } from './routes/settings';

// טען משתני סביבה
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // אבטחה בסיסית
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting - הגבלת קצב בקשות
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 דקות
  max: 100, // מקסימום 100 בקשות
  message: 'יותר מדי בקשות, נסה שוב מאוחר יותר'
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/borrowers', borrowersRouter);
app.use('/api/loans', loansRouter);
app.use('/api/settings', settingsRouter);

// Root route - דף בית
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({
    name: 'Gemach Management System API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      borrowers: '/api/borrowers',
      loans: '/api/loans',
      settings: '/api/settings'
    },
    documentation: 'https://github.com/sh5616107/gemach-management-system'
  });
});

// Health check
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'שגיאת שרת פנימית',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
