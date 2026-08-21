-- ============================================================
-- CUSI TRAVEL — Migración v12
-- 1) Presupuesto libre por reserva (persiste en la hoja de la
--    propia reserva, igual que "observaciones").
-- 2) Campos documentarios + enlace de Drive en cada operación
--    (detalles_operacion_proveedor): tipo de documento, serie,
--    número y enlace de Google Drive.
-- 3) Auditoría de cambio de estado por operación: quién y cuándo
--    modificó por última vez el estado de una operación.
-- ============================================================
-- EJECUCIÓN:
--   node run_migration.js 15_migration.sql
-- ============================================================

SET search_path TO cusi, public;

-- ── 1. Presupuesto libre de la reserva ─────────────────────────
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS presupuesto TEXT;

-- ── 2. Documento + enlace de Drive en operaciones ──────────────
ALTER TABLE detalles_operacion_proveedor ADD COLUMN IF NOT EXISTS tipo_documento   VARCHAR(40);
ALTER TABLE detalles_operacion_proveedor ADD COLUMN IF NOT EXISTS serie_documento  VARCHAR(20);
ALTER TABLE detalles_operacion_proveedor ADD COLUMN IF NOT EXISTS numero_documento VARCHAR(30);
ALTER TABLE detalles_operacion_proveedor ADD COLUMN IF NOT EXISTS enlace_drive     TEXT;

-- ── 3. Auditoría de cambio de estado ───────────────────────────
ALTER TABLE detalles_operacion_proveedor ADD COLUMN IF NOT EXISTS estado_actualizado_por_id INTEGER
  REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE detalles_operacion_proveedor ADD COLUMN IF NOT EXISTS estado_actualizado_en TIMESTAMPTZ;

COMMENT ON COLUMN reservas.presupuesto IS 'Notas de presupuesto libres, editables desde la reserva';
COMMENT ON COLUMN detalles_operacion_proveedor.enlace_drive IS 'Enlace a Google Drive con el comprobante/documento de la operación';
COMMENT ON COLUMN detalles_operacion_proveedor.estado_actualizado_por_id IS 'Último usuario que cambió el campo estado';
COMMENT ON COLUMN detalles_operacion_proveedor.estado_actualizado_en IS 'Fecha/hora del último cambio de estado';
