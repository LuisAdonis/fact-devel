"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    factura_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Factura', required: true },
    producto_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Producto', required: true },
    cantidad: { type: Number, required: true },
    precio_unitario: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    valor_iva: { type: Number, required: true },
});
exports.default = (0, mongoose_1.model)('FacturaDetalle', schema);
