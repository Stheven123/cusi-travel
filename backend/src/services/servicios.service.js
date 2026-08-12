const { query, withTransaction } = require('../config/database');
const { AppError }               = require('../middleware/error.middleware');

const getAll = async (q = {}) => {
  const conds  = ['1=1'];
  const values = [];
  let   idx    = 1;

  if (q.tipo)    { conds.push(`tipo = $${idx++}`);             values.push(q.tipo); }
  if (q.activo !== undefined) {
    conds.push(`activo = $${idx++}`);
    values.push(q.activo === 'true' || q.activo === true);
  }
  if (q.busqueda) {
    conds.push(`(nombre ILIKE $${idx} OR codigo ILIKE $${idx})`);
    values.push(`%${q.busqueda}%`);
    idx++;
  }

  const { rows } = await query(
    `SELECT s.*, creador.nombre || ' ' || creador.apellido AS creado_por_nombre,
            COUNT(i.id)::int AS total_dias_itinerario,
            (SELECT COALESCE(json_agg(jsonb_build_object('id', ca.id, 'nombre', ca.nombre, 'precio_usd', ca.precio_usd) ORDER BY ca.orden), '[]'::json)
               FROM cusi.plantilla_servicios_adicionales ca WHERE ca.servicio_id = s.id) AS catalogo_adicionales
     FROM cusi.servicios_turisticos s
     LEFT JOIN cusi.usuarios creador ON creador.id = s.creado_por
     LEFT JOIN cusi.itinerarios i    ON i.servicio_id = s.id
     WHERE ${conds.join(' AND ')}
     GROUP BY s.id, creador.nombre, creador.apellido
     ORDER BY s.nombre`,
    values
  );
  return rows;
};

const getById = async (id) => {
  const { rows } = await query(
    'SELECT * FROM cusi.servicios_turisticos WHERE id = $1',
    [id]
  );
  if (!rows.length) throw new AppError('Servicio no encontrado', 404, 'NOT_FOUND');

  const { rows: itinerarios } = await query(
    'SELECT * FROM cusi.itinerarios WHERE servicio_id = $1 ORDER BY dia_numero',
    [id]
  );

  const { rows: plantillaOperaciones } = await query(
    `SELECT po.*, p.nombre AS proveedor_nombre
     FROM cusi.plantilla_operaciones po
     LEFT JOIN cusi.proveedores p ON p.id = po.proveedor_id
     WHERE po.servicio_id = $1 ORDER BY po.orden, po.id`,
    [id]
  );
  const { rows: plantillaTareas } = await query(
    `SELECT pt.* FROM cusi.plantilla_tareas_operacion pt
     JOIN cusi.plantilla_operaciones po ON po.id = pt.plantilla_operacion_id
     WHERE po.servicio_id = $1 ORDER BY pt.orden, pt.id`,
    [id]
  );
  const operaciones = plantillaOperaciones.map(op => ({
    ...op,
    tareas: plantillaTareas.filter(t => t.plantilla_operacion_id === op.id),
  }));

  const { rows: catalogoAdicionales } = await query(
    `SELECT * FROM cusi.plantilla_servicios_adicionales WHERE servicio_id = $1 ORDER BY orden, id`,
    [id]
  );

  return { ...rows[0], itinerarios, plantilla_operaciones: operaciones, catalogo_adicionales: catalogoAdicionales };
};

// ── Sincroniza plantilla_operaciones (+ tareas) y catálogo de extras ──
// Estrategia: borrar todo lo existente y reinsertar (volumen bajo, evita
// diffing complejo). Se llama dentro de una transacción desde create/update.
const syncPlantillas = async (client, servicioId, data) => {
  if (Array.isArray(data.plantilla_operaciones)) {
    await client.query('DELETE FROM cusi.plantilla_operaciones WHERE servicio_id = $1', [servicioId]);
    for (let i = 0; i < data.plantilla_operaciones.length; i++) {
      const op = data.plantilla_operaciones[i];
      const { rows } = await client.query(
        `INSERT INTO cusi.plantilla_operaciones
           (servicio_id, tipo_servicio, proveedor_id, descripcion, cantidad, costo_unitario_usd, moneda, orden)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id`,
        [
          servicioId, op.tipo_servicio, op.proveedor_id || null, op.descripcion || null,
          Number(op.cantidad) || 1, Number(op.costo_unitario_usd) || 0, op.moneda || 'USD', i + 1,
        ]
      );
      const plantillaOpId = rows[0].id;
      const tareas = Array.isArray(op.tareas) ? op.tareas : [];
      for (let j = 0; j < tareas.length; j++) {
        const titulo = (tareas[j].titulo || tareas[j]) + '';
        if (!titulo.trim()) continue;
        await client.query(
          `INSERT INTO cusi.plantilla_tareas_operacion (plantilla_operacion_id, titulo, orden) VALUES ($1,$2,$3)`,
          [plantillaOpId, titulo, j + 1]
        );
      }
    }
  }

  if (Array.isArray(data.catalogo_adicionales)) {
    await client.query('DELETE FROM cusi.plantilla_servicios_adicionales WHERE servicio_id = $1', [servicioId]);
    for (let i = 0; i < data.catalogo_adicionales.length; i++) {
      const item = data.catalogo_adicionales[i];
      if (!item.nombre || !item.nombre.trim()) continue;
      await client.query(
        `INSERT INTO cusi.plantilla_servicios_adicionales (servicio_id, nombre, precio_usd, orden) VALUES ($1,$2,$3,$4)`,
        [servicioId, item.nombre, Number(item.precio_usd) || 0, i + 1]
      );
    }
  }
};

