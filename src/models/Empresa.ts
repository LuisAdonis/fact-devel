import { Schema, model, Document, Types } from 'mongoose';
export interface IEmpresa extends Document {
  logo:string;
  ruc: string;
  razon_social: string;
  nombre_comercial: string;
  direccion?: string;
  direccion_matriz?: string;
  direccion_establecimiento?: string;
  telefono?: string;
  email?: string;
  codigo_establecimiento: string;
  punto_emision: string;
  tipo_ambiente: number;
  tipo_emision: number;
  obligado_contabilidad?: boolean;
  contribuyente_especial?: boolean;
  agente_de_retencion?:boolean;
  email_notificacion?: string;
  certificate?: string;
  certificate_password?: string;
  user_id: Types.ObjectId; // Reference to User
}

const schema = new Schema<IEmpresa>(
  {
    ruc: { type: String, required: true, unique: true },
    razon_social: { type: String, required: true },
    logo: { type: String, required: true ,default:'sinlogo'},
    nombre_comercial: { type: String, required: true },
    direccion: { type: String },
    direccion_matriz: { type: String },
    direccion_establecimiento: { type: String },
    telefono: { type: String },
    email: { type: String },
    codigo_establecimiento: { type: String, required: true, default: '001' },
    punto_emision: { type: String, required: true, default: '001' },
    tipo_ambiente: { type: Number, required: true, default: 1 }, // 1 = Pruebas, 2 = Producción
    tipo_emision: { type: Number, required: true, default: 1 }, // 1 = Normal
    obligado_contabilidad: { type: Boolean, default: false },
    agente_de_retencion: { type: Boolean, default: false },
    contribuyente_especial: {  type: Boolean, default: false  },
    email_notificacion: { type: String },
    certificate: { type: String },
    certificate_password: { type: String },
    user_id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  },
  {
    timestamps: true, // Add createdAt and updatedAt
  },
);


// schema.index({ ruc: 1 });
// schema.index({ user_id: 1 });

export default model<IEmpresa>('Empresa', schema);
