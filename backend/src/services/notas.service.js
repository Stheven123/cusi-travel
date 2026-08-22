const { query }    = require('../config/database');
const { AppError } = require('../middleware/error.middleware');

const getByReserva = async (reservaId) => {
  const { rows } = await query(
    `SELECT n.*, u.nombre || ' ' || u.apellido AS creado_por_nombre
     FROM cusi.reserva_notas n
     LEFT JOIN cusi.usuarios u ON u.id = n.creado_por_id
     WHERE n.reserva_id = $1
     ORDER BY n.creado_en DESC`,
    [reservaId]
  );
  return rows;
};

const create = async (data, creadoPorId) => {
  const { rows } = await query(
    `INSERT INTO cusi.reserva_notas (reserva_id, texto, creado_por_id)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [data.reserva_id, data.texto, creadoPorId]
  );
  return rows[0];
};

const update = async (id, data) => {
  const { rows } = await query(
    `UPDATE cusi.reserva_notas SET texto = $2 WHERE id = $1 RETURNING *`,
    [id, data.texto]
  );
  if (!rows.length) throw new AppError('Nota no encontrada', 404, 'NOT_FOUND');
  return rows[0];
};

const remove = async (id) => {
  const { rowCount } = await query('DELETE FROM cusi.reserva_notas WHERE id = $1', [id]);
  if (!rowCount) throw new AppError('Nota no encontrada', 404, 'NOT_FOUND');
};

module.exports = { getByReserva, create, update, remove };
