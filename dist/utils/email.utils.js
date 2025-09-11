"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoiceEmailTemplate = generateInvoiceEmailTemplate;
exports.prepareEmailConfig = prepareEmailConfig;
exports.isValidEmail = isValidEmail;
exports.sendInvoiceEmail = sendInvoiceEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
/**
 * Creates email transporter based on environment configuration
 */
function createTransporter() {
    const emailService = process.env.EMAIL_SERVICE || 'gmail';
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    if (!emailUser || !emailPassword) {
        throw new Error('Email credentials not configured. Set EMAIL_USER and EMAIL_PASSWORD environment variables.');
    }
    return nodemailer_1.default.createTransport({
        service: emailService,
        auth: {
            user: emailUser,
            pass: emailPassword,
        },
    });
}
/**
 * Generates email template for invoice PDF
 */
function generateInvoiceEmailTemplate(facturaPDF, clientName, companyName) {
    const subject = `Factura Electrónica - ${facturaPDF.claveAcceso}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Factura Electrónica</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .content { margin-bottom: 20px; }
        .footer { font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
        .invoice-details { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Factura Electrónica</h2>
          <p>Estimado/a ${clientName},</p>
        </div>
        
        <div class="content">
          <p>Adjunto encontrará su factura electrónica emitida por <strong>${companyName}</strong>.</p>
          
          <div class="invoice-details">
            <strong>Detalles de la Factura:</strong><br>
            <strong>Clave de Acceso:</strong> ${facturaPDF.claveAcceso}<br>
            <strong>Número de Autorización:</strong> ${facturaPDF.numero_autorizacion}<br>
            <strong>Fecha de Autorización:</strong> ${facturaPDF.fecha_autorizacion.toLocaleDateString('es-EC')}<br>
            <strong>Fecha de Generación PDF:</strong> ${facturaPDF.fecha_generacion.toLocaleDateString('es-EC')}
          </div>
          
          <p>Por favor, conserve este documento para sus registros contables.</p>
          
          <p>Si tiene alguna consulta sobre esta factura, no dude en contactarnos.</p>
        </div>
        
        <div class="footer">
          <p>Este es un mensaje automático. Por favor, no responda a este correo.</p>
          <p>Factura generada.</p>
        </div>
      </div>
    </body>
    </html>
  `;
    const text = `
    Factura Electrónica
    
    Estimado/a ${clientName},
    
    Adjunto encontrará su factura electrónica emitida por ${companyName}.
    
    Detalles de la Factura:
    Clave de Acceso: ${facturaPDF.claveAcceso}
    Número de Autorización: ${facturaPDF.numero_autorizacion}
    Fecha de Autorización: ${facturaPDF.fecha_autorizacion.toLocaleDateString('es-EC')}
    Fecha de Generación PDF: ${facturaPDF.fecha_generacion.toLocaleDateString('es-EC')}
    
    Por favor, conserve este documento para sus registros contables.
    
    Si tiene alguna consulta sobre esta factura, no dude en contactarnos.
    
    Este es un mensaje automático. Por favor, no responda a este correo.
    Factura generada.
  `;
    return { subject, html, text };
}
/**
 * Prepares email configuration for sending
 */
function prepareEmailConfig(facturaPDF, emailTemplate, recipientEmail) {
    const config = {
        to: recipientEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
    };
    // Add PDF attachment if buffer is available
    if (facturaPDF.pdf_buffer) {
        config.attachments = [
            {
                filename: `factura_${facturaPDF.claveAcceso}.pdf`,
                content: facturaPDF.pdf_buffer,
                contentType: 'application/pdf',
            },
        ];
    }
    return config;
}
/**
 * Validates email address format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Sends invoice email using configured email service
 */
async function sendInvoiceEmail(facturaPDF, recipientEmail, clientName, companyName) {
    try {
        // Validate email
        if (!isValidEmail(recipientEmail)) {
            throw new Error('Formato de email inválido');
        }
        // Check if email is configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.warn('Email service not configured. Email sending is disabled.');
            return {
                success: false,
                error: 'Servicio de email no configurado. Configure EMAIL_USER y EMAIL_PASSWORD.',
            };
        }
        // Generate email template
        const template = generateInvoiceEmailTemplate(facturaPDF, clientName, companyName);
        // Prepare email config
        const emailConfig = prepareEmailConfig(facturaPDF, template, recipientEmail);
        // Create transporter and send email
        const transporter = createTransporter();
        const result = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            ...emailConfig,
        });
        console.log('✅ Email sent successfully:', {
            to: emailConfig.to,
            subject: emailConfig.subject,
            messageId: result.messageId,
        });
        return {
            success: true,
            messageId: result.messageId,
        };
    }
    catch (error) {
        console.error('❌ Error sending email:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}
