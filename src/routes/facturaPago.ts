import { Router } from 'express';
import FacturaPagoModel from '../models/FacturaPago';

const router = Router();

// Crear pago de factura
router.post('/', async (req, res) => {
  try {
    const pago = new FacturaPagoModel(req.body);
    await pago.save();
    res.json(pago);
  } catch (err) {
    res.status(500).json({ message: err || 'Server error' });
  }
});

// Listar todos los pagos
router.get('/', async (req, res) => {
  const pagos = await FacturaPagoModel.find();
  res.json(pagos);
});

export default router;
