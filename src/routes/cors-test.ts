import { Router, Request, Response } from 'express';


import Caja from '../models/Caja';
import Usuario from '../models/Usuario';
import MovimientoCaja from '../models/MovimientoCaja';

import FacturaPDF from '../models/FacturaPDF';
import Factura from '../models/Factura';
import FacturaDetalle from '../models/FacturaDetalle';
import FacturaPago from '../models/FacturaPago';

import Inventario from '../models/Inventario';
import CierreCaja from '../models/CierreCajaModel';


const router = Router();
router.get('/cors-test', (req: Request, res: Response) => {
  const origin = req.get('Origin');
  const userAgent = req.get('User-Agent');
  const method = req.method;

  console.log(`🧪 CORS Test Request:`);
  console.log(`   Origin: ${origin || 'No origin'}`);
  console.log(`   Method: ${method}`);
  console.log(`   User-Agent: ${userAgent}`);

  res.json({
    message: '✅ CORS is working correctly!',
    timestamp: new Date().toISOString(),
    requestInfo: {
      origin: origin || 'No origin',
      method,
      path: req.path,
      userAgent,
      headers: req.headers,
    },
    corsInfo: {
      status: 'success',
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentialsAllowed: true,
    },
  });
});

// Endpoint POST para probar CORS con datos
router.post('/cors-test', (req: Request, res: Response) => {
  const origin = req.get('Origin');

  console.log(`🧪 CORS POST Test Request from: ${origin || 'No origin'}`);
  console.log(`📋 Body:`, req.body);

  res.json({
    message: '✅ CORS POST request successful!',
    receivedData: req.body,
    timestamp: new Date().toISOString(),
    origin: origin || 'No origin',
  });
});
router.post('/data-deleted', async (req: Request, res: Response) => {
  try {
    // await Usuario.deleteMany({});
    await Caja.deleteMany({});
    await MovimientoCaja.deleteMany({});

    await FacturaPDF.deleteMany({});
    await Factura.deleteMany({});
    await FacturaDetalle.deleteMany({});
    await FacturaPago.deleteMany({});
    // await Inventario.deleteMany({});
    await CierreCaja.deleteMany({});

    res.json({ message: "Todas las tablas han sido vaciadas" });

  } catch (error) {
    res.status(500).json({ error: error });
  }

});
export default router;
