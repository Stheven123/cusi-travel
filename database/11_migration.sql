-- ============================================================
-- CUSI TRAVEL — Migración v9b
-- proveedor_id deja de ser obligatorio en operaciones — sigue
-- siendo requerido salvo cuando tipo_servicio = 'INGRESOS'
-- (registro libre, sin proveedor).
-- ============================================================
-- EJECUCIÓN (después de 10_migration.sql):
--   node run_migration.js 11_migration.sql
-- ============================================================

SET search_path TO cusi, public;

ALTER TABLE detalles_operacion_proveedor ALTER COLUMN proveedor_id DROP NOT NULL;

ALTER TABLE detalles_operacion_proveedor
  DROP CONSTRAINT IF EXISTS chk_detalles_proveedor_o_ingreso;
ALTER TABLE detalles_operacion_proveedor
  ADD CONSTRAINT chk_detalles_proveedor_o_ingreso
  CHECK (proveedor_id IS NOT NULL OR tipo_servicio = 'INGRESOS');
