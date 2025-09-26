import { Router } from 'express';
import FacturaPDF from '../models/FacturaPDF';
import Factura from '../models/Factura';
import { FacturaService } from '../services/factura.service';
import { enviarComprobanteSRI } from '../utils/sri.utils';
import { consultarAutorizacionSRI } from '../utils/sri2.utils';

const router = Router();
router.get('/', async (_req, res) => {
  try {
    const docs = await FacturaPDF.find();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

router.get('/factura/:facturaId', async (req, res) => {
  try {
    const doc = await FacturaPDF.findOne({ factura_id: req.params.facturaId });
    if (!doc) return res.status(404).json({ message: 'PDF not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/access-key/:claveAcceso', async (req, res) => {
  try {
    const doc = await FacturaPDF.findOne({ claveAcceso: req.params.claveAcceso });
    if (!doc) return res.status(404).json({ message: 'PDF not found' });

    if (doc.pdf_buffer) {
      res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
        'Content-Disposition',
        `inline; filename="factura_${doc.claveAcceso}.pdf"`
      );
      res.send(doc.pdf_buffer);
    } else {
      res.status(404).json({ message: 'PDF buffer not available' });
    }

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/download/:claveAcceso', async (req, res) => {
  try {
    const doc = await FacturaPDF.findOne({ claveAcceso: req.params.claveAcceso });
    if (!doc) return res.status(404).json({ message: 'PDF not found' });

    if (doc.pdf_buffer) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="factura_${doc.claveAcceso}.pdf"`);
      res.send(doc.pdf_buffer);
    } else {
      res.status(404).json({ message: 'PDF buffer not available' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Regenerate PDF for a specific invoice
router.get('/regenerate/:facturaId', async (req, res) => {
  try {
    const docs = await Factura.findById(req.params.facturaId);
    console.log(".." + docs?.sri_estado);
    const facturpdf = await FacturaPDF.findOne({ factura_id: docs?.id });
    if (facturpdf) {
      console.log(facturpdf?.factura_id);
      const factura = await FacturaPDF.findOneAndDelete({ factura_id: facturpdf.factura_id });
      console.log(factura?.factura_id + ": Eliminada");

    }
    const responses = await FacturaService.procesarRegeneracionPDF(docs);
    console.log(docs?.clave_acceso);

    const doc = await FacturaPDF.findOne({ claveAcceso: docs?.clave_acceso });
    if (!doc) return res.status(404).json({ message: 'PDF not found' });

    if (doc.pdf_buffer) {
      res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
        'Content-Disposition',
        `inline; filename="factura_${doc.claveAcceso}.pdf"`
      );
      res.send(doc.pdf_buffer);
    } else {
      res.status(404).json({ message: 'PDF buffer not available' });
    }

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// // Send PDF via email
router.post('/status-auto/:claveAcceso', async (req, res) => {
  try {
    // const { email_destinatario } = req.body;

    // if (!email_destinatario) {
    //   return res.status(400).json({ message: 'Email destinatario is required' });
    // }

    // const doc = await FacturaPDF.findOne({ claveAcceso: req.params.claveAcceso });
    // if (!doc) return res.status(404).json({ message: 'PDF not found' });

    // // Update email fields for future implementation
    // doc.email_estado = 'PENDIENTE';
    // doc.email_destinatario = email_destinatario;
    // doc.email_intentos = 0;
    // doc.email_ultimo_error = undefined;
    // // doc.email_enviado_por = req.user?.id; // When auth is implemented

    // await doc.save();
    // // TODO: Implement actual email sending logic here
    // res.json({
    //   message: 'Email sending request queued',
    //   claveAcceso: req.params.claveAcceso,
    //   destinatario: email_destinatario,
    //   estado: 'PENDIENTE',
    // });

          const  respuestaSRI = await consultarAutorizacionSRI(req.params.claveAcceso);
          res.json(respuestaSRI);
    
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// // Get email status for a PDF
// router.get('/email-status/:claveAcceso', async (req, res) => {
//   try {
//     const doc = await FacturaPDF.findOne({ claveAcceso: req.params.claveAcceso });
//     if (!doc) return res.status(404).json({ message: 'PDF not found' });

//     res.json({
//       claveAcceso: req.params.claveAcceso,
//       email_estado: doc.email_estado,
//       email_destinatario: doc.email_destinatario,
//       email_fecha_envio: doc.email_fecha_envio,
//       email_intentos: doc.email_intentos,
//       email_ultimo_error: doc.email_ultimo_error,
//     });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// router.post('/retry-email/:claveAcceso', async (req, res) => {
//   try {
//     const doc = await FacturaPDF.findOne({ claveAcceso: req.params.claveAcceso });
//     if (!doc) return res.status(404).json({ message: 'PDF not found' });

//     if (doc.email_estado === 'ENVIADO') {
//       return res.status(400).json({ message: 'Email already sent successfully' });
//     }

//     // Reset for retry
//     doc.email_estado = 'PENDIENTE';
//     doc.email_ultimo_error = undefined;

//     await doc.save();

//     // TODO: Implement actual email retry logic here
//     res.json({
//       message: 'Email retry requested',
//       claveAcceso: req.params.claveAcceso,
//       estado: 'PENDIENTE',
//     });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

export default router;
