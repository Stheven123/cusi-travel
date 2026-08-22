-- ============================================================
-- CUSI TRAVEL — Migración v13
-- Notas y Presupuesto de reserva pasan de un campo de texto único
-- a tablas de filas (cada nota / cada línea de presupuesto es un
-- registro propio, editable y eliminable individualmente — igual
-- que briefings o servicios adicionales).
-- ============================================================
-- EJECUCIÓN:
--   node run_migration.js 16_migration.sql
-- ============================================================

SET search_path TO cusi, public;

-- La columna de texto libre queda reemplazada por reserva_presupuesto
ALTER TABLE reservas DROP COLUMN IF EXISTS presupuesto;

-- ── Notas de la reserva (una fila por nota) ────────────────────
CREATE TABLE IF NOT EXISTS reserva_notas (
  id             SERIAL       PRIMARY KEY,
  reserva_id     INTEGER      NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  texto          TEXT         NOT NULL,
  creado_por_id  INTEGER      REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reserva_notas_reserva ON reserva_notas(reserva_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reserva_notas_actualizado_en'
  ) THEN
    CREATE TRIGGER trg_reserva_notas_actualizado_en
      BEFORE UPDATE ON reserva_notas
      FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();
  END IF;
END$$;

-- ── Presupuesto de la reserva (una fila por línea de presupuesto) ──
CREATE TABLE IF NOT EXISTS reserva_presupuesto (
  id             SERIAL        PRIMARY KEY,
  reserva_id     INTEGER       NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  descripcion    VARCHAR(300)  NOT NULL,
  monto          NUMERIC(10,2) NOT NULL DEFAULT 0,
  moneda         VARCHAR(3)    NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD','PEN')),
  creado_por_id  INTEGER       REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reserva_presupuesto_reserva ON reserva_presupuesto(reserva_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reserva_presupuesto_actualizado_en'
  ) THEN
    CREATE TRIGGER trg_reserva_presupuesto_actualizado_en
      BEFORE UPDATE ON reserva_presupuesto
      FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();
  END IF;
END$$;
