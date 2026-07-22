const { z }   = require('zod');
const service = require('../services/usuarios.service');

const usuarioSchema = z.object({
  codigo:           z.string().regex(/^USR-\d{3,}$/, 'Formato: USR-001'),
  nombre:           z.string().min(2).max(100),
  apellido:         z.string().min(2).max(100),
  email:            z.string().email(),
  password:         z.string().min(8, 'Mínimo 8 caracteres'),
  rol:              z.enum(['ADMIN','OPERACIONES','VENTAS','GUIA','FINANZAS','SOLO_LECTURA']),
  avatar_iniciales: z.string().max(4).optional(),
  activo:           z.boolean().default(true),
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
    const body = usuarioSchema.parse(req.body);
    const data = await service.create(body);
    res.status(201).json({ ok: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const body = usuarioSchema.omit({ password: true }).partial().parse(req.body);
    const data = await service.update(Number(req.params.id), body);
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

const cambiarPassword = async (req, res, next) => {
  try {
    const schema = z.object({ nueva_password: z.string().min(8) });
    const { nueva_password } = schema.parse(req.body);
    await service.cambiarPassword(Number(req.params.id), nueva_password);
    res.json({ ok: true });
  } catch (err) { next(err); }
};

const toggleActivo = async (req, res, next) => {
  try {
    const data = await service.toggleActivo(Number(req.params.id));
    res.json({ ok: true, data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, cambiarPassword, toggleActivo };
