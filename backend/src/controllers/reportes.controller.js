const { z }           = require('zod');
const service         = require('../services/reportes.service');
const invoiceService  = require('../services/invoice.service');
const cierreService   = require('../services/cierre.service');

const filtroProveedorSchema = z.object({
  proveedor_id:    z.number().int().positive().optional(),
  tipo_proveedor:  z.string().optional(),
  fecha_desde:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_hasta:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  estado:          z.string().optional(),
  reserva_ids:     z.array(z.number().int().positive()).optional(), // selección por checkboxes
  campos:          z.array(z.string()).optional(),                  // campos a incluir en el reporte
  labels:          z.record(z.string()).optional(),                 // etiquetas legibles para los encabezados del Excel
});

const getKPIs = async (_req, res, next) => {
  try {
    const data = await service.getKPIs();
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const reporteProveedores = async (req, res, next) => {
  try {
    const filtros = filtroProveedorSchema.parse(req.body);
    const data    = await service.reporteProveedores(filtros);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const reporteProveedoresExcel = async (req, res, next) => {
  try {
    const filtros = filtroProveedorSchema.parse(req.body);
    const workbook = await service.reporteProveedoresExcel(filtros);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Reporte-Proveedores.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};

const resumenMensual = async (req, res, next) => {
  try {
    const schema = z.object({
      anio: z.coerce.number().int().min(2020).max(2099).default(new Date().getFullYear()),
      mes:  z.coerce.number().int().min(1).max(12).default(new Date().getMonth() + 1),
    });
    const { anio, mes } = schema.parse(req.query);
    const data = await service.resumenMensual(anio, mes);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const proximas = async (req, res, next) => {
  try {
    const dias = Number(req.query.dias) || 7;
    const data = await service.proximasReservas(dias);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const generarInvoice = async (req, res, next) => {
  try {
    const reservaId = Number(req.params.reservaId);
    if (!Number.isInteger(reservaId) || reservaId < 1) {
      return res.status(400).json({ ok: false, error: 'reservaId invalido' });
    }

    const { agency = {}, bank = {}, to = {}, lineItems } = req.body || {};
    const overrides = { agency, bank, to, lineItems };

    const { workbook, codigo } = await invoiceService.generarInvoiceExcel(reservaId, overrides);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${codigo}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};

const generarCierre = async (req, res, next) => {
  try {
    const schema = z.object({
      anio: z.coerce.number().int().min(2020).max(2099).default(new Date().getFullYear()),
      mes:  z.coerce.number().int().min(1).max(12).default(new Date().getMonth() + 1),
    });
    const { anio, mes } = schema.parse(req.query);
    const agencia = req.body?.agencia || {};

    const { workbook, filename } = await cierreService.generarCierreExcel(anio, mes, agencia);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};

const generarCierreReserva = async (req, res, next) => {
  try {
    const reservaId = Number(req.params.reservaId);
    if (!Number.isInteger(reservaId) || reservaId < 1) {
      return res.status(400).json({ ok: false, error: 'reservaId invalido' });
    }
    const agencia = req.body?.agencia || {};

    const { workbook, filename } = await cierreService.generarCierreExcelPorReserva(reservaId, agencia);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};

module.exports = { getKPIs, reporteProveedores, reporteProveedoresExcel, resumenMensual, proximas, generarInvoice, generarCierre, generarCierreReserva };
