const { query }    = require('../config/database');
const { AppError } = require('../middleware/error.middleware');

const getAll = async (q = {}) => {
  const conds  = ['1=1'];
  const values = [];
  let   idx    = 1;

  if (q.reserva_id) { conds.push(`b.reserva_id = $${idx++}`); values.push(Number(q.reserva_id)); }
  if (q.desde)      { conds.push(`b.fecha >= $${idx++}`);       values.push(q.desde); }
  if (q.hasta)      { conds.push(`b.fecha <= $${idx++}`);       values.push(q.hasta); }

  const { rows } = await query(
    `SELECT b.*,
            r.codigo_reserva,
            u.nombre || ' ' || u.apellido AS creado_por_nombre
     FROM cusi.briefings b
     LEFT JOIN cusi.reservas  r ON r.id = b.reserva_id
     LEFT JOIN cusi.usuarios  u ON u.id = b.creado_por_id
     WHERE ${conds.join(' AND ')}
     ORDER BY b.fecha, b.hora NULLS LAST`,
    values
  );
  return rows;
};

const getByReserva = async (reservaId) => {
  const { rows } = await query(
    `SELECT b.*, u.nombre || ' ' || u.apellido AS creado_por_nombre
     FROM cusi.briefings b
     LEFT JOIN cusi.usuarios u ON u.id = b.creado_por_id
     WHERE b.reserva_id = $1
     ORDER BY b.fecha, b.hora NULLS LAST`,
    [reservaId]
  );
  return rows;
};

const create = async (data, creadoPorId) => {
  const { rows } = await query(
    `INSERT INTO cusi.briefings
       (reserva_id, fecha, hora, hora_salida, lugar, persona_encargada, notas, creado_por_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      data.reserva_id       || null,
      data.fecha,
      data.hora             || null,
      data.hora_salida      || null,
      data.lugar            || null,
      data.persona_encargada|| null,
      data.notas            || null,
      creadoPorId,
    ]
  );
  return rows[0];
};

const update = async (id, data) => {
  const campos  = Object.keys(data).filter(k => !['id','creado_por_id','creado_en','reserva_id'].includes(k));
  if (!campos.length) throw new AppError('Sin datos para actualizar', 400, 'EMPTY_UPDATE');

  const sets   = campos.map((k, i) => `${k} = $${i + 2}`);
  const values = campos.map(k => data[k]);

  const { rows } = await query(
    `UPDATE cusi.briefings SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  if (!rows.length) throw new AppError('Briefing no encontrado', 404, 'NOT_FOUND');
  return rows[0];
};

const remove = async (id) => {
  const { rowCount } = await query('DELETE FROM cusi.briefings WHERE id = $1', [id]);
  if (!rowCount) throw new AppError('Briefing no encontrado', 404, 'NOT_FOUND');
};

module.exports = { getAll, getByReserva, create, update, remove };
