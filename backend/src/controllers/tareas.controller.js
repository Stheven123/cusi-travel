const { z }   = require('zod');
const service = require('../services/tareas.service');

const tareaSchema = z.object({
  titulo:            z.string().min(2).max(300),
  descripcion:       z.string().optional().nullable(),
  // tareas_pendientes.usuario_id es NOT NULL en la BD — dejarlo opcional acá
  // hacía que un create() sin responsable pasara la validación y recién
  // fallara en el INSERT con un 422 genérico. .partial() (usado en update)
  // sigue haciéndolo opcional igual, esto solo afecta a create().
  usuario_id:        z.coerce.number().int().positive(),
  reserva_id:        z.coerce.number().int().positive().optional().nullable(),
  prioridad:         z.enum(['BAJA','MEDIA','ALTA','URGENTE']).default('MEDIA'),
  estado:            z.enum(['PENDIENTE','EN_PROGRESO','COMPLETADA','CANCELADA']).default('PENDIENTE'),
  fecha_vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional().nullable(),
});

const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll(req.query);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const getMias = async (req, res, next) => {
  try {
    const data = await service.getByUsuario(req.user.id, req.query);
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
    const body = tareaSchema.parse(req.body);
    const data = await service.create(body, req.user.id);
    res.status(201).json({ ok: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const body = tareaSchema.partial().parse(req.body);
    const data = await service.update(Number(req.params.id), body, req.user.id);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const completar = async (req, res, next) => {
  try {
    const schema = z.object({ notas_cierre: z.string().optional() });
    const { notas_cierre } = schema.parse(req.body);
    const data = await service.completar(Number(req.params.id), req.user.id, notas_cierre);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) { next(err); }
};

module.exports = { getAll, getMias, getById, create, update, completar, remove };
