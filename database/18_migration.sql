-- ============================================================
-- CUSI TRAVEL — Migración 18
-- Agrega "plazo límite" y "encargado" a cada operación de proveedor
-- (detalles_operacion_proveedor) — antes esos datos solo existían
-- a nivel de tarea de checklist, no en la operación misma.
-- ============================================================
-- EJECUCIÓN:
--   node run_migration.js 18_migration.sql
-- ============================================================

SET search_path TO cusi, public;

ALTER TABLE detalles_operacion_proveedor
  ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE,
  ADD COLUMN IF NOT EXISTS persona_encargada VARCHAR(200);

COMMENT ON COLUMN detalles_operacion_proveedor.fecha_vencimiento IS 'Plazo límite para confirmar/resolver esta operación (no confundir con fecha_inicio, que es la fecha del servicio en sí)';
COMMENT ON COLUMN detalles_operacion_proveedor.persona_encargada IS 'Persona del equipo responsable de dar seguimiento a esta operación';
