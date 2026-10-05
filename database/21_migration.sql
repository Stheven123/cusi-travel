-- ============================================================
-- CUSI TRAVEL — Migración 21
-- 1) Día del paquete en cada operación de plantilla: las operaciones
--    de la plantilla se agrupan por día (Día 1, Día 2...) y al crear
--    la reserva cada operación cae en la fecha de su día
--    (fecha_inicio de la reserva + dia_numero - 1).
-- 2) Itinerario propio de una reserva (reserva_itinerarios): por
--    defecto la reserva usa el itinerario de su paquete; si se
--    personaliza, se guarda aquí y pasa a tener prioridad.
-- 3) Pagos de la reserva con fecha (reserva_pagos): un cliente puede
--    pagar en varias fechas. Cuando hay pagos, adelanto_usd es la suma.
-- ============================================================
-- EJECUCIÓN:
--   node run_migration.js 21_migration.sql
-- ============================================================

SET search_path TO cusi, public;

-- ── 1. Día de la operación en la plantilla del paquete ─────────
ALTER TABLE plantilla_operaciones
  ADD COLUMN IF NOT EXISTS dia_numero SMALLINT NOT NULL DEFAULT 1;

ALTER TABLE plantilla_operaciones DROP CONSTRAINT IF EXISTS chk_plantilla_operaciones_dia;
ALTER TABLE plantilla_operaciones
  ADD CONSTRAINT chk_plantilla_operaciones_dia CHECK (dia_numero >= 1);

-- ── 2. Itinerario personalizado por reserva ────────────────────
CREATE TABLE IF NOT EXISTS reserva_itinerarios (
  id               SERIAL       PRIMARY KEY,
  reserva_id       INTEGER      NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  dia_numero       SMALLINT     NOT NULL,
  titulo           VARCHAR(200) NOT NULL,
  descripcion      TEXT,
  altitud_max_msnm INTEGER,
  distancia_km     NUMERIC(6,2),
  horas_caminata   NUMERIC(4,1),
  desayuno         BOOLEAN      NOT NULL DEFAULT FALSE,
  almuerzo         BOOLEAN      NOT NULL DEFAULT FALSE,
  cena             BOOLEAN      NOT NULL DEFAULT FALSE,
  box_lunch        BOOLEAN      NOT NULL DEFAULT FALSE,
  alojamiento      VARCHAR(200),
  notas_operativas TEXT,
  orden            SMALLINT     NOT NULL DEFAULT 1,

  CONSTRAINT uq_reserva_itinerario_dia UNIQUE (reserva_id, dia_numero),
  CONSTRAINT chk_reserva_itin_dia      CHECK (dia_numero >= 1)
);

CREATE INDEX IF NOT EXISTS idx_reserva_itinerarios_reserva ON reserva_itinerarios(reserva_id);

COMMENT ON TABLE reserva_itinerarios IS 'Itinerario personalizado de una reserva. Si no tiene filas, la reserva usa el itinerario de su paquete.';

-- ── 3. Pagos con fecha ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reserva_pagos (
  id          SERIAL        PRIMARY KEY,
  reserva_id  INTEGER       NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  fecha       DATE          NOT NULL,
  monto       NUMERIC(10,2) NOT NULL,
  nota        VARCHAR(200),
  creado_en   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_reserva_pagos_monto CHECK (monto > 0)
);

CREATE INDEX IF NOT EXISTS idx_reserva_pagos_reserva ON reserva_pagos(reserva_id);

COMMENT ON TABLE reserva_pagos IS 'Pagos recibidos de una reserva, cada uno con su fecha. Si existen, reservas.adelanto_usd = suma de montos.';
