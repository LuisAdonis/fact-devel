import CajaModel, { ICaja } from '../models/Caja';
import FacturaPagoModel from '../models/FacturaPago';
import MovimientoCajaModel from '../models/MovimientoCaja';
import FacturaModel from '../models/Factura';
import FacturaDetalleModel from '../models/FacturaDetalle';
import ProductoModel from '../models/Producto';
import UsuarioModel from '../models/Usuario';
import { Types } from 'mongoose';

interface CierreCajaProfesionalInput {
  cajaId: string;
  montoContado: number; 
}

export const cerrarCajaProfesional = async ({ cajaId, montoContado }: CierreCajaProfesionalInput) => {
  const caja = await CajaModel.findById(cajaId) as ICaja;
  if (!caja) throw new Error('Caja no encontrada');
  if (!caja.estado) throw new Error('La caja ya está cerrada');

  const usuario = await UsuarioModel.findById(caja.usuario_id);
  const pagos = await FacturaPagoModel.find({ caja_id: caja._id });

  let totalEfectivo = 0;
  let totalTarjeta = 0;
  let totalTransferencia = 0;

  pagos.forEach(pago => {
    switch (pago.metodo_pago) {
      case 'EFECTIVO':
        totalEfectivo += pago.monto;
        break;
      case 'TARJETA':
        totalTarjeta += pago.monto;
        break;
      case 'TRANSFERENCIA':
        totalTransferencia += pago.monto;
        break;
      case 'MIXTO':
        totalEfectivo += pago.monto * 0.5;
        totalTarjeta += pago.monto * 0.5;
        break;
    }
  });

  const movimientos = await MovimientoCajaModel.find({ caja_id: caja._id });
  let totalIngresos = 0;
  let totalEgresos = 0;

  movimientos.forEach(mov => {
    if (mov.tipo === 'INGRESO') totalIngresos += mov.monto;
    if (mov.tipo === 'EGRESO') totalEgresos += mov.monto;
    if (mov.tipo=='INICIO')0;
  });

  const facturaIds = pagos.map(p => p.factura_id);
  const facturas = await FacturaModel.find({ _id: { $in: facturaIds } });

  const facturasDetalle = [];

  for (const factura of facturas) {
    const cliente = factura.cliente_id; 
    const detalles = await FacturaDetalleModel.find({ factura_id: factura._id });
    const productos = [];

    for (const detalle of detalles) {
      const producto = await ProductoModel.findById(detalle.producto_id);
      productos.push({
        nombre: producto?.nombre || 'Producto',
        cantidad: detalle.cantidad,
        subtotal: detalle.subtotal,
        iva: detalle.valor_iva
      });
    }

    const pagoFactura = pagos.find(p => p.factura_id.equals(factura.id));

    facturasDetalle.push({
      numero: factura.secuencial,
      cliente: factura.cliente_id,
      total: factura.total_con_impuestos,
      metodo_pago: pagoFactura?.metodo_pago || 'EFECTIVO',
      productos
    });
  }

  const totalEsperado = caja.monto_inicial + totalEfectivo + totalTarjeta + totalTransferencia + totalIngresos - totalEgresos;
  const diferencia = montoContado - totalEsperado;

  caja.fecha_cierre = new Date();
  caja.monto_contado = montoContado;
  caja.monto_efectivo = totalEfectivo;
  caja.monto_tarjeta = totalTarjeta;
  caja.monto_transferencia = totalTransferencia;
  caja.diferencia = diferencia;
  caja.estado = false;
  await caja.save();

  return {
    caja_id: caja._id,
    usuario: usuario?.correo || 'Desconocido',
    fecha_apertura: caja.fecha_apertura,
    fecha_cierre: caja.fecha_cierre,
    totales: {
      efectivo: totalEfectivo,
      tarjeta: totalTarjeta,
      transferencia: totalTransferencia,
      ingresos_extra: totalIngresos,
      egresos_extra: totalEgresos,
      total_esperado: totalEsperado,
      monto_contado: montoContado,
      diferencia
    },
    facturas: facturasDetalle,
    movimientos_extra: movimientos.map(m => ({
      tipo: m.tipo,
      concepto: m.concepto,
      monto: m.monto
    }))
  };
};
