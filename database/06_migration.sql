-- ============================================================
-- CUSI TRAVEL — Migración v5
-- Duffel bag propio (distinto de quechua_extra_kg, que es el
-- cargo extra en kilos llevado por el porteador)
-- ============================================================
-- EJECUCIÓN:
--   node run_migration.js 06_migration.sql
-- ============================================================

SET search_path TO cusi, public;

ALTER TABLE pasajeros ADD COLUMN IF NOT EXISTS duffel_bag BOOLEAN NOT NULL DEFAULT FALSE;
