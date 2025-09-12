import { Schema, model, Document ,Types} from 'mongoose';

export interface IUsuario extends Document {
  empresa_id: Types.ObjectId;
  nombre: string;
  correo: string;
  contrasena: string;
  administrador: boolean;
}

const UsuarioSchema = new Schema<IUsuario>({
  empresa_id: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },
  correo: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  contrasena: { type: String, required: true },
  administrador: { type: Boolean, default: false },
});

export default model<IUsuario>('Usuario', UsuarioSchema);
