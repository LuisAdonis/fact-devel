import { Schema, model, Document } from 'mongoose';

export interface IUsuario extends Document {
  correo: string;
  contrasena: string;
}

const UsuarioSchema = new Schema<IUsuario>({
  correo: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
});

export default model<IUsuario>('Usuario', UsuarioSchema);
