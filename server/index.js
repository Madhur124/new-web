import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import leadRoutes from './routes/leads.js';

const { MONGODB_URI, JWT_SECRET, ADMIN_PIN } = process.env;
if (!MONGODB_URI || !JWT_SECRET || !ADMIN_PIN) {
  console.error('Missing MONGODB_URI, JWT_SECRET or ADMIN_PIN in .env');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '..', 'dist');

const app = express();
app.set('trust proxy', 1); // correct client IP behind Render/Railway etc.
app.use(helmet({ contentSecurityPolicy: false })); // CSP off so fonts/images/inline styles keep working
app.use(express.json({ limit: '50kb' }));

// ---- API ----
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found' }));

// ---- Frontend (production): serve the Vite build from the same server ----
app.use(express.static(distPath));
app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB Atlas connected');
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });