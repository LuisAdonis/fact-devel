import { Router } from 'express';
import FacturaPDF from '../models/FacturaPDF';

const router = Router();
router.get('/', async (_req, res) => {
  try {
    const docs = await FacturaPDF.find();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
export default router;