const { z }   = require('zod');
const service = require('../services/servicios.service');

const servicioSchema = z.object({
  codigo:           z.string().min(2).max(30),
  nombre:           z.string().min(2).max(200),
  descripcion:      z.string().optional().or(z.literal('')).nullable(),
  tipo:             z.enum(['TREK','DAY_TOUR','CITY_TOUR','TRANSFER','MULTI_DAY','VUELO','PAQUETE_COMPLETO']),
  duracion_dias:    z.number().int().min(1).default(1),
  precio_base_usd:  z.number().min(0).default(0),
  nivel_dificultad: z.enum(['FACIL','MODERADO','DIFICIL','MUY_DIFICIL','EXTREMO']).optional().or(z.literal('')).nullable(),
  min_pax:          z.number().int().min(1).default(1),
  max_pax:          z.number().int().positive().optional().nullable(),
  incluye:          z.string().optional().or(z.literal('')).nullable(),
  no_incluye:       z.string().optional().or(z.literal('')).nullable(),
  que_llevar:       z.string().optional().or(z.literal('')).nullable(),
  politica_cancelacion: z.string().optional().or(z.literal('')).nullable(),
  activo:           z.boolean().default(true),
  es_plantilla:     z.boolean().default(false),
});

const itinerarioSchema = z.object({
  dia_numero:       z.number().int().min(1),
  titulo:           z.string().min(2).max(200),
  descripcion:      z.string().optional(),
  altitud_max_msnm: z.number().int().optional(),
  distancia_km:     z.number().min(0).optional(),
  horas_caminata:   z.number().min(0).max(24).optional(),
  desayuno:         z.boolean().default(false),
  almuerzo:         z.boolean().default(false),
  cena:             z.boolean().default(false),
  box_lunch:        z.boolean().default(false),
  alojamiento:      z.string().max(200).optional(),
  notas_operativas: z.string().optional(),
  orden:            z.number().int().default(1),
});

const clonarSchema = z.object({
  nuevo_codigo: z.string().min(2).max(30),
  nuevo_nombre: z.string().min(2).max(200),
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
    const body = servicioSchema.parse(req.body);
    const data = await service.create(body, req.user.id);
    res.status(201).json({ ok: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const body = servicioSchema.partial().parse(req.body);
    const data = await service.update(Number(req.params.id), body);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const clonar = async (req, res, next) => {
  try {
    const { nuevo_codigo, nuevo_nombre } = clonarSchema.parse(req.body);
    const data = await service.clonar(Number(req.params.id), nuevo_codigo, nuevo_nombre, req.user.id);
    res.status(201).json({ ok: true, data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) { next(err); }
};

const addItinerario = async (req, res, next) => {
  try {
    const body = itinerarioSchema.parse(req.body);
    const data = await service.addItinerario(Number(req.params.id), body);
    res.status(201).json({ ok: true, data });
  } catch (err) { next(err); }
};

const updateItinerario = async (req, res, next) => {
  try {
    const body = itinerarioSchema.partial().parse(req.body);
    const data = await service.updateItinerario(Number(req.params.diaId), body);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const deleteItinerario = async (req, res, next) => {
  try {
    await service.deleteItinerario(Number(req.params.diaId));
    res.json({ ok: true });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, clonar, remove, addItinerario, updateItinerario, deleteItinerario };
