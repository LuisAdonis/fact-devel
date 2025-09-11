"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    ruc: { type: String, required: true, unique: true },
    razon_social: { type: String, required: true },
    logo: { type: String, required: true, default: 'sinlogo' },
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
    contribuyente_especial: { type: Boolean, default: false },
    email_notificacion: { type: String },
    certificate: { type: String },
    certificate_password: { type: String },
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Usuario', required: true },
}, {
    timestamps: true, // Add createdAt and updatedAt
});
// schema.index({ ruc: 1 });
// schema.index({ user_id: 1 });
exports.default = (0, mongoose_1.model)('Empresa', schema);
