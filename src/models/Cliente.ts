import { Schema, model, Document, Types } from 'mongoose';

export interface ICliente extends Document {
  tipo_identificacion_id: Types.ObjectId;
  identificacion: string;
  razon_social: string;
  direccion: string;
  email: string;
  telefono: string;
}

const schema = new Schema<ICliente>({
  tipo_identificacion_id: { type: Schema.Types.ObjectId, ref: 'IdentificationType', required: true },
  identificacion: { type: String, required: true },
  razon_social: { type: String, required: true },
  direccion: { type: String },
  email: { type: String },
  telefono: { type: String },
},{
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true }
});

schema.virtual('identificacions', {
  ref: 'IdentificacionTipo',
  localField: 'tipo_identificacion_id',
  foreignField: '_id',
  justOne: true

  
});
export default model<ICliente>('Cliente', schema);