const create = async (data, userId) => {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO cusi.servicios_turisticos
         (codigo, nombre, descripcion, tipo, duracion_dias, precio_base_usd,
          nivel_dificultad, min_pax, max_pax, incluye, no_incluye, que_llevar,
          politica_cancelacion, activo, es_plantilla, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        data.codigo, data.nombre, data.descripcion || null,
        data.tipo, data.duracion_dias, data.precio_base_usd,
        data.nivel_dificultad || null, data.min_pax, data.max_pax || null,
        data.incluye || null, data.no_incluye || null, data.que_llevar || null,
        data.politica_cancelacion || null,
        data.activo ?? true, data.es_plantilla ?? false, userId,
      ]
    );
    await syncPlantillas(client, rows[0].id, data);
    return rows[0];
  });
};

const update = async (id, data) => {
  const { plantilla_operaciones, catalogo_adicionales, ...camposServicio } = data;
  const campos = Object.keys(camposServicio);

  return withTransaction(async (client) => {
    let servicio;
    if (campos.length) {
      const sets   = campos.map((k, i) => `${k} = $${i + 2}`);
      const values = campos.map(k => camposServicio[k]);
      const { rows } = await client.query(
        `UPDATE cusi.servicios_turisticos SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
      if (!rows.length) throw new AppError('Servicio no encontrado', 404, 'NOT_FOUND');
      servicio = rows[0];
    } else {
      const { rows } = await client.query('SELECT * FROM cusi.servicios_turisticos WHERE id = $1', [id]);
      if (!rows.length) throw new AppError('Servicio no encontrado', 404, 'NOT_FOUND');
      servicio = rows[0];
    }
    await syncPlantillas(client, id, data);
    return servicio;
  });
};

// Llama a la función SQL fn_clonar_servicio que clona servicio + itinerarios
const clonar = async (id, nuevoCodigo, nuevoNombre, userId) => {
  const { rows } = await query(
    'SELECT cusi.fn_clonar_servicio($1, $2, $3, $4) AS nuevo_id',
    [id, nuevoCodigo, nuevoNombre, userId]
  );
  const nuevoId = rows[0].nuevo_id;
  return getById(nuevoId);
};

// Soft delete — preserva historial de reservas que referencian este servicio
const remove = async (id) => {
  const { rows } = await query(
    'UPDATE cusi.servicios_turisticos SET activo = FALSE WHERE id = $1 RETURNING id',
    [id]
  );
  if (!rows.length) throw new AppError('Servicio no encontrado', 404, 'NOT_FOUND');
};

const addItinerario = async (servicioId, data) => {
  const { rows } = await query(
    `INSERT INTO cusi.itinerarios
       (servicio_id, dia_numero, titulo, descripcion, altitud_max_msnm,
        distancia_km, horas_caminata, desayuno, almuerzo, cena, box_lunch,
        alojamiento, notas_operativas, orden)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      servicioId, data.dia_numero, data.titulo, data.descripcion || null,
      data.altitud_max_msnm || null, data.distancia_km || null, data.horas_caminata || null,
      data.desayuno ?? false, data.almuerzo ?? false, data.cena ?? false, data.box_lunch ?? false,
      data.alojamiento || null, data.notas_operativas || null, data.orden ?? 1,
    ]
  );
  return rows[0];
};

const updateItinerario = async (diaId, data) => {
  const campos  = Object.keys(data);
  if (!campos.length) throw new AppError('Sin datos para actualizar', 400, 'EMPTY_UPDATE');

  const sets   = campos.map((k, i) => `${k} = $${i + 2}`);
  const values = campos.map(k => data[k]);

  const { rows } = await query(
    `UPDATE cusi.itinerarios SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    [diaId, ...values]
  );
  if (!rows.length) throw new AppError('Itinerario no encontrado', 404, 'NOT_FOUND');
  return rows[0];
};

const deleteItinerario = async (diaId) => {
  const { rowCount } = await query(
    'DELETE FROM cusi.itinerarios WHERE id = $1',
    [diaId]
  );
  if (!rowCount) throw new AppError('Itinerario no encontrado', 404, 'NOT_FOUND');
};

module.exports = { getAll, getById, create, update, clonar, remove, addItinerario, updateItinerario, deleteItinerario };
