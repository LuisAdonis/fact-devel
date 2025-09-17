import { Router } from 'express';
import FacturaPagoModel from '../models/FacturaPago';
import MovimientoCaja from '../models/MovimientoCaja';

const router = Router();

// Crear pago de factura
router.post('/', async (req, res) => {
  try {
    const pago = new FacturaPagoModel(req.body);
    await pago.save();

    const movimiento = new MovimientoCaja({
      caja_id: pago.caja_id,
      usuario_id: pago.usuario_id,
      tipo: 'FACTURA',
      concepto:pago.factura_id,
      monto: pago.monto,
    });
    await movimiento.save();
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
