const { z }   = require('zod');
const service = require('../services/proveedores.service');

const proveedorSchema = z.object({
  codigo:            z.string().min(2).max(20),
  nombre:            z.string().min(2).max(200),
  tipo:              z.enum(['HOTEL','TRANSPORTE','RESTAURANTE','GUIA','AEROLINEA','TREN','OPERADOR_LOCAL','SEGURO','ACTIVIDAD','OTRO']),
  contacto_nombre:   z.string().max(150).optional().or(z.literal('')).nullable(),
  contacto_email:    z.string().email().optional().or(z.literal('')).nullable(),
  contacto_telefono: z.string().max(30).optional().or(z.literal('')).nullable(),
  whatsapp:          z.string().max(30).optional().or(z.literal('')).nullable(),
  direccion:         z.string().optional().or(z.literal('')).nullable(),
  ciudad:            z.string().max(100).optional().or(z.literal('')).nullable(),
  pais:              z.string().max(100).default('Perú'),
  ruc:               z.string().max(20).optional().or(z.literal('')).nullable(),
  moneda_pago:       z.enum(['USD','PEN','EUR','GBP']).default('USD'),
  activo:            z.boolean().default(true),
  observaciones:     z.string().optional().or(z.literal('')).nullable(),
  notas:             z.string().optional().or(z.literal('')).nullable(),   // alias del frontend — se mapea a observaciones
});

const detalleSchemaBase = z.object({
  reserva_id:          z.number().int().positive(),
  proveedor_id:        z.number().int().positive(),
  tipo_servicio:       z.enum(['HOTEL','TRANSPORTE','RESTAURANTE','GUIA','AEROLINEA','TREN','OPERADOR_LOCAL','SEGURO','ACTIVIDAD','OTRO']),
  descripcion:         z.string().max(500).optional().or(z.literal('')).nullable(),
  fecha_inicio:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_fin:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')).nullable(),
  hora_inicio:         z.string().optional().or(z.literal('')).nullable(),
  cantidad:            z.number().int().min(1).default(1),
  costo_unitario_usd:  z.number().min(0).default(0),
  estado:              z.enum(['PENDIENTE','SOLICITADO','RESERVADO','PAGADO','CONFIRMADO','RECONFIRMADO','EMITIDO','ANULADO','FACTURADO','COMPLETADO','CANCELADO','PENDIENTE_PAGO']).default('PENDIENTE'),
  confirmacion_ref:    z.string().max(100).optional().or(z.literal('')).nullable(),
  notas:               z.string().optional().or(z.literal('')).nullable(),
});

const withFechaCheck = (schema) => schema.refine(
  d => !d.fecha_fin || !d.fecha_inicio || d.fecha_fin >= d.fecha_inicio,
  { message: 'La fecha fin no puede ser anterior a la fecha inicio', path: ['fecha_fin'] }
);

const detalleSchema = withFechaCheck(detalleSchemaBase);

const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll(req.query);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const body = proveedorSchema.parse(req.body);
    const data = await service.create(body);
    res.status(201).json({ ok: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const body = proveedorSchema.partial().parse(req.body);
    const data = await service.update(Number(req.params.id), body);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) { next(err); }
};

const getDetallesByReserva = async (req, res, next) => {
  try {
    const data = await service.getDetallesByReserva(Number(req.params.reservaId));
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const getAllDetalles = async (req, res, next) => {
  try {
    const data = await service.getAllDetalles(req.query);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const createDetalle = async (req, res, next) => {
  try {
    const body = detalleSchema.parse(req.body);
    const data = await service.createDetalle(body);
    res.status(201).json({ ok: true, data });
  } catch (err) { next(err); }
};

const updateDetalle = async (req, res, next) => {
  try {
    const body = withFechaCheck(detalleSchemaBase.partial()).parse(req.body);
    const data = await service.updateDetalle(Number(req.params.detalleId), body);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const deleteDetalle = async (req, res, next) => {
  try {
    await service.deleteDetalle(Number(req.params.detalleId));
    res.json({ ok: true });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove, getDetallesByReserva, getAllDetalles, createDetalle, updateDetalle, deleteDetalle };
