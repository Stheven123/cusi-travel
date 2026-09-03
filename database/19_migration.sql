-- ============================================================
-- CUSI TRAVEL — Migración 19
-- 1) Agrega fecha límite, monto y persona encargada a las tareas de
--    checklist de una plantilla de operaciones (paquete) — antes solo
--    tenían título, a diferencia del checklist de una operación real.
-- 2) Agrega "modalidad_servicio" (compartido/privado) a la reserva.
-- ============================================================
-- EJECUCIÓN:
--   node run_migration.js 19_migration.sql
-- ============================================================

SET search_path TO cusi, public;

ALTER TABLE plantilla_tareas_operacion
  ADD COLUMN IF NOT EXISTS fecha             DATE,
  ADD COLUMN IF NOT EXISTS monto             NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS persona_encargada VARCHAR(200);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'modalidad_servicio') THEN
    CREATE TYPE modalidad_servicio AS ENUM ('COMPARTIDO', 'PRIVADO');
  END IF;
END$$;

ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS modalidad_servicio modalidad_servicio;

COMMENT ON COLUMN reservas.modalidad_servicio IS 'Tipo de servicio de la reserva: compartido o privado';
