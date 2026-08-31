const { query }    = require('../config/database');
const { AppError } = require('../middleware/error.middleware');

const buildFilters = (q) => {
  const conds  = ['1=1'];
  const values = [];
  let   idx    = 1;

  if (q.usuario_id)  { conds.push(`t.usuario_id = $${idx++}`);  values.push(Number(q.usuario_id)); }
  if (q.reserva_id)  { conds.push(`t.reserva_id = $${idx++}`);  values.push(Number(q.reserva_id)); }
  if (q.estado)      { conds.push(`t.estado = $${idx++}`);       values.push(q.estado); }
  if (q.prioridad)   { conds.push(`t.prioridad = $${idx++}`);    values.push(q.prioridad); }
  if (q.fecha_desde) { conds.push(`t.fecha_vencimiento >= $${idx++}`); values.push(q.fecha_desde); }
  if (q.fecha_hasta) { conds.push(`t.fecha_vencimiento <= $${idx++}`); values.push(q.fecha_hasta); }
  if (q.busqueda) {
    conds.push(`(t.titulo ILIKE $${idx} OR r.codigo_reserva ILIKE $${idx} OR r.agencia_nombre ILIKE $${idx})`);
    values.push(`%${q.busqueda}%`);
    idx++;
  }
  if (q.activas_solo === 'true') {
    conds.push(`t.estado IN ('PENDIENTE','EN_PROGRESO')`);
  }

  return { where: conds.join(' AND '), values, idx };
};

const getAll = async (q = {}) => {
  const { where, values, idx } = buildFilters(q);

  const { rows } = await query(
    `SELECT t.*,
            u.nombre || ' ' || u.apellido     AS asignado_a,
            r.codigo_reserva,
            cr.nombre || ' ' || cr.apellido   AS creado_por_nombre
     FROM cusi.tareas_pendientes t
     LEFT JOIN cusi.usuarios u  ON u.id  = t.usuario_id
     LEFT JOIN cusi.reservas r  ON r.id  = t.reserva_id
     LEFT JOIN cusi.usuarios cr ON cr.id = t.creado_por_id
     WHERE ${where}
     ORDER BY
       CASE t.prioridad WHEN 'URGENTE' THEN 1 WHEN 'ALTA' THEN 2 WHEN 'MEDIA' THEN 3 ELSE 4 END,
       t.fecha_vencimiento NULLS LAST`,
    values
  );
  return rows;
};

const getByUsuario = async (usuarioId, q = {}) => {
  return getAll({ ...q, usuario_id: usuarioId });
};

const getById = async (id) => {
  const { rows } = await query(
    `SELECT t.*,
            u.nombre || ' ' || u.apellido AS asignado_a,
            r.codigo_reserva
     FROM cusi.tareas_pendientes t
     LEFT JOIN cusi.usuarios u ON u.id = t.usuario_id
     LEFT JOIN cusi.reservas r ON r.id = t.reserva_id
     WHERE t.id = $1`,
    [id]
  );
  if (!rows.length) throw new AppError('Tarea no encontrada', 404, 'NOT_FOUND');
  return rows[0];
};

const create = async (data, creadoPorId) => {
  // chk_tareas_completada_tiene_fecha exige completada_en cuando estado =
  // COMPLETADA — update() ya lo maneja, create() lo tenía sin cubrir (crear
  // una tarea ya completada rompía con un 422 genérico).
  const completadaEn    = data.estado === 'COMPLETADA' ? new Date() : null;
  const completadaPorId = data.estado === 'COMPLETADA' ? creadoPorId : null;

  const { rows } = await query(
    `INSERT INTO cusi.tareas_pendientes
       (titulo, descripcion, usuario_id, reserva_id, prioridad, estado,
        fecha_vencimiento, creado_por_id, completada_en, completada_por_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      data.titulo,
      data.descripcion      || null,
      data.usuario_id,
      data.reserva_id       || null,
      data.prioridad,
      data.estado,
      data.fecha_vencimiento || null,
      creadoPorId,
      completadaEn,
      completadaPorId,
    ]
  );
  return rows[0];
};

const update = async (id, data, usuarioId) => {
  const campos = { ...data };

  // La tabla exige completada_en cuando estado = COMPLETADA (chk_tareas_completada_tiene_fecha).
  // El formulario de edición solo cambia "estado" — hay que fijar/limpiar el resto acá.
  if (campos.estado === 'COMPLETADA') {
    if (!campos.completada_en) campos.completada_en = new Date();
    if (!campos.completada_por_id && usuarioId) campos.completada_por_id = usuarioId;
  } else if (campos.estado) {
    campos.completada_en = null;
    campos.completada_por_id = null;
  }

  const keys = Object.keys(campos);
  if (!keys.length) throw new AppError('Sin datos para actualizar', 400, 'EMPTY_UPDATE');

  const sets   = keys.map((k, i) => `${k} = $${i + 2}`);
  const values = keys.map(k => campos[k]);

  const { rows } = await query(
    `UPDATE cusi.tareas_pendientes SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  if (!rows.length) throw new AppError('Tarea no encontrada', 404, 'NOT_FOUND');
  return rows[0];
};

const completar = async (id, usuarioId, notas_cierre) => {
  const { rows } = await query(
    `UPDATE cusi.tareas_pendientes
     SET estado = 'COMPLETADA', completada_en = NOW(),
         completada_por_id = $2, notas_cierre = $3
     WHERE id = $1
     RETURNING *`,
    [id, usuarioId, notas_cierre || null]
  );
  if (!rows.length) throw new AppError('Tarea no encontrada', 404, 'NOT_FOUND');
  return rows[0];
};

const remove = async (id) => {
  const { rowCount } = await query(
    'DELETE FROM cusi.tareas_pendientes WHERE id = $1',
    [id]
  );
  if (!rowCount) throw new AppError('Tarea no encontrada', 404, 'NOT_FOUND');
};

module.exports = { getAll, getByUsuario, getById, create, update, completar, remove };
