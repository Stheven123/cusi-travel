const { z }           = require('zod');
const service         = require('../services/reservas.service');

const ESTADOS_OP  = ['COTIZACION','RESERVADO','SERVICIO_COMPLETO','PENDIENTE','ANULADO_SIN_PENALIDAD','ANULADO_CON_PENALIDAD'];
const ESTADOS_PAG = ['PENDIENTE','PARCIAL','PAGADO','REEMBOLSADO','ANULADO'];

const reservaSchema = z.object({
  codigo_reserva:       z.string().min(1).max(30).optional().nullable(),
  servicio_id:          z.number().int().positive().optional().nullable(),
  nombre_servicio_snap: z.string().max(200).optional().or(z.literal('')).nullable(),
  // reservas.fecha_inicio/fecha_fin son DATE NOT NULL en la BD — antes eran
  // opcionales acá, así que un create() sin fecha pasaba la validación y
  // recién fallaba en el INSERT con un 422 genérico ("campo obligatorio no
  // proporcionado") en vez de decir cuál campo faltaba. .partial() (usado en
  // update) sigue haciéndolos opcionales igual, esto solo afecta a create().
  fecha_inicio:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  fecha_fin:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  hora_encuentro:       z.string().optional().or(z.literal('')).nullable(),
  lugar_encuentro:      z.string().max(300).optional().or(z.literal('')).nullable(),
  n_pasajeros:          z.number().int().min(1).default(1),
  idioma_servicio:      z.string().max(50).default('Español'),
  estado_operacion:     z.enum(ESTADOS_OP).default('COTIZACION'),
  precio_usd_por_pax:   z.number().min(0).default(0),
  total_usd:            z.number().min(0).default(0),
  adelanto_usd:         z.number().min(0).default(0),
  descuento_usd:        z.number().min(0).default(0),
  agencia_nombre:       z.string().max(200).optional().or(z.literal('')).nullable(),
  agencia_codigo:       z.string().max(50).optional().or(z.literal('')).nullable(),
  operador_nombre:      z.string().max(200).optional().or(z.literal('')).nullable(),
  usuario_operador_id:  z.number().int().positive().optional().nullable(),
  usuario_guia_id:      z.number().int().positive().optional().nullable(),
  observaciones:        z.string().optional().or(z.literal('')).nullable(),
  notas_internas:       z.string().optional().or(z.literal('')).nullable(),
  servicios_adicionales: z.array(z.object({
    nombre:              z.string().min(1).max(200),
    cantidad:            z.number().int().min(1).default(1),
    precio_unitario_usd: z.number().min(0).default(0),
  })).optional(),
});

const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll(req.query);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const getCalendario = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const data = await service.getCalendario(desde, hasta);
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
    const body = reservaSchema.parse(req.body);
    const data = await service.create(body, req.user.id);
    res.status(201).json({ ok: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const body = reservaSchema.partial().parse(req.body);
    const data = await service.update(Number(req.params.id), body, req.user.id);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const cambiarEstado = async (req, res, next) => {
  try {
    const schema = z.object({ estado_operacion: z.enum(ESTADOS_OP) });
    const { estado_operacion } = schema.parse(req.body);
    const data = await service.cambiarEstado(Number(req.params.id), estado_operacion, req.user.id);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(Number(req.params.id), req.user.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
};

module.exports = { getAll, getCalendario, getById, create, update, cambiarEstado, remove };
