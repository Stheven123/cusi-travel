const { z }   = require('zod');
const service = require('../services/presupuesto.service');

const itemSchema = z.object({
  reserva_id:  z.number().int().positive(),
  descripcion: z.string().min(1).max(300),
  monto:       z.number().min(0),
  moneda:      z.enum(['USD', 'PEN']).default('USD'),
});

const getByReserva = async (req, res, next) => {
  try {
    const data = await service.getByReserva(Number(req.params.reservaId));
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const body = itemSchema.parse(req.body);
    const data = await service.create(body, req.user.id);
    res.status(201).json({ ok: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const body = itemSchema.omit({ reserva_id: true }).partial().parse(req.body);
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
