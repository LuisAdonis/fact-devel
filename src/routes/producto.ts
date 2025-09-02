import { Router } from 'express';
import Producto from '../models/Producto';
import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: 'uploads/Productos',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, "productos-"+uniqueSuffix + ext);
  }
});


const checkFileField = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers['content-type']?.includes('multipart/form-data')) {
    return res.status(400).json({ error: 'Se requiere multipart/form-data con un archivo en "file"' });
  }
  next();
};

const upload = multer({ storage });


const router = Router();

router.post('/', async (req, res) => {
  try {
    console.log('Creating product with data:', req.body);
    const doc = new Producto(req.body);
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    res.json({ message: err });
  }
});

router.get('/', async (_req, res) => {
  try {
    const docs = await Producto.find().populate('inventarios');
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err});
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await Producto.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.post('/foto', checkFileField, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se envió ningún archivo' });
  }
      const oldUrl = req.body.url;

   if (oldUrl) {
      const oldPath = path.join('uploads/Productos', path.basename(oldUrl));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

  const relativePath = `/uploads/${req.file!.filename}`;
  const fileUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
  return res.json({ message: 'Upload success', 'url': fileUrl ,'d':req.body.url});
});

router.put('/:id', async (req, res) => {
  try {
    
    const doc = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await Producto.findByIdAndDelete(req.params.id);
     
    if (!doc) return res.status(404).json({ message: 'Not found' });
    
    const oldPath = path.join('uploads/Productos', path.basename(doc.imagen));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;