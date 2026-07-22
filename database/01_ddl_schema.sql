-- ============================================================
-- CUSI TRAVEL ERP — DDL PostgreSQL v1.0
-- Arquitectura empresarial — Production-ready
-- Comité de Ingeniería: Arquitecto de Datos + CISO + Lead UI/UX
-- ============================================================
-- EJECUCIÓN: psql -U cusi_admin -d cusi_travel -f 01_ddl_schema.sql
-- ============================================================

-- Eliminar schema anterior (SOLO EN DESARROLLO)
DROP SCHEMA IF EXISTS cusi CASCADE;
CREATE SCHEMA cusi;
SET search_path TO cusi, public;

-- ============================================================
-- SECCIÓN 1: TIPOS ENUMERADOS — Combolists de negocio
-- Definición centralizada para garantizar consistencia en toda
-- la aplicación y evitar strings libres en campos de estado.
-- ============================================================

-- Estados del ciclo operativo de una reserva
CREATE TYPE estado_operacion AS ENUM (
  'COTIZACION',           -- Propuesta enviada, sin compromiso
  'RESERVADO',            -- Cliente confirmó, pago pendiente
  'SERVICIO_COMPLETO',    -- Servicio ejecutado correctamente
  'PENDIENTE',            -- Requiere acción antes de confirmar
  'ANULADO_SIN_PENALIDAD',-- Cancelación sin cargo al cliente
  'ANULADO_CON_PENALIDAD' -- Cancelación con cargo / deducción
);

-- Estados del ciclo financiero de una reserva
CREATE TYPE estado_pago AS ENUM (
  'PENDIENTE',    -- Sin pago registrado
  'PARCIAL',      -- Adelanto recibido, saldo pendiente
  'PAGADO',       -- Liquidado al 100%
  'REEMBOLSADO',  -- Devolución procesada
  'ANULADO'       -- Pago invalidado (reserva cancelada)
);

-- Roles de acceso de empleados
CREATE TYPE rol_usuario AS ENUM (
  'ADMIN',        -- Acceso total + configuración del sistema
  'OPERACIONES',  -- Gestión de reservas, ordenes de servicio
  'VENTAS',       -- Creación de cotizaciones y reservas
  'GUIA',         -- Solo lectura de su agenda asignada
  'FINANZAS',     -- Módulo financiero + reportes
  'SOLO_LECTURA'  -- Consultas sin modificar datos
);

-- Categorías de proveedores de servicio turístico
CREATE TYPE tipo_proveedor AS ENUM (
  'HOTEL',
  'TRANSPORTE',
  'RESTAURANTE',
  'GUIA',
  'AEROLINEA',
  'TREN',
  'OPERADOR_LOCAL',
  'SEGURO',
  'ACTIVIDAD',
  'OTRO'
);

-- Categorías de productos turísticos
CREATE TYPE tipo_servicio_turistico AS ENUM (
  'TREK',            -- Trekking multi-día con camping
  'DAY_TOUR',        -- Tour de un día sin pernocte
  'CITY_TOUR',       -- Recorrido urbano
  'TRANSFER',        -- Traslado punto a punto
  'MULTI_DAY',       -- Paquete multi-día con hotel
  'VUELO',           -- Servicio aéreo
  'PAQUETE_COMPLETO' -- Combo integrado de servicios
);

-- Nivel de exigencia física del tour
CREATE TYPE nivel_dificultad AS ENUM (
  'FACIL',
  'MODERADO',
  'DIFICIL',
  'MUY_DIFICIL',
  'EXTREMO'
);

-- Urgencia de tareas operativas
CREATE TYPE prioridad_tarea AS ENUM (
  'BAJA',
  'MEDIA',
  'ALTA',
  'URGENTE'
);

-- Ciclo de vida de una tarea
CREATE TYPE estado_tarea AS ENUM (
  'PENDIENTE',
  'EN_PROGRESO',
  'COMPLETADA',
  'CANCELADA'
);

-- Estado de los servicios contratados a proveedores
CREATE TYPE estado_detalle_proveedor AS ENUM (
  'SOLICITADO',     -- Solicitud enviada al proveedor
  'CONFIRMADO',     -- Proveedor confirmó disponibilidad
  'COMPLETADO',     -- Servicio ejecutado
  'CANCELADO',      -- Servicio cancelado
  'PENDIENTE_PAGO'  -- Confirmado, pendiente pago al proveedor
);

CREATE TYPE genero AS ENUM ('M', 'F', 'NO_ESPECIFICADO');

-- ============================================================
-- SECCIÓN 2: TABLAS PRINCIPALES
-- Orden de creación respeta dependencias de FK
-- ============================================================

