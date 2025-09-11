"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
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
    estado: { type: Boolean },
    controlado: { type: String },
    codigo_barra: { type: String },
    registro_sanitario: { type: String },
    ubicacion: { type: String },
    tipo_medicamento: { type: String },
}, {
    toJSON: { virtuals: true }, // 👈 importante
    toObject: { virtuals: true }
});
schema.virtual('inventarios', {
    ref: 'Inventario',
    localField: '_id',
    foreignField: 'producto_id'
});
exports.default = (0, mongoose_1.model)('Producto', schema);
