"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    producto_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Producto', required: true },
    proveedor_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Proveedor', required: true },
    stock_unidades: { type: Number, required: true },
    stock_caja: { type: Number, required: true },
    unidades_caja: { type: Number, required: true },
    lote: { type: String, required: true },
    fecha_caducidad: { type: Date, required: true },
});
exports.default = (0, mongoose_1.model)('Inventario', schema);
