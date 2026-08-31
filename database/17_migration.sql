-- ============================================================
-- CUSI TRAVEL — Migración 17
-- 1) reserva_notas: columna opcional para vincular una nota a la
--    operación (detalle_operacion_proveedor) que la originó, y así
--    poder sincronizar (upsert) sin duplicar cuando se edita la
--    misma operación varias veces.
-- 2) v_reporte_proveedores: agrega columnas de briefing (el reporte
--    de proveedores no tenía forma de incluir el briefing asociado
--    a la reserva).
-- ============================================================
-- EJECUCIÓN:
--   node run_migration.js 17_migration.sql
-- ============================================================

SET search_path TO cusi, public;

-- ── 1. reserva_notas.detalle_operacion_id ──────────────────────
ALTER TABLE reserva_notas
  ADD COLUMN IF NOT EXISTS detalle_operacion_id INTEGER
    REFERENCES detalles_operacion_proveedor(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS ux_reserva_notas_detalle_operacion
  ON reserva_notas(detalle_operacion_id)
  WHERE detalle_operacion_id IS NOT NULL;

-- ── 2. v_reporte_proveedores + briefing más relevante por reserva ──
CREATE OR REPLACE VIEW v_reporte_proveedores AS
SELECT
  d.id                            AS detalle_id,
  d.estado                        AS detalle_estado,
  d.tipo_servicio,
  d.fecha_inicio,
  d.fecha_fin,
  d.hora_inicio,
  d.cantidad,
  d.costo_unitario_usd,
  d.costo_total_usd,
  d.descripcion                   AS servicio_descripcion,
  d.confirmacion_ref,
  d.notas,
  pv.id                           AS proveedor_id,
  pv.nombre                       AS proveedor_nombre,
  pv.tipo                         AS proveedor_tipo,
  pv.contacto_nombre,
  pv.contacto_email,
  pv.contacto_telefono,
  r.id                            AS reserva_id,
  r.codigo_reserva,
  r.fecha_inicio                  AS reserva_fecha_inicio,
  r.fecha_fin                     AS reserva_fecha_fin,
  r.n_pasajeros,
  r.estado_operacion              AS reserva_estado,
  r.agencia_nombre,
  r.idioma_servicio,
  st.nombre                       AS servicio_turistico,
  b.fecha                         AS briefing_fecha,
  b.hora                          AS briefing_hora,
  b.lugar                         AS briefing_lugar,
  b.persona_encargada             AS briefing_persona_encargada,
  b.notas                         AS briefing_notas
FROM detalles_operacion_proveedor d
JOIN proveedores         pv ON pv.id = d.proveedor_id
JOIN reservas            r  ON r.id  = d.reserva_id
LEFT JOIN servicios_turisticos st ON st.id = r.servicio_id
LEFT JOIN LATERAL (
  SELECT fecha, hora, lugar, persona_encargada, notas
  FROM briefings
  WHERE reserva_id = r.id
  ORDER BY (fecha >= r.fecha_inicio) DESC, fecha DESC
  LIMIT 1
) b ON TRUE;

COMMENT ON VIEW v_reporte_proveedores IS 'Vista base para el motor de reportes a proveedores con filtros dinámicos (incluye el briefing más relevante de la reserva)';
