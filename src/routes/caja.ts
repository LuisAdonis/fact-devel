import { Router } from 'express';
import CajaModel from '../models/Caja';
import { cerrarCajaProfesional } from '../services/cerrarCajaProfesional';
import CierreCaja from '../models/CierreCajaModel';
import MovimientoCaja from '../models/MovimientoCaja';

const router = Router();

// Crear caja
router.post('/', async (req, res) => {
  try {
    const { usuario_id, monto_inicial } = req.body;
    const cajaAbierta = await CajaModel.findOne({ usuario_id, estado: true });
    if (cajaAbierta) {
      return res.status(400).json({
        error: 'Este usuario ya tiene una caja abierta. Debe cerrarla antes de abrir otra.'
      });
    }
    // Crear nueva caja
    const caja = new CajaModel({
      usuario_id,
      monto_inicial,
      estado: true,
      fecha_apertura: new Date()
    });

    await caja.save();
    const mov = new MovimientoCaja({
      caja_id: caja.id,
      usuario_id: caja.usuario_id,
      tipo: 'INICIO',
      concepto: 'Apertura de Caja',
      monto: caja.monto_inicial,
    });
    await mov.save();
    const respuesta = {
      ...caja.toObject(),
      mensaje: "Caja abierta correctamente",
      movimientos: [mov.toObject()]

    };
    res.json(respuesta);

  } catch (err) {
    res.status(500).json({ message: err || 'Server error' });
  }
});

// Obtener todas las cajas
router.get('/', async (req, res) => {
  const cajas = await CajaModel.find();
  res.json(cajas);
});

router.get('/:id', async (req, res) => {

  const cajas = await CajaModel.findOne({
    usuario_id: req.params.id,
    estado: true,
  });
  if (cajas) {
    const movimientos = await MovimientoCaja.find({ caja_id: cajas._id });

    const respuesta = {
      ...cajas.toObject(),
      mensaje: "Caja abierta correctamente",
      movimientos: movimientos.map(m => m.toObject()), // lo devuelves en []
    };

    res.json(respuesta);
  } else {
    res.json({});
  }
});

router.post('/cerrar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id, monto_contado, observaciones } = req.body;
    const caja = await CajaModel.findById(id);
    if (!caja) return res.status(404).json({ error: 'Caja no encontrada' });
    if (!caja.estado)
      return res.status(400).json({ error: 'La caja ya está cerrada' });

    // Generar reporte
    const reporte = await cerrarCajaProfesional({ cajaId: id, montoContado: monto_contado });

    // Guardar reporte
    const cierre = new CierreCaja({
      ...reporte,
      usuario_id,
      observaciones
    });
    await cierre.save();

    // Cerrar caja
    caja.estado = false;
    caja.fecha_cierre = new Date();
    await caja.save();

    res.json({ mensaje: 'Caja cerrada correctamente', cierre });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;