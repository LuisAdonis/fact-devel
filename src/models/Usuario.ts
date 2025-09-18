import { Schema, model, Document, Types } from 'mongoose';

export interface IUsuario extends Document {
  empresa_id: Types.ObjectId;
  usuario_id: Types.ObjectId;
  nombre: string;
  correo: string;
  contrasena: string;
  administrador: boolean;
  permisos: Types.ObjectId;

}

const UsuarioSchema = new Schema<IUsuario>({
  empresa_id: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },
  usuario_id: { type: Schema.Types.ObjectId, ref: 'Empresa', },
  correo: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  contrasena: { type: String, required: true },
  administrador: { type: Boolean, required: true },
  permisos: { type: Schema.Types.ObjectId, ref: 'Permisos', },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
},);

UsuarioSchema.virtual('permiso', {
  ref: 'Permisos',
  localField: '_id',
  foreignField: 'usuario_id',
  justOne: true

});
export default model<IUsuario>('Usuario', UsuarioSchema);
