-- ==========================================================================
-- CAFÉ MARFIL — ESQUEMA DE BASE DE DATOS (MySQL 8)
--
-- Convenciones:
--   * Tablas y columnas en snake_case; la API las expone en camelCase.
--   * Fechas de calendario: DATE. Horas de reloj: TIME.
--   * Marcas de tiempo (creado_en, inicio, fin...): DATETIME(3) siempre en UTC.
--   * Booleanos: TINYINT(1). Listas simples de texto: columna JSON.
--   * Todo el archivo es idempotente (IF NOT EXISTS): se aplica en cada arranque.
--   * El orden importa: una tabla debe existir antes de que otra la referencie.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- Sucursales, zonas y personal
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sucursales (
  id              VARCHAR(60)  NOT NULL,                 -- slug estable: 'porras-matriz'
  nombre          VARCHAR(120) NOT NULL,
  subtitulo       VARCHAR(255),
  direccion       VARCHAR(255) NOT NULL,
  horario         VARCHAR(160) NOT NULL,
  telefono        VARCHAR(30),
  imagen          VARCHAR(300),
  aforo_max       SMALLINT UNSIGNED NOT NULL,
  caracteristicas JSON NOT NULL DEFAULT (JSON_ARRAY()),  -- string[]
  servicios       JSON NOT NULL DEFAULT (JSON_ARRAY()),  -- string[]
  maps_url        VARCHAR(500),
  map_embed_url   VARCHAR(500),
  destacada       TINYINT(1) NOT NULL DEFAULT 0,
  activa          TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  CONSTRAINT chk_sucursales_aforo CHECK (aforo_max > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS zonas (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sucursal_id VARCHAR(60)  NOT NULL,
  nombre      VARCHAR(80)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_zonas_sucursal_nombre (sucursal_id, nombre),
  CONSTRAINT fk_zonas_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Personal del café. Solo quien tiene email + password_hash puede entrar al panel.
--   rol: admin y gerente administran catálogos; host opera sala; staff no tiene acceso.
CREATE TABLE IF NOT EXISTS personal (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(120) NOT NULL,
  email         VARCHAR(190),
  password_hash VARCHAR(100),
  rol           ENUM('admin', 'gerente', 'host', 'staff') NOT NULL DEFAULT 'staff',
  puesto        VARCHAR(80)  NOT NULL,                   -- 'Head Barista & Métodos'
  sucursal_id   VARCHAR(60),
  turno_inicio  TIME,
  turno_fin     TIME,
  estado        ENUM('activo', 'descanso', 'inactivo') NOT NULL DEFAULT 'activo',
  es_encargado  TINYINT(1) NOT NULL DEFAULT 0,
  creado_en     DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_personal_email (email),
  CONSTRAINT fk_personal_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------------
-- Clientes y Club Marfil (pasaporte de sellos)
-- --------------------------------------------------------------------------

-- Un cliente puede existir sin cuenta (registrado en caja): email/password_hash nulos.
CREATE TABLE IF NOT EXISTS clientes (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo_club          VARCHAR(20)  NOT NULL,            -- 'MF-CLUB-77312' (va en su QR)
  nombre               VARCHAR(120) NOT NULL,
  email                VARCHAR(190),
  telefono             VARCHAR(30),
  password_hash        VARCHAR(100),
  ciudad               VARCHAR(80),
  sellos_actuales      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  sellos_meta          TINYINT UNSIGNED NOT NULL DEFAULT 8,
  puntos               INT UNSIGNED NOT NULL DEFAULT 0,
  visitas_totales      INT UNSIGNED NOT NULL DEFAULT 0,
  ultima_visita        DATETIME(3),
  sucursal_habitual_id VARCHAR(60),
  preferencias         JSON NOT NULL DEFAULT (JSON_OBJECT()),  -- objeto libre
  creado_en            DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clientes_codigo (codigo_club),
  UNIQUE KEY uq_clientes_email (email),
  CONSTRAINT fk_clientes_sucursal FOREIGN KEY (sucursal_habitual_id) REFERENCES sucursales (id),
  CONSTRAINT chk_clientes_sellos CHECK (sellos_meta > 0 AND sellos_actuales <= sellos_meta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Bitácora de sellos y puntos (de aquí sale "sellos emitidos hoy").
CREATE TABLE IF NOT EXISTS movimientos_club (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id  INT UNSIGNED NOT NULL,
  tipo        ENUM('sello', 'recompensa_canjeada', 'ajuste') NOT NULL,
  sellos      INT NOT NULL DEFAULT 0,
  puntos      INT NOT NULL DEFAULT 0,
  descripcion VARCHAR(255),
  sucursal_id VARCHAR(60),
  personal_id INT UNSIGNED,
  creado_en   DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_movimientos_fecha (tipo, creado_en),
  CONSTRAINT fk_movimientos_cliente  FOREIGN KEY (cliente_id)  REFERENCES clientes (id),
  CONSTRAINT fk_movimientos_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales (id),
  CONSTRAINT fk_movimientos_personal FOREIGN KEY (personal_id) REFERENCES personal (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Monedero de beneficios del cliente (cada uno con su código canjeable por QR).
CREATE TABLE IF NOT EXISTS beneficios (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id INT UNSIGNED NOT NULL,
  codigo     VARCHAR(30)  NOT NULL,                      -- 'MF-BEN-4F9A2C'
  titulo     VARCHAR(160) NOT NULL,
  subtitulo  VARCHAR(255),
  icono      VARCHAR(40)  NOT NULL DEFAULT 'Gift',       -- nombre de ícono lucide
  origen     ENUM('sellos', 'manual') NOT NULL DEFAULT 'manual',
  estado     ENUM('disponible', 'usado') NOT NULL DEFAULT 'disponible',
  vence_en   DATE,                                       -- NULL si no vence
  usado_en   DATETIME(3),
  creado_en  DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_beneficios_codigo (codigo),
  CONSTRAINT fk_beneficios_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS notificaciones (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id     INT UNSIGNED NOT NULL,
  titulo         VARCHAR(160) NOT NULL,
  mensaje        VARCHAR(500) NOT NULL,
  tipo           ENUM('reservacion', 'beneficio', 'promo') NOT NULL,
  screen_destino VARCHAR(40),                            -- pantalla de la PWA a la que lleva
  leida          TINYINT(1) NOT NULL DEFAULT 0,
  creado_en      DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_notificaciones_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------------
-- Menú
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categorias_menu (
  id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug   VARCHAR(40) NOT NULL,                           -- 'salado', 'frappes'...
  nombre VARCHAR(80) NOT NULL,
  orden  SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categorias_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS productos (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug            VARCHAR(80)  NOT NULL,
  nombre          VARCHAR(120) NOT NULL,
  nombre_corto    VARCHAR(40),                           -- rótulo del carrusel: 'KINDER BUENO'
  categoria_id    INT UNSIGNED NOT NULL,
  etiqueta        VARCHAR(80),                           -- subcategoría: 'Frappé de Autor'
  descripcion     VARCHAR(600) NOT NULL DEFAULT '',
  porcion         VARCHAR(80),                           -- '16 oz', 'Para Compartir (28cm)'
  precio          DECIMAL(10, 2) NOT NULL,
  imagen          VARCHAR(300),
  badge           VARCHAR(40),
  calorias        SMALLINT UNSIGNED,
  color_card      CHAR(7),                               -- color de la tarjeta en la PWA: '#E12927'
  ingredientes    JSON NOT NULL DEFAULT (JSON_ARRAY()),  -- string[] ("qué trae")
  alergenos       JSON NOT NULL DEFAULT (JSON_ARRAY()),  -- string[]
  disponible      TINYINT(1) NOT NULL DEFAULT 1,
  stock_diario    INT UNSIGNED NOT NULL DEFAULT 0,
  vendidos_hoy    INT UNSIGNED NOT NULL DEFAULT 0,
  tiempo_prep_min SMALLINT UNSIGNED NOT NULL DEFAULT 10,
  destacado       TINYINT(1) NOT NULL DEFAULT 0,
  activo          TINYINT(1) NOT NULL DEFAULT 1,         -- borrado lógico
  creado_en       DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_productos_slug (slug),
  CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_menu (id),
  CONSTRAINT chk_productos_precio CHECK (precio >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------------
-- Actividades y eventos
-- --------------------------------------------------------------------------

-- fecha NULL = actividad sin fecha fija (permanente o por confirmar); en ese caso
-- fecha_texto / horario_texto guardan el rótulo que se muestra al cliente.
CREATE TABLE IF NOT EXISTS actividades (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug           VARCHAR(80)  NOT NULL,
  nombre         VARCHAR(140) NOT NULL,
  categoria      VARCHAR(80)  NOT NULL,
  categoria_slug VARCHAR(40)  NOT NULL,                  -- cine, talleres, musica, juegos...
  sucursal_id    VARCHAR(60)  NOT NULL,
  fecha          DATE,
  fecha_texto    VARCHAR(80),
  hora_inicio    TIME,
  hora_fin       TIME,
  horario_texto  VARCHAR(80),
  duracion       VARCHAR(60),
  imagen         VARCHAR(300),
  resumen        VARCHAR(400) NOT NULL,
  descripcion    VARCHAR(1500),
  cupo_total     SMALLINT UNSIGNED NOT NULL,
  precio         DECIMAL(10, 2) NOT NULL DEFAULT 0,
  precio_texto   VARCHAR(60),                            -- 'Consumo mínimo $100', 'Entrada Libre'
  es_gratis      TINYINT(1) NOT NULL DEFAULT 0,
  incluye        JSON NOT NULL DEFAULT (JSON_ARRAY()),   -- string[]
  requisitos     VARCHAR(400),
  activa         TINYINT(1) NOT NULL DEFAULT 1,
  creado_en      DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_actividades_slug (slug),
  CONSTRAINT fk_actividades_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales (id),
  CONSTRAINT chk_actividades_cupo CHECK (cupo_total > 0),
  CONSTRAINT chk_actividades_precio CHECK (precio >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------------
-- Mesas, reservaciones y servicio en sala
-- --------------------------------------------------------------------------

-- estado es el estado físico de la mesa. "reservada" NO se guarda: la API lo
-- deriva cuando la mesa está libre y tiene una reservación confirmada para hoy.
CREATE TABLE IF NOT EXISTS mesas (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sucursal_id VARCHAR(60) NOT NULL,
  zona_id     INT UNSIGNED,
  numero      VARCHAR(10) NOT NULL,                      -- 'M01', 'L02'
  capacidad   TINYINT UNSIGNED NOT NULL,
  forma       ENUM('squircle', 'circle', 'rectangle_vertical', 'rectangle_horizontal') NOT NULL DEFAULT 'squircle',
  estado      ENUM('libre', 'ocupada', 'limpieza') NOT NULL DEFAULT 'libre',
  notas       VARCHAR(500),
  activa      TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mesas_sucursal_numero (sucursal_id, numero),
  CONSTRAINT fk_mesas_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales (id),
  CONSTRAINT fk_mesas_zona     FOREIGN KEY (zona_id)     REFERENCES zonas (id),
  CONSTRAINT chk_mesas_capacidad CHECK (capacidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS reservaciones (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  folio             VARCHAR(20)  NOT NULL,               -- 'MF-RES-88219' (se le dicta al host)
  token_qr          VARCHAR(40)  NOT NULL,               -- secreto que viaja en el QR
  cliente_id        INT UNSIGNED,                        -- NULL = invitado sin cuenta
  nombre_contacto   VARCHAR(120) NOT NULL,
  telefono_contacto VARCHAR(30)  NOT NULL,
  email_contacto    VARCHAR(190),
  sucursal_id       VARCHAR(60)  NOT NULL,
  mesa_id           INT UNSIGNED,
  actividad_id      INT UNSIGNED,
  tipo              ENUM('mesa', 'juegos', 'actividad', 'evento') NOT NULL,
  tipo_nombre       VARCHAR(80),                         -- rótulo opcional: 'Desayuno & Brunch'
  fecha             DATE NOT NULL,
  hora              TIME NOT NULL,
  personas          TINYINT UNSIGNED NOT NULL,
  estado            ENUM('confirmada', 'en_curso', 'asistida', 'cancelada', 'no_show') NOT NULL DEFAULT 'confirmada',
  notas             VARCHAR(500),
  origen            ENUM('app', 'host') NOT NULL DEFAULT 'app',
  registrada_por    INT UNSIGNED,
  creado_en         DATETIME(3) NOT NULL,
  actualizado_en    DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reservaciones_folio (folio),
  UNIQUE KEY uq_reservaciones_token (token_qr),
  KEY idx_reservaciones_sucursal_fecha (sucursal_id, fecha),
  KEY idx_reservaciones_actividad (actividad_id, fecha),
  KEY idx_reservaciones_mesa_fecha (mesa_id, fecha),
  CONSTRAINT fk_reservaciones_cliente   FOREIGN KEY (cliente_id)     REFERENCES clientes (id),
  CONSTRAINT fk_reservaciones_sucursal  FOREIGN KEY (sucursal_id)    REFERENCES sucursales (id),
  CONSTRAINT fk_reservaciones_mesa      FOREIGN KEY (mesa_id)        REFERENCES mesas (id),
  CONSTRAINT fk_reservaciones_actividad FOREIGN KEY (actividad_id)   REFERENCES actividades (id),
  CONSTRAINT fk_reservaciones_personal  FOREIGN KEY (registrada_por) REFERENCES personal (id),
  CONSTRAINT chk_reservaciones_personas CHECK (personas BETWEEN 1 AND 60),
  CONSTRAINT chk_reservaciones_actividad CHECK (tipo <> 'actividad' OR actividad_id IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Cada vez que se sienta a alguien en una mesa (con reservación o walk-in).
-- fin NULL = servicio abierto, es decir, la mesa está ocupada ahora mismo.
--
-- `abierto` vale 1 mientras el servicio está abierto y NULL al cerrarse. Como un
-- índice UNIQUE permite muchos NULL pero un solo 1 por mesa, la base garantiza
-- que una mesa no tenga dos servicios abiertos a la vez.
CREATE TABLE IF NOT EXISTS servicios_mesa (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  mesa_id        INT UNSIGNED NOT NULL,
  reservacion_id INT UNSIGNED,
  comensal       VARCHAR(120) NOT NULL,
  personas       TINYINT UNSIGNED NOT NULL,
  notas          VARCHAR(500),
  ticket_total   DECIMAL(10, 2),
  atendido_por   INT UNSIGNED,                           -- mesero
  inicio         DATETIME(3) NOT NULL,
  fin            DATETIME(3),
  abierto        TINYINT GENERATED ALWAYS AS (IF(fin IS NULL, 1, NULL)) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uq_servicio_abierto_por_mesa (mesa_id, abierto),
  KEY idx_servicios_inicio (inicio),
  CONSTRAINT fk_servicios_mesa        FOREIGN KEY (mesa_id)        REFERENCES mesas (id),
  CONSTRAINT fk_servicios_reservacion FOREIGN KEY (reservacion_id) REFERENCES reservaciones (id),
  CONSTRAINT fk_servicios_personal    FOREIGN KEY (atendido_por)   REFERENCES personal (id),
  CONSTRAINT chk_servicios_personas CHECK (personas > 0),
  CONSTRAINT chk_servicios_ticket CHECK (ticket_total IS NULL OR ticket_total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------------
-- Promociones y cupones
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS promociones (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(30)  NOT NULL,                 -- 'MF-PROMO-2X1'
  titulo          VARCHAR(140) NOT NULL,
  categoria       VARCHAR(80)  NOT NULL,
  categoria_slug  VARCHAR(40),                           -- filtro de la PWA: mes, temporada...
  descuento_badge VARCHAR(30)  NOT NULL,
  beneficio       VARCHAR(300) NOT NULL,
  descripcion     VARCHAR(600),
  vigencia        VARCHAR(140) NOT NULL,
  imagen          VARCHAR(300),
  condiciones     JSON NOT NULL DEFAULT (JSON_ARRAY()),  -- string[]
  como_usar       VARCHAR(300),
  limite_diario   INT UNSIGNED NOT NULL DEFAULT 50,
  estado          ENUM('activo', 'pausado') NOT NULL DEFAULT 'activo',
  creado_en       DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_promociones_codigo (codigo),
  CONSTRAINT chk_promociones_limite CHECK (limite_diario > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS promocion_sucursal (
  promocion_id INT UNSIGNED NOT NULL,
  sucursal_id  VARCHAR(60)  NOT NULL,
  PRIMARY KEY (promocion_id, sucursal_id),
  CONSTRAINT fk_promosuc_promocion FOREIGN KEY (promocion_id) REFERENCES promociones (id) ON DELETE CASCADE,
  CONSTRAINT fk_promosuc_sucursal  FOREIGN KEY (sucursal_id)  REFERENCES sucursales (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Un renglón por cupón canjeado (de aquí sale "canjes hoy" y el límite diario).
CREATE TABLE IF NOT EXISTS canjes_promocion (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  promocion_id INT UNSIGNED NOT NULL,
  cliente_id   INT UNSIGNED,
  sucursal_id  VARCHAR(60),
  personal_id  INT UNSIGNED,
  creado_en    DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_canjes_promocion_fecha (promocion_id, creado_en),
  CONSTRAINT fk_canjes_promocion FOREIGN KEY (promocion_id) REFERENCES promociones (id),
  CONSTRAINT fk_canjes_cliente   FOREIGN KEY (cliente_id)   REFERENCES clientes (id),
  CONSTRAINT fk_canjes_sucursal  FOREIGN KEY (sucursal_id)  REFERENCES sucursales (id),
  CONSTRAINT fk_canjes_personal  FOREIGN KEY (personal_id)  REFERENCES personal (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------------
-- Ludoteca
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS juegos (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre               VARCHAR(120) NOT NULL,
  categoria            VARCHAR(80)  NOT NULL,
  jugadores            VARCHAR(40)  NOT NULL,            -- '3 - 4 jugadores'
  duracion             VARCHAR(40)  NOT NULL,            -- '60 - 90 min'
  dificultad           VARCHAR(40)  NOT NULL,
  piezas_estado        VARCHAR(120) NOT NULL DEFAULT '100% Completo (Verificado)',
  reposicion_requerida TINYINT(1) NOT NULL DEFAULT 0,
  sucursal_id          VARCHAR(60) NOT NULL,
  activo               TINYINT(1) NOT NULL DEFAULT 1,
  creado_en            DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_juegos_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- devuelto_en NULL = el juego está en una mesa ahora mismo.
-- `abierto` + UNIQUE: un juego no puede estar prestado a dos mesas a la vez
-- (mismo recurso que en servicios_mesa).
CREATE TABLE IF NOT EXISTS prestamos_juego (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  juego_id    INT UNSIGNED NOT NULL,
  mesa_id     INT UNSIGNED NOT NULL,
  personal_id INT UNSIGNED,
  prestado_en DATETIME(3) NOT NULL,
  devuelto_en DATETIME(3),
  abierto     TINYINT GENERATED ALWAYS AS (IF(devuelto_en IS NULL, 1, NULL)) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uq_prestamo_abierto_por_juego (juego_id, abierto),
  KEY idx_prestamos_fecha (juego_id, prestado_en),
  CONSTRAINT fk_prestamos_juego    FOREIGN KEY (juego_id)    REFERENCES juegos (id),
  CONSTRAINT fk_prestamos_mesa     FOREIGN KEY (mesa_id)     REFERENCES mesas (id),
  CONSTRAINT fk_prestamos_personal FOREIGN KEY (personal_id) REFERENCES personal (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------------------------
-- Bitácora del escáner de caja
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS escaneos (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo      VARCHAR(80)  NOT NULL,
  tipo        ENUM('reservacion', 'promocion', 'club', 'beneficio', 'desconocido') NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  resultado   VARCHAR(160) NOT NULL,
  exito       TINYINT(1) NOT NULL DEFAULT 1,
  personal_id INT UNSIGNED,
  creado_en   DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_escaneos_fecha (creado_en),
  CONSTRAINT fk_escaneos_personal FOREIGN KEY (personal_id) REFERENCES personal (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