-- ------------------------------------------------------------
-- TABLA: usuarios
-- Empleados que acceden al sistema ERP.
-- ON DELETE RESTRICT en tareas: no se puede eliminar un
-- usuario con tareas activas asignadas (protección operativa).
-- ------------------------------------------------------------
CREATE TABLE usuarios (
  id               SERIAL       PRIMARY KEY,
  codigo           VARCHAR(20)  NOT NULL UNIQUE,          -- USR-001, USR-002...
  nombre           VARCHAR(100) NOT NULL,
  apellido         VARCHAR(100) NOT NULL,
  email            VARCHAR(200) NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL,                 -- bcrypt cost=12 obligatorio
  rol              rol_usuario  NOT NULL DEFAULT 'SOLO_LECTURA',
  avatar_iniciales VARCHAR(4),                            -- Ej: "JP" para Juan Pérez
  activo           BOOLEAN      NOT NULL DEFAULT TRUE,
  ultimo_acceso    TIMESTAMPTZ,
  creado_en        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_usuarios_email CHECK (
    email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
  ),
  CONSTRAINT chk_usuarios_codigo CHECK (codigo ~ '^USR-[0-9]{3,}$')
);

COMMENT ON TABLE  usuarios IS 'Empleados con acceso al ERP Cusi Travel';
COMMENT ON COLUMN usuarios.password_hash IS 'Hash bcrypt (cost >= 12). NUNCA texto plano.';
COMMENT ON COLUMN usuarios.rol IS 'Controla permisos en capa de negocio Node.js';


-- ------------------------------------------------------------
-- TABLA: proveedores
-- Hoteles, transportes, guías y demás socios operativos.
-- ON DELETE RESTRICT en detalles: no se puede eliminar un
-- proveedor que tenga operaciones registradas.
-- ------------------------------------------------------------
CREATE TABLE proveedores (
  id                SERIAL        PRIMARY KEY,
  codigo            VARCHAR(20)   NOT NULL UNIQUE,         -- PROV-001...
  nombre            VARCHAR(200)  NOT NULL,
  tipo              tipo_proveedor NOT NULL,
  contacto_nombre   VARCHAR(150),
  contacto_email    VARCHAR(200),
  contacto_telefono VARCHAR(30),
  whatsapp          VARCHAR(30),
  direccion         TEXT,
  ciudad            VARCHAR(100),
  pais              VARCHAR(100)  NOT NULL DEFAULT 'Perú',
  ruc               VARCHAR(20),
  cuenta_bancaria   VARCHAR(150),                          -- cifrar en producción
  moneda_pago       VARCHAR(10)   NOT NULL DEFAULT 'USD',
  activo            BOOLEAN       NOT NULL DEFAULT TRUE,
  observaciones     TEXT,
  creado_en         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_proveedores_moneda CHECK (moneda_pago IN ('USD','PEN','EUR','GBP')),
  CONSTRAINT chk_proveedores_ruc    CHECK (ruc IS NULL OR length(ruc) BETWEEN 8 AND 15)
);

COMMENT ON TABLE  proveedores IS 'Socios operativos: hoteles, transportes, guías, restaurantes';
COMMENT ON COLUMN proveedores.cuenta_bancaria IS 'Dato sensible — cifrar a nivel columna en producción (pgcrypto)';


-- ------------------------------------------------------------
-- TABLA: servicios_turisticos
-- Catálogo de productos vendibles. Incluye soporte para
-- clonar servicios completos con sus itinerarios.
-- ------------------------------------------------------------
CREATE TABLE servicios_turisticos (
  id               SERIAL              PRIMARY KEY,
  codigo           VARCHAR(30)         NOT NULL UNIQUE,    -- IT4D, STK5, CTC...
  nombre           VARCHAR(200)        NOT NULL,
  descripcion      TEXT,
  tipo             tipo_servicio_turistico NOT NULL,
  duracion_dias    SMALLINT            NOT NULL DEFAULT 1,
  precio_base_usd  NUMERIC(10,2)       NOT NULL DEFAULT 0,
  nivel_dificultad nivel_dificultad,
  min_pax          SMALLINT            NOT NULL DEFAULT 1,
  max_pax          SMALLINT,
  incluye          TEXT,
  no_incluye       TEXT,
  que_llevar       TEXT,
  activo           BOOLEAN             NOT NULL DEFAULT TRUE,
  es_plantilla     BOOLEAN             NOT NULL DEFAULT FALSE,
  clonado_de       INTEGER             REFERENCES servicios_turisticos(id) ON DELETE SET NULL,
  creado_por       INTEGER             REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  actualizado_en   TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_servicios_duracion   CHECK (duracion_dias >= 1),
  CONSTRAINT chk_servicios_precio     CHECK (precio_base_usd >= 0),
  CONSTRAINT chk_servicios_pax_min    CHECK (min_pax >= 1),
  CONSTRAINT chk_servicios_pax_max    CHECK (max_pax IS NULL OR max_pax >= min_pax)
);

