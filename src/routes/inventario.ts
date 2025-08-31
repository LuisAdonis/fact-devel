import { Router }    from 'express';
import Inventario from '../models/Inventario';
const router = Router();
router.get('/', async (_req, res) => {
  try {
    const docs = await Inventario.find();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.post('/', async (req, res) => {
  try {
    console.log('agg stock product with data:', req.body);
    const doc = new Inventario(req.body);
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err || 'Server error' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const doc = await Inventario.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await Inventario.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await Inventario.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;