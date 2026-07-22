-- ============================================================
-- CUSI TRAVEL — Migración v3
-- Tabla agencias + campos de restricciones alimentarias y
-- equipamiento en pasajeros
-- ============================================================
-- EJECUCIÓN:
--   psql -U cusi_admin -d cusi_travel -f 04_migration.sql
--   (o node migrate.js <DATABASE_URL> apuntando a este archivo)
-- ============================================================

SET search_path TO cusi, public;

-- ── 1. Tabla agencias (clientes que envían reservas) ──────────
CREATE TABLE IF NOT EXISTS agencias (
  id             SERIAL       PRIMARY KEY,
  nombre         VARCHAR(200) NOT NULL,
  codigo         VARCHAR(50),
  contacto       VARCHAR(200),
  telefono       VARCHAR(30),
  email          VARCHAR(150),
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_agencias_actualizado_en'
  ) THEN
    CREATE TRIGGER trg_agencias_actualizado_en
      BEFORE UPDATE ON agencias
      FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();
  END IF;
END$$;

-- ── 2. Nuevos campos en pasajeros: restricciones alimentarias ──
ALTER TABLE pasajeros ADD COLUMN IF NOT EXISTS es_pescetariano BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE pasajeros ADD COLUMN IF NOT EXISTS es_flexitariano BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE pasajeros ADD COLUMN IF NOT EXISTS es_halal        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE pasajeros ADD COLUMN IF NOT EXISTS sin_lactosa     BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 3. Nuevos campos en pasajeros: equipamiento de trekking ────
ALTER TABLE pasajeros ADD COLUMN IF NOT EXISTS quechua_extra_kg VARCHAR(2)
  CHECK (quechua_extra_kg IS NULL OR quechua_extra_kg IN ('8', '15'));
ALTER TABLE pasajeros ADD COLUMN IF NOT EXISTS trekking_poles BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE pasajeros ADD COLUMN IF NOT EXISTS sleeping_bag   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE pasajeros ADD COLUMN IF NOT EXISTS carpa_privada  BOOLEAN NOT NULL DEFAULT FALSE;
