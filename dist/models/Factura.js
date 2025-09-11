"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    empresa_emisora_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Empresa', required: true },
    cliente_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    fecha_emision: { type: Date, required: true },
    clave_acceso: { type: String, required: true },
    secuencial: { type: String, required: true },
    estado: { type: String, required: true },
    total_sin_impuestos: { type: Number, required: true },
    total_iva: { type: Number, required: true },
    total_con_impuestos: { type: Number, required: true },
    xml: { type: String },
    xml_firmado: { type: String },
    ride_pdf: { type: Buffer },
    autorizacion_numero: { type: String },
    fecha_autorizacion: { type: Date },
    sri_estado: { type: String },
    sri_mensajes: { type: mongoose_1.Schema.Types.Mixed },
    sri_fecha_envio: { type: Date },
    sri_fecha_respuesta: { type: Date },
    datos_originales: { type: String },
});
exports.default = (0, mongoose_1.model)('Factura', schema);
