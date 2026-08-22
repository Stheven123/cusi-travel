const { query }    = require('../config/database');
const { AppError } = require('../middleware/error.middleware');

const getByReserva = async (reservaId) => {
  const { rows } = await query(
    `SELECT p.*, u.nombre || ' ' || u.apellido AS creado_por_nombre
     FROM cusi.reserva_presupuesto p
     LEFT JOIN cusi.usuarios u ON u.id = p.creado_por_id
     WHERE p.reserva_id = $1
     ORDER BY p.creado_en`,
    [reservaId]
  );
  return rows;
};

const create = async (data, creadoPorId) => {
  const { rows } = await query(
    `INSERT INTO cusi.reserva_presupuesto (reserva_id, descripcion, monto, moneda, creado_por_id)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [data.reserva_id, data.descripcion, data.monto, data.moneda || 'USD', creadoPorId]
  );
  return rows[0];
};

const update = async (id, data) => {
  const campos = Object.keys(data);
  if (!campos.length) throw new AppError('Sin datos para actualizar', 400, 'EMPTY_UPDATE');

  const sets   = campos.map((k, i) => `${k} = $${i + 2}`);
  const values = campos.map(k => data[k]);

  const { rows } = await query(
    `UPDATE cusi.reserva_presupuesto SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  if (!rows.length) throw new AppError('Línea de presupuesto no encontrada', 404, 'NOT_FOUND');
  return rows[0];
};

const remove = async (id) => {
  const { rowCount } = await query('DELETE FROM cusi.reserva_presupuesto WHERE id = $1', [id]);
  if (!rowCount) throw new AppError('Línea de presupuesto no encontrada', 404, 'NOT_FOUND');
};

module.exports = { getByReserva, create, update, remove };
