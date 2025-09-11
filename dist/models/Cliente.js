"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    tipo_identificacion_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'IdentificationType', required: true },
    identificacion: { type: String, required: true },
    razon_social: { type: String, required: true },
    direccion: { type: String },
    email: { type: String },
    telefono: { type: String },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
schema.virtual('identificacions', {
    ref: 'IdentificacionTipo',
    localField: 'tipo_identificacion_id',
    foreignField: '_id',
    justOne: true
});
exports.default = (0, mongoose_1.model)('Cliente', schema);
