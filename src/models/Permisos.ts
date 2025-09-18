import { Schema, model, Document, Types } from 'mongoose';

export interface IPermisos extends Document {
    usuario_id: Types.ObjectId;
    caja: boolean;
    cliente: boolean;
    venta: boolean;
    factura: boolean;
    producto: boolean;
    usuario: boolean;
    reporte: boolean;
    pdf: boolean;
    config: boolean;
    identi: boolean;
}
const schema = new Schema<IPermisos>({
    usuario_id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  caja: { type: Boolean, default: false },
    cliente: { type: Boolean, default: false },
    venta: { type: Boolean, default: false },
    factura: { type: Boolean, default: false },
    producto: { type: Boolean, default: false },
    usuario: { type: Boolean, default: false },
    reporte: { type: Boolean, default: false },
    pdf: { type: Boolean, default: false },
    config: { type: Boolean, default: false },
    identi: { type: Boolean, default: false },
});


export default model<IPermisos>('Permisos', schema);
