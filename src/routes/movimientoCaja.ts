import { Router } from 'express';
import MovimientoCajaModel from '../models/MovimientoCaja';

const router = Router();

// Crear movimiento de caja
router.post('/', async (req, res) => {
  try {
    const movimiento = new MovimientoCajaModel(req.body);
    await movimiento.save();
    res.json(movimiento);
  } catch (err) {
    res.status(500).json({ message: err || 'Server error' });
  }
});

// Listar movimientos
router.get('/', async (req, res) => {
  const movimientos = await MovimientoCajaModel.find();
  res.json(movimientos);
});

export default router;
