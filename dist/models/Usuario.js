"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UsuarioSchema = new mongoose_1.Schema({
    correo: { type: String, required: true, unique: true },
    contrasena: { type: String, required: true },
});
exports.default = (0, mongoose_1.model)('Usuario', UsuarioSchema);
