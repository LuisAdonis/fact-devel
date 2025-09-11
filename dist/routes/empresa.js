"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Empresa_1 = __importDefault(require("../models/Empresa"));
const fs_1 = __importDefault(require("fs"));
const encryption_utils_1 = require("../utils/encryption.utils");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: 'uploads/Empresa',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, "LogoEmpresa" + uniqueSuffix + ext);
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
// router.get('/', async (_req, res) => {
//   try {
//     const docs = await Empresa.find();
//     res.json(docs);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });
router.post('/foto', checkFileField, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se envió ningún archivo' });
    }
    const relativePath = `/uploads/${req.file.filename}`;
    const fileUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
    return res.json({ message: 'Upload success', 'url': fileUrl });
});
router.get('/:id', async (req, res) => {
    try {
        const doc = await Empresa_1.default.findById(req.params.id);
        if (!doc)
            return res.status(404).json({ message: 'Not found' });
        res.json(doc);
    }
    catch (err) {
        res.status(500).json({ message: err });
    }
});
router.put('/:id', checkFileField, upload.single('file'), async (req, res) => {
    try {
        const { certificatePath, certificate, certificatePassword, certificate_password, ...rest } = req.body;
        let certBase64 = certificate;
        if (certificatePath) {
            certBase64 = fs_1.default.readFileSync(certificatePath).toString('base64');
        }
        // Use certificate_password or certificatePassword, whichever is available
        const passwordToEncrypt = certificate_password || certificatePassword;
        const encryptedPass = passwordToEncrypt ? (0, encryption_utils_1.encrypt)(passwordToEncrypt) : undefined;
        const updateData = { ...rest };
        if (certBase64)
            updateData.certificate = certBase64;
        if (encryptedPass)
            updateData.certificate_password = encryptedPass;
        // if (req.file) {
        //   const relativePath = `/uploads/${req.file!.filename}`;
        //   const fileUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
        //   updateData.logo=fileUrl;
        // }
        const doc = await Empresa_1.default.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!doc)
            return res.status(404).json({ message: 'Not found' });
        res.json(doc);
    }
    catch (err) {
        res.status(500).json({ message: err });
    }
});
// router.delete('/:id', async (req, res) => {
//   try {
//     const doc = await Empresa.findByIdAndDelete(req.params.id);
//     if (!doc) return res.status(404).json({ message: 'Not found' });
//     res.json({ message: 'Deleted' });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });
exports.default = router;
