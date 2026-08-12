-- ============================================================
-- CUSI TRAVEL — Migración v8
-- Checklist de tareas por operación (detalle_operacion_proveedor)
-- Ej: para una operación de tipo GUIA — fecha de confirmación,
-- reconfirmación, entrega de sobre/equipo, comprobantes, pago...
-- ============================================================
-- EJECUCIÓN:
--   node run_migration.js 09_migration.sql
-- ============================================================

SET search_path TO cusi, public;

CREATE TABLE IF NOT EXISTS tareas_operacion (
  id                SERIAL        PRIMARY KEY,
  detalle_id        INTEGER       NOT NULL REFERENCES detalles_operacion_proveedor(id) ON DELETE CASCADE,
  titulo            VARCHAR(300)  NOT NULL,
  fecha             DATE,
  monto             NUMERIC(10,2),
  persona_encargada VARCHAR(200),
  completada        BOOLEAN       NOT NULL DEFAULT FALSE,
  orden             SMALLINT      NOT NULL DEFAULT 1,
  creado_en         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tareas_operacion_detalle ON tareas_operacion(detalle_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tareas_operacion_actualizado_en'
  ) THEN
    CREATE TRIGGER trg_tareas_operacion_actualizado_en
      BEFORE UPDATE ON tareas_operacion
      FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();
  END IF;
END$$;
