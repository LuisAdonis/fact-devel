"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Cliente_1 = __importDefault(require("../models/Cliente"));
const router = (0, express_1.Router)();
router.post('/', async (req, res) => {
    try {
        const doc = new Cliente_1.default(req.body);
        await doc.save();
        await doc.populate('identificacions');
        res.status(201).json(doc);
    }
    catch (err) {
        res.status(500).json({ message: err || 'Server error' });
    }
});
router.get('/', async (_req, res) => {
    try {
        const docs = await Cliente_1.default.find().populate('identificacions');
        res.json(docs);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const doc = await Cliente_1.default.findById(req.params.id);
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
        const doc = await Cliente_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('identificacions');
        if (!doc)
            return res.status(404).json({ message: 'Not found' });
        res.json(doc);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const doc = await Cliente_1.default.findByIdAndDelete(req.params.id);
        if (!doc)
            return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Deleted' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
