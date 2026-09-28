-- ============================================================
-- CUSI TRAVEL — Migración 20
-- 1) Operaciones "sin asignar": el proveedor deja de ser obligatorio
--    en las operaciones. Así una plantilla de paquete puede traer la
--    operación (con su checklist) sin proveedor, y el equipo lo asigna
--    después en la reserva — antes elegir un proveedor en la plantilla
--    era obligatorio y se terminaba poniendo uno cualquiera.
-- 2) Moneda (USD / PEN) en el monto del checklist de operaciones y de
--    la plantilla de operaciones — antes se asumía siempre USD.
-- ============================================================
-- EJECUCIÓN:
--   node run_migration.js 20_migration.sql
-- ============================================================

SET search_path TO cusi, public;

-- ── 1. Operaciones sin proveedor asignado ──────────────────────
ALTER TABLE detalles_operacion_proveedor
  DROP CONSTRAINT IF EXISTS chk_detalles_proveedor_o_ingreso;

-- ── 2. Moneda del monto en los checklists ──────────────────────
ALTER TABLE tareas_operacion
  ADD COLUMN IF NOT EXISTS moneda VARCHAR(3) NOT NULL DEFAULT 'USD';
ALTER TABLE plantilla_tareas_operacion
  ADD COLUMN IF NOT EXISTS moneda VARCHAR(3) NOT NULL DEFAULT 'USD';

ALTER TABLE tareas_operacion DROP CONSTRAINT IF EXISTS chk_tareas_operacion_moneda;
ALTER TABLE tareas_operacion
  ADD CONSTRAINT chk_tareas_operacion_moneda CHECK (moneda IN ('USD','PEN'));
ALTER TABLE plantilla_tareas_operacion DROP CONSTRAINT IF EXISTS chk_plantilla_tareas_operacion_moneda;
ALTER TABLE plantilla_tareas_operacion
  ADD CONSTRAINT chk_plantilla_tareas_operacion_moneda CHECK (moneda IN ('USD','PEN'));
