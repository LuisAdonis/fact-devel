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

import CajaRouter from './routes/caja';
import FacturaPagoRouter from './routes/facturaPago';
import MovimientoCajaRouter from './routes/movimientoCaja';
import UsuariosRouter from './routes/usuario';

import verifyToken from './middleware/verifyToken';
import corsErrorHandler from './middleware/corsErrorHandler';
import backupRoutes from './routes/respaldo';

import path from 'path';

import swaggerSpec from './swagger';
import { firmarXMLConP12 } from './firma';


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

const swaggerHtml = `<!DOCTYPE html>
<html>
<head>
  <title>API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.18.3/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.18.3/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({ url: '/swagger.json', dom_id: '#swagger-ui' });
    };
  </script>
</body>
</html>`;

// app.get('/swagger.json', (_req, res) => {
//   res.json(swaggerSpec);
// });

// app.get('/docs', (_req, res) => {
//   res.type('html').send(swaggerHtml);
// });

app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toUTCString(),
    cors: 'enabled',
    environment: process.env.NODE_ENV || 'development',
    SRI_ENVIRONMENT: process.env.SRI_ENVIRONMENT || 'development',
  });
});
app.use(corsTestRoutes);

app.use('/api/v1/factura-pdf',facturaPDFRoutes);
app.use('/api/v1', backupRoutes);

app.get('/teste',async (_req, res) => {
  const dd='<?xml version="1.0" encoding="UTF-8"?><factura id="comprobante" version="1.0.0">  <infoTributaria>    <ambiente>1</ambiente>    <tipoEmision>1</tipoEmision>    <razonSocial>Aurita</razonSocial>    <nombreComercial>Aurita</nombreComercial>    <ruc>1312553454001</ruc>    <claveAcceso>3009202501131255345400110010010000000156216151316</claveAcceso>    <codDoc>01</codDoc>      <estab>001</estab>    <ptoEmi>001</ptoEmi>    <secuencial>000000015</secuencial>    <dirMatriz>av</dirMatriz>  </infoTributaria>  <infoFactura>    <fechaEmision>30/09/2025</fechaEmision>          <dirEstablecimiento>av</dirEstablecimiento>    <obligadoContabilidad>SI</obligadoContabilidad>    <tipoIdentificacionComprador>07</tipoIdentificacionComprador>    <razonSocialComprador>Consumiddor final</razonSocialComprador>    <identificacionComprador>9999999999999</identificacionComprador>    <totalSinImpuestos>0.45</totalSinImpuestos>    <totalDescuento>0.00</totalDescuento>    <totalConImpuestos>      <totalImpuesto>        <codigo>2</codigo>        <codigoPorcentaje>4</codigoPorcentaje>                  <baseImponible>0.45</baseImponible>        <valor>0.07</valor>      </totalImpuesto>    </totalConImpuestos>    <propina>0.00</propina>    <importeTotal>0.52</importeTotal>   <moneda>DOLAR</moneda>  </infoFactura>  <detalles>    <detalle>      <codigoPrincipal>PAR500MG</codigoPrincipal>                        <descripcion>Tylenol</descripcion>      <cantidad>1</cantidad>      <precioUnitario>0.45</precioUnitario>      <descuento>0.00</descuento>      <precioTotalSinImpuesto>0.45</precioTotalSinImpuesto>      <impuestos>        <impuesto>          <codigo>2</codigo>          <codigoPorcentaje>4</codigoPorcentaje>          <tarifa>15.00</tarifa>          <baseImponible>0.45</baseImponible>          <valor>0.07</valor>        </impuesto>      </impuestos>    </detalle>  </detalles>  <infoAdicional>    <campoAdicional nombre="Email">correo@domain.com</campoAdicional>    <campoAdicional nombre="Teléfono">0999999999</campoAdicional>  </infoAdicional></factura>';
  const p12Base64='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';
    const xmlFirmado = await firmarXMLConP12(dd, p12Base64, "12345678");

  res.json(xmlFirmado);
});

app.use(verifyToken);
app.use('/api/v1/identificacion-tipo', identificaciontipoRoutes);
app.use('/api/v1/empresa', empresaRoutes);
app.use('/api/v1/cliente', clienteRoutes);
app.use('/api/v1/factura-detalle', facturaDetalleRoutes);
app.use('/api/v1/factura', facturaRoutes);
// app.use('/api/v1/factura-pdf',facturaPDFRoutes);

app.use('/api/v1/producto', productoRoutes);
app.use('/api/v1/invetario',invetarioRoutes);

app.use('/api/v1/caja', CajaRouter);
app.use('/api/v1/factura-pago', FacturaPagoRouter);
app.use('/api/v1/movimiento-caja', MovimientoCajaRouter);
app.use('/api/v1/usuarios', UsuariosRouter);


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
      console.log(`📄 API Docs: http://localhost:${PORT}/docs`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection error', err);
  });
