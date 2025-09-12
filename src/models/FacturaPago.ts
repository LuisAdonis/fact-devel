import { Schema, model, Document, Types } from 'mongoose';

export interface IFacturaPago extends Document {
  factura_id: Types.ObjectId;
  caja_id: Types.ObjectId;            // Caja asociada
  metodo_pago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'MIXTO';
  monto: number;
}

const FacturaPagoSchema = new Schema<IFacturaPago>({
  factura_id: { type: Schema.Types.ObjectId, ref: 'Factura', required: true },
  caja_id: { type: Schema.Types.ObjectId, ref: 'Caja', required: true },
  metodo_pago: { type: String, enum: ['EFECTIVO','TARJETA','TRANSFERENCIA','MIXTO'], required: true },
  monto: { type: Number, required: true },
}, {
  timestamps: true
});

export default model<IFacturaPago>('FacturaPago', FacturaPagoSchema);
