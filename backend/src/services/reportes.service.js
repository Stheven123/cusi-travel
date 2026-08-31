const { query }  = require('../config/database');
const ExcelJS    = require('exceljs');

const getKPIs = async () => {
  const hoy    = new Date();
  const mesAct = hoy.getMonth() + 1;
  const anio   = hoy.getFullYear();

  const { rows: [kpi] } = await query(
    `SELECT
       COUNT(*) FILTER (WHERE EXTRACT(MONTH FROM fecha_inicio) = $1 AND EXTRACT(YEAR FROM fecha_inicio) = $2)::int AS reservas_mes,
       COALESCE(SUM(n_pasajeros) FILTER (WHERE EXTRACT(MONTH FROM fecha_inicio) = $1 AND EXTRACT(YEAR FROM fecha_inicio) = $2), 0)::int AS pax_mes,
       COALESCE(SUM(total_usd)    FILTER (WHERE EXTRACT(MONTH FROM fecha_inicio) = $1 AND EXTRACT(YEAR FROM fecha_inicio) = $2), 0) AS ingreso_mes,
       COALESCE(SUM(adelanto_usd) FILTER (WHERE EXTRACT(MONTH FROM fecha_inicio) = $1 AND EXTRACT(YEAR FROM fecha_inicio) = $2), 0) AS adelanto_mes,
       COALESCE(AVG(total_usd)    FILTER (WHERE EXTRACT(MONTH FROM fecha_inicio) = $1 AND EXTRACT(YEAR FROM fecha_inicio) = $2 AND estado_operacion NOT IN ('ANULADO_SIN_PENALIDAD','ANULADO_CON_PENALIDAD')), 0)::numeric(10,2) AS ticket_promedio_mes,
       COALESCE(SUM(saldo_usd) FILTER (WHERE estado_pago IN ('PENDIENTE','PARCIAL') AND estado_operacion NOT IN ('ANULADO_SIN_PENALIDAD','ANULADO_CON_PENALIDAD')), 0) AS saldo_total_pendiente,
       COUNT(*) FILTER (WHERE estado_operacion IN ('COTIZACION','RESERVADO'))::int AS reservas_activas,
       COUNT(*) FILTER (WHERE fecha_inicio BETWEEN CURRENT_DATE AND CURRENT_DATE + 7 AND estado_operacion NOT IN ('ANULADO_SIN_PENALIDAD','ANULADO_CON_PENALIDAD'))::int AS proximas_7_dias
     FROM cusi.reservas`,
    [mesAct, anio]
  );

  const { rows: [pasajeros] } = await query(
    `SELECT COUNT(*)::int AS total FROM cusi.pasajeros`
  );
  const { rows: [tareas] } = await query(
    `SELECT COUNT(*)::int AS pendientes FROM cusi.tareas_pendientes
     WHERE estado IN ('PENDIENTE','EN_PROGRESO')`
  );
  const { rows: alertas } = await query(
    `SELECT COUNT(*)::int AS total FROM cusi.v_alertas_pasaportes WHERE nivel_alerta = 'CRITICO'`
  );

  return {
    ...kpi,
    total_pasajeros: pasajeros.total,
    tareas_pendientes: tareas.pendientes,
    alertas_pasaportes_criticas: alertas[0]?.total || 0,
  };
};

// Motor de reportes para proveedores con filtros avanzados y selección de campos
// NOTA: v_reporte_proveedores ya es una vista PLANA (sin alias de tabla) — las
// columnas se filtran por su nombre final, no por "d.xxx" (esa era la causa de
// que cualquier filtro rompiera el reporte con "missing FROM-clause entry").
const reporteProveedores = async (filtros = {}) => {
  const conds  = ['1=1'];
  const values = [];
  let   idx    = 1;

  if (filtros.proveedor_id)   { conds.push(`proveedor_id = $${idx++}`);   values.push(filtros.proveedor_id); }
  if (filtros.tipo_proveedor) { conds.push(`tipo_servicio = $${idx++}`);  values.push(filtros.tipo_proveedor); }
  if (filtros.fecha_desde)    { conds.push(`fecha_inicio >= $${idx++}`);  values.push(filtros.fecha_desde); }
  if (filtros.fecha_hasta)    { conds.push(`fecha_inicio <= $${idx++}`);  values.push(filtros.fecha_hasta); }
  if (filtros.estado)         { conds.push(`detalle_estado = $${idx++}`); values.push(filtros.estado); }
  if (filtros.reserva_ids?.length) {
    // Los IDs de reserva vienen validados como array de enteros desde el controller
    const placeholders = filtros.reserva_ids.map(() => `$${idx++}`).join(',');
    conds.push(`reserva_id IN (${placeholders})`);
    values.push(...filtros.reserva_ids);
  }

  const { rows } = await query(
    `SELECT * FROM cusi.v_reporte_proveedores WHERE ${conds.join(' AND ')}
     ORDER BY proveedor_nombre, fecha_inicio`,
    values
  );

  // Proyección de campos si se especificaron
  if (filtros.campos?.length) {
    return rows.map(row => {
      const out = {};
      filtros.campos.forEach(c => { if (c in row) out[c] = row[c]; });
      return out;
    });
  }

  return rows;
};

