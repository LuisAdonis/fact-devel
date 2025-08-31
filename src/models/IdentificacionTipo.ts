import { Schema, model, Document } from 'mongoose';

export interface IIdentificacionTipo extends Document {
  codigo: string;
  descripcion: string;
}

const schema = new Schema<IIdentificacionTipo>({
  codigo: { type: String, required: true },
  descripcion: { type: String, required: true },
});

export default model<IIdentificacionTipo>('IdentificacionTipo', schema);
