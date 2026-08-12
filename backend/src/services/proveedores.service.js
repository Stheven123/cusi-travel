const { query }    = require('../config/database');
const { AppError } = require('../middleware/error.middleware');

const getAll = async (q = {}) => {
  const conds  = ['1=1'];
  const values = [];
  let   idx    = 1;

  if (q.tipo)   { conds.push(`tipo = $${idx++}`);              values.push(q.tipo); }
  if (q.activo !== undefined) {
    conds.push(`activo = $${idx++}`);
    values.push(q.activo === 'true' || q.activo === true);
  }
  if (q.busqueda) {
    conds.push(`(nombre ILIKE $${idx} OR contacto_nombre ILIKE $${idx} OR ciudad ILIKE $${idx})`);
    values.push(`%${q.busqueda}%`);
    idx++;
  }

  const { rows } = await query(
    `SELECT * FROM cusi.proveedores WHERE ${conds.join(' AND ')} ORDER BY nombre`,
    values
  );
  return rows;
};

const getById = async (id) => {
  const { rows } = await query(
    'SELECT * FROM cusi.proveedores WHERE id = $1',
    [id]
  );
  if (!rows.length) throw new AppError('Proveedor no encontrado', 404, 'NOT_FOUND');
  return rows[0];
};

const create = async (data) => {
  const obs = data.observaciones || data.notas || null;
  const { rows } = await query(
    `INSERT INTO cusi.proveedores
       (codigo, nombre, tipo, contacto_nombre, contacto_email, contacto_telefono,
        whatsapp, direccion, ciudad, pais, ruc, moneda_pago, activo, observaciones)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      data.codigo, data.nombre, data.tipo,
      data.contacto_nombre    || null,
      data.contacto_email     || null,
      data.contacto_telefono  || null,
      data.whatsapp           || null,
      data.direccion          || null,
      data.ciudad             || null,
      data.pais,
      data.ruc                || null,
      data.moneda_pago,
      data.activo ?? true,
      obs,
    ]
  );
  return rows[0];
};

const update = async (id, data) => {
  const campos  = Object.keys(data);
  if (!campos.length) throw new AppError('Sin datos para actualizar', 400, 'EMPTY_UPDATE');

  const norm   = v => (v === '' ? null : v);
  const sets   = campos.map((k, i) => `${k} = $${i + 2}`);
  const values = campos.map(k => norm(data[k]));

  const { rows } = await query(
    `UPDATE cusi.proveedores SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  if (!rows.length) throw new AppError('Proveedor no encontrado', 404, 'NOT_FOUND');
  return rows[0];
};

const remove = async (id) => {
  const { rows } = await query(
    'UPDATE cusi.proveedores SET activo = FALSE WHERE id = $1 RETURNING id',
    [id]
  );
  if (!rows.length) throw new AppError('Proveedor no encontrado', 404, 'NOT_FOUND');
};

// ── Detalles de operación ────────────────────────────────

const getDetallesByReserva = async (reservaId) => {
  const { rows } = await query(
    `SELECT d.*, p.nombre AS proveedor_nombre, p.tipo AS proveedor_tipo,
            p.contacto_telefono AS proveedor_telefono
     FROM cusi.detalles_operacion_proveedor d
     LEFT JOIN cusi.proveedores p ON p.id = d.proveedor_id
     WHERE d.reserva_id = $1
     ORDER BY d.fecha_inicio`,
    [reservaId]
  );
  return rows;
};

const createDetalle = async (data) => {
  const { rows } = await query(
    `INSERT INTO cusi.detalles_operacion_proveedor
       (reserva_id, proveedor_id, tipo_servicio, descripcion,
        fecha_inicio, fecha_fin, hora_inicio, cantidad,
        costo_unitario_usd, moneda, estado, confirmacion_ref, notas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      data.reserva_id, data.proveedor_id || null, data.tipo_servicio,
      data.descripcion     || null,
      data.fecha_inicio,
      data.fecha_fin       || null,
      data.hora_inicio     || null,
      data.cantidad,
      data.costo_unitario_usd,
      data.moneda           || 'USD',
      data.estado,
      data.confirmacion_ref || null,
      data.notas            || null,
    ]
  );
  return rows[0];
};

const updateDetalle = async (detalleId, data) => {
  const campos  = Object.keys(data);
  if (!campos.length) throw new AppError('Sin datos para actualizar', 400, 'EMPTY_UPDATE');

  const norm   = v => (v === '' ? null : v);
  const sets   = campos.map((k, i) => `${k} = $${i + 2}`);
  const values = campos.map(k => norm(data[k]));

  const { rows } = await query(
    `UPDATE cusi.detalles_operacion_proveedor SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    [detalleId, ...values]
  );
  if (!rows.length) throw new AppError('Detalle de operación no encontrado', 404, 'NOT_FOUND');
  return rows[0];
};

const deleteDetalle = async (detalleId) => {
  const { rowCount } = await query(
    'DELETE FROM cusi.detalles_operacion_proveedor WHERE id = $1',
    [detalleId]
  );
  if (!rowCount) throw new AppError('Detalle de operación no encontrado', 404, 'NOT_FOUND');
};

const getAllDetalles = async (filters = {}) => {
  const conditions = [];
  const values = [];
  let i = 1;

  if (filters.estado)       { conditions.push(`d.estado = $${i++}`);              values.push(filters.estado); }
  if (filters.tipo_servicio){ conditions.push(`d.tipo_servicio = $${i++}`);        values.push(filters.tipo_servicio); }
  if (filters.desde)        { conditions.push(`d.fecha_inicio >= $${i++}`);        values.push(filters.desde); }
  if (filters.hasta)        { conditions.push(`d.fecha_inicio <= $${i++}`);        values.push(filters.hasta); }
  if (filters.proveedor_id) { conditions.push(`d.proveedor_id = $${i++}`);         values.push(Number(filters.proveedor_id)); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await query(
    `SELECT d.*,
            p.nombre AS proveedor_nombre, p.tipo AS proveedor_tipo,
            p.contacto_telefono AS proveedor_telefono,
            r.codigo_reserva, r.nombre_servicio_snap,
            r.agencia_nombre, r.estado_operacion AS reserva_estado
     FROM cusi.detalles_operacion_proveedor d
     LEFT JOIN cusi.proveedores p ON p.id = d.proveedor_id
     JOIN cusi.reservas    r ON r.id = d.reserva_id
     ${where}
     ORDER BY d.fecha_inicio DESC, d.id DESC
     LIMIT 500`,
    values
  );
  return rows;
};

// ── Checklist de tareas por operación ────────────────────

const getTareasByDetalle = async (detalleId) => {
  const { rows } = await query(
    `SELECT * FROM cusi.tareas_operacion WHERE detalle_id = $1 ORDER BY orden, id`,
    [detalleId]
  );
  return rows;
};

const createTareaOperacion = async (detalleId, data) => {
  const { rows } = await query(
    `INSERT INTO cusi.tareas_operacion
       (detalle_id, titulo, fecha, monto, persona_encargada, completada, orden)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      detalleId,
      data.titulo,
      data.fecha             || null,
      data.monto             ?? null,
      data.persona_encargada || null,
      data.completada        ?? false,
      data.orden             ?? 1,
    ]
  );
  return rows[0];
};

const createTareasOperacionBulk = async (detalleId, items) => {
  const creadas = [];
  for (let i = 0; i < items.length; i++) {
    creadas.push(await createTareaOperacion(detalleId, { ...items[i], orden: i + 1 }));
  }
  return creadas;
};

const updateTareaOperacion = async (tareaId, data) => {
  const campos = Object.keys(data);
  if (!campos.length) throw new AppError('Sin datos para actualizar', 400, 'EMPTY_UPDATE');

  const norm   = v => (v === '' ? null : v);
  const sets   = campos.map((k, i) => `${k} = $${i + 2}`);
  const values = campos.map(k => norm(data[k]));

  const { rows } = await query(
    `UPDATE cusi.tareas_operacion SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    [tareaId, ...values]
  );
  if (!rows.length) throw new AppError('Tarea de operación no encontrada', 404, 'NOT_FOUND');
  return rows[0];
};

const deleteTareaOperacion = async (tareaId) => {
  const { rowCount } = await query(
    'DELETE FROM cusi.tareas_operacion WHERE id = $1',
    [tareaId]
  );
  if (!rowCount) throw new AppError('Tarea de operación no encontrada', 404, 'NOT_FOUND');
};

module.exports = {
  getAll, getById, create, update, remove, getDetallesByReserva, getAllDetalles, createDetalle, updateDetalle, deleteDetalle,
  getTareasByDetalle, createTareaOperacion, createTareasOperacionBulk, updateTareaOperacion, deleteTareaOperacion,
};
