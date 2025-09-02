import { Schema, model, Document, Types } from 'mongoose';

export interface IInventario extends Document {
    producto_id: Types.ObjectId;
    proveedor_id: Types.ObjectId;
    stock_actual: number;
    lote: string;
    fecha_caducidad: Date;
}

const schema = new Schema<IInventario>({
    producto_id: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
    proveedor_id: { type: Schema.Types.ObjectId, ref: 'Proveedor', required: true },
    stock_actual: { type: Number, required: true },
    lote: { type: String, required: true },
    fecha_caducidad: { type: Date, required: true },
});

export default model<IInventario>('Inventario', schema);
