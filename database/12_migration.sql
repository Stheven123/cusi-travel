-- ============================================================
-- CUSI TRAVEL — Migración v10a
-- Plantillas de operaciones por paquete: cada servicio_turistico
-- puede definir qué operaciones (hotel, guía, tren...) se crean
-- automáticamente al hacer una reserva de ese paquete, junto con
-- su checklist de tareas.
-- ============================================================
-- EJECUCIÓN:
--   node run_migration.js 12_migration.sql
-- ============================================================

SET search_path TO cusi, public;

CREATE TABLE IF NOT EXISTS plantilla_operaciones (
  id                  SERIAL         PRIMARY KEY,
  servicio_id         INTEGER        NOT NULL REFERENCES servicios_turisticos(id) ON DELETE CASCADE,
  tipo_servicio       tipo_proveedor NOT NULL,
  proveedor_id        INTEGER        REFERENCES proveedores(id) ON DELETE SET NULL,
  descripcion         VARCHAR(500),
  cantidad            SMALLINT       NOT NULL DEFAULT 1,
  costo_unitario_usd  NUMERIC(10,2)  NOT NULL DEFAULT 0,
  moneda              VARCHAR(3)     NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD','PEN')),
  orden               SMALLINT       NOT NULL DEFAULT 1,
  creado_en           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plantilla_operaciones_servicio ON plantilla_operaciones(servicio_id);

CREATE TABLE IF NOT EXISTS plantilla_tareas_operacion (
  id                       SERIAL       PRIMARY KEY,
  plantilla_operacion_id   INTEGER      NOT NULL REFERENCES plantilla_operaciones(id) ON DELETE CASCADE,
  titulo                   VARCHAR(300) NOT NULL,
  orden                    SMALLINT     NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_plantilla_tareas_operacion ON plantilla_tareas_operacion(plantilla_operacion_id);
