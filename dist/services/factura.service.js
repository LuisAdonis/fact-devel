"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacturaService = void 0;
const invoice_utils_1 = require("../utils/invoice.utils");
const xml_utils_1 = require("../utils/xml.utils");
const firma_utils_1 = require("../utils/firma.utils");
const sri_utils_1 = require("../utils/sri.utils");
const pdf_utils_1 = require("../utils/pdf.utils");
const Factura_1 = __importDefault(require("../models/Factura"));
const FacturaDetalle_1 = __importDefault(require("../models/FacturaDetalle"));
const FacturaPDF_1 = __importDefault(require("../models/FacturaPDF"));
const IdentificacionTipo_1 = __importDefault(require("../models/IdentificacionTipo"));
const Empresa_1 = __importDefault(require("../models/Empresa"));
const Cliente_1 = __importDefault(require("../models/Cliente"));
const Producto_1 = __importDefault(require("../models/Producto"));
const fs_1 = __importDefault(require("fs"));
const encryption_utils_1 = require("../utils/encryption.utils");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const node_forge_1 = __importDefault(require("node-forge"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execPromise = (0, util_1.promisify)(child_process_1.exec);
class FacturaService {
    static validarDatosFactura(invoiceData) {
        return !!(invoiceData.infoTributaria && invoiceData.infoFactura && invoiceData.detalles);
    }
    static async generarSecuencial(rucCompany) {
        const empresa = await Empresa_1.default.findOne({ ruc: rucCompany });
        if (!empresa) {
            throw new Error(`Empresa with RUC ${rucCompany} not found`);
        }
        const ultimaFactura = await Factura_1.default.findOne({
            empresa_emisora_id: empresa._id,
        }).sort({ secuencial: -1 });
        let secuencial = '000000001';
        if (ultimaFactura) {
            const siguiente = parseInt(ultimaFactura.secuencial) + 1;
            secuencial = siguiente.toString().padStart(9, '0');
        }
        return secuencial;
    }
    static async buscarTipoIdentificacion(codigo) {
        const tipoIdent = await IdentificacionTipo_1.default.findOne({ codigo });
        return tipoIdent;
    }
    static async buscarEmpresa(ruc) {
        const empresa = await Empresa_1.default.findOne({ ruc });
        if (!empresa)
            return null;
        let certificatePath;
        let certificatePassword;
        if (empresa.certificate && empresa.certificate_password) {
            try {
                if (!empresa.certificate.trim()) {
                    throw new Error('El certificado está vacío');
                }
                try {
                    const certBuffer = Buffer.from(empresa.certificate, 'base64');
                    const tempDir = os_1.default.tmpdir();
                    const p12Path = path_1.default.join(tempDir, `cert-${Date.now()}.p12`);
                    if (!fs_1.default.existsSync(tempDir)) {
                        fs_1.default.mkdirSync(tempDir, { recursive: true });
                    }
                    fs_1.default.writeFileSync(p12Path, certBuffer);
                    try {
                        if (empresa.certificate_password && empresa.certificate_password.includes(':')) {
                            try {
                                certificatePassword = (0, encryption_utils_1.decrypt)(empresa.certificate_password);
                            }
                            catch (decryptError) {
                                certificatePassword = empresa.certificate_password;
                            }
                        }
                        else {
                            certificatePassword = empresa.certificate_password;
                        }
                        if (!certificatePassword || certificatePassword.trim() === '') {
                            certificatePassword = '';
                        }
                    }
                    catch (passError) {
                        certificatePassword = empresa.certificate_password || '';
                    }
                    certificatePath = p12Path;
                    if (!certificatePath || !fs_1.default.existsSync(certificatePath) || fs_1.default.statSync(certificatePath).size === 0) {
                        throw new Error('El archivo del certificado no existe o está vacío');
                    }
                }
                catch (error) {
                    throw new Error('Error al procesar el certificado PKCS#12: ' +
                        (error instanceof Error ? error.message : 'Error desconocido'));
                }
                if (!certificatePath) {
                    throw new Error('No se pudo generar el archivo del certificado');
                }
            }
            catch (error) {
                throw new Error('Error al procesar el certificado: ' + error.message);
            }
        }
        return {
            ...empresa.toObject(),
            certificatePath,
            certificatePassword,
        };
    }
    static async buscarCliente(identificacion) {
        const cliente = await Cliente_1.default.findOne({ identificacion });
        return cliente;
    }
    static async buscarProducto(codigo) {
        const producto = await Producto_1.default.findOne({ codigo });
        return producto;
    }
    static async buscarProductos(detalles) {
        var _a;
        const productos = [];
        for (const det of detalles) {
            const codigo = (_a = det.detalle) === null || _a === void 0 ? void 0 : _a.codigoPrincipal;
            const producto = await this.buscarProducto(codigo);
            if (!producto) {
                throw new Error(`Product not found: ${codigo}`);
            }
            productos.push(producto);
        }
        return productos;
    }
    static async crearFactura(datos) {
        const factura = new Factura_1.default({
            empresa_emisora_id: datos.empresaId,
            cliente_id: datos.clienteId,
            fecha_emision: datos.fechaEmision,
            clave_acceso: datos.claveAcceso,
            secuencial: datos.secuencial,
            estado: 'CREADA',
            total_sin_impuestos: datos.totalSinImpuestos,
            total_iva: datos.totalIva,
            total_con_impuestos: datos.totalConImpuestos,
        });
        await factura.save();
        return factura;
    }
    static async crearDetallesInvoice(facturaId, detalles, products) {
        const detallesGuardados = [];
        for (let i = 0; i < detalles.length; i++) {
            const det = detalles[i].detalle;
            const prod = products[i];
            const detDoc = new FacturaDetalle_1.default({
                factura_id: facturaId,
                producto_id: prod._id,
                cantidad: parseFloat(det.cantidad),
                precio_unitario: parseFloat(det.precioUnitario),
                subtotal: parseFloat(det.precioTotalSinImpuesto),
                valor_iva: parseFloat(det.impuestos[0].impuesto.valor),
            });
            await detDoc.save();
            detallesGuardados.push(detDoc);
        }
        return detallesGuardados;
    }
    static async procesarFacturaCompleta(datosFactura) {
        if (!this.validarDatosFactura(datosFactura)) {
            throw new Error('Datos de factura inválidos o incompletos');
        }
        const tipoIdent = await this.buscarTipoIdentificacion(datosFactura.infoFactura.tipoIdentificacionComprador);
        if (!tipoIdent) {
            throw new Error('Identification type not found');
        }
        const empresa = await this.buscarEmpresa(datosFactura.infoTributaria.ruc);
        if (!empresa) {
            throw new Error('Empresa emisora no encontrada');
        }
        const cliente = await this.buscarCliente(datosFactura.infoFactura.identificacionComprador);
        if (!cliente) {
            throw new Error('Client not found');
        }
        const productos = await this.buscarProductos(datosFactura.detalles);
        const secuencial = await this.generarSecuencial(empresa.ruc);
        const fechaEmision = (0, invoice_utils_1.convertirFecha)(datosFactura.infoFactura.fechaEmision);
        if (isNaN(fechaEmision.getTime())) {
            throw new Error('Invalid date format');
        }
        return {
            empresa,
            cliente,
            productos,
            secuencial,
            fechaEmision,
        };
    }
    static async crearFacturaCompleta(datosFactura) {
        const { empresa, cliente, productos, secuencial, fechaEmision } = await this.procesarFacturaCompleta(datosFactura);
        const serie = `${empresa.codigo_establecimiento}${empresa.punto_emision}`;
        const claveAcceso = (0, invoice_utils_1.generarClaveAcceso)({
            fecha: fechaEmision,
            tipoComprobante: '01',
            ruc: empresa.ruc,
            ambiente: empresa.tipo_ambiente.toString(),
            serie,
            secuencial,
            codigoNumerico: Math.floor(10000000 + Math.random() * 89999999).toString(),
            tipoEmision: empresa.tipo_emision.toString(),
        });
        const totalSinImpuestos = parseFloat(datosFactura.infoFactura.totalSinImpuestos);
        const totalIva = datosFactura.detalles.reduce((s, d) => s + parseFloat(d.detalle.impuestos[0].impuesto.valor), 0);
        const totalConImpuestos = parseFloat(datosFactura.infoFactura.importeTotal);
        const xml = (0, xml_utils_1.generarXMLFactura)(datosFactura, empresa, cliente, productos, claveAcceso, secuencial);
        const facturaCreada = await this.crearFactura({
            empresaId: empresa._id,
            clienteId: cliente._id,
            fechaEmision,
            claveAcceso,
            secuencial,
            totalSinImpuestos,
            totalIva,
            totalConImpuestos,
        });
        facturaCreada.xml = xml;
        facturaCreada.sri_estado = 'PENDIENTE';
        facturaCreada.datos_originales = JSON.stringify(datosFactura);
        await facturaCreada.save();
        this.procesarEnvioSRI(facturaCreada, empresa, cliente, productos, datosFactura).catch((error) => {
            console.error('Error in asynchronous SRI sending process:', error);
        });
        const detallesGuardados = await this.crearDetallesInvoice(facturaCreada._id, datosFactura.detalles, productos);
        return {
            factura: facturaCreada,
            detalles: detallesGuardados,
            xml: facturaCreada.xml,
            xml_firmado: facturaCreada.xml_firmado || null,
            respuesta_sri: null,
        };
    }
    static async procesarEnvioSRI(factura, empresa, cliente, productos, datosFactura) {
        let respuestaSRI = null;
        try {
            const p12Path = empresa.certificatePath;
            const p12Password = empresa.certificatePassword || '';
            if (p12Path && fs_1.default.existsSync(p12Path)) {
                try {
                    const diagnosis = await FacturaService.diagnoseP12Certificate(p12Path, p12Password);
                    if (!diagnosis.fileExists) {
                        throw new Error('El archivo del certificado P12 no existe');
                    }
                    if (diagnosis.fileSize === 0) {
                        throw new Error('El archivo del certificado P12 está vacío');
                    }
                    if (!diagnosis.isValidP12) {
                        throw new Error(`El archivo P12 no es válido: ${diagnosis.error}`);
                    }
                    const passwordVerification = await FacturaService.verifyP12Password(p12Path, p12Password);
                    let workingPassword = p12Password;
                    if (!passwordVerification.valid) {
                        const passwordSearch = await FacturaService.findWorkingP12Password(p12Path, p12Password);
                        if (passwordSearch.password !== null) {
                            workingPassword = passwordSearch.password;
                        }
                        else {
                            throw new Error(`Error de contraseña del certificado P12: ${passwordVerification.error}. Se probaron múltiples contraseñas sin éxito. Verifique que la contraseña del certificado sea correcta.`);
                        }
                    }
                    const pemPath = await FacturaService.convertP12ToPem(p12Path, workingPassword);
                    const xmlFirmado = await (0, firma_utils_1.firmarXML)(factura.xml, pemPath, workingPassword);
                    factura.xml_firmado = xmlFirmado;
                    await factura.save();
                    if (factura.xml_firmado) {
                        factura.sri_fecha_envio = new Date();
                        await factura.save();
                        respuestaSRI = await (0, sri_utils_1.enviarComprobanteSRI)(factura.xml_firmado);
                        factura.sri_fecha_respuesta = new Date();
                        factura.sri_estado = respuestaSRI.estado;
                        if (respuestaSRI.mensajes) {
                            factura.sri_mensajes = respuestaSRI.mensajes;
                        }
                        await factura.save();
                        if (respuestaSRI.estado === 'RECIBIDA') {
                            console.log(`✅ FACTURA RECIBIDA POR SRI - ID: ${factura._id}, Clave: ${factura.clave_acceso}, Secuencial: ${factura.secuencial}`);
                            await this.generarPDFFactura(factura, empresa, cliente, productos, datosFactura);
                        }
                        else {
                            console.log(`⚠️ SRI Estado: ${respuestaSRI.estado} - Factura ID: ${factura._id}`);
                        }
                    }
                }
                catch (error) {
                    console.error('Error during certificate conversion or signing:', error.message);
                    factura.sri_estado = 'ERROR_FIRMA';
                    factura.sri_mensajes = { error: error.message };
                    await factura.save();
                }
            }
            else {
                factura.sri_estado = 'ERROR_FIRMA';
                factura.sri_mensajes = { mensaje: 'Certificate not found for signing' };
                await factura.save();
            }
        }
        catch (error) {
            console.error('Error during signing or sending to SRI:', error.message);
            factura.sri_estado = 'ERROR_PROCESO';
            factura.sri_mensajes = { error: error.message };
            await factura.save();
        }
    }
    static async verifyP12Password(p12Path, password) {
        try {
            const p12Buffer = fs_1.default.readFileSync(p12Path);
            const p12Base64 = p12Buffer.toString('base64');
            const p12Der = node_forge_1.default.util.decode64(p12Base64);
            const p12Asn1 = node_forge_1.default.asn1.fromDer(p12Der);
            try {
                const p12 = node_forge_1.default.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
                return { valid: true };
            }
            catch (error) {
                return { valid: false, error: error.message };
            }
        }
        catch (error) {
            return { valid: false, error: error.message };
        }
    }
    /**
     * Convierte un archivo P12 a formato PEM usando node-forge
     * @param p12Path Ruta al archivo P12
     * @param password Contraseña del certificado
     * @returns Promesa con la ruta al archivo PEM generado
     */
    static async convertP12ToPem(p12Path, password) {
        var _a, _b;
        try {
            const p12Buffer = fs_1.default.readFileSync(p12Path);
            const p12Base64 = p12Buffer.toString('base64');
            const p12Der = node_forge_1.default.util.decode64(p12Base64);
            const p12Asn1 = node_forge_1.default.asn1.fromDer(p12Der);
            let p12;
            try {
                p12 = node_forge_1.default.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
            }
            catch (pkcs12Error) {
                if (password && password.length > 0) {
                    try {
                        p12 = node_forge_1.default.pkcs12.pkcs12FromAsn1(p12Asn1, false, '');
                    }
                    catch (emptyPassError) {
                        try {
                            p12 = node_forge_1.default.pkcs12.pkcs12FromAsn1(p12Asn1, false, null);
                        }
                        catch (nullPassError) {
                            throw new Error(`Error de contraseña del certificado P12. Verifique que la contraseña sea correcta. Error original: ${pkcs12Error.message}`);
                        }
                    }
                }
                else {
                    throw new Error(`Error de contraseña del certificado P12. La contraseña proporcionada no es válida. Error: ${pkcs12Error.message}`);
                }
            }
            const bags = p12.getBags({ bagType: node_forge_1.default.pki.oids.certBag });
            const certBags = bags[node_forge_1.default.pki.oids.certBag] || [];
            const keyBags = p12.getBags({ bagType: node_forge_1.default.pki.oids.pkcs8ShroudedKeyBag });
            const keyBag = ((_a = keyBags[node_forge_1.default.pki.oids.pkcs8ShroudedKeyBag]) === null || _a === void 0 ? void 0 : _a[0]) ||
                ((_b = p12.getBags({ bagType: node_forge_1.default.pki.oids.keyBag })[node_forge_1.default.pki.oids.keyBag]) === null || _b === void 0 ? void 0 : _b[0]);
            if (!certBags.length || !keyBag) {
                throw new Error('Certificado o clave privada no encontrados en el archivo P12. El archivo puede estar corrupto o tener un formato incorrecto.');
            }
            const certBag = certBags[0];
            const privateKey = keyBag.key;
            const certificate = certBag.cert;
            if (!privateKey || !certificate) {
                throw new Error('No se pudo extraer el certificado o la clave privada del archivo P12');
            }
            const pemCertificate = node_forge_1.default.pki.certificateToPem(certificate);
            const pemPrivateKey = node_forge_1.default.pki.privateKeyToPem(privateKey);
            const tempDir = os_1.default.tmpdir();
            const certPath = path_1.default.join(tempDir, `cert-${Date.now()}.pem`);
            const keyPath = path_1.default.join(tempDir, `key-${Date.now()}.pem`);
            fs_1.default.writeFileSync(certPath, pemCertificate);
            fs_1.default.writeFileSync(keyPath, pemPrivateKey);
            const certContent = fs_1.default.readFileSync(certPath, 'utf8');
            const keyContent = fs_1.default.readFileSync(keyPath, 'utf8');
            const combinedPemPath = path_1.default.join(tempDir, `combined-${Date.now()}.pem`);
            const formattedCert = certContent.trim();
            const formattedKey = keyContent.trim();
            const combinedContent = `${formattedKey}\n\n${formattedCert}`;
            fs_1.default.writeFileSync(combinedPemPath, combinedContent);
            return combinedPemPath;
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('MAC could not be verified')) {
                    throw new Error(`Error de contraseña del certificado P12: La contraseña proporcionada es incorrecta. Verifique la contraseña del certificado digital.`);
                }
                else if (error.message.includes('Invalid password')) {
                    throw new Error(`Error de contraseña del certificado P12: Contraseña inválida. Verifique que la contraseña del certificado sea correcta.`);
                }
                else if (error.message.includes('PKCS#12')) {
                    throw new Error(`Error en el certificado P12: ${error.message}. Verifique que el archivo del certificado sea válido.`);
                }
            }
            throw new Error(`Error en conversión P12 a PEM: ${error.message}`);
        }
    }
    /**
     * Generates and saves PDF when invoice is approved by SRI
     * @param factura The approved invoice
     * @param empresa The issuing company
     * @param cliente The client
     * @param productos The products
     * @param datosFactura Original invoice data
     */
    static async generarPDFFactura(factura, empresa, cliente, productos, datosFactura) {
        try {
            const numeroAutorizacion = factura.clave_acceso;
            const fechaAutorizacion = factura.sri_fecha_respuesta || new Date();
            const pdfData = {
                factura: datosFactura,
                empresa,
                cliente,
                productos,
                claveAcceso: factura.clave_acceso,
                secuencial: factura.secuencial,
                fechaEmision: factura.fecha_emision,
                numeroAutorizacion,
                fechaAutorizacion,
            };
            const pdfBuffer = await (0, pdf_utils_1.generateInvoicePDF)(pdfData);
            const filename = `factura_${factura.secuencial}_${factura.clave_acceso}`;
            const pdfPath = await (0, pdf_utils_1.savePDFToFile)(pdfBuffer, filename);
            const invoicePDF = new FacturaPDF_1.default({
                factura_id: factura._id,
                claveAcceso: factura.clave_acceso,
                pdf_path: pdfPath,
                pdf_buffer: pdfBuffer,
                tamano_archivo: pdfBuffer.length,
                numero_autorizacion: numeroAutorizacion,
                fecha_autorizacion: fechaAutorizacion,
                estado: 'GENERADO',
            });
            await invoicePDF.save();
        }
        catch (error) {
            console.error('Error generating PDF:', error);
            try {
                const errorPDF = new FacturaPDF_1.default({
                    factura_id: factura._id,
                    claveAcceso: factura.clave_acceso,
                    pdf_path: '',
                    tamano_archivo: 0,
                    numero_autorizacion: factura.clave_acceso,
                    fecha_autorizacion: new Date(),
                    estado: 'ERROR',
                });
                await errorPDF.save();
            }
            catch (dbError) {
                console.error('Error saving PDF error record:', dbError);
            }
        }
    }
    /**
     * Intenta diferentes contraseñas comunes para el certificado P12
     * @param p12Path Ruta al archivo P12
     * @param originalPassword Contraseña original a probar primero
     * @returns Promise con la contraseña correcta o null si ninguna funciona
     */
    static async findWorkingP12Password(p12Path, originalPassword) {
        const passwordsToTry = [
            originalPassword,
            '',
            'password',
            '123456',
            'admin',
            originalPassword === null || originalPassword === void 0 ? void 0 : originalPassword.toLowerCase(),
            originalPassword === null || originalPassword === void 0 ? void 0 : originalPassword.toUpperCase(),
        ].filter((pass, index, arr) => pass !== undefined && arr.indexOf(pass) === index);
        for (const password of passwordsToTry) {
            const verification = await this.verifyP12Password(p12Path, password);
            if (verification.valid) {
                return { password };
            }
        }
        return { password: null, error: 'No se encontró una contraseña válida para el certificado P12' };
    }
    /**
     * Función de diagnóstico para certificados P12
     * @param p12Path Ruta al archivo P12
     * @param password Contraseña del certificado
     * @returns Información de diagnóstico del certificado
     */
    static async diagnoseP12Certificate(p12Path, password) {
        const diagnosis = {
            fileExists: false,
            fileSize: 0,
            isValidP12: false,
            passwordWorks: false,
        };
        try {
            diagnosis.fileExists = fs_1.default.existsSync(p12Path);
            if (!diagnosis.fileExists) {
                return { ...diagnosis, error: 'El archivo P12 no existe' };
            }
            const stats = fs_1.default.statSync(p12Path);
            diagnosis.fileSize = stats.size;
            if (diagnosis.fileSize === 0) {
                return { ...diagnosis, error: 'El archivo P12 está vacío' };
            }
            try {
                const p12Buffer = fs_1.default.readFileSync(p12Path);
                const p12Base64 = p12Buffer.toString('base64');
                const p12Der = node_forge_1.default.util.decode64(p12Base64);
                const p12Asn1 = node_forge_1.default.asn1.fromDer(p12Der);
                diagnosis.isValidP12 = true;
                try {
                    const p12 = node_forge_1.default.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
                    diagnosis.passwordWorks = true;
                    const bags = p12.getBags({ bagType: node_forge_1.default.pki.oids.certBag });
                    const certBags = bags[node_forge_1.default.pki.oids.certBag] || [];
                    if (certBags.length > 0) {
                        const cert = certBags[0].cert;
                        if (cert) {
                            diagnosis.certificateInfo = {
                                subject: cert.subject.attributes.map((attr) => `${attr.shortName}=${attr.value}`).join(', '),
                                issuer: cert.issuer.attributes.map((attr) => `${attr.shortName}=${attr.value}`).join(', '),
                                validFrom: cert.validity.notBefore,
                                validTo: cert.validity.notAfter,
                                serialNumber: cert.serialNumber,
                            };
                        }
                    }
                }
                catch (passwordError) {
                    diagnosis.passwordWorks = false;
                    return { ...diagnosis, error: `Error de contraseña: ${passwordError.message}` };
                }
            }
            catch (parseError) {
                diagnosis.isValidP12 = false;
                return { ...diagnosis, error: `Error al parsear P12: ${parseError.message}` };
            }
            return diagnosis;
        }
        catch (error) {
            return { ...diagnosis, error: `Error general: ${error.message}` };
        }
    }
    static async procesarRegeneracionPDF(factura) {
        try {
            const empresa = await Empresa_1.default.findById(factura.empresa_emisora_id)
                .lean()
                .exec();
            if (!empresa)
                throw new Error("Empresa no encontrada");
            const cliente = await Cliente_1.default.findById(factura.cliente_id)
                .lean()
                .exec();
            if (!cliente)
                throw new Error("Cliente no encontrado");
            const productos = [];
            if (factura.datos_originales) {
                const parsed = JSON.parse(factura.datos_originales);
                if (parsed.detalles) {
                    for (const item of parsed.detalles) {
                        const detalle = item.detalle || item;
                        productos.push({
                            codigo: detalle.codigoPrincipal,
                            descripcion: detalle.descripcion,
                            nombre: detalle.descripcion, // usamos la descripción como nombre
                            tipo_medicamento: detalle.tipo_medicamento, // valor por defecto
                            precio_unitario: parseFloat(detalle.precioUnitario),
                            precio_caja: 0, // valor por defecto si no hay info
                            tiene_iva: (detalle.impuestos || []).some((imp) => imp.impuesto.codigo === "2" || imp.impuesto.codigo === "4"),
                            imagen: "", // placeholder vacío
                            nombre_comercial: undefined,
                            presentacion: undefined,
                            laboratorio: undefined,
                            categoria: undefined,
                            estado: true,
                            controlado: undefined,
                            codigo_barra: undefined,
                            registro_sanitario: undefined,
                            ubicacion: undefined,
                            descripcion_adicional: undefined,
                        }); // ya no debería dar error porque todos los campos obligatorios están presentes
                    }
                }
            }
            const datosFactura = {
                infoTributaria: factura.datos_originales
                    ? JSON.parse(factura.datos_originales).infoTributaria
                    : {},
                infoFactura: factura.datos_originales
                    ? JSON.parse(factura.datos_originales).infoFactura
                    : {},
                detalles: factura.datos_originales
                    ? JSON.parse(factura.datos_originales).detalles
                    : []
            };
            await this.generarPDFFactura(factura, empresa, cliente, productos, datosFactura);
            console.log("Se genero el pdf");
            return factura;
        }
        catch (error) {
            console.error("Error procesando regeneración PDF:", error);
            throw error;
        }
    }
}
exports.FacturaService = FacturaService;
