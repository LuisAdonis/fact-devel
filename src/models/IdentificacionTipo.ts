import { Schema, model, Document, Types } from 'mongoose';

export interface IIdentificacionTipo extends Document {
  usuario_id: Types.ObjectId;        // Cajero que abre/cierra
  codigo: string;
  descripcion: string;
}

const schema = new Schema<IIdentificacionTipo>({
  usuario_id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  codigo: { type: String, required: true },
  descripcion: { type: String, required: true },
}, {
  timestamps: true, // Add createdAt and updatedAt
},);

export default model<IIdentificacionTipo>('IdentificacionTipo', schema);