COMMENT ON TABLE  servicios_turisticos IS 'Catálogo de productos turísticos de Cusi Travel';
COMMENT ON COLUMN servicios_turisticos.clonado_de IS 'FK auto-referencial: registra el servicio origen al duplicar';
COMMENT ON COLUMN servicios_turisticos.es_plantilla IS 'TRUE = plantilla base, no aparece en ventas directas';


-- ------------------------------------------------------------
-- TABLA: itinerarios
-- Detalle día a día de cada servicio turístico.
-- ON DELETE CASCADE: si se borra el servicio, se borran sus
-- días (es información exclusiva del servicio padre).
-- ------------------------------------------------------------
CREATE TABLE itinerarios (
  id               SERIAL       PRIMARY KEY,
  servicio_id      INTEGER      NOT NULL REFERENCES servicios_turisticos(id) ON DELETE CASCADE,
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

  CONSTRAINT uq_servicio_dia   UNIQUE (servicio_id, dia_numero),
  CONSTRAINT chk_dia_numero    CHECK (dia_numero >= 1),
  CONSTRAINT chk_altitud       CHECK (altitud_max_msnm IS NULL OR altitud_max_msnm BETWEEN 0 AND 9000),
  CONSTRAINT chk_distancia     CHECK (distancia_km IS NULL OR distancia_km >= 0),
  CONSTRAINT chk_horas         CHECK (horas_caminata IS NULL OR horas_caminata BETWEEN 0 AND 24)
);

COMMENT ON TABLE itinerarios IS 'Programa día a día de cada servicio turístico';


-- ------------------------------------------------------------
-- TABLA: reservas
-- Núcleo del ERP. Vincula clientes, servicios y estados.
-- saldo_usd es columna calculada (GENERATED ALWAYS AS STORED).
-- ON DELETE RESTRICT en servicio_id: protege historial de
-- ventas frente a eliminación accidental de catálogo.
-- ------------------------------------------------------------
CREATE TABLE reservas (
  id                    SERIAL           PRIMARY KEY,
  codigo_reserva        VARCHAR(30)      NOT NULL UNIQUE,      -- R-2024-001...
  servicio_id           INTEGER          REFERENCES servicios_turisticos(id) ON DELETE RESTRICT,
  nombre_servicio_snap  VARCHAR(200),    -- snapshot al reservar (preserva historial)
  fecha_inicio          DATE             NOT NULL,
  fecha_fin             DATE             NOT NULL,
  hora_encuentro        TIME,
  lugar_encuentro       VARCHAR(300),
  n_pasajeros           SMALLINT         NOT NULL DEFAULT 1,
  idioma_servicio       VARCHAR(50)      NOT NULL DEFAULT 'Español',

  -- Combolists de estado (ambos con DEFAULT conservador)
  estado_operacion      estado_operacion  NOT NULL DEFAULT 'COTIZACION',
  estado_pago           estado_pago       NOT NULL DEFAULT 'PENDIENTE',

  -- Financiero (todos NOT NULL con DEFAULT 0 para evitar NULLs en aritmética)
  precio_usd_por_pax    NUMERIC(10,2)    NOT NULL DEFAULT 0,
  total_usd             NUMERIC(10,2)    NOT NULL DEFAULT 0,
  adelanto_usd          NUMERIC(10,2)    NOT NULL DEFAULT 0,
  descuento_usd         NUMERIC(10,2)    NOT NULL DEFAULT 0,
  saldo_usd             NUMERIC(10,2)    GENERATED ALWAYS AS (total_usd - adelanto_usd - descuento_usd) STORED,

  -- Canal de venta
  agencia_nombre        VARCHAR(200),
  agencia_codigo        VARCHAR(50),
  operador_nombre       VARCHAR(200),

  -- Responsables internos
  usuario_creador_id    INTEGER          REFERENCES usuarios(id) ON DELETE SET NULL,
  usuario_operador_id   INTEGER          REFERENCES usuarios(id) ON DELETE SET NULL,

  observaciones         TEXT,
  notas_internas        TEXT,
  creado_en             TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  actualizado_en        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_reservas_fechas       CHECK (fecha_fin >= fecha_inicio),
  CONSTRAINT chk_reservas_n_pax        CHECK (n_pasajeros >= 1),
  CONSTRAINT chk_reservas_total        CHECK (total_usd >= 0),
  CONSTRAINT chk_reservas_adelanto     CHECK (adelanto_usd >= 0 AND adelanto_usd <= total_usd),
  CONSTRAINT chk_reservas_descuento    CHECK (descuento_usd >= 0 AND descuento_usd <= total_usd),
  CONSTRAINT chk_reservas_precio_pax   CHECK (precio_usd_por_pax >= 0)
);

COMMENT ON TABLE  reservas IS 'Reservas de servicios turísticos — entidad central del ERP';
COMMENT ON COLUMN reservas.saldo_usd IS 'Columna calculada: total_usd - adelanto_usd - descuento_usd';
COMMENT ON COLUMN reservas.nombre_servicio_snap IS 'Snapshot del nombre del servicio al momento de reservar. No normalizar.';
COMMENT ON COLUMN reservas.notas_internas IS 'Visibles solo para empleados, no para clientes ni proveedores';


