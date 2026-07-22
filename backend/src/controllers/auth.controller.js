const { z }           = require('zod');
const authService     = require('../services/auth.service');

const loginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

const login = async (req, res, next) => {
  try {
    const data   = loginSchema.parse(req.body);
    const result = await authService.login(data.email, data.password);
    res.json({ ok: true, data: result });
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({ ok: true, data: user });
  } catch (err) { next(err); }
};

module.exports = { login, logout, me };
