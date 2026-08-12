-- ============================================================
-- CUSI TRAVEL — Migración v9a
-- Nuevo valor de enum: INGRESOS (registro de ingreso libre,
-- sin proveedor obligatorio). Va en archivo separado porque
-- Postgres no permite usar un valor de enum recién agregado
-- dentro de la misma transacción en que se crea.
-- ============================================================
-- EJECUCIÓN:
--   node run_migration.js 10_migration.sql
-- ============================================================

SET search_path TO cusi, public;

ALTER TYPE tipo_proveedor ADD VALUE IF NOT EXISTS 'INGRESOS';