-- ------------------------------------------------------------
-- TABLA: pasajeros
-- Viajeros vinculados a una reserva.
-- ON DELETE CASCADE: si se anula/elimina la reserva, los datos
-- del pasajero se eliminan con ella (coherencia de datos).
-- CRÍTICO DE SEGURIDAD: restricciones_alimenticias requiere
-- sanitización XSS en la capa de servicio antes de persistir.
-- ------------------------------------------------------------
CREATE TABLE pasajeros (
  id                        SERIAL       PRIMARY KEY,
  reserva_id                INTEGER      NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  nombre                    VARCHAR(100) NOT NULL,
  apellido                  VARCHAR(100) NOT NULL,
  genero                    genero       NOT NULL DEFAULT 'NO_ESPECIFICADO',
  fecha_nacimiento          DATE,
  edad_calculada            SMALLINT,                    -- auto-poblado por trigger
  nacionalidad              VARCHAR(100),
  pasaporte                 VARCHAR(50),                 -- dato sensible
  pasaporte_vencimiento     DATE,
  email                     VARCHAR(200),
  telefono                  VARCHAR(30),
  whatsapp                  VARCHAR(30),

  -- Flags alimenticios (booleanos explícitos, sin ambigüedad)
  es_vegetariano            BOOLEAN      NOT NULL DEFAULT FALSE,
  es_vegano                 BOOLEAN      NOT NULL DEFAULT FALSE,
  es_celiaco                BOOLEAN      NOT NULL DEFAULT FALSE,
  es_diabetico              BOOLEAN      NOT NULL DEFAULT FALSE,

  -- Campos de texto libre — sanitización XSS obligatoria en backend
  alergias                  VARCHAR(500),
  restricciones_alimenticias TEXT,
  condicion_medica          TEXT,
  observaciones             TEXT,
  creado_en                 TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_pasajeros_pasaporte CHECK (
    pasaporte IS NULL OR (length(pasaporte) BETWEEN 5 AND 30)
  ),
  CONSTRAINT chk_pasajeros_pasaporte_vencimiento CHECK (
    pasaporte_vencimiento IS NULL OR pasaporte_vencimiento > '2000-01-01'::DATE
  ),
  CONSTRAINT chk_pasajeros_email CHECK (
    email IS NULL OR email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
  )
);

COMMENT ON TABLE  pasajeros IS 'Pasajeros vinculados a una reserva. CASCADE al eliminar reserva.';
COMMENT ON COLUMN pasajeros.restricciones_alimenticias IS 'CRÍTICO: sanitizar XSS (DOMPurify server-side) antes de INSERT/UPDATE';
COMMENT ON COLUMN pasajeros.pasaporte IS 'Dato PII — considerar pgcrypto / cifrado en columna en producción';
COMMENT ON COLUMN pasajeros.edad_calculada IS 'Calculada automáticamente por trg_pasajeros_edad al insertar/actualizar fecha_nacimiento';


-- ------------------------------------------------------------
-- TABLA: tareas_pendientes
-- Panel operativo. Toda tarea DEBE tener un responsable.
-- reserva_id es opcional pero fuertemente recomendado.
-- ON DELETE RESTRICT en usuario_id: protege contra huérfanos
-- operativos (las tareas deben reasignarse antes de borrar).
-- ON DELETE SET NULL en reserva_id: si se borra la reserva,
-- la tarea queda pero pierde el vínculo (historial).
-- ------------------------------------------------------------
CREATE TABLE tareas_pendientes (
  id                SERIAL          PRIMARY KEY,
  titulo            VARCHAR(300)    NOT NULL,
  descripcion       TEXT,
  usuario_id        INTEGER         NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  reserva_id        INTEGER         REFERENCES reservas(id) ON DELETE SET NULL,
  prioridad         prioridad_tarea NOT NULL DEFAULT 'MEDIA',
  estado            estado_tarea    NOT NULL DEFAULT 'PENDIENTE',
  fecha_vencimiento TIMESTAMPTZ,
  completada_en     TIMESTAMPTZ,
  completada_por_id INTEGER         REFERENCES usuarios(id) ON DELETE SET NULL,
  notas_cierre      TEXT,
  creado_por_id     INTEGER         REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_tareas_completada_tiene_fecha CHECK (
    estado != 'COMPLETADA' OR completada_en IS NOT NULL
  )
);

COMMENT ON TABLE  tareas_pendientes IS 'Tareas operativas asignadas a empleados, opcionalmente ligadas a una reserva';
COMMENT ON COLUMN tareas_pendientes.usuario_id IS 'ON DELETE RESTRICT: reasignar tareas antes de desactivar empleado';