// Columnas por defecto si el usuario deselecciona todas en el frontend —
// evita volcar TODAS las columnas internas de la vista (ids, claves foráneas)
// cuando no se pidió ninguna en particular.
const CAMPOS_EXCEL_DEFAULT = [
  'codigo_reserva', 'reserva_fecha_inicio', 'n_pasajeros', 'proveedor_nombre',
  'tipo_servicio', 'fecha_inicio', 'costo_total_usd', 'detalle_estado',
];

// Genera el reporte de proveedores como archivo Excel (.xlsx) editable, con
// las mismas columnas/filtros que la vista JSON — reemplaza el "imprimir"
// (window.print) que era la única salida disponible hasta ahora.
const reporteProveedoresExcel = async (filtros = {}) => {
  const rows   = await reporteProveedores(filtros);
  const campos = filtros.campos?.length ? filtros.campos : CAMPOS_EXCEL_DEFAULT;
  const labels = filtros.labels || {};

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Cusi Travel'; wb.created = new Date();
  const ws = wb.addWorksheet('Reporte proveedores');

  ws.columns = campos.map(c => ({ header: labels[c] || c, key: c, width: 20 }));
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECF5' } };

  if (rows.length) {
    rows.forEach(r => ws.addRow(campos.reduce((acc, c) => { acc[c] = r[c] ?? ''; return acc; }, {})));
  } else {
    ws.mergeCells(2, 1, 2, campos.length || 1);
    ws.getCell(2, 1).value = 'Sin resultados para los filtros seleccionados.';
    ws.getCell(2, 1).font  = { italic: true, color: { argb: 'FF888888' } };
  }

  return wb;
};

const resumenMensual = async (anio, mes) => {
  const { rows } = await query(
    `SELECT
       r.estado_operacion,
       COUNT(*)::int AS total_reservas,
       SUM(r.n_pasajeros)::int AS total_pax,
       SUM(r.total_usd) AS ingreso_bruto,
       SUM(r.adelanto_usd) AS cobrado,
       SUM(r.saldo_usd) AS por_cobrar,
       AVG(r.total_usd)::numeric(10,2) AS ticket_promedio
     FROM cusi.reservas r
     WHERE EXTRACT(YEAR FROM r.fecha_inicio) = $1
       AND EXTRACT(MONTH FROM r.fecha_inicio) = $2
     GROUP BY r.estado_operacion
     ORDER BY total_reservas DESC`,
    [anio, mes]
  );

  const { rows: porServicio } = await query(
    `SELECT
       COALESCE(r.nombre_servicio_snap, st.nombre) AS servicio,
       COUNT(*)::int AS reservas,
       SUM(r.n_pasajeros)::int AS pax,
       SUM(r.total_usd) AS ingreso
     FROM cusi.reservas r
     LEFT JOIN cusi.servicios_turisticos st ON st.id = r.servicio_id
     WHERE EXTRACT(YEAR FROM r.fecha_inicio) = $1
       AND EXTRACT(MONTH FROM r.fecha_inicio) = $2
     GROUP BY COALESCE(r.nombre_servicio_snap, st.nombre)
     ORDER BY ingreso DESC`,
    [anio, mes]
  );

  return { por_estado: rows, por_servicio: porServicio };
};

const proximasReservas = async (dias = 7) => {
  const { rows } = await query(
    `SELECT r.id, r.codigo_reserva, r.fecha_inicio, r.fecha_fin,
            r.n_pasajeros, r.estado_operacion, r.estado_pago,
            r.hora_encuentro, r.lugar_encuentro, r.idioma_servicio,
            COALESCE(r.nombre_servicio_snap, st.nombre) AS servicio_nombre,
            st.tipo AS servicio_tipo,
            uo.nombre || ' ' || uo.apellido AS operador_nombre,
            COUNT(t.id) FILTER (WHERE t.estado = 'PENDIENTE')::int AS tareas_pendientes
     FROM cusi.reservas r
     LEFT JOIN cusi.servicios_turisticos st ON st.id = r.servicio_id
     LEFT JOIN cusi.usuarios uo             ON uo.id = r.usuario_operador_id
     LEFT JOIN cusi.tareas_pendientes t     ON t.reserva_id = r.id
     WHERE r.fecha_inicio BETWEEN CURRENT_DATE AND CURRENT_DATE + $1::int
       AND r.estado_operacion NOT IN ('ANULADO_SIN_PENALIDAD','ANULADO_CON_PENALIDAD')
     GROUP BY r.id, st.nombre, st.tipo, uo.nombre, uo.apellido
     ORDER BY r.fecha_inicio`,
    [dias]
  );
  return rows;
};

module.exports = { getKPIs, reporteProveedores, reporteProveedoresExcel, resumenMensual, proximasReservas };
