"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Usuario_1 = __importDefault(require("../models/Usuario"));
const Empresa_1 = __importDefault(require("../models/Empresa"));
const encryption_utils_1 = require("../utils/encryption.utils");
const router = (0, express_1.Router)();
function isValidRUC(ruc) {
    const rucRegex = /^\d{10}001$/;
    return rucRegex.test(ruc);
}
async function isFirstRegistration() {
    const userCount = await Usuario_1.default.countDocuments();
    const companyCount = await Empresa_1.default.countDocuments();
    return userCount === 0 && companyCount === 0;
}
async function validateRegistrationSecurity(req) {
    var _a, _b;
    const { masterKey, invitationCode, ruc } = req.body;
    const isFirst = await isFirstRegistration();
    if (isFirst) {
        const requiredMasterKey = process.env.MASTER_REGISTRATION_KEY;
        if (!requiredMasterKey) {
            return { valid: false, error: 'Sistema no configurado para registro inicial' };
        }
        if (masterKey !== requiredMasterKey) {
            return { valid: false, error: 'Clave maestra requerida para el primer registro' };
        }
    }
    else {
        const allowedRUCs = ((_a = process.env.ALLOWED_RUCS) === null || _a === void 0 ? void 0 : _a.split(',').map((r) => r.trim())) || [];
        const validInvitationCodes = ((_b = process.env.INVITATION_CODES) === null || _b === void 0 ? void 0 : _b.split(',').map((c) => c.trim())) || [];
        if (process.env.DISABLE_REGISTRATION === 'true') {
            return { valid: false, error: 'Registro deshabilitado por el administrador' };
        }
        if (invitationCode && validInvitationCodes.includes(invitationCode)) {
            return { valid: true };
        }
        if (ruc && allowedRUCs.includes(ruc)) {
            return { valid: true };
        }
        if (!invitationCode && allowedRUCs.length === 0) {
            return { valid: false, error: 'Código de invitación requerido' };
        }
        return { valid: false, error: 'Código de invitación inválido o RUC no autorizado' };
    }
    return { valid: true };
}
router.post('/register', async (req, res) => {
    const { correo, contrasena, 
    // Company data
    ruc, razon_social, nombre_comercial, direccion, telefono, email: company_email, codigo_establecimiento, punto_emision, tipo_ambiente, tipo_emision, certificate, certificatePassword, certificatePath, 
    // Security
    masterKey, invitationCode, } = req.body;
    // Validate required fields
    if (!correo || !contrasena) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }
    if (!ruc || !razon_social) {
        return res.status(400).json({ message: 'RUC y razón social son requeridos' });
    }
    // Validate RUC format
    if (!isValidRUC(ruc)) {
        return res.status(400).json({ message: 'Formato de RUC inválido. Debe tener 13 dígitos y terminar en 001' });
    }
    try {
        // Validate security requirements
        const securityCheck = await validateRegistrationSecurity(req);
        if (!securityCheck.valid) {
            return res.status(403).json({ message: securityCheck.error });
        }
        // Check if user already exists
        const existingUser = await Usuario_1.default.findOne({ correo });
        if (existingUser) {
            return res.status(409).json({ message: 'Usuario ya existe' });
        }
        // Check if company already exists
        const existingCompany = await Empresa_1.default.findOne({ ruc });
        if (existingCompany) {
            return res.status(409).json({ message: 'Empresa con este RUC ya está registrada' });
        }
        // Process certificate
        let certBase64 = certificate;
        if (certificatePath) {
            const fs = require('fs');
            certBase64 = fs.readFileSync(certificatePath).toString('base64');
        }
        // Encrypt certificate password
        const encryptedPass = certificatePassword ? (0, encryption_utils_1.encrypt)(certificatePassword) : undefined;
        // Create user
        const hashedPassword = await bcryptjs_1.default.hash(contrasena, 10);
        const user = new Usuario_1.default({ correo, contrasena: hashedPassword });
        await user.save();
        // Create company
        const company = new Empresa_1.default({
            ruc,
            razon_social,
            nombre_comercial: nombre_comercial || razon_social,
            direccion,
            telefono,
            email: company_email || correo,
            codigo_establecimiento: codigo_establecimiento || '001',
            punto_emision: punto_emision || '001',
            tipo_ambiente: tipo_ambiente || 1, // Default to test environment
            tipo_emision: tipo_emision || 1, // Default to normal emission
            certificate: certBase64,
            certificate_password: encryptedPass,
            user_id: user._id, // Link company to user
        });
        await company.save();
        // Generate token
        const token = jsonwebtoken_1.default.sign({ userId: user._id, companyId: company._id }, process.env.JWT_SECRET || '', {
            expiresIn: '4d',
        });
        return res.status(201).json({
            message: 'Usuario y empresa creados exitosamente',
            token,
            user: {
                id: user._id,
                email: user.correo,
            },
            company: {
                id: company._id,
                ruc: company.ruc,
                razon_social: company.razon_social,
                nombre_comercial: company.nombre_comercial,
            },
        });
    }
    catch (err) {
        console.error('Error en registro:', err);
        return res.status(500).json({ message: 'Error del servidor' });
    }
});
router.post('/auth', async (req, res) => {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) {
        return res.status(400).json({ message: 'Email y contraseña requeridos' });
    }
    try {
        const user = await Usuario_1.default.findOne({ correo });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        const match = await bcryptjs_1.default.compare(contrasena, user.contrasena);
        if (!match) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        // Find associated company
        const company = await Empresa_1.default.findOne({ user_id: user._id });
        const token = jsonwebtoken_1.default.sign({
            userId: user._id,
            companyId: company === null || company === void 0 ? void 0 : company._id,
        }, process.env.JWT_SECRET || '', {
            expiresIn: '4d',
        });
        return res.json({
            token,
            user: {
                id: user._id,
                email: user.correo,
            },
            company: company
                ? {
                    id: company._id,
                    ruc: company.ruc,
                    razon_social: company.razon_social,
                    nombre_comercial: company.nombre_comercial,
                }
                : null,
        });
    }
    catch (err) {
        console.error('Error en autenticación:', err);
        return res.status(500).json({ message: 'Error del servidor' });
    }
});
// Endpoint to check system status
router.get('/status', async (req, res) => {
    try {
        const isFirst = await isFirstRegistration();
        const registrationDisabled = process.env.DISABLE_REGISTRATION === 'true';
        return res.json({
            firstRegistration: isFirst,
            registrationDisabled,
            requiresInvitation: !isFirst && !registrationDisabled,
            masterKeyRequired: isFirst,
        });
    }
    catch (err) {
        return res.status(500).json({ message: 'Error del servidor' });
    }
});
exports.default = router;