-- ------------------------------------------------------------
-- TABLA: detalles_operacion_proveedor
-- Servicios reales contratados por reserva (hotel específico,
-- bus, guía, etc.). Permite construir reportes para proveedores.
-- ON DELETE CASCADE desde reservas: si se elimina la reserva,
-- se eliminan sus detalles de operación.
-- ON DELETE RESTRICT desde proveedores: no se puede borrar un
-- proveedor con servicios contratados en historial.
-- ------------------------------------------------------------
CREATE TABLE detalles_operacion_proveedor (
  id                  SERIAL                   PRIMARY KEY,
  reserva_id          INTEGER                  NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  proveedor_id        INTEGER                  NOT NULL REFERENCES proveedores(id) ON DELETE RESTRICT,
  tipo_servicio       tipo_proveedor           NOT NULL,
  descripcion         VARCHAR(500),
  fecha_inicio        DATE                     NOT NULL,
  fecha_fin           DATE,
  hora_inicio         TIME,
  cantidad            SMALLINT                 NOT NULL DEFAULT 1,
  costo_unitario_usd  NUMERIC(10,2)            NOT NULL DEFAULT 0,
  costo_total_usd     NUMERIC(10,2)            GENERATED ALWAYS AS (cantidad * costo_unitario_usd) STORED,
  estado              estado_detalle_proveedor NOT NULL DEFAULT 'SOLICITADO',
  confirmacion_ref    VARCHAR(100),            -- código de confirmación del proveedor
  notas               TEXT,
  creado_en           TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
  actualizado_en      TIMESTAMPTZ              NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_detalles_cantidad      CHECK (cantidad >= 1),
  CONSTRAINT chk_detalles_costo         CHECK (costo_unitario_usd >= 0),
  CONSTRAINT chk_detalles_fechas        CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

COMMENT ON TABLE  detalles_operacion_proveedor IS 'Servicios contratados a proveedores por reserva. Base para reportes a proveedores.';
COMMENT ON COLUMN detalles_operacion_proveedor.costo_total_usd IS 'Calculado: cantidad * costo_unitario_usd';


-- ------------------------------------------------------------
-- TABLA: logs_auditoria
-- Registro inmutable de cambios. No tiene UPDATE ni DELETE
-- (enforced por política de permisos en producción).
-- BIGSERIAL para soporte de alto volumen a largo plazo.
-- ------------------------------------------------------------
CREATE TABLE logs_auditoria (
  id            BIGSERIAL    PRIMARY KEY,
  tabla         VARCHAR(80)  NOT NULL,
  operacion     VARCHAR(10)  NOT NULL,
  registro_id   INTEGER,
  usuario_id    INTEGER      REFERENCES usuarios(id) ON DELETE SET NULL,
  datos_antes   JSONB,
  datos_despues JSONB,
  ip_origen     INET,
  user_agent    TEXT,
  creado_en     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_logs_operacion CHECK (
    operacion IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','CLONE','EXPORT')
  )
);

COMMENT ON TABLE logs_auditoria IS 'Registro de auditoría inmutable. En producción: sin UPDATE/DELETE para este rol.';


-- ============================================================
-- SECCIÓN 3: ÍNDICES DE RENDIMIENTO
-- Cubren campos de búsqueda intensiva identificados en los
-- flujos de negocio: fechas, códigos, pasaportes, estados.
-- ============================================================

-- Reservas — búsquedas principales del dashboard y reportes
CREATE INDEX idx_reservas_fecha_inicio      ON reservas(fecha_inicio);
CREATE INDEX idx_reservas_fecha_fin         ON reservas(fecha_fin);
CREATE INDEX idx_reservas_rango_fechas      ON reservas(fecha_inicio, fecha_fin);  -- calendario
CREATE INDEX idx_reservas_estado_operacion  ON reservas(estado_operacion);
CREATE INDEX idx_reservas_estado_pago       ON reservas(estado_pago);
CREATE INDEX idx_reservas_codigo            ON reservas(codigo_reserva);           -- búsqueda exacta
CREATE INDEX idx_reservas_agencia           ON reservas(agencia_nombre);
CREATE INDEX idx_reservas_servicio          ON reservas(servicio_id);
CREATE INDEX idx_reservas_operador          ON reservas(usuario_operador_id);
-- Índice compuesto: reportes con filtro de fecha + estado (query más común)
CREATE INDEX idx_reservas_fecha_estado      ON reservas(fecha_inicio, estado_operacion, estado_pago);

-- Pasajeros — búsquedas de verificación de documentos
CREATE INDEX idx_pasajeros_reserva_id       ON pasajeros(reserva_id);
CREATE INDEX idx_pasajeros_pasaporte        ON pasajeros(pasaporte);               -- búsqueda por doc
CREATE INDEX idx_pasajeros_nombre           ON pasajeros(apellido, nombre);
-- Índice parcial: solo pasajeros con pasaporte próximo a vencer (alertas operativas)
CREATE INDEX idx_pasajeros_pasaporte_vence  ON pasajeros(pasaporte_vencimiento)
  WHERE pasaporte_vencimiento IS NOT NULL;

-- Tareas — panel operativo por empleado y estado
CREATE INDEX idx_tareas_usuario_id          ON tareas_pendientes(usuario_id);
CREATE INDEX idx_tareas_reserva_id          ON tareas_pendientes(reserva_id);
CREATE INDEX idx_tareas_estado              ON tareas_pendientes(estado);
-- Índice parcial: solo tareas activas para el widget de dashboard
CREATE INDEX idx_tareas_activas_vencimiento ON tareas_pendientes(usuario_id, fecha_vencimiento)
  WHERE estado IN ('PENDIENTE','EN_PROGRESO');
CREATE INDEX idx_tareas_prioridad_estado    ON tareas_pendientes(prioridad, estado);

-- Proveedores — filtros de reportes
CREATE INDEX idx_proveedores_tipo           ON proveedores(tipo);
CREATE INDEX idx_proveedores_nombre         ON proveedores(nombre);
CREATE INDEX idx_proveedores_activo         ON proveedores(activo) WHERE activo = TRUE;

-- Detalles de operación — motor de reportes para proveedores
CREATE INDEX idx_detalles_reserva_id        ON detalles_operacion_proveedor(reserva_id);
CREATE INDEX idx_detalles_proveedor_id      ON detalles_operacion_proveedor(proveedor_id);
CREATE INDEX idx_detalles_fecha_inicio      ON detalles_operacion_proveedor(fecha_inicio);
CREATE INDEX idx_detalles_estado            ON detalles_operacion_proveedor(estado);
-- Índice compuesto: reporte por proveedor + fecha (filtro más común de reportes)
CREATE INDEX idx_detalles_proveedor_fecha   ON detalles_operacion_proveedor(proveedor_id, fecha_inicio);

-- Servicios turísticos — catálogo
CREATE INDEX idx_servicios_tipo             ON servicios_turisticos(tipo);
CREATE INDEX idx_servicios_activo           ON servicios_turisticos(activo) WHERE activo = TRUE;
CREATE INDEX idx_servicios_codigo           ON servicios_turisticos(codigo);

-- Itinerarios — carga de detalle por servicio
CREATE INDEX idx_itinerarios_servicio_id    ON itinerarios(servicio_id, dia_numero);

-- Auditoría — consultas de trazabilidad
CREATE INDEX idx_logs_tabla_fecha           ON logs_auditoria(tabla, creado_en DESC);
CREATE INDEX idx_logs_usuario_id            ON logs_auditoria(usuario_id);
CREATE INDEX idx_logs_registro_id           ON logs_auditoria(registro_id);
CREATE INDEX idx_logs_operacion             ON logs_auditoria(operacion);


-- ============================================================
-- SECCIÓN 4: TRIGGERS AUTOMÁTICOS
-- ============================================================

-- Función genérica: actualizar campo actualizado_en
CREATE OR REPLACE FUNCTION fn_set_actualizado_en()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.actualizado_en := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_usuarios_upd
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_proveedores_upd
  BEFORE UPDATE ON proveedores
  FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_servicios_upd
  BEFORE UPDATE ON servicios_turisticos
  FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_reservas_upd
  BEFORE UPDATE ON reservas
  FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_tareas_upd
  BEFORE UPDATE ON tareas_pendientes
  FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();

CREATE TRIGGER trg_detalles_upd
  BEFORE UPDATE ON detalles_operacion_proveedor
  FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();


-- Función: calcular edad automáticamente al insertar/editar pasajero
CREATE OR REPLACE FUNCTION fn_calcular_edad_pasajero()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.fecha_nacimiento IS NOT NULL THEN
    NEW.edad_calculada := EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.fecha_nacimiento))::SMALLINT;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pasajeros_edad
  BEFORE INSERT OR UPDATE OF fecha_nacimiento ON pasajeros
  FOR EACH ROW EXECUTE FUNCTION fn_calcular_edad_pasajero();


