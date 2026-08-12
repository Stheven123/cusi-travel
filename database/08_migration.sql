-- ============================================================
-- CUSI TRAVEL — Migración v7
-- Moneda (USD/PEN) en operaciones de proveedor
-- ============================================================
-- EJECUCIÓN:
--   node run_migration.js 08_migration.sql
-- ============================================================

SET search_path TO cusi, public;

ALTER TABLE detalles_operacion_proveedor ADD COLUMN IF NOT EXISTS moneda VARCHAR(3)
  NOT NULL DEFAULT 'USD'
  CHECK (moneda IN ('USD', 'PEN'));
