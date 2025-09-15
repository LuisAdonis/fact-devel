import { Schema, model, Document, Types } from 'mongoose';

export interface ICierreCaja extends Document {
  caja_id: Types.ObjectId;
  usuario_id: Types.ObjectId;
  fecha_cierre: Date;
  fecha_apertura: Date;
  totales: {
    efectivo: number;
    tarjeta: number;
    transferencia: number;
    ingresos_extra: number;
    egresos_extra: number;
    total_esperado: number;
    monto_contado: number;
    diferencia: number;
  };
  facturas: Array<{
    numero: string;
    cliente: string;
    total: number;
    metodo_pago: string;
    productos: Array<{
      nombre: string;
      cantidad: number;
      subtotal: number;
      iva: number;
    }>;
  }>;
  movimientos_extra: Array<{
    tipo: 'INGRESO' | 'EGRESO';
    concepto: string;
    monto: number;
  }>;
  observaciones?: string;
}

const schema = new Schema<ICierreCaja>({
  caja_id: { type: Schema.Types.ObjectId, ref: 'Caja', required: true },
  usuario_id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fecha_cierre: { type: Date, default: Date.now },
  fecha_apertura: { type: Date, default: Date.now },
  totales: {
    efectivo: { type: Number, default: 0 },
    tarjeta: { type: Number, default: 0 },
    transferencia: { type: Number, default: 0 },
    ingresos_extra: { type: Number, default: 0 },
    egresos_extra: { type: Number, default: 0 },
    total_esperado: { type: Number, default: 0 },
    monto_contado: { type: Number, default: 0 },
    diferencia: { type: Number, default: 0 }
  },
  facturas: [
    {
      numero: String,
      cliente: String,
      total: Number,
      metodo_pago: String,
      productos: [
        {
          nombre: String,
          cantidad: Number,
          subtotal: Number,
          iva: Number
        }
      ]
    }
  ],
  movimientos_extra: [
    {
      tipo: { type: String, enum: ['INGRESO', 'EGRESO','INICIO'] },
      concepto: String,
      monto: Number
    }
  ],
  observaciones: { type: String }
});

export default model<ICierreCaja>('CierreCaja', schema);
