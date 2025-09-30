import fs from 'fs';
import os from 'os';
import path from 'path';
import forge from 'node-forge';
import { DOMParser } from '@xmldom/xmldom';
import { SignedXml } from 'xml-crypto';
import { FacturaService } from './services/factura.service';

interface KeyInfoProvider {
    getKeyInfo(): string;
}

/**
 * Firma un XML usando un archivo .p12 (PKCS#12) en base64
 * @param xmlString XML a firmar
 * @param p12Base64 Contenido del .p12 en Base64
 * @param password Contraseña del .p12
 * @returns XML firmado con X509Certificate incluido
 */


export async function firmarXMLConP12(xmlString: string, p12Base64: string, password: string): Promise<string> {
    try {

        // const certBuffer = Buffer.from(p12Base64, 'base64');
        // const tempDir = os.tmpdir();

        // const p12Path = path.join(tempDir, `cert-${Date.now()}.p12`);
        // if (!fs.existsSync(tempDir)) {
        //     fs.mkdirSync(tempDir, { recursive: true });
        // }

        // fs.writeFileSync(p12Path, certBuffer);

        const pemPath = await FacturaService.convertP12ToPem("E:\\Proyectos\\fact-devel\\certificado.p12", "develp");
        const pemData = fs.readFileSync(pemPath, 'utf8');

        // Extraer certificado
        const certMatch = pemData.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/);
        if (!certMatch) {
            throw new Error('No se pudo encontrar el certificado en el archivo PEM');
        }

        const certPem = certMatch[0];
        const certBase64Clean = certPem
            .replace(/-----BEGIN CERTIFICATE-----/g, '')
            .replace(/-----END CERTIFICATE-----/g, '')
            .replace(/\s+/g, '')
            .trim();

        console.log('Certificado extraído, longitud:', certBase64Clean.length);

        // Validar certificado
        try {
            forge.pki.certificateFromPem(certPem);
            console.log('✅ Certificado válido');
        } catch (e) {
            throw new Error('Error al validar certificado: ' + (e as Error).message);
        }

        // Extraer clave privada
        let privateKeyPem = '';

        const rsaKeyMatch = pemData.match(/-----BEGIN RSA PRIVATE KEY-----[\s\S]+?-----END RSA PRIVATE KEY-----/);
        const keyMatch = pemData.match(/-----BEGIN PRIVATE KEY-----[\s\S]+?-----END PRIVATE KEY-----/);

        if (rsaKeyMatch) {
            privateKeyPem = rsaKeyMatch[0];
        } else if (keyMatch) {
            privateKeyPem = keyMatch[0];
        } else {
            throw new Error('No se encontró la clave privada en el archivo PEM');
        }

        console.log('✅ Clave privada extraída');

        // Crear SignedXml
        const sig = new SignedXml({
            privateKey: privateKeyPem,
            signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
            canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
        }) as any;

        // Agregar referencia
        sig.addReference({
            xpath: "//*[@id='comprobante']",
            transforms: ['http://www.w3.org/2000/09/xmldsig#enveloped-signature'],
            digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
            uri: '#comprobante',
            isEmptyUri: false
        });

        // FORMA ALTERNATIVA: Crear el KeyInfo manualmente
        const keyInfoProvider = {
            getKeyInfo: (key?: any, prefix?: string): string => {
                const keyInfo = `<X509Data><X509Certificate>${certBase64Clean}</X509Certificate></X509Data>`;
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
            const keyInfoXml = `<KeyInfo><X509Data><X509Certificate>${certBase64Clean}</X509Certificate></X509Data></KeyInfo>`;
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
        console.error('❌ Error al firmar XML:', error.message);
        throw error;
    }
}
