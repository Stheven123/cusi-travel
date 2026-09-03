const { query, withTransaction } = require('../config/database');
const { AppError }               = require('../middleware/error.middleware');

// "Hoy" en horario de Cusco/Lima (UTC-5, sin horario de verano) — usar
// toISOString().slice(0,10) da la fecha en UTC, que ya cambió de día entre
// las 19:00 y 23:59 hora local, dejando fuera del calendario reservas del
// resto del día actual durante esa ventana.
const fechaLimaISO = (date) => date.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

// Checklist estándar cuando una operación de tipo GUIA no trae tareas de plantilla propias
const CHECKLIST_GUIA_DEFAULT = [
  'Fecha de confirmación',
  'Fecha de reconfirmación',
  'Fecha de entrega de sobre y equipo necesario',
  'Fecha que recibimos sus comprobantes',
  'Fecha que recibimos su recibo por honorario',
  'Fecha de pago',
];

// Copia las operaciones + checklist definidos en la plantilla del paquete
// hacia la nueva reserva. Se ejecuta solo al CREAR (no en cada edición).
const instanciarPlantillaOperaciones = async (client, servicioId, reservaId, fechaInicio) => {
  const { rows: plantillas } = await client.query(
    'SELECT * FROM cusi.plantilla_operaciones WHERE servicio_id = $1 ORDER BY orden, id',
    [servicioId]
  );
  for (const pl of plantillas) {
    const { rows: det } = await client.query(
      `INSERT INTO cusi.detalles_operacion_proveedor
         (reserva_id, proveedor_id, tipo_servicio, descripcion, fecha_inicio,
          cantidad, costo_unitario_usd, moneda, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'PENDIENTE')
       RETURNING id`,
      [
        reservaId, pl.proveedor_id || null, pl.tipo_servicio, pl.descripcion || null,
        fechaInicio || fechaLimaISO(new Date()),
        pl.cantidad, pl.costo_unitario_usd, pl.moneda,
      ]
    );
    const detalleId = det[0].id;

    const { rows: tareasPlantilla } = await client.query(
      'SELECT titulo, fecha, monto, persona_encargada FROM cusi.plantilla_tareas_operacion WHERE plantilla_operacion_id = $1 ORDER BY orden, id',
      [pl.id]
    );
    const tareas = tareasPlantilla.length
      ? tareasPlantilla
      : (pl.tipo_servicio === 'GUIA' ? CHECKLIST_GUIA_DEFAULT.map(titulo => ({ titulo })) : []);

    for (let i = 0; i < tareas.length; i++) {
      const t = tareas[i];
      await client.query(
        `INSERT INTO cusi.tareas_operacion (detalle_id, titulo, fecha, monto, persona_encargada, orden)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [detalleId, t.titulo, t.fecha || null, t.monto ?? null, t.persona_encargada || null, i + 1]
      );
    }
  }
};

// Reemplaza los servicios adicionales de una reserva (borrar + reinsertar).
const syncServiciosAdicionales = async (client, reservaId, extras) => {
  if (!Array.isArray(extras)) return;
  await client.query('DELETE FROM cusi.reserva_servicios_adicionales WHERE reserva_id = $1', [reservaId]);
  for (const e of extras) {
    if (!e.nombre || !e.nombre.trim()) continue;
    await client.query(
      `INSERT INTO cusi.reserva_servicios_adicionales (reserva_id, nombre, cantidad, precio_unitario_usd)
       VALUES ($1,$2,$3,$4)`,
      [reservaId, e.nombre, Number(e.cantidad) || 1, Number(e.precio_unitario_usd) || 0]
    );
  }
};

// Constructor de filtros dinámico con queries 100% parametrizadas
const buildFilters = (q) => {
  const conds  = ['1=1'];
  const values = [];
  let   idx    = 1;

  if (q.estado_operacion) { conds.push(`r.estado_operacion = $${idx++}`); values.push(q.estado_operacion); }
  if (q.estado_pago)      { conds.push(`r.estado_pago = $${idx++}`);       values.push(q.estado_pago); }
  if (q.fecha_desde)      { conds.push(`r.fecha_inicio >= $${idx++}`);     values.push(q.fecha_desde); }
  if (q.fecha_hasta)      { conds.push(`r.fecha_inicio <= $${idx++}`);     values.push(q.fecha_hasta); }
  if (q.agencia)          { conds.push(`r.agencia_nombre ILIKE $${idx++}`); values.push(`%${q.agencia}%`); }
  if (q.servicio_id)      { conds.push(`r.servicio_id = $${idx++}`);       values.push(Number(q.servicio_id)); }
  if (q.busqueda) {
    conds.push(`(r.codigo_reserva ILIKE $${idx} OR r.agencia_nombre ILIKE $${idx} OR r.nombre_servicio_snap ILIKE $${idx})`);
    values.push(`%${q.busqueda}%`);
    idx++;
  }
  if (q.pasajero) {
    conds.push(`EXISTS (
      SELECT 1 FROM cusi.pasajeros p2
      WHERE p2.reserva_id = r.id
        AND (p2.nombre ILIKE $${idx} OR p2.apellido ILIKE $${idx} OR p2.pasaporte ILIKE $${idx})
    )`);
    values.push(`%${q.pasajero}%`);
    idx++;
  }

  return { where: conds.join(' AND '), values, idx };
};

const getAll = async (q = {}) => {
  const { where, values, idx } = buildFilters(q);
  // Tope subido de 200 a 1000: la vista "por mes" de ReservasPage pide hasta
  // 500 para poder agrupar todo el historial visible sin paginar, y con 200
  // se truncaba en silencio (sin aviso) apenas una cuenta pasaba ese umbral.
  const limit  = Math.min(Number(q.limit)  || 50, 1000);
  const offset = Number(q.offset) || 0;

  const { rows } = await query(
    `SELECT r.*,
            st.nombre           AS servicio_nombre,
            st.tipo             AS servicio_tipo,
            st.duracion_dias,
            uo.nombre || ' ' || uo.apellido AS operador_nombre,
            ug.nombre || ' ' || ug.apellido AS guia_nombre,
            COUNT(p.id)::int    AS pasajeros_registrados,
            COUNT(t.id) FILTER (WHERE t.estado IN ('PENDIENTE','EN_PROGRESO'))::int AS tareas_activas
     FROM cusi.reservas r
     LEFT JOIN cusi.servicios_turisticos st ON st.id = r.servicio_id
     LEFT JOIN cusi.usuarios uo             ON uo.id = r.usuario_operador_id
     LEFT JOIN cusi.usuarios ug             ON ug.id = r.usuario_guia_id
     LEFT JOIN cusi.pasajeros p             ON p.reserva_id = r.id
     LEFT JOIN cusi.tareas_pendientes t     ON t.reserva_id = r.id
     WHERE ${where}
     GROUP BY r.id, st.nombre, st.tipo, st.duracion_dias, uo.nombre, uo.apellido, ug.nombre, ug.apellido
     ORDER BY r.fecha_inicio DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset]
  );
  return rows;
};

const getCalendario = async (desde, hasta) => {
  const { rows } = await query(
    `SELECT r.id, r.codigo_reserva, r.fecha_inicio, r.fecha_fin,
            r.n_pasajeros, r.estado_operacion, r.estado_pago,
            r.idioma_servicio, r.hora_encuentro, r.lugar_encuentro,
            r.agencia_nombre,
            r.total_usd, r.adelanto_usd, r.descuento_usd,
            (r.total_usd - r.adelanto_usd - r.descuento_usd) AS saldo_usd,
            COALESCE(r.nombre_servicio_snap, st.nombre) AS servicio_nombre,
            st.tipo AS servicio_tipo
     FROM cusi.reservas r
     LEFT JOIN cusi.servicios_turisticos st ON st.id = r.servicio_id
     WHERE r.fecha_inicio <= $2 AND r.fecha_fin >= $1
       AND r.estado_operacion NOT IN ('ANULADO_SIN_PENALIDAD','ANULADO_CON_PENALIDAD')
     ORDER BY r.fecha_inicio`,
    [desde || fechaLimaISO(new Date()),
     hasta  || fechaLimaISO(new Date(Date.now() + 30 * 86400_000))]
  );
  return rows;
};

const getById = async (id) => {
  const { rows } = await query(
    `SELECT r.*,
            st.nombre AS servicio_nombre, st.tipo AS servicio_tipo, st.duracion_dias,
            uo.nombre || ' ' || uo.apellido AS operador_nombre,
            uc.nombre || ' ' || uc.apellido AS creador_nombre,
            ug.nombre || ' ' || ug.apellido AS guia_nombre
     FROM cusi.reservas r
     LEFT JOIN cusi.servicios_turisticos st ON st.id = r.servicio_id
     LEFT JOIN cusi.usuarios uo             ON uo.id = r.usuario_operador_id
     LEFT JOIN cusi.usuarios uc             ON uc.id = r.usuario_creador_id
     LEFT JOIN cusi.usuarios ug             ON ug.id = r.usuario_guia_id
     WHERE r.id = $1`,
    [id]
  );
  if (!rows.length) throw new AppError('Reserva no encontrada', 404, 'NOT_FOUND');

  const reserva = rows[0];
  const { rows: pasajeros } = await query(
    `SELECT * FROM cusi.pasajeros WHERE reserva_id = $1 ORDER BY apellido, nombre`,
    [id]
  );
  const { rows: tareas } = await query(
    `SELECT t.*, u.nombre || ' ' || u.apellido AS asignado_a
     FROM cusi.tareas_pendientes t
     LEFT JOIN cusi.usuarios u ON u.id = t.usuario_id
     WHERE t.reserva_id = $1 ORDER BY t.prioridad DESC, t.fecha_vencimiento`,
    [id]
  );
  const { rows: detalles } = await query(
    `SELECT d.*, p.nombre AS proveedor_nombre, p.tipo AS proveedor_tipo,
            eu.nombre || ' ' || eu.apellido AS estado_actualizado_por_nombre
     FROM cusi.detalles_operacion_proveedor d
     LEFT JOIN cusi.proveedores p  ON p.id  = d.proveedor_id
     LEFT JOIN cusi.usuarios    eu ON eu.id = d.estado_actualizado_por_id
     WHERE d.reserva_id = $1 ORDER BY d.fecha_inicio`,
    [id]
  );
  const { rows: serviciosAdicionales } = await query(
    `SELECT * FROM cusi.reserva_servicios_adicionales WHERE reserva_id = $1 ORDER BY id`,
    [id]
  );

  return { ...reserva, pasajeros, tareas, detalles, servicios_adicionales: serviciosAdicionales };
};

const create = async (data, userId) => {
  return withTransaction(async (client) => {
    // Obtener snapshot del nombre del servicio si se proporciona
    let nombreSnap = data.nombre_servicio_snap;
    if (data.servicio_id && !nombreSnap) {
      const { rows } = await client.query(
        'SELECT nombre FROM cusi.servicios_turisticos WHERE id = $1',
        [data.servicio_id]
      );
      if (rows.length) nombreSnap = rows[0].nombre;
    }

    // Si el usuario ingresó un código personalizado al crear la reserva, se
    // respeta; si no, se inserta con 'TEMP' y se reemplaza abajo por el
    // código autogenerado R-{año}-{id} (necesita el id, que recién existe
    // después del INSERT).
    const codigoManual = data.codigo_reserva && data.codigo_reserva.trim();

    const { rows } = await client.query(
      `INSERT INTO cusi.reservas
         (servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin,
          hora_encuentro, lugar_encuentro, n_pasajeros, idioma_servicio,
          estado_operacion, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd,
          agencia_nombre, agencia_codigo, operador_nombre,
          usuario_creador_id, usuario_operador_id, usuario_guia_id, observaciones, notas_internas,
          modalidad_servicio, codigo_reserva)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       RETURNING id`,
      [
        data.servicio_id       || null,
        nombreSnap             || null,
        data.fecha_inicio      || null,
        data.fecha_fin         || null,
        data.hora_encuentro    || null,
        data.lugar_encuentro   || null,
        data.n_pasajeros,
        data.idioma_servicio,
        data.estado_operacion,
        data.precio_usd_por_pax,
        data.total_usd,
        data.adelanto_usd,
        data.descuento_usd,
        data.agencia_nombre    || null,
        data.agencia_codigo    || null,
        data.operador_nombre   || null,
        userId,
        data.usuario_operador_id || null,
        data.usuario_guia_id   || null,
        data.observaciones     || null,
        data.notas_internas    || null,
        data.modalidad_servicio || null,
        codigoManual            || 'TEMP',
      ]
    );

    const newId  = rows[0].id;
    const codigo = codigoManual || `R-${new Date().getFullYear()}-${String(newId).padStart(5, '0')}`;

    const { rows: updated } = await client.query(
      'UPDATE cusi.reservas SET codigo_reserva = $1 WHERE id = $2 RETURNING *',
      [codigo, newId]
    );

    if (data.servicio_id) {
      await instanciarPlantillaOperaciones(client, data.servicio_id, newId, data.fecha_inicio);
    }
    await syncServiciosAdicionales(client, newId, data.servicios_adicionales);

    await client.query(
      `INSERT INTO cusi.logs_auditoria (tabla, operacion, registro_id, usuario_id, datos_despues)
       VALUES ($1,$2,$3,$4,$5)`,
      ['reservas', 'INSERT', newId, userId, JSON.stringify({ codigo_reserva: codigo })]
    );

    return updated[0];
  });
};

const update = async (id, data, userId) => {
  const { servicios_adicionales, ...camposReserva } = data;
  const campos = Object.keys(camposReserva);
  if (!campos.length && servicios_adicionales === undefined) {
    throw new AppError('Sin datos para actualizar', 400, 'EMPTY_UPDATE');
  }

  const norm = v => (v === '' ? null : v);

  // Antes el UPDATE de la reserva y el sync de servicios_adicionales corrían
  // como dos operaciones independientes (sin transacción compartida): si la
  // segunda fallaba (ej. error de conexión), la reserva quedaba con un
  // total_usd ya actualizado pero sin que sus líneas de extras reflejaran
  // ese cambio — el total dejaba de cuadrar con su propio desglose.
  const row = await withTransaction(async (client) => {
    let updated;
    if (campos.length) {
      const sets   = campos.map((k, i) => `${k} = $${i + 2}`);
      const values = campos.map(k => norm(camposReserva[k]));
      const { rows } = await client.query(
        `UPDATE cusi.reservas SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
      if (!rows.length) throw new AppError('Reserva no encontrada', 404, 'NOT_FOUND');
      updated = rows[0];
    }

    if (servicios_adicionales !== undefined) {
      await syncServiciosAdicionales(client, id, servicios_adicionales);
    }

    if (!updated) {
      const { rows } = await client.query('SELECT * FROM cusi.reservas WHERE id = $1', [id]);
      if (!rows.length) throw new AppError('Reserva no encontrada', 404, 'NOT_FOUND');
      updated = rows[0];
    }
    return updated;
  });

  await query(
    `INSERT INTO cusi.logs_auditoria (tabla, operacion, registro_id, usuario_id, datos_despues)
     VALUES ($1,$2,$3,$4,$5)`,
    ['reservas', 'UPDATE', id, userId, JSON.stringify(data)]
  );

  return row;
};

const cambiarEstado = async (id, estado_operacion, userId) => {
  return update(id, { estado_operacion }, userId);
};

const remove = async (id, userId) => {
  const { rowCount } = await query(
    'DELETE FROM cusi.reservas WHERE id = $1',
    [id]
  );
  if (!rowCount) throw new AppError('Reserva no encontrada', 404, 'NOT_FOUND');

  await query(
    `INSERT INTO cusi.logs_auditoria (tabla, operacion, registro_id, usuario_id)
     VALUES ($1,$2,$3,$4)`,
    ['reservas', 'DELETE', id, userId]
  );
};

module.exports = { getAll, getCalendario, getById, create, update, cambiarEstado, remove };
