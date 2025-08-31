import { Schema, model, Document } from 'mongoose';

export interface IProducto extends Document {
  codigo: string;
  descripcion: string;
  nombre: string;
  precio_unitario: number;
  tiene_iva: boolean;
  imagen: string;
  descripcion_adicional?: string;
}

const schema = new Schema<IProducto>({
  codigo: { type: String, required: true },
  descripcion: { type: String, required: true },
  nombre: { type: String, required: true },
  precio_unitario: { type: Number, required: true },
  tiene_iva: { type: Boolean, required: true },
  imagen:{ type: String},
  descripcion_adicional: { type: String },
});

export default model<IProducto>('Producto', schema);
