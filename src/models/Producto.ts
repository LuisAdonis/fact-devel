import { Schema, model, Document } from 'mongoose';

export interface IProducto extends Document {
  codigo: string;
  descripcion: string;
  nombre: string;

  nombre_comercial?: string;
  presentacion?: string;
  laboratorio?: string;
  categoria?: string;
  estado?: string;
  controlado?: string;
  codigo_barra?: string;
  registro_sanitario?: string;
  ubicacion?: string;
  tipo_medicamento: string;

  precio_unitario: number;
  precio_caja: number;
  tiene_iva: boolean;
  imagen: string;
  descripcion_adicional?: string;
}

const schema = new Schema<IProducto>({
  codigo: { type: String, required: true },
  descripcion: { type: String, required: true },
  nombre: { type: String, required: true },
  precio_unitario: { type: Number, required: true },
  precio_caja: { type: Number, required: true },
  tiene_iva: { type: Boolean, required: true },
  imagen: { type: String },
  descripcion_adicional: { type: String },

  nombre_comercial: { type: String },
  presentacion: { type: String },
  laboratorio: { type: String },
  categoria: { type: String },
  estado: { type: String },
  controlado: { type: String },
  codigo_barra: { type: String },
  registro_sanitario: { type: String },
  ubicacion: { type: String },
  tipo_medicamento: { type: String },

}, {
  toJSON: { virtuals: true },   // 👈 importante
  toObject: { virtuals: true }
});
schema.virtual('inventarios', {
  ref: 'Inventario',
  localField: '_id',
  foreignField: 'producto_id'
});
export default model<IProducto>('Producto', schema);
