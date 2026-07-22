const { query }    = require('../config/database');
const { AppError } = require('../middleware/error.middleware');

const getByReserva = async (reservaId) => {
  const { rows } = await query(
    `SELECT * FROM cusi.pasajeros
     WHERE reserva_id = $1
     ORDER BY apellido, nombre`,
    [reservaId]
  );
  return rows;
};

const getById = async (id) => {
  const { rows } = await query(
    `SELECT p.*, r.codigo_reserva
     FROM cusi.pasajeros p
     JOIN cusi.reservas r ON r.id = p.reserva_id
     WHERE p.id = $1`,
    [id]
  );
  if (!rows.length) throw new AppError('Pasajero no encontrado', 404, 'NOT_FOUND');
  return rows[0];
};

const alertasVencimiento = async () => {
  const { rows } = await query(
    'SELECT * FROM cusi.v_alertas_pasaportes ORDER BY pasaporte_vencimiento'
  );
  return rows;
};

const create = async (data) => {
  const { rows } = await query(
    `INSERT INTO cusi.pasajeros
       (reserva_id, nombre, apellido, genero, fecha_nacimiento, nacionalidad,
        pasaporte, pasaporte_vencimiento, email, telefono, whatsapp,
        es_vegetariano, es_vegano, es_pescetariano, es_flexitariano,
        es_celiaco, es_diabetico, es_halal, sin_lactosa,
        quechua_extra_kg, trekking_poles, sleeping_bag, carpa_privada,
        alergias, restricciones_alimenticias, condicion_medica, observaciones)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
     RETURNING *`,
    [
      data.reserva_id,
      data.nombre,
      data.apellido,
      data.genero                || 'NO_ESPECIFICADO',
      data.fecha_nacimiento      || null,
      data.nacionalidad          || null,
      data.pasaporte             || null,
      data.pasaporte_vencimiento || null,
      data.email                 || null,
      data.telefono              || null,
      data.whatsapp              || null,
      data.es_vegetariano        ?? false,
      data.es_vegano             ?? false,
      data.es_pescetariano       ?? false,
      data.es_flexitariano       ?? false,
      data.es_celiaco            ?? false,
      data.es_diabetico          ?? false,
      data.es_halal              ?? false,
      data.sin_lactosa           ?? false,
      data.quechua_extra_kg      || null,
      data.trekking_poles        ?? false,
      data.sleeping_bag          ?? false,
      data.carpa_privada         ?? false,
      data.alergias              || null,
      data.restricciones_alimenticias || null,
      data.condicion_medica      || null,
      data.observaciones         || null,
    ]
  );
  return rows[0];
};

const update = async (id, data) => {
  const campos  = Object.keys(data);
  if (!campos.length) throw new AppError('Sin datos para actualizar', 400, 'EMPTY_UPDATE');

  // Normaliza strings vacíos a NULL igual que create(), para no violar
  // CHECK constraints (ej. pasaporte, fechas) al limpiar un campo opcional.
  const norm   = v => (v === '' ? null : v);
  const sets   = campos.map((k, i) => `${k} = $${i + 2}`);
  const values = campos.map(k => norm(data[k]));

  const { rows } = await query(
    `UPDATE cusi.pasajeros SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  if (!rows.length) throw new AppError('Pasajero no encontrado', 404, 'NOT_FOUND');
  return rows[0];
};

const remove = async (id) => {
  const { rowCount } = await query(
    'DELETE FROM cusi.pasajeros WHERE id = $1',
    [id]
  );
  if (!rowCount) throw new AppError('Pasajero no encontrado', 404, 'NOT_FOUND');
};

module.exports = { getByReserva, getById, alertasVencimiento, create, update, remove };
