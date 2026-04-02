import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import productsRouter from './routes/products.js';
import promotionsRouter from './routes/promotions.js';
import ordersRouter from './routes/orders.js';
import adminAuthRouter from './routes/adminAuth.js';
import adminProductsRouter from './routes/adminProducts.js';
import adminPromotionsRouter from './routes/adminPromotions.js';
import adminOrdersRouter from './routes/adminOrders.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: false
}));

app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/products', productsRouter);
app.use('/api/promotions', promotionsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminAuthRouter);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/admin/promotions', adminPromotionsRouter);
app.use('/api/admin/orders', adminOrdersRouter);

const port = process.env.PORT || 5000;
const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URL ||
  'mongodb://127.0.0.1:27017/kite';

mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    if (String(err?.message || '').includes('ECONNREFUSED')) {
      console.error(
        `MongoDB is not reachable at ${mongoUri}. Start MongoDB service or set MONGODB_URI to a running instance (Atlas/local).`
      );
    } else {
      console.error('MongoDB connection error', err);
    }
    process.exit(1);
  });

export default app;

