import { Router } from 'express';
import Usuario from '../models/Usuario';
import bcrypt from 'bcryptjs';

const router = Router();

// Crear usuario
router.post('/', async (req, res) => {
  try {
    const {
      correo,
      contrasena,
      nombre,
      empresa_id,
    } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }
    const existingUser = await Usuario.findOne({ correo });
    if (existingUser) {
      return res.status(409).json({ message: 'Usuario ya existe' });
    }
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const user = new Usuario({ nombre: nombre, correo: correo, contrasena: hashedPassword, administrador: false, empresa_id: empresa_id });
    await user.save();
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Listar todos los usuarios
router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuario.find({ administrador: { $ne: 1 } }).select('-__v');
    res.json(usuarios);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (!("contrasena" in data)) {
      delete data.contrasena;
    }
    if (data.contrasena) {
      // Si viene en el body y tiene valor, encriptamos
      const hashedPassword = await bcrypt.hash(data.contrasena, 10);
      data.contrasena = hashedPassword;
    } else {
      // Si no viene o viene vacío/null/undefined, no la actualizamos
      delete data.contrasena;
    }
    const usuario = await Usuario.findByIdAndUpdate(req.params.id, data, { new: true },).select('-contrasena');

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar usuario
router.delete('/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndDelete(req.params.id).select('-contrasena');;
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario eliminado', usuario });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
