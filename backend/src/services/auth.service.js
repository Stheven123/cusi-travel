const bcrypt     = require('bcrypt');
const jwt        = require('jsonwebtoken');
const { query }  = require('../config/database');
const { env }    = require('../config/env');
const { AppError } = require('../middleware/error.middleware');

const login = async (email, password) => {
  const { rows } = await query(
    `SELECT id, codigo, nombre, apellido, email, password_hash, rol, avatar_iniciales
     FROM cusi.usuarios
     WHERE email = $1 AND activo = TRUE`,
    [email]
  );

  if (!rows.length) throw new AppError('Credenciales inválidas', 401, 'INVALID_CREDENTIALS');

  const user  = rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match)  throw new AppError('Credenciales inválidas', 401, 'INVALID_CREDENTIALS');

  await query(
    'UPDATE cusi.usuarios SET ultimo_acceso = NOW() WHERE id = $1',
    [user.id]
  );

  await query(
    `INSERT INTO cusi.logs_auditoria (tabla, operacion, registro_id, usuario_id)
     VALUES ($1, $2, $3, $4)`,
    ['usuarios', 'LOGIN', user.id, user.id]
  );

  const token = jwt.sign(
    { id: user.id, codigo: user.codigo, nombre: `${user.nombre} ${user.apellido}`, rol: user.rol },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES }
  );

  const { password_hash: _, ...userPublic } = user;
  return { token, user: userPublic };
};

const logout = async (userId) => {
  await query(
    `INSERT INTO cusi.logs_auditoria (tabla, operacion, registro_id, usuario_id)
     VALUES ($1, $2, $3, $4)`,
    ['usuarios', 'LOGOUT', userId, userId]
  );
};

const getMe = async (userId) => {
  const { rows } = await query(
    `SELECT id, codigo, nombre, apellido, email, rol, avatar_iniciales, ultimo_acceso
     FROM cusi.usuarios WHERE id = $1 AND activo = TRUE`,
    [userId]
  );
  if (!rows.length) throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
  return rows[0];
};

module.exports = { login, logout, getMe };
