import { Router } from 'express';
import Cliente from '../models/Cliente';
const router = Router();

router.post('/', async (req, res) => {
  try {
    const doc = new Cliente(req.body);
    await doc.save();
    await doc.populate('identificacions');

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err || 'Server error' });
  }
});

router.get('/', async (_req, res) => {
  try {
    const docs = await Cliente.find().populate('identificacions');
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await Cliente.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('identificacions');
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await Cliente.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
