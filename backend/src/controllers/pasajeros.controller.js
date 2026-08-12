const { z }   = require('zod');
const service = require('../services/pasajeros.service');

const pasajeroSchema = z.object({
  reserva_id:                z.number().int().positive(),
  nombre:                    z.string().max(100).default(''),
  apellido:                  z.string().max(100).default(''),
  genero:                    z.enum(['M', 'F', 'NO_ESPECIFICADO']).default('NO_ESPECIFICADO'),
  fecha_nacimiento:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')).nullable(),
  nacionalidad:              z.string().max(100).optional().or(z.literal('')).nullable(),
  pasaporte:                 z.string().min(5).max(50).optional().or(z.literal('')).nullable(),
  pasaporte_vencimiento:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')).nullable(),
  email:                     z.string().email().optional().or(z.literal('')).nullable(),
  telefono:                  z.string().max(30).optional().nullable(),
  whatsapp:                  z.string().max(30).optional().nullable(),
  es_vegetariano:            z.boolean().default(false),
  es_vegano:                 z.boolean().default(false),
  es_pescetariano:           z.boolean().default(false),
  es_flexitariano:           z.boolean().default(false),
  es_celiaco:                z.boolean().default(false),
  es_diabetico:              z.boolean().default(false),
  es_halal:                  z.boolean().default(false),
  sin_lactosa:               z.boolean().default(false),
  quechua_extra_kg:          z.enum(['8', '15']).optional().or(z.literal('')).nullable(),
  trekking_poles:            z.boolean().default(false),
  sleeping_bag:              z.boolean().default(false),
  carpa_privada:             z.boolean().default(false),
  duffel_bag:                z.boolean().default(false),
  alergias:                  z.string().max(500).optional().nullable(),
  restricciones_alimenticias: z.string().optional().nullable(), // sanitizado por middleware
  condicion_medica:          z.string().optional().nullable(),
  observaciones:             z.string().optional().nullable(),
});

const getByReserva = async (req, res, next) => {
  try {
    const data = await service.getByReserva(Number(req.params.reservaId));
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const alertasVencimiento = async (_req, res, next) => {
  try {
    const data = await service.alertasVencimiento();
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const body = pasajeroSchema.parse(req.body);
    const data = await service.create(body);
    res.status(201).json({ ok: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const body = pasajeroSchema.partial().omit({ reserva_id: true }).parse(req.body);
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

module.exports = { getByReserva, getById, alertasVencimiento, create, update, remove };
