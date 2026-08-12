-- ============================================================
-- CUSI TRAVEL — Migración v6
-- Guía asignado a la reserva (usuario interno con rol GUIA)
-- ============================================================
-- EJECUCIÓN:
--   node run_migration.js 07_migration.sql
-- ============================================================

SET search_path TO cusi, public;

ALTER TABLE reservas ADD COLUMN IF NOT EXISTS usuario_guia_id INTEGER
  REFERENCES usuarios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reservas_guia ON reservas(usuario_guia_id);
