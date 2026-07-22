const bcrypt     = require('bcrypt');
const { query }  = require('../config/database');
const { AppError } = require('../middleware/error.middleware');

const BCRYPT_ROUNDS = 12;

const getAll = async (q = {}) => {
  const conds  = ['1=1'];
  const values = [];
  let   idx    = 1;

  if (q.rol)    { conds.push(`rol = $${idx++}`);           values.push(q.rol); }
  if (q.activo !== undefined) {
    conds.push(`activo = $${idx++}`);
    values.push(q.activo === 'true' || q.activo === true);
  }

  const { rows } = await query(
    `SELECT id, codigo, nombre, apellido, email, rol, avatar_iniciales, activo, ultimo_acceso, creado_en
     FROM cusi.usuarios WHERE ${conds.join(' AND ')} ORDER BY apellido, nombre`,
    values
  );
  return rows;
};

const getById = async (id) => {
  const { rows } = await query(
    `SELECT id, codigo, nombre, apellido, email, rol, avatar_iniciales, activo, ultimo_acceso, creado_en
     FROM cusi.usuarios WHERE id = $1`,
    [id]
  );
  if (!rows.length) throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
  return rows[0];
};

const create = async (data) => {
  const hash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  const iniciales = data.avatar_iniciales ||
    `${data.nombre[0]}${data.apellido[0]}`.toUpperCase();

  const { rows } = await query(
    `INSERT INTO cusi.usuarios
       (codigo, nombre, apellido, email, password_hash, rol, avatar_iniciales, activo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id, codigo, nombre, apellido, email, rol, avatar_iniciales, activo, creado_en`,
    [
      data.codigo, data.nombre, data.apellido, data.email,
      hash, data.rol, iniciales, data.activo ?? true,
    ]
  );
  return rows[0];
};

const update = async (id, data) => {
  const campos  = Object.keys(data);
  if (!campos.length) throw new AppError('Sin datos para actualizar', 400, 'EMPTY_UPDATE');

  const sets   = campos.map((k, i) => `${k} = $${i + 2}`);
  const values = campos.map(k => data[k]);

  const { rows } = await query(
    `UPDATE cusi.usuarios SET ${sets.join(', ')} WHERE id = $1
     RETURNING id, codigo, nombre, apellido, email, rol, avatar_iniciales, activo`,
    [id, ...values]
  );
  if (!rows.length) throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
  return rows[0];
};

const cambiarPassword = async (id, nuevaPassword) => {
  const hash = await bcrypt.hash(nuevaPassword, BCRYPT_ROUNDS);
  const { rowCount } = await query(
    'UPDATE cusi.usuarios SET password_hash = $1 WHERE id = $2',
    [hash, id]
  );
  if (!rowCount) throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
};

const toggleActivo = async (id) => {
  const { rows } = await query(
    'UPDATE cusi.usuarios SET activo = NOT activo WHERE id = $1 RETURNING id, activo',
    [id]
  );
  if (!rows.length) throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
  return rows[0];
};

module.exports = { getAll, getById, create, update, cambiarPassword, toggleActivo };
