import { Router } from 'express';
import CajaModel from '../models/Caja';
import { cerrarCajaProfesional } from '../services/cerrarCajaProfesional';
const router = Router();

// Crear caja
router.post('/', async (req, res) => {
  try {
    const caja = new CajaModel(req.body);
    await caja.save();
    res.json(caja);
  } catch (err) {
    res.status(500).json({ message: err || 'Server error' });
  }
});

// Obtener todas las cajas
router.get('/', async (req, res) => {
  const cajas = await CajaModel.find();
  res.json(cajas);
});

// Cierre de caja profesional
router.post('/cerrar/:id', async (req, res) => {
  try {
    const { montoContado } = req.body;
    const reporte = await cerrarCajaProfesional({ cajaId: req.params.id, montoContado });
    res.json(reporte);
  } catch (err) {
    res.status(500).json({ message: err || 'Server error' });
  }
});

export default router;