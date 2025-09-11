"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Inventario_1 = __importDefault(require("../models/Inventario"));
const router = (0, express_1.Router)();
router.get('/', async (_req, res) => {
    try {
        const docs = await Inventario_1.default.find();
        res.json(docs);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/', async (req, res) => {
    try {
        console.log('agg stock product with data:', req.body);
        const doc = new Inventario_1.default(req.body);
        await doc.save();
        res.status(201).json(doc);
    }
    catch (err) {
        res.status(500).json({ message: err || 'Server error' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const doc = await Inventario_1.default.findById(req.params.id);
        if (!doc)
            return res.status(404).json({ message: 'Not found' });
        res.json(doc);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const doc = await Inventario_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!doc)
            return res.status(404).json({ message: 'Not found' });
        res.json(doc);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
router.put('/update/:id', async (req, res) => {
    try {
        const productoId = req.params.id;
        const cantidad = req.body.cantidad;
        const tipo = req.body.tipov;
        const ahora = new Date();
        const inventarios = await Inventario_1.default.find({
            producto_id: productoId,
            fecha_caducidad: { $gte: ahora },
            $or: [
                { stock_unidades: { $gt: 0 } },
                { stock_caja: { $gt: 0 } }
            ],
        }).sort({ fecha_caducidad: 1 });
        if (inventarios.length === 0) {
            return res.status(404).json({ message: 'No hay stock disponible' });
        }
        let restante = cantidad;
        for (const inv of inventarios) {
            if (restante <= 0)
                break;
            const unidadesPorCaja = inv.unidades_caja;
            if (tipo) {
                if (inv.stock_caja >= restante) {
                    inv.stock_caja -= restante;
                    restante = 0;
                }
                else {
                    restante -= inv.stock_caja;
                    inv.stock_caja = 0;
                }
            }
            else {
                if (inv.stock_unidades >= restante) {
                    inv.stock_unidades -= restante;
                    restante = 0;
                }
                else {
                    restante -= inv.stock_unidades;
                    inv.stock_unidades = 0;
                    while (restante > 0 && inv.stock_caja > 0) {
                        inv.stock_caja -= 1;
                        inv.stock_unidades += unidadesPorCaja;
                        if (inv.stock_unidades >= restante) {
                            inv.stock_unidades -= restante;
                            restante = 0;
                        }
                        else {
                            restante -= inv.stock_unidades;
                            inv.stock_unidades = 0;
                        }
                    }
                }
            }
            await inv.save();
        }
        if (restante > 0) {
            return res.status(400).json({ message: 'No hay suficiente stock para completar la operación' });
        }
        res.json(inventarios);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const doc = await Inventario_1.default.findByIdAndDelete(req.params.id);
        if (!doc)
            return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Deleted' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
