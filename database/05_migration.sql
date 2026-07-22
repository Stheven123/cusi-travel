-- ============================================================
-- CUSI TRAVEL — Migración v4
-- Columna faltante politica_cancelacion en servicios_turisticos
-- (el backend/frontend ya la usaban, pero nunca se creó en BD —
--  causaba que "Nuevo paquete" fallara siempre con error 500)
-- ============================================================
-- EJECUCIÓN:
--   psql -U cusi_admin -d cusi_travel -f 05_migration.sql
-- ============================================================

SET search_path TO cusi, public;

ALTER TABLE servicios_turisticos ADD COLUMN IF NOT EXISTS politica_cancelacion TEXT;
