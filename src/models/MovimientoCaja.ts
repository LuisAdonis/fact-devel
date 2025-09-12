import { Schema, model, Document, Types } from 'mongoose';

export interface IMovimientoCaja extends Document {
  caja_id: Types.ObjectId;
  usuario_id: Types.ObjectId;
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string;
  monto: number;
  fecha: Date;
}

const MovimientoCajaSchema = new Schema<IMovimientoCaja>({
  caja_id: { type: Schema.Types.ObjectId, ref: 'Caja', required: true },
  usuario_id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  tipo: { type: String, enum: ['INGRESO','EGRESO'], required: true },
  concepto: { type: String, required: true },
  monto: { type: Number, required: true },
  fecha: { type: Date, default: Date.now },
}, {
  timestamps: true
});

export default model<IMovimientoCaja>('MovimientoCaja', MovimientoCajaSchema);
