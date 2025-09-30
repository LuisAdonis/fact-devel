import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';
import { SignedXml } from 'xml-crypto';
import forge from 'node-forge';

interface KeyInfoProvider {
  getKeyInfo(): string;
}

/**
 * Firma un documento XML usando un certificado PEM
 * @param xmlString String del XML a firmar
 * @param pemPath Ruta al archivo PEM del certificado
 * @param password Contraseña del certificado (opcional para PEM)
 * @returns String del XML firmado
 */
export async function firmarXML(xmlString: string, pemPath: string, password: string): Promise<string> {
  try {
    // Read PEM file
    const pemData = fs.readFileSync(pemPath, 'utf8');

    // Parse the PEM certificate
    const certPart = pemData.split('-----BEGIN CERTIFICATE-----')[1]?.split('-----END CERTIFICATE-----')[0];
    if (!certPart) {
      throw new Error('No se pudo encontrar el certificado en el archivo PEM');
    }

    const certPem = `-----BEGIN CERTIFICATE-----${certPart}-----END CERTIFICATE-----`;

    try {
      const certificate = forge.pki.certificateFromPem(certPem);
    } catch (e) {
      console.error('Error parsing certificate:', e);
      throw new Error('Error al parsear el certificado: ' + (e as Error).message);
    }

    // Extract the private key from the certificate
    let privateKey;
    let privateKeyPem = '';

    // Check RSA PRIVATE KEY format
    if (pemData.includes('-----BEGIN RSA PRIVATE KEY-----')) {
      const rsaKeyPart = pemData.split('-----BEGIN RSA PRIVATE KEY-----')[1]?.split('-----END RSA PRIVATE KEY-----')[0];
      if (rsaKeyPart) {
        privateKeyPem = `-----BEGIN RSA PRIVATE KEY-----${rsaKeyPart}-----END RSA PRIVATE KEY-----`;
        privateKey = privateKeyPem;
      }
    }
    // Check PRIVATE KEY format
    else if (pemData.includes('-----BEGIN PRIVATE KEY-----')) {
      const keyPart = pemData.split('-----BEGIN PRIVATE KEY-----')[1]?.split('-----END PRIVATE KEY-----')[0];
      if (keyPart) {
        privateKeyPem = `-----BEGIN PRIVATE KEY-----${keyPart}-----END PRIVATE KEY-----`;
        privateKey = privateKeyPem;
      }
    }

    if (!privateKeyPem) {
      throw new Error('No se encontró la clave privada en el archivo PEM');
    }

    const sig = new SignedXml({
      privateKey: privateKey,
      signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
      canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    }) as any;

    sig.addReference({
      xpath: "//*[local-name(.)='factura']",
      transforms: ['http://www.w3.org/2000/09/xmldsig#enveloped-signature'],
      digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
    });

    // sig.keyInfoProvider = {
    //   getKeyInfo(): string {
    //     return `<X509Data><X509Certificate>${certPem
    //       .replace('-----BEGIN CERTIFICATE-----', '')
    //       .replace('-----END CERTIFICATE-----', '')
    //       .replace(/\r?\n|\r/g, '')}</X509Certificate></X509Data>`;
    //   },
    // } as KeyInfoProvider;

      const keyInfoProvider = {
            getKeyInfo: (key?: any, prefix?: string): string => {
                const keyInfo = `<X509Data><X509Certificate>${certPart}</X509Certificate></X509Data>`;
                console.log('KeyInfo generado:', keyInfo.substring(0, 100) + '...');
                return keyInfo;
            },
            getKey: (keyInfo?: any): string => {
                return privateKeyPem;
            }
        };

        sig.keyInfoProvider = keyInfoProvider;

 console.log('Computando firma...');

        // Computar firma
        sig.computeSignature(xmlString, {
            location: {
                reference: "//*[local-name(.)='factura']",
                action: 'append'
            },
            prefix: ''
        });

        let signedXml = sig.getSignedXml();

        console.log('Verificando XML firmado...');
        console.log('Contiene <Signature>:', signedXml.includes('<Signature'));
        console.log('Contiene <KeyInfo>:', signedXml.includes('<KeyInfo>'));
        console.log('Contiene <X509Certificate>:', signedXml.includes('<X509Certificate>'));

        // SI NO TIENE KeyInfo, agregarlo manualmente
        if (!signedXml.includes('<KeyInfo>') || !signedXml.includes('<X509Certificate>')) {
            console.log('⚠️  KeyInfo no se agregó automáticamente, insertando manualmente...');

            // Insertar KeyInfo después de SignatureValue
            const keyInfoXml = `<KeyInfo><X509Data><X509Certificate>${certPart}</X509Certificate></X509Data></KeyInfo>`;
            signedXml = signedXml.replace(
                '</SignatureValue>',
                `</SignatureValue>${keyInfoXml}`
            );

            console.log('KeyInfo insertado manualmente');
        }

        // Validación final
        if (!signedXml.includes('<X509Certificate>')) {
            console.error('❌ XML firmado (primeros 500 caracteres):');
            console.error(signedXml.substring(0, 500));
            throw new Error('El certificado no se agregó a la firma');
        }

        console.log('✅ XML firmado correctamente con certificado');
        return signedXml;

  } catch (error: any) {
    console.error('Error signing XML:', error.message);
    throw new Error(`Error al firmar XML: ${error.message}`);
  }
}

/**
 * Guarda un XML firmado en un archivo
 */
export function guardarXMLFirmado(xmlString: string, outputPath: string): void {
  fs.writeFileSync(outputPath, xmlString, { encoding: 'utf8' });
    
  console.log('=== Verificación de archivo PEM ===');
  console.log('Contiene certificado:', xmlString.includes('BEGIN CERTIFICATE'));
  console.log('Contiene clave privada RSA:', xmlString.includes('BEGIN RSA PRIVATE KEY'));
  console.log('Contiene clave privada:', xmlString.includes('BEGIN PRIVATE KEY'));
  console.log('Tamaño del archivo:', xmlString.length, 'bytes');
}
