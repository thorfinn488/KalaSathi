import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { productsRouter } from './routes/products.js';
import { opportunitiesRouter } from './routes/opportunities.js';
import { demoApiRouter } from './routes/demoApi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploads, audio, mocks)
const uploadsDir = path.resolve(__dirname, '../../uploads');
app.use('/static', express.static(uploadsDir));

// API Routes
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/products', productsRouter);
app.use('/api/opportunities', opportunitiesRouter);

// Order dashboard demo API
app.use('/demo-api', demoApiRouter);

// Serve frontend build in production
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/demo-api') || req.path.startsWith('/static')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) {
      // In dev mode when frontend isn't built yet, return helpful JSON
      res.json({ message: 'KalaSathi Backend Active. Vite dev server runs at http://localhost:3000' });
    }
  });
});