-- Función: sincronizar estado_pago automáticamente según montos
CREATE OR REPLACE FUNCTION fn_sincronizar_estado_pago()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- No interferir si la reserva está anulada
  IF NEW.estado_operacion IN ('ANULADO_SIN_PENALIDAD','ANULADO_CON_PENALIDAD') THEN
    IF NEW.estado_pago NOT IN ('REEMBOLSADO','ANULADO') THEN
      NEW.estado_pago := 'ANULADO';
    END IF;
    RETURN NEW;
  END IF;

  -- Calcular estado de pago según montos (no sobreescribir estados manuales REEMBOLSADO)
  IF NEW.estado_pago != 'REEMBOLSADO' AND NEW.total_usd > 0 THEN
    IF NEW.adelanto_usd >= (NEW.total_usd - NEW.descuento_usd) THEN
      NEW.estado_pago := 'PAGADO';
    ELSIF NEW.adelanto_usd > 0 THEN
      NEW.estado_pago := 'PARCIAL';
    ELSE
      NEW.estado_pago := 'PENDIENTE';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reservas_pago
  BEFORE INSERT OR UPDATE OF adelanto_usd, total_usd, descuento_usd, estado_operacion ON reservas
  FOR EACH ROW EXECUTE FUNCTION fn_sincronizar_estado_pago();


