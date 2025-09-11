"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Producto_1 = __importDefault(require("../models/Producto"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const storage = multer_1.default.diskStorage({
    destination: 'uploads/Productos',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, "productos-" + uniqueSuffix + ext);
    }
});
const checkFileField = (req, res, next) => {
    var _a;
    if (!((_a = req.headers['content-type']) === null || _a === void 0 ? void 0 : _a.includes('multipart/form-data'))) {
        return res.status(400).json({ error: 'Se requiere multipart/form-data con un archivo en "file"' });
    }
    next();
};
const upload = (0, multer_1.default)({ storage });
const router = (0, express_1.Router)();
router.post('/', async (req, res) => {
    try {
        console.log('Creating product with data:', req.body);
        const doc = new Producto_1.default(req.body);
        await doc.save();
        res.status(201).json(doc);
    }
    catch (err) {
        res.json({ message: err });
    }
});
router.get('/', async (_req, res) => {
    try {
        const docs = await Producto_1.default.find().populate('inventarios');
        res.json(docs);
    }
    catch (err) {
        res.status(500).json({ message: err });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const doc = await Producto_1.default.findById(req.params.id);
        if (!doc)
            return res.status(404).json({ message: 'Not found' });
        res.json(doc);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/foto', checkFileField, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se envió ningún archivo' });
    }
    const oldUrl = req.body.url;
    if (oldUrl) {
        const oldPath = path_1.default.join('uploads/Productos', path_1.default.basename(oldUrl));
        if (fs_1.default.existsSync(oldPath)) {
            fs_1.default.unlinkSync(oldPath);
        }
    }
    const relativePath = `/uploads/${req.file.filename}`;
    const fileUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
    return res.json({ message: 'Upload success', 'url': fileUrl, 'd': req.body.url });
});
router.put('/:id', async (req, res) => {
    try {
        const doc = await Producto_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
        const doc = await Producto_1.default.findByIdAndDelete(req.params.id);
        if (!doc)
            return res.status(404).json({ message: 'Not found' });
        const oldPath = path_1.default.join('uploads/Productos', path_1.default.basename(doc.imagen));
        if (fs_1.default.existsSync(oldPath)) {
            fs_1.default.unlinkSync(oldPath);
        }
        res.json({ message: 'Deleted' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
