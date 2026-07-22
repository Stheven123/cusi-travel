-- ============================================================
-- CUSI TRAVEL — Migración v2
-- Nuevos estados de operación + tabla briefings
-- ============================================================
-- EJECUCIÓN (fuera de transacción, ALTER TYPE lo requiere):
--   psql -U cusi_admin -d cusi_travel -f 03_migration.sql
-- ============================================================

SET search_path TO cusi, public;

-- ── 1. Nuevos valores al enum estado_detalle_proveedor ────────
-- ALTER TYPE ADD VALUE no puede ejecutarse dentro de BEGIN/COMMIT
ALTER TYPE estado_detalle_proveedor ADD VALUE IF NOT EXISTS 'PENDIENTE';
ALTER TYPE estado_detalle_proveedor ADD VALUE IF NOT EXISTS 'RESERVADO';
ALTER TYPE estado_detalle_proveedor ADD VALUE IF NOT EXISTS 'PAGADO';
ALTER TYPE estado_detalle_proveedor ADD VALUE IF NOT EXISTS 'RECONFIRMADO';
ALTER TYPE estado_detalle_proveedor ADD VALUE IF NOT EXISTS 'EMITIDO';
ALTER TYPE estado_detalle_proveedor ADD VALUE IF NOT EXISTS 'ANULADO';
ALTER TYPE estado_detalle_proveedor ADD VALUE IF NOT EXISTS 'FACTURADO';

-- ── 2. Tabla briefings ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS briefings (
  id                SERIAL       PRIMARY KEY,
  reserva_id        INTEGER      REFERENCES reservas(id) ON DELETE CASCADE,
  fecha             DATE         NOT NULL,
  hora              TIME,
  hora_salida       TIME,
  lugar             VARCHAR(300),
  persona_encargada VARCHAR(200),
  notas             TEXT,
  creado_por_id     INTEGER      REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_briefings_reserva ON briefings(reserva_id);
CREATE INDEX IF NOT EXISTS idx_briefings_fecha   ON briefings(fecha);

-- ── 3. Trigger actualizado_en en briefings ────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_briefings_actualizado_en'
  ) THEN
    CREATE TRIGGER trg_briefings_actualizado_en
      BEFORE UPDATE ON briefings
      FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();
  END IF;
END$$;
