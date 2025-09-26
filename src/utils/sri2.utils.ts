import axios from 'axios';
import { DOMParser } from '@xmldom/xmldom';

export interface RespuestaAutorizacionSRI {
  estado: string; // AUTORIZADO, NO AUTORIZADO, ERROR, etc.
  numeroAutorizacion?: string;
  fechaAutorizacion?: string;
  ambiente?: string;
  mensajes?: {
    mensaje:
      | Array<{
          identificador: string;
          mensaje: string;
          informacionAdicional?: string;
          tipo: string;
        }>
      | {
          identificador: string;
          mensaje: string;
          informacionAdicional?: string;
          tipo: string;
        };
  };
  comprobante?: string; // XML autorizado en CDATA
}

// WSDL URLs para autorización
const WSDL_PRUEBAS_AUTORIZACION =
  process.env.SRI_AUTORIZACION_URL_PRUEBAS ||
  'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl';

const WSDL_PRODUCCION_AUTORIZACION =
  process.env.SRI_AUTORIZACION_URL_PRODUCCION ||
  'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl';

function getWsdlAutorizacionUrl(): string {
  const environment = process.env.SRI_ENVIRONMENT || '1';
  return environment === '2' ? WSDL_PRODUCCION_AUTORIZACION : WSDL_PRUEBAS_AUTORIZACION;
}

function parseAutorizacionResponse(xmlString: string): RespuestaAutorizacionSRI {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const autorizacionElement = xmlDoc.getElementsByTagName('autorizacion')[0];
    if (!autorizacionElement) {
      return {
        estado: 'DESCONOCIDO',
        mensajes: {
          mensaje: {
            identificador: '999',
            mensaje: 'No se encontró nodo <autorizacion> en respuesta',
            tipo: 'ERROR',
          },
        },
      };
    }

    const estado = autorizacionElement.getElementsByTagName('estado')[0]?.textContent || 'DESCONOCIDO';
    const numeroAutorizacion = autorizacionElement.getElementsByTagName('numeroAutorizacion')[0]?.textContent || undefined;
    const fechaAutorizacion = autorizacionElement.getElementsByTagName('fechaAutorizacion')[0]?.textContent || undefined;
    const ambiente = autorizacionElement.getElementsByTagName('ambiente')[0]?.textContent || undefined;
    const comprobante = autorizacionElement.getElementsByTagName('comprobante')[0]?.textContent || undefined;

    // Extraer mensajes
    const mensajesElements = autorizacionElement.getElementsByTagName('mensaje');
    const mensajes = [];
    for (let i = 0; i < mensajesElements.length; i++) {
      const m = mensajesElements[i];
      mensajes.push({
        identificador: m.getElementsByTagName('identificador')[0]?.textContent || '',
        mensaje: m.getElementsByTagName('mensaje')[0]?.textContent || '',
        tipo: m.getElementsByTagName('tipo')[0]?.textContent || 'INFO',
        informacionAdicional: m.getElementsByTagName('informacionAdicional')[0]?.textContent || undefined,
      });
    }

    return {
      estado,
      numeroAutorizacion,
      fechaAutorizacion,
      ambiente,
      comprobante,
      ...(mensajes.length > 0
        ? { mensajes: mensajes.length === 1 ? { mensaje: mensajes[0] } : { mensaje: mensajes } }
        : {}),
    };
  } catch (e) {
    return {
      estado: 'ERROR_PARSING',
      mensajes: {
        mensaje: {
          identificador: '998',
          mensaje: 'Error procesando respuesta XML de autorización',
          tipo: 'ERROR',
        },
      },
    };
  }
}

/**
 * Consulta autorización en SRI por clave de acceso
 */
export async function consultarAutorizacionSRI(claveAcceso: string): Promise<RespuestaAutorizacionSRI> {
  try {
    const soapRequestBody =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">' +
      '<soap:Header/>' +
      '<soap:Body>' +
      '<ec:autorizacionComprobante>' +
      `<claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>` +
      '</ec:autorizacionComprobante>' +
      '</soap:Body>' +
      '</soap:Envelope>';

    const headers: any = {
      'Content-Type': 'text/xml; charset=utf-8',
    };

    const response = await axios.post(getWsdlAutorizacionUrl(), soapRequestBody, {
      headers,
      timeout: 30000,
    });

    if (typeof response.data === 'string') {
      return parseAutorizacionResponse(response.data);
    }

    return {
      estado: 'ERROR_COMUNICACION',
      mensajes: {
        mensaje: {
          identificador: '997',
          mensaje: 'Respuesta inesperada del SRI',
          tipo: 'ERROR',
        },
      },
    };
  } catch (error: any) {
    return {
      estado: 'ERROR_COMUNICACION',
      mensajes: {
        mensaje: {
          identificador: '996',
          mensaje: `Error comunicando con SRI: ${error.message}`,
          tipo: 'ERROR',
        },
      },
    };
  }
}
