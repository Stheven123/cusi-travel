const { z }   = require('zod');
const service = require('../services/notas.service');

const notaSchema = z.object({
  reserva_id: z.number().int().positive(),
  texto:      z.string().min(1).max(4000),
});

const getByReserva = async (req, res, next) => {
  try {
    const data = await service.getByReserva(Number(req.params.reservaId));
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const body = notaSchema.parse(req.body);
    const data = await service.create(body, req.user.id);
    res.status(201).json({ ok: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const body = notaSchema.pick({ texto: true }).parse(req.body);
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

module.exports = { getByReserva, create, update, remove };
