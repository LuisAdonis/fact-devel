"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firmarXML = firmarXML;
exports.guardarXMLFirmado = guardarXMLFirmado;
const fs_1 = __importDefault(require("fs"));
const xmldom_1 = require("@xmldom/xmldom");
const xml_crypto_1 = require("xml-crypto");
const node_forge_1 = __importDefault(require("node-forge"));
/**
 * Firma un documento XML usando un certificado PEM
 * @param xmlString String del XML a firmar
 * @param pemPath Ruta al archivo PEM del certificado
 * @param password Contraseña del certificado (opcional para PEM)
 * @returns String del XML firmado
 */
async function firmarXML(xmlString, pemPath, password) {
    var _a, _b, _c;
    try {
        // Read PEM file
        const pemData = fs_1.default.readFileSync(pemPath, 'utf8');
        // Parse the PEM certificate
        const certPart = (_a = pemData.split('-----BEGIN CERTIFICATE-----')[1]) === null || _a === void 0 ? void 0 : _a.split('-----END CERTIFICATE-----')[0];
        if (!certPart) {
            throw new Error('No se pudo encontrar el certificado en el archivo PEM');
        }
        const certPem = `-----BEGIN CERTIFICATE-----${certPart}-----END CERTIFICATE-----`;
        try {
            const certificate = node_forge_1.default.pki.certificateFromPem(certPem);
        }
        catch (e) {
            console.error('Error parsing certificate:', e);
            throw new Error('Error al parsear el certificado: ' + e.message);
        }
        // Extract the private key from the certificate
        let privateKey;
        let privateKeyPem = '';
        // Check RSA PRIVATE KEY format
        if (pemData.includes('-----BEGIN RSA PRIVATE KEY-----')) {
            const rsaKeyPart = (_b = pemData.split('-----BEGIN RSA PRIVATE KEY-----')[1]) === null || _b === void 0 ? void 0 : _b.split('-----END RSA PRIVATE KEY-----')[0];
            if (rsaKeyPart) {
                privateKeyPem = `-----BEGIN RSA PRIVATE KEY-----${rsaKeyPart}-----END RSA PRIVATE KEY-----`;
                privateKey = privateKeyPem;
            }
        }
        // Check PRIVATE KEY format
        else if (pemData.includes('-----BEGIN PRIVATE KEY-----')) {
            const keyPart = (_c = pemData.split('-----BEGIN PRIVATE KEY-----')[1]) === null || _c === void 0 ? void 0 : _c.split('-----END PRIVATE KEY-----')[0];
            if (keyPart) {
                privateKeyPem = `-----BEGIN PRIVATE KEY-----${keyPart}-----END PRIVATE KEY-----`;
                privateKey = privateKeyPem;
            }
        }
        if (!privateKeyPem) {
            throw new Error('No se encontró la clave privada en el archivo PEM');
        }
        const sig = new xml_crypto_1.SignedXml({
            privateKey: privateKey,
            signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
            canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
        });
        sig.addReference({
            xpath: "//*[local-name(.)='factura']",
            transforms: ['http://www.w3.org/2000/09/xmldsig#enveloped-signature'],
            digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
        });
        sig.keyInfoProvider = {
            getKeyInfo() {
                return `<X509Data><X509Certificate>${certPem
                    .replace('-----BEGIN CERTIFICATE-----', '')
                    .replace('-----END CERTIFICATE-----', '')
                    .replace(/\r?\n|\r/g, '')}</X509Certificate></X509Data>`;
            },
        };
        // Sign XML
        const doc = new xmldom_1.DOMParser().parseFromString(xmlString, 'text/xml');
        sig.computeSignature(xmlString);
        return sig.getSignedXml();
    }
    catch (error) {
        console.error('Error signing XML:', error.message);
        throw new Error(`Error al firmar XML: ${error.message}`);
    }
}
/**
 * Guarda un XML firmado en un archivo
 */
function guardarXMLFirmado(xmlString, outputPath) {
    fs_1.default.writeFileSync(outputPath, xmlString, { encoding: 'utf8' });
}
