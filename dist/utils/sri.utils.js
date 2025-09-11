"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enviarComprobanteSRI = enviarComprobanteSRI;
const axios_1 = __importDefault(require("axios"));
const buffer_1 = require("buffer"); // For base64 conversion
const xmldom_1 = require("@xmldom/xmldom");
// WSDL URLs for SRI - now configurable via environment variables
const WSDL_PRUEBAS_RECEPCION = process.env.SRI_RECEPCION_URL_PRUEBAS ||
    'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl';
const WSDL_PRODUCCION_RECEPCION = process.env.SRI_RECEPCION_URL_PRODUCCION ||
    'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl';
/**
 * Get the appropriate WSDL URL based on environment
 */
function getWsdlUrl() {
    const environment = process.env.SRI_ENVIRONMENT || '1';
    return environment === '2' ? WSDL_PRODUCCION_RECEPCION : WSDL_PRUEBAS_RECEPCION;
}
/**
 * Parse XML response from SRI to RespuestaSRI interface
 */
function parseXmlResponse(xmlString) {
    var _a, _b, _c, _d, _e, _f;
    try {
        const parser = new xmldom_1.DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        // Check for SOAP fault first
        const faultElements = xmlDoc.getElementsByTagName('soap:Fault');
        if (faultElements.length > 0) {
            const faultString = ((_a = faultElements[0].getElementsByTagName('faultstring')[0]) === null || _a === void 0 ? void 0 : _a.textContent) || 'Error SOAP desconocido';
            return {
                estado: 'ERROR_SOAP',
                mensajes: {
                    mensaje: {
                        identificador: '001',
                        mensaje: `Error SOAP: ${faultString}`,
                        tipo: 'ERROR',
                    },
                },
            };
        }
        // Look for the response in different possible locations
        let estadoElement = xmlDoc.getElementsByTagName('estado')[0];
        // If not found, try with namespace prefixes
        if (!estadoElement) {
            const responseElements = xmlDoc.getElementsByTagName('RespuestaRecepcionComprobante');
            if (responseElements.length > 0) {
                estadoElement = responseElements[0].getElementsByTagName('estado')[0];
            }
        }
        const estado = estadoElement ? estadoElement.textContent || 'DESCONOCIDO' : 'DESCONOCIDO';
        const respuesta = { estado };
        // Extract mensajes if they exist
        const mensajesElements = xmlDoc.getElementsByTagName('mensaje');
        if (mensajesElements.length > 0) {
            const mensajes = [];
            for (let i = 0; i < mensajesElements.length; i++) {
                const mensajeElement = mensajesElements[i];
                const identificador = ((_b = mensajeElement.getElementsByTagName('identificador')[0]) === null || _b === void 0 ? void 0 : _b.textContent) || '';
                const mensaje = ((_c = mensajeElement.getElementsByTagName('mensaje')[0]) === null || _c === void 0 ? void 0 : _c.textContent) || '';
                const tipo = ((_d = mensajeElement.getElementsByTagName('tipo')[0]) === null || _d === void 0 ? void 0 : _d.textContent) || 'INFO';
                const informacionAdicional = (_e = mensajeElement.getElementsByTagName('informacionAdicional')[0]) === null || _e === void 0 ? void 0 : _e.textContent;
                mensajes.push({
                    identificador,
                    mensaje,
                    tipo,
                    ...(informacionAdicional && { informacionAdicional }),
                });
            }
            if (mensajes.length === 1) {
                respuesta.mensajes = { mensaje: mensajes[0] };
            }
            else if (mensajes.length > 1) {
                respuesta.mensajes = { mensaje: mensajes };
            }
        }
        // Extract comprobantes if they exist
        const comprobantesElements = xmlDoc.getElementsByTagName('comprobante');
        if (comprobantesElements.length > 0) {
            const comprobantes = [];
            for (let i = 0; i < comprobantesElements.length; i++) {
                const comprobanteElement = comprobantesElements[i];
                const claveAcceso = ((_f = comprobanteElement.getElementsByTagName('claveAcceso')[0]) === null || _f === void 0 ? void 0 : _f.textContent) || '';
                comprobantes.push({ claveAcceso });
            }
            respuesta.comprobantes = { comprobante: comprobantes };
        }
        return respuesta;
    }
    catch (error) {
        return {
            estado: 'ERROR_PARSING',
            mensajes: {
                mensaje: {
                    identificador: '001',
                    mensaje: 'Error al procesar respuesta del SRI',
                    tipo: 'ERROR',
                },
            },
        };
    }
}
/**
 * Sends a signed XML receipt to SRI.
 * @param xmlFirmado String of the signed XML.
 * @returns Promise<RespuestaSRI> The parsed response from SRI.
 */
async function enviarComprobanteSRI(xmlFirmado) {
    try {
        const xmlBase64 = buffer_1.Buffer.from(xmlFirmado).toString('base64');
        const soapRequestBody = '<?xml version="1.0" encoding="UTF-8"?>' +
            '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">' +
            '<soap:Header/>' +
            '<soap:Body>' +
            '<ec:validarComprobante>' +
            '<xml>' +
            xmlBase64 +
            '</xml>' +
            '</ec:validarComprobante>' +
            '</soap:Body>' +
            '</soap:Envelope>';
        const possibleActions = ['"http://ec.gob.sri.ws.recepcion/validarComprobante"', '"validarComprobante"', '""'];
        for (const soapAction of possibleActions) {
            try {
                const headers = {
                    'Content-Type': 'text/xml; charset=utf-8',
                };
                if (soapAction && soapAction !== '""') {
                    headers['SOAPAction'] = soapAction;
                }
                const response = await axios_1.default.post(getWsdlUrl(), soapRequestBody, {
                    headers,
                    timeout: 30000,
                });
                if (typeof response.data === 'string') {
                    const result = parseXmlResponse(response.data);
                    if (result.estado !== 'ERROR_SOAP') {
                        return result;
                    }
                }
            }
            catch (error) {
                continue;
            }
        }
        return {
            estado: 'ERROR_COMUNICACION',
            mensajes: {
                mensaje: {
                    identificador: '000',
                    mensaje: 'No se pudo determinar el SOAPAction correcto para el servicio del SRI',
                    tipo: 'ERROR',
                },
            },
        };
    }
    catch (error) {
        return {
            estado: 'ERROR_COMUNICACION',
            mensajes: {
                mensaje: {
                    identificador: '000',
                    mensaje: `Error de comunicación con SRI: ${error.message}`,
                    tipo: 'ERROR',
                },
            },
        };
    }
}
// Helper to remove XML tag prefixes when parsing (if using xml2js)
/*
function stripPrefix(name: string): string {
  return name.substring(name.indexOf(':') + 1);
}
*/
