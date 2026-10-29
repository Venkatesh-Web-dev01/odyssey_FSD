import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from cwd, server/.env, or root .env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { mountRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeDatabase } from './db/database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ─── Root & Info Routes ──────────────────────────────────
app.get(['/', '/api'], (_req, res) => {
  res.json({
    name: 'Odyssey Travel Planner API',
    status: 'ok',
    version: '0.1.0',
    endpoints: {
      health: '/api/health',
      trips: '/api/trips'
    }
  });
});

// ─── Routes ──────────────────────────────────────────────
mountRoutes(app);

// ─── 404 Catch-all (Returns JSON instead of default HTML) ──
app.use((req, res) => {
  res.status(404).json({
    error: true,
    status: 404,
    message: `Not Found: ${req.method} ${req.originalUrl || req.path}`
  });
});

// ─── Centralized Error Handler (must be after routes) ────
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────
async function start() {
  try {
    // Initialize SQLite database and run migrations
    initializeDatabase();
    console.log('✅ Database initialized');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();
