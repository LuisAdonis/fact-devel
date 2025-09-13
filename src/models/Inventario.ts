import { Schema, model, Document, Types } from 'mongoose';

export interface IInventario extends Document {
  usuario_id: Types.ObjectId;        // Cajero que abre/cierra
  producto_id: Types.ObjectId;
  usuario_update?: string;
  proveedor_id: Types.ObjectId;
  stock_unidades: number;
  stock_caja: number;
  unidades_caja: number;
  lote: string;
  fecha_caducidad: Date;
}

const schema = new Schema<IInventario>({
  producto_id: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  usuario_id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  usuario_update: {
    type: Schema.Types.ObjectId, ref: 'Usuario', default: null,
    set: (v: unknown): Types.ObjectId | null => {
      if (v === "" || v === null || v === undefined) {
        return null;
      }
      return v as Types.ObjectId;
    }
  },
  proveedor_id: { type: Schema.Types.ObjectId, ref: 'Proveedor', required: true },
  stock_unidades: { type: Number, required: true },
  stock_caja: { type: Number, required: true },
  unidades_caja: { type: Number, required: true },
  lote: { type: String, required: true },
  fecha_caducidad: { type: Date, required: true },
}, {
  timestamps: true, // Add createdAt and updatedAt
},);

export default model<IInventario>('Inventario', schema);
