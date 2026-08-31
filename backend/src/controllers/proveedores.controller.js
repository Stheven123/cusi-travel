const { z }   = require('zod');
const service = require('../services/proveedores.service');

const proveedorSchema = z.object({
  codigo:            z.string().min(2).max(20),
  nombre:            z.string().min(2).max(200),
  tipo:              z.enum(['HOTEL','TRANSPORTE','RESTAURANTE','GUIA','AEROLINEA','TREN','OPERADOR_LOCAL','SEGURO','ACTIVIDAD','COCINERO','PORTER','OTRO']),
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
  proveedor_id:        z.number().int().positive().optional().nullable(),
  tipo_servicio:       z.enum(['HOTEL','TRANSPORTE','RESTAURANTE','GUIA','AEROLINEA','TREN','OPERADOR_LOCAL','SEGURO','ACTIVIDAD','COCINERO','PORTER','OTRO','INGRESOS']),
  descripcion:         z.string().max(500).optional().or(z.literal('')).nullable(),
  fecha_inicio:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_fin:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')).nullable(),
  hora_inicio:         z.string().optional().or(z.literal('')).nullable(),
  cantidad:            z.number().int().min(1).default(1),
  costo_unitario_usd:  z.number().min(0).default(0),
  moneda:              z.enum(['USD','PEN']).default('USD'),
  estado:              z.enum(['PENDIENTE','SOLICITADO','RESERVADO','PAGADO','CONFIRMADO','RECONFIRMADO','EMITIDO','ANULADO','FACTURADO','COMPLETADO','CANCELADO','PENDIENTE_PAGO']).default('PENDIENTE'),
  confirmacion_ref:    z.string().max(100).optional().or(z.literal('')).nullable(),
  notas:               z.string().optional().or(z.literal('')).nullable(),
  fecha_vencimiento:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')).nullable(),
  persona_encargada:   z.string().max(200).optional().or(z.literal('')).nullable(),
  tipo_documento:      z.string().max(40).optional().or(z.literal('')).nullable(),
  serie_documento:     z.string().max(20).optional().or(z.literal('')).nullable(),
  numero_documento:    z.string().max(30).optional().or(z.literal('')).nullable(),
  enlace_drive:        z.string().max(500).optional().or(z.literal('')).nullable(),
});

const withFechaCheck = (schema) => schema.refine(
  d => !d.fecha_fin || !d.fecha_inicio || d.fecha_fin >= d.fecha_inicio,
  { message: 'La fecha fin no puede ser anterior a la fecha inicio', path: ['fecha_fin'] }
);

// INGRESOS es un registro libre (sin proveedor); el resto de tipos sí lo requieren.
// Solo aplica a create (schema completo) — en updates parciales el campo puede
// simplemente no venir en el body sin que eso signifique quitar el proveedor.
const withProveedorCheck = (schema) => schema.refine(
  d => d.proveedor_id != null || d.tipo_servicio === 'INGRESOS',
  { message: 'Selecciona un proveedor', path: ['proveedor_id'] }
);

const detalleSchema = withProveedorCheck(withFechaCheck(detalleSchemaBase));

const tareaOperacionSchema = z.object({
  titulo:            z.string().min(2).max(300),
  fecha:             z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')).nullable(),
  monto:             z.number().optional().nullable(),
  persona_encargada: z.string().max(200).optional().or(z.literal('')).nullable(),
  completada:        z.boolean().default(false),
});

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

// Checklist estándar que se precarga al crear una operación de tipo GUIA
// cuando el usuario no define su propio checklist al crearla.
const CHECKLIST_GUIA = [
  'Fecha de confirmación',
  'Fecha de reconfirmación',
  'Fecha de entrega de sobre y equipo necesario',
  'Fecha que recibimos sus comprobantes',
  'Fecha que recibimos su recibo por honorario',
  'Fecha de pago',
];

const tareasInlineSchema = z.array(z.object({ titulo: z.string().min(1).max(300) })).optional();

const createDetalle = async (req, res, next) => {
  try {
    const body   = detalleSchema.parse(req.body);
    const tareas = tareasInlineSchema.parse(req.body.tareas);
    const data   = await service.createDetalle(body, req.user.id);

    const titulos = tareas?.length
      ? tareas.map(t => t.titulo)
      : (body.tipo_servicio === 'GUIA' ? CHECKLIST_GUIA : []);

    if (titulos.length) {
      await service.createTareasOperacionBulk(data.id, titulos.map(titulo => ({ titulo })));
    }
    res.status(201).json({ ok: true, data });
  } catch (err) { next(err); }
};

const updateDetalle = async (req, res, next) => {
  try {
    const body = withFechaCheck(detalleSchemaBase.partial()).parse(req.body);
    const data = await service.updateDetalle(Number(req.params.detalleId), body, req.user.id);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const deleteDetalle = async (req, res, next) => {
  try {
    await service.deleteDetalle(Number(req.params.detalleId));
    res.json({ ok: true });
  } catch (err) { next(err); }
};

const getTareasOperacion = async (req, res, next) => {
  try {
    const data = await service.getTareasByDetalle(Number(req.params.detalleId));
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

// Todas las tareas de checklist de operaciones (vista consolidada para el módulo de Tareas)
const getAllTareasOperacion = async (req, res, next) => {
  try {
    const data = await service.getAllTareasOperacion(req.query);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const createTareaOperacion = async (req, res, next) => {
  try {
    const body = tareaOperacionSchema.parse(req.body);
    const data = await service.createTareaOperacion(Number(req.params.detalleId), body);
    res.status(201).json({ ok: true, data });
  } catch (err) { next(err); }
};

const updateTareaOperacion = async (req, res, next) => {
  try {
    const body = tareaOperacionSchema.partial().parse(req.body);
    const data = await service.updateTareaOperacion(Number(req.params.tareaId), body);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const deleteTareaOperacion = async (req, res, next) => {
  try {
    await service.deleteTareaOperacion(Number(req.params.tareaId));
    res.json({ ok: true });
  } catch (err) { next(err); }
};

module.exports = {
  getAll, getById, create, update, remove, getDetallesByReserva, getAllDetalles, createDetalle, updateDetalle, deleteDetalle,
  getTareasOperacion, getAllTareasOperacion, createTareaOperacion, updateTareaOperacion, deleteTareaOperacion,
};
