import mongoose, { Schema, Document } from 'mongoose';

export interface IFacturaPDF extends Document {
  factura_id: string;
  claveAcceso: string;
  pdf_path: string;
  pdf_buffer?: Buffer;
  fecha_generacion: Date;
  estado: 'GENERADO' | 'ERROR';
  tamano_archivo: number;
  numero_autorizacion: string;
  fecha_autorizacion: Date;

  // Email sending fields
  email_estado: 'PENDIENTE' | 'ENVIADO' | 'ERROR' | 'NO_ENVIADO';
  email_destinatario?: string;
  email_fecha_envio?: Date;
  email_intentos: number;
  email_ultimo_error?: string;
  email_enviado_por?: string; // ID del usuario que envió
}

const FacturaPDFSchema: Schema = new Schema({
  factura_id: { type: String, required: true, ref: 'Invoice' },
  claveAcceso: { type: String, required: true, unique: true },
  pdf_path: { type: String, required: true },
  pdf_buffer: { type: Buffer },
  fecha_generacion: { type: Date, default: Date.now },
  estado: { type: String, enum: ['GENERADO', 'ERROR'], default: 'GENERADO' },
  tamano_archivo: { type: Number, required: true },
  numero_autorizacion: { type: String, required: true },
  fecha_autorizacion: { type: Date, required: true },

  // Email sending fields
  email_estado: {
    type: String,
    enum: ['PENDIENTE', 'ENVIADO', 'ERROR', 'NO_ENVIADO'],
    required: true,
    default: 'NO_ENVIADO',
  },
  email_destinatario: { type: String },
  email_fecha_envio: { type: Date },
  email_intentos: { type: Number, required: true, default: 0 },
  email_ultimo_error: { type: String },
  email_enviado_por: { type: String },
});

export default mongoose.model<IFacturaPDF>('FacturaPDF', FacturaPDFSchema);