-- ============================================================
-- SECCIÓN 5: FUNCIÓN CLONAR SERVICIO
-- Duplica un servicio turístico completo con todos sus
-- itinerarios, generando nuevos IDs correlativos (SERIAL).
-- Retorna el ID del nuevo servicio para navegación inmediata.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_clonar_servicio(
  p_servicio_id  INTEGER,
  p_nuevo_codigo VARCHAR(30),
  p_nuevo_nombre VARCHAR(200),
  p_usuario_id   INTEGER
)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  v_nuevo_id INTEGER;
BEGIN
  -- Validar que el servicio origen existe
  IF NOT EXISTS (SELECT 1 FROM servicios_turisticos WHERE id = p_servicio_id) THEN
    RAISE EXCEPTION 'Servicio origen ID=% no encontrado', p_servicio_id;
  END IF;

  -- Validar que el nuevo código no esté en uso
  IF EXISTS (SELECT 1 FROM servicios_turisticos WHERE codigo = p_nuevo_codigo) THEN
    RAISE EXCEPTION 'El código % ya está en uso', p_nuevo_codigo;
  END IF;

  -- Clonar cabecera del servicio con nuevos IDs (SERIAL auto-incrementa)
  INSERT INTO servicios_turisticos (
    codigo, nombre, descripcion, tipo, duracion_dias, precio_base_usd,
    nivel_dificultad, min_pax, max_pax, incluye, no_incluye, que_llevar,
    activo, es_plantilla, clonado_de, creado_por
  )
  SELECT
    p_nuevo_codigo,
    p_nuevo_nombre,
    descripcion, tipo, duracion_dias, precio_base_usd,
    nivel_dificultad, min_pax, max_pax, incluye, no_incluye, que_llevar,
    TRUE,   -- activo
    FALSE,  -- es_plantilla: el clon es un servicio real
    p_servicio_id,
    p_usuario_id
  FROM servicios_turisticos
  WHERE id = p_servicio_id
  RETURNING id INTO v_nuevo_id;

  -- Clonar todos los itinerarios asociados al servicio origen
  INSERT INTO itinerarios (
    servicio_id, dia_numero, titulo, descripcion, altitud_max_msnm,
    distancia_km, horas_caminata, desayuno, almuerzo, cena, box_lunch,
    alojamiento, notas_operativas, orden
  )
  SELECT
    v_nuevo_id,  -- nuevo FK
    dia_numero, titulo, descripcion, altitud_max_msnm,
    distancia_km, horas_caminata, desayuno, almuerzo, cena, box_lunch,
    alojamiento, notas_operativas, orden
  FROM itinerarios
  WHERE servicio_id = p_servicio_id
  ORDER BY dia_numero;

  -- Registrar la operación en auditoría
  INSERT INTO logs_auditoria (tabla, operacion, registro_id, usuario_id, datos_despues)
  VALUES (
    'servicios_turisticos',
    'CLONE',
    v_nuevo_id,
    p_usuario_id,
    jsonb_build_object(
      'clonado_de', p_servicio_id,
      'nuevo_codigo', p_nuevo_codigo,
      'nuevo_nombre', p_nuevo_nombre
    )
  );

  RETURN v_nuevo_id;
END;
$$;

COMMENT ON FUNCTION fn_clonar_servicio IS
  'Clona servicio + itinerarios con IDs nuevos. Retorna ID del nuevo servicio. Registra en auditoría.';


-- ============================================================
-- SECCIÓN 6: VISTAS OPERATIVAS
-- Desnormalizadas para reducir JOINs en el backend.
-- NO reemplazar con lógica de negocio — solo proyección de datos.
-- ============================================================

-- Vista principal del dashboard de reservas
CREATE VIEW v_dashboard_reservas AS
SELECT
  r.id,
  r.codigo_reserva,
  r.fecha_inicio,
  r.fecha_fin,
  r.n_pasajeros,
  r.estado_operacion,
  r.estado_pago,
  r.total_usd,
  r.adelanto_usd,
  r.saldo_usd,
  r.agencia_nombre,
  r.idioma_servicio,
  r.hora_encuentro,
  r.lugar_encuentro,
  st.nombre         AS servicio_nombre,
  st.tipo           AS servicio_tipo,
  st.duracion_dias,
  st.nivel_dificultad,
  uo.nombre || ' ' || uo.apellido   AS operador_nombre,
  uc.nombre || ' ' || uc.apellido   AS creador_nombre,
  (
    SELECT COUNT(*) FROM tareas_pendientes tp
    WHERE tp.reserva_id = r.id AND tp.estado IN ('PENDIENTE','EN_PROGRESO')
  ) AS tareas_activas_count
