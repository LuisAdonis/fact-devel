"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const FacturaPDFSchema = new mongoose_1.Schema({
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
exports.default = mongoose_1.default.model('FacturaPDF', FacturaPDFSchema);
