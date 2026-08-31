const { query }    = require('../config/database');
const { AppError } = require('../middleware/error.middleware');

const getAll = async (q = {}) => {
  const conds  = ['1=1'];
  const values = [];
  let   idx    = 1;

  if (q.activo !== undefined) {
    conds.push(`activo = $${idx++}`);
    values.push(q.activo === 'true' || q.activo === true);
  }
  if (q.busqueda) {
    conds.push(`(nombre ILIKE $${idx} OR codigo ILIKE $${idx} OR contacto ILIKE $${idx})`);
    values.push(`%${q.busqueda}%`);
    idx++;
  }

  const { rows } = await query(
    `SELECT * FROM cusi.agencias WHERE ${conds.join(' AND ')} ORDER BY nombre`,
    values
  );
  return rows;
};

const getById = async (id) => {
  const { rows } = await query('SELECT * FROM cusi.agencias WHERE id = $1', [id]);
  if (!rows.length) throw new AppError('Agencia no encontrada', 404, 'NOT_FOUND');
  return rows[0];
};

const create = async (data) => {
  const { rows } = await query(
    `INSERT INTO cusi.agencias (nombre, codigo, contacto, telefono, email, activo)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      data.nombre,
      data.codigo   || null,
      data.contacto || null,
      data.telefono || null,
      data.email    || null,
      data.activo ?? true,
    ]
  );
  return rows[0];
};

const update = async (id, data) => {
  const campos = Object.keys(data);
  if (!campos.length) throw new AppError('Sin datos para actualizar', 400, 'EMPTY_UPDATE');

  const norm   = v => (v === '' ? null : v);
  const sets   = campos.map((k, i) => `${k} = $${i + 2}`);
  const values = campos.map(k => norm(data[k]));

  const { rows } = await query(
    `UPDATE cusi.agencias SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  if (!rows.length) throw new AppError('Agencia no encontrada', 404, 'NOT_FOUND');
  return rows[0];
};

const remove = async (id) => {
  const { rows } = await query(
    'UPDATE cusi.agencias SET activo = FALSE WHERE id = $1 RETURNING id',
    [id]
  );
  if (!rows.length) throw new AppError('Agencia no encontrada', 404, 'NOT_FOUND');
};

module.exports = { getAll, getById, create, update, remove };
