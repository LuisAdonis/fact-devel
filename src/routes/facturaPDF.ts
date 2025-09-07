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
router.get('/factura/:facturaId', async (req, res) => {
  try {
    const doc = await FacturaPDF.findOne({ factura_id: req.params.facturaId });
    if (!doc) return res.status(404).json({ message: 'PDF not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/download/:claveAcceso', async (req, res) => {
  try {
    const doc = await FacturaPDF.findOne({ claveAcceso: req.params.claveAcceso });
    if (!doc) return res.status(404).json({ message: 'PDF not found' });

    if (doc.pdf_buffer) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="factura_${doc.claveAcceso}.pdf"`);
      res.send(doc.pdf_buffer);
    } else {
      res.status(404).json({ message: 'PDF buffer not available' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;