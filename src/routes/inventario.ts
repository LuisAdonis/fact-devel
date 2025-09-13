import { Router } from 'express';
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
    console.log(err);

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
router.put('/update/:id', async (req, res) => {
  try {
    const productoId = req.params.id;
    const cantidad = req.body.cantidad;
    const tipo = req.body.tipov;
    const ahora = new Date();
    const usuarioId = req.body.usuario_id; // según de dónde lo saques


    const inventarios = await Inventario.find({
      producto_id: productoId,
      fecha_caducidad: { $gte: ahora },
      $or: [
        { stock_unidades: { $gt: 0 } },
        { stock_caja: { $gt: 0 } }
      ],
    }).sort({ fecha_caducidad: 1 });


    if (inventarios.length === 0) {
      //aqui
      return res.status(404).json({ message: 'No hay stock disponible' });
    }

    let restante = cantidad;

    for (const inv of inventarios) {
      if (restante <= 0) break;

      const unidadesPorCaja = inv.unidades_caja;

      if (tipo) {
        if (inv.stock_caja >= restante) {
          inv.stock_caja -= restante;
          restante = 0;
        } else {
          restante -= inv.stock_caja;
          inv.stock_caja = 0;
        }
      } else {
        if (inv.stock_unidades >= restante) {
          inv.stock_unidades -= restante;
          restante = 0;
        } else {
          restante -= inv.stock_unidades;
          inv.stock_unidades = 0;

          while (restante > 0 && inv.stock_caja > 0) {
            inv.stock_caja -= 1;
            inv.stock_unidades += unidadesPorCaja;

            if (inv.stock_unidades >= restante) {
              inv.stock_unidades -= restante;
              restante = 0;
            } else {
              restante -= inv.stock_unidades;
              inv.stock_unidades = 0;
            }
          }
        }
      }
      inv.usuario_update = usuarioId;
      await inv.save();
    }

    if (restante > 0) {
      return res.status(201).json({ message: 'No hay suficiente stock para completar la operación' });
    }
    res.json(inventarios);
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