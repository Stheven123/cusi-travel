const { z }   = require('zod');
const service = require('../services/agencias.service');

const agenciaSchema = z.object({
  nombre:   z.string().min(2).max(200),
  codigo:   z.string().max(50).optional().or(z.literal('')).nullable(),
  contacto: z.string().max(200).optional().or(z.literal('')).nullable(),
  telefono: z.string().max(30).optional().or(z.literal('')).nullable(),
  email:    z.string().email().optional().or(z.literal('')).nullable(),
  activo:   z.boolean().default(true),
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
    const body = agenciaSchema.parse(req.body);
    const data = await service.create(body);
    res.status(201).json({ ok: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const body = agenciaSchema.partial().parse(req.body);
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

module.exports = { getAll, getById, create, update, remove };
