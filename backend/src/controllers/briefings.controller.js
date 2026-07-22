const { z }   = require('zod');
const service = require('../services/briefings.service');

const briefingSchema = z.object({
  reserva_id:        z.number().int().positive().optional().nullable(),
  fecha:             z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  hora:              z.string().optional().or(z.literal('')).nullable(),
  hora_salida:       z.string().optional().or(z.literal('')).nullable(),
  lugar:             z.string().max(300).optional().or(z.literal('')).nullable(),
  persona_encargada: z.string().max(200).optional().or(z.literal('')).nullable(),
  notas:             z.string().optional().or(z.literal('')).nullable(),
});

const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll(req.query);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const getByReserva = async (req, res, next) => {
  try {
    const data = await service.getByReserva(Number(req.params.reservaId));
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const body = briefingSchema.parse(req.body);
    const data = await service.create(body, req.user.id);
    res.status(201).json({ ok: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const body = briefingSchema.partial().parse(req.body);
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

module.exports = { getAll, getByReserva, create, update, remove };