FROM reservas r
LEFT JOIN servicios_turisticos st ON st.id = r.servicio_id
LEFT JOIN usuarios uo             ON uo.id = r.usuario_operador_id
LEFT JOIN usuarios uc             ON uc.id = r.usuario_creador_id;

COMMENT ON VIEW v_dashboard_reservas IS 'Vista para el dashboard — evita JOINs repetitivos en el backend';


-- Vista de alertas: pasaportes próximos a vencer (180 días)
CREATE VIEW v_alertas_pasaportes AS
SELECT
  p.id                        AS pasajero_id,
  p.nombre,
  p.apellido,
  p.pasaporte,
  p.pasaporte_vencimiento,
  p.nacionalidad,
  r.id                        AS reserva_id,
  r.codigo_reserva,
  r.fecha_inicio,
  r.estado_operacion,
  (p.pasaporte_vencimiento - CURRENT_DATE) AS dias_para_vencer,
  CASE
    WHEN (p.pasaporte_vencimiento - CURRENT_DATE) <= 30  THEN 'CRITICO'
    WHEN (p.pasaporte_vencimiento - CURRENT_DATE) <= 90  THEN 'URGENTE'
    ELSE 'AVISO'
  END AS nivel_alerta
FROM pasajeros p
JOIN reservas r ON r.id = p.reserva_id
WHERE p.pasaporte_vencimiento IS NOT NULL
  AND p.pasaporte_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '180 days'
  AND r.estado_operacion NOT IN ('ANULADO_SIN_PENALIDAD','ANULADO_CON_PENALIDAD')
ORDER BY p.pasaporte_vencimiento;

COMMENT ON VIEW v_alertas_pasaportes IS 'Pasaportes de pasajeros en reservas activas que vencen en 180 días. Nivel de alerta calculado.';


-- Vista del motor de reportes para proveedores
CREATE VIEW v_reporte_proveedores AS
SELECT
  d.id                            AS detalle_id,
  d.estado                        AS detalle_estado,
  d.tipo_servicio,
  d.fecha_inicio,
  d.fecha_fin,
  d.hora_inicio,
  d.cantidad,
  d.costo_unitario_usd,
  d.costo_total_usd,
  d.descripcion                   AS servicio_descripcion,
  d.confirmacion_ref,
  d.notas,
  pv.id                           AS proveedor_id,
  pv.nombre                       AS proveedor_nombre,
  pv.tipo                         AS proveedor_tipo,
  pv.contacto_nombre,
  pv.contacto_email,
  pv.contacto_telefono,
  r.id                            AS reserva_id,
  r.codigo_reserva,
  r.fecha_inicio                  AS reserva_fecha_inicio,
  r.fecha_fin                     AS reserva_fecha_fin,
  r.n_pasajeros,
  r.estado_operacion              AS reserva_estado,
  r.agencia_nombre,
  r.idioma_servicio,
  st.nombre                       AS servicio_turistico
FROM detalles_operacion_proveedor d
JOIN proveedores         pv ON pv.id = d.proveedor_id
JOIN reservas            r  ON r.id  = d.reserva_id
LEFT JOIN servicios_turisticos st ON st.id = r.servicio_id;

COMMENT ON VIEW v_reporte_proveedores IS 'Vista base para el motor de reportes a proveedores con filtros dinámicos';


-- ============================================================
-- SECCIÓN 7: DATOS SEMILLA
-- Usuario administrador inicial. Hash DEBE cambiarse en el
-- primer acceso (enforced en la lógica de negocio del backend).
-- ============================================================

INSERT INTO usuarios (codigo, nombre, apellido, email, password_hash, rol, avatar_iniciales)
VALUES (
  'USR-001',
  'Admin',
  'Cusi Travel',
  'admin@cusitravel.pe',
  -- Contraseña: Admin2025!  (bcrypt cost=12)
  '$2b$12$DWWfpPN10yqYWBg9aNxgiuDNuOrLahyLb/zJPrZPNXDzgnMJHwykq',
  'ADMIN',
  'AC'
);

-- Proveedor interno (para servicios propios)
INSERT INTO proveedores (codigo, nombre, tipo, contacto_nombre, contacto_email, ciudad, pais)
VALUES (
  'PROV-001',
  'Cusi Travel Propio',
  'OPERADOR_LOCAL',
  'Operaciones Cusi',
  'ops@cusitravel.pe',
  'Cusco',
  'Perú'
);


-- ============================================================
-- FIN DEL SCRIPT DDL — CUSI TRAVEL ERP v1.0
-- Próximos pasos:
--   FASE 2 → docker-compose.yml + configuración Node.js/Express
--   FASE 3 → API REST (rutas, controladores, servicios)
--   FASE 4 → Interfaz React (Vite + Tailwind CSS)
-- ============================================================
