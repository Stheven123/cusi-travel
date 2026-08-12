-- ============================================================
-- CUSI TRAVEL — Migración v10b
-- Catálogo de servicios adicionales por paquete (con precio
-- sugerido) + los extras realmente agregados a cada reserva.
-- ============================================================
-- EJECUCIÓN:
--   node run_migration.js 13_migration.sql
-- ============================================================

SET search_path TO cusi, public;

CREATE TABLE IF NOT EXISTS plantilla_servicios_adicionales (
  id           SERIAL         PRIMARY KEY,
  servicio_id  INTEGER        NOT NULL REFERENCES servicios_turisticos(id) ON DELETE CASCADE,
  nombre       VARCHAR(200)   NOT NULL,
  precio_usd   NUMERIC(10,2)  NOT NULL DEFAULT 0,
  orden        SMALLINT       NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_plantilla_extras_servicio ON plantilla_servicios_adicionales(servicio_id);

CREATE TABLE IF NOT EXISTS reserva_servicios_adicionales (
  id                    SERIAL         PRIMARY KEY,
  reserva_id            INTEGER        NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  nombre                VARCHAR(200)   NOT NULL,
  cantidad              SMALLINT       NOT NULL DEFAULT 1,
  precio_unitario_usd   NUMERIC(10,2)  NOT NULL DEFAULT 0,
  creado_en             TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reserva_extras_reserva ON reserva_servicios_adicionales(reserva_id);
