"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    codigo: { type: String, required: true },
    descripcion: { type: String, required: true },
});
exports.default = (0, mongoose_1.model)('IdentificacionTipo', schema);
