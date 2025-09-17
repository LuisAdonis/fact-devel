import { Schema, model, Document, Types } from 'mongoose';

export interface ICaja extends Document {
  usuario_id: Types.ObjectId;       
  fecha_apertura: Date;
  fecha_cierre?: Date;
  monto_inicial: number;
  monto_contado?: number;       
  monto_efectivo?: number;
  monto_tarjeta?: number;
  monto_transferencia?: number;
  diferencia?: number;               
  estado: boolean;
  observaciones?: string;
}
const CajaSchema = new Schema<ICaja>({
  usuario_id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fecha_apertura: { type: Date, required: true, default: Date.now },
  fecha_cierre: { type: Date },
  monto_inicial: { type: Number, required: true },
  monto_contado: { type: Number },
  monto_efectivo: { type: Number },
  monto_tarjeta: { type: Number },
  monto_transferencia: { type: Number },
  diferencia: { type: Number },
  estado: { type: Boolean, default: true },
  observaciones: { type: String },
}, {
  timestamps: true
});
export default model<ICaja>('Caja', CajaSchema);
