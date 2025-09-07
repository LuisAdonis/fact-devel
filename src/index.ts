import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { getCorsConfig } from './config/cors.config';

import authRoutes from './routes/auth';
import corsTestRoutes from './routes/cors-test';


import identificaciontipoRoutes from './routes/identificacion';
import empresaRoutes from './routes/empresa';

import clienteRoutes from './routes/cliente';
import productoRoutes from './routes/producto';
import facturaRoutes from './routes/factura';
import facturaDetalleRoutes from './routes/facturaDetalle';
import facturaPDFRoutes from './routes/facturaPDF';
import invetarioRoutes from './routes/inventario';


import verifyToken from './middleware/verifyToken';
import corsErrorHandler from './middleware/corsErrorHandler';

import path from 'path';


dotenv.config();
const app = express();
const corsConfig = getCorsConfig();
app.use(cors(corsConfig));
app.use((req, res, next) => {
  // Logs para debgging
  // console.log(`📡 ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'No origin'}`);
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    console.log('✅ Preflight request handled');
    res.status(200).end();
    return;
  }
  next();
});

app.use(express.json());

app.use(authRoutes);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads/Empresa')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads/Productos')));

app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    environment: process.env.NODE_ENV || 'development',
  });
});
// app.use(corsTestRoutes);


// app.use(verifyToken);
app.use('/api/v1/identificacion-tipo', identificaciontipoRoutes);
app.use('/api/v1/empresa', empresaRoutes);
app.use('/api/v1/cliente', clienteRoutes);
app.use('/api/v1/factura-detalle', facturaDetalleRoutes);
app.use('/api/v1/factura', facturaRoutes);
app.use('/api/v1/factura-pdf',facturaPDFRoutes);

app.use('/api/v1/producto', productoRoutes);
app.use('/api/v1/invetario',invetarioRoutes);


app.use(corsErrorHandler);
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

const PORT = process.env.PORT || 3000;
mongoose
  .connect(process.env.MONGODB_URI || '')
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📄 API Docs: http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection error', err);
  });
