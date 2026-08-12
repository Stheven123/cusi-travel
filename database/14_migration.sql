-- ============================================================
-- CUSI TRAVEL — Migración v11
-- Nuevos tipos de operación/proveedor: COCINERO y PORTER
-- (quechuas/porteadores) — roles clave en los treks que antes
-- no existían como categoría propia (se registraban como
-- OPERADOR_LOCAL u OTRO, sin poder distinguirlos en reportes
-- ni en la Orden de Salida).
-- ============================================================
-- EJECUCIÓN:
--   node run_migration.js 14_migration.sql
-- ============================================================

SET search_path TO cusi, public;

ALTER TYPE tipo_proveedor ADD VALUE IF NOT EXISTS 'COCINERO';
ALTER TYPE tipo_proveedor ADD VALUE IF NOT EXISTS 'PORTER';
