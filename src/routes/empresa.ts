import { Router } from 'express';
import Empresa from '../models/Empresa';
import fs from 'fs';

import { encrypt } from '../utils/encryption.utils';
import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

const storage = multer.diskStorage({
  destination: 'uploads/Empresa',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, "LogoEmpresa"+uniqueSuffix + ext);
  }
});


const checkFileField = (req: Request, res: Response, next: NextFunction) => {
 if (req.headers['content-type']?.includes('multipart/form-data')) {
    return next();
  }
  if (req.is('application/json')) {
    return next();
  }
  return res.status(400).json({ error: 'Formato de contenido no soportado' });
};

const upload = multer({ storage });


const router = Router();
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
  const relativePath = `/uploads/${req.file!.filename}`;
  const fileUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
  return res.json({ message: 'Upload success', 'url': fileUrl });
});


router.get('/:id', async (req, res) => {
  try {
    const doc = await Empresa.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

router.put('/:id',checkFileField, upload.single('file'), async (req, res) => {
  try {
    const { certificatePath, certificate, certificatePassword, certificate_password, ...rest } = req.body;

    let certBase64 = certificate;
    if (certificatePath) {
      certBase64 = fs.readFileSync(certificatePath).toString('base64');
    }
    // Use certificate_password or certificatePassword, whichever is available
    const passwordToEncrypt = certificate_password || certificatePassword;
    const encryptedPass = passwordToEncrypt ? encrypt(passwordToEncrypt) : undefined;

    const updateData: any = { ...rest };
    if (certBase64) updateData.certificate = certBase64;
    if (encryptedPass) updateData.certificate_password = encryptedPass;
    // if (req.file) {
    //   const relativePath = `/uploads/${req.file!.filename}`;
    //   const fileUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
    //   updateData.logo=fileUrl;
    // }
    const doc = await Empresa.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err:any) {
    if (err.name === 'ValidationError') {
      return res.status(422).json({
        message: 'Error de validación',
        details: err.message,
        errors: err.errors
      });
    }
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
export default router;