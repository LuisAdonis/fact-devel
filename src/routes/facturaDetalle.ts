import { Router } from 'express';
import facturaDetalle from '../models/FacturaDetalle';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const docs = await facturaDetalle.find();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


export default router;