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
  // "notas" es un alias del frontend (ver proveedorSchema) — la tabla solo
  // tiene columna "observaciones". create() ya hacía este mapeo; update() no
  // lo hacía y mandaba "notas" como si fuera columna real, rompiendo con
  // "column notas does not exist".
  const payload = { ...data };
  if ('notas' in payload) {
    if (payload.observaciones === undefined || payload.observaciones === '' || payload.observaciones === null) {
      payload.observaciones = payload.notas;
    }
    delete payload.notas;
  }

  const campos  = Object.keys(payload);
  if (!campos.length) throw new AppError('Sin datos para actualizar', 400, 'EMPTY_UPDATE');

  const norm   = v => (v === '' ? null : v);
  const sets   = campos.map((k, i) => `${k} = $${i + 2}`);
  const values = campos.map(k => norm(payload[k]));

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
            p.contacto_telefono AS proveedor_telefono,
            eu.nombre || ' ' || eu.apellido AS estado_actualizado_por_nombre
     FROM cusi.detalles_operacion_proveedor d
     LEFT JOIN cusi.proveedores p ON p.id = d.proveedor_id
     LEFT JOIN cusi.usuarios    eu ON eu.id = d.estado_actualizado_por_id
     WHERE d.reserva_id = $1
     ORDER BY d.fecha_inicio`,
    [reservaId]
  );
  return rows;
};

// Mantiene sincronizada la pestaña "Notas" de la reserva con las notas que se
// escriben en una operación puntual: cada operación tiene a lo sumo una nota
// asociada en reserva_notas (detalle_operacion_id), que se crea/actualiza/borra
// junto con la nota de la operación.
const TIPO_LABEL = {
  HOTEL: 'Hotel', TRANSPORTE: 'Transporte', RESTAURANTE: 'Restaurante', GUIA: 'Guía',
  AEROLINEA: 'Aerolínea', TREN: 'Tren', OPERADOR_LOCAL: 'Operador local', SEGURO: 'Seguro',
  ACTIVIDAD: 'Actividad', COCINERO: 'Cocinero', PORTER: 'Quechuas', OTRO: 'Otro', INGRESOS: 'Ingreso',
};

const syncNotaOperacion = async (reservaId, detalleId, tipoServicio, proveedorId, notas, userId) => {
  if (!notas?.trim()) {
    await query('DELETE FROM cusi.reserva_notas WHERE detalle_operacion_id = $1', [detalleId]);
    return;
  }

  let proveedorNombre = null;
  if (proveedorId) {
    const { rows } = await query('SELECT nombre FROM cusi.proveedores WHERE id = $1', [proveedorId]);
    proveedorNombre = rows[0]?.nombre || null;
  }
  const texto = `${TIPO_LABEL[tipoServicio] || tipoServicio}${proveedorNombre ? ` (${proveedorNombre})` : ''}: ${notas.trim()}`;

  await query(
    `INSERT INTO cusi.reserva_notas (reserva_id, texto, creado_por_id, detalle_operacion_id)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (detalle_operacion_id) WHERE detalle_operacion_id IS NOT NULL
     DO UPDATE SET texto = EXCLUDED.texto`,
    [reservaId, texto, userId || null, detalleId]
  );
};

const createDetalle = async (data, userId) => {
  const { rows } = await query(
    `INSERT INTO cusi.detalles_operacion_proveedor
       (reserva_id, proveedor_id, tipo_servicio, descripcion,
        fecha_inicio, fecha_fin, hora_inicio, cantidad,
        costo_unitario_usd, moneda, estado, confirmacion_ref, notas,
        fecha_vencimiento, persona_encargada,
        tipo_documento, serie_documento, numero_documento, enlace_drive,
        estado_actualizado_por_id, estado_actualizado_en)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW())
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
      data.fecha_vencimiento || null,
      data.persona_encargada || null,
      data.tipo_documento   || null,
      data.serie_documento  || null,
      data.numero_documento || null,
      data.enlace_drive     || null,
      userId                || null,
    ]
  );
  const detalle = rows[0];
  await syncNotaOperacion(detalle.reserva_id, detalle.id, detalle.tipo_servicio, detalle.proveedor_id, detalle.notas, userId);
  return detalle;
};

const updateDetalle = async (detalleId, data, userId) => {
  const campos  = { ...data };
  if (!Object.keys(campos).length) throw new AppError('Sin datos para actualizar', 400, 'EMPTY_UPDATE');

  const needsEstadoCheck = Object.prototype.hasOwnProperty.call(campos, 'estado');
  const needsNotasCheck  = Object.prototype.hasOwnProperty.call(campos, 'notas');
  let notasCambiaron = false;

  if (needsEstadoCheck || needsNotasCheck) {
    const { rows: cur } = await query(
      'SELECT estado, notas FROM cusi.detalles_operacion_proveedor WHERE id = $1',
      [detalleId]
    );
    if (!cur.length) throw new AppError('Detalle de operación no encontrado', 404, 'NOT_FOUND');
    // Si el estado cambia, se registra quién y cuándo lo modificó.
    if (needsEstadoCheck && cur[0].estado !== campos.estado) {
      campos.estado_actualizado_por_id = userId || null;
      campos.estado_actualizado_en     = new Date();
    }
    // El formulario reenvía "notas" en cada guardado aunque el usuario no haya
    // tocado ese campo — si igual disparáramos syncNotaOperacion cada vez,
    // pisaría/resucitaría cualquier edición o borrado que el usuario haya
    // hecho directamente en la pestaña "Notas" de la reserva. Solo se
    // resincroniza cuando el texto de la operación realmente cambió.
    if (needsNotasCheck && (cur[0].notas || null) !== (campos.notas || null)) {
      notasCambiaron = true;
    }
  }

  const keys   = Object.keys(campos);
  const norm   = v => (v === '' ? null : v);
  const sets   = keys.map((k, i) => `${k} = $${i + 2}`);
  const values = keys.map(k => norm(campos[k]));

  const { rows } = await query(
    `UPDATE cusi.detalles_operacion_proveedor SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    [detalleId, ...values]
  );
  if (!rows.length) throw new AppError('Detalle de operación no encontrado', 404, 'NOT_FOUND');
  const detalle = rows[0];
  if (notasCambiaron) {
    await syncNotaOperacion(detalle.reserva_id, detalle.id, detalle.tipo_servicio, detalle.proveedor_id, detalle.notas, userId);
  }
  return detalle;
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
            eu.nombre || ' ' || eu.apellido AS estado_actualizado_por_nombre,
            r.codigo_reserva, r.nombre_servicio_snap,
            r.agencia_nombre, r.estado_operacion AS reserva_estado
     FROM cusi.detalles_operacion_proveedor d
     LEFT JOIN cusi.proveedores p  ON p.id  = d.proveedor_id
     LEFT JOIN cusi.usuarios    eu ON eu.id = d.estado_actualizado_por_id
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

// Vista consolidada de TODAS las tareas de checklist de operaciones, con el
// contexto de su reserva/proveedor — usada por el módulo de Tareas para que
// el checklist operativo no quede aislado dentro de cada operación.
const getAllTareasOperacion = async (filters = {}) => {
  const conds  = ['1=1'];
  const values = [];
  let   idx    = 1;

  if (filters.completada !== undefined) {
    conds.push(`t.completada = $${idx++}`);
    values.push(filters.completada === 'true' || filters.completada === true);
  }
  if (filters.reserva_id) { conds.push(`d.reserva_id = $${idx++}`); values.push(Number(filters.reserva_id)); }
  if (filters.tipo_servicio) { conds.push(`d.tipo_servicio = $${idx++}`); values.push(filters.tipo_servicio); }

  const { rows } = await query(
    `SELECT t.*,
            d.reserva_id, d.tipo_servicio, d.proveedor_id,
            p.nombre AS proveedor_nombre,
            r.codigo_reserva, r.agencia_nombre,
            TRIM(CONCAT(ug.nombre, ' ', ug.apellido)) AS guia_asignado_nombre
     FROM cusi.tareas_operacion t
     JOIN cusi.detalles_operacion_proveedor d ON d.id = t.detalle_id
     LEFT JOIN cusi.proveedores p ON p.id = d.proveedor_id
     JOIN cusi.reservas r ON r.id = d.reserva_id
     LEFT JOIN cusi.usuarios ug ON ug.id = r.usuario_guia_id
     WHERE ${conds.join(' AND ')}
     ORDER BY t.completada, t.fecha NULLS LAST, t.id DESC
     LIMIT 500`,
    values
  );
  return rows;
};

module.exports = {
  getAll, getById, create, update, remove, getDetallesByReserva, getAllDetalles, createDetalle, updateDetalle, deleteDetalle,
  getTareasByDetalle, createTareaOperacion, createTareasOperacionBulk, updateTareaOperacion, deleteTareaOperacion,
  getAllTareasOperacion,
};
