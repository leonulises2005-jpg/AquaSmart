-- =====================================================
-- Sistema Inteligente de Gestión de Agua Potable
-- Script SQL completo para MySQL
-- =====================================================

CREATE DATABASE IF NOT EXISTS agua_potable CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE agua_potable;

-- =====================================================
-- Tabla: administradores (login del sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'operador') DEFAULT 'operador',
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- Tabla: clientes (consumidores de agua)
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    direccion VARCHAR(255),
    zona VARCHAR(50),
    telefono VARCHAR(20),
    email VARCHAR(150),
    medidor VARCHAR(50) UNIQUE,
    activo TINYINT(1) DEFAULT 1,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- Tabla: tanques (almacenamiento de agua)
-- =====================================================
CREATE TABLE IF NOT EXISTS tanques (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(200),
    capacidad_litros DECIMAL(12,2) NOT NULL,
    nivel_actual DECIMAL(12,2) NOT NULL DEFAULT 0,
    estado ENUM('critico', 'bajo', 'medio', 'alto', 'lleno') DEFAULT 'medio',
    ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- Tabla: consumos (registros de consumo)
-- =====================================================
CREATE TABLE IF NOT EXISTS consumos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    litros DECIMAL(10,2) NOT NULL,
    fecha_registro DATE NOT NULL,
    periodo VARCHAR(20),
    observaciones TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- Tabla: calidad_agua (monitoreo de calidad del agua)
-- =====================================================
CREATE TABLE IF NOT EXISTS calidad_agua (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tanque_id INT NOT NULL,
    ph DECIMAL(4,2) NOT NULL,              -- Rango normal: 6.5 - 8.5
    cloro_residual DECIMAL(4,2) NOT NULL,  -- mg/L, rango normal: 0.2 - 1.5
    turbidez DECIMAL(6,2) NOT NULL,        -- NTU, aceptable: < 5
    temperatura_agua DECIMAL(5,2),         -- °C del agua
    coliformes TINYINT(1) DEFAULT 0,       -- 0=ausente, 1=presente
    estado ENUM('optima', 'aceptable', 'alerta', 'no_potable') DEFAULT 'optima',
    fecha_muestreo DATETIME DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    FOREIGN KEY (tanque_id) REFERENCES tanques(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- Tabla: alertas
-- =====================================================
CREATE TABLE IF NOT EXISTS alertas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('consumo_alto', 'nivel_bajo', 'calidad_agua', 'fuga', 'mantenimiento', 'general') NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    prioridad ENUM('baja', 'media', 'alta', 'critica') DEFAULT 'media',
    activa TINYINT(1) DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- DATOS DE EJEMPLO
-- =====================================================

-- Administrador (contraseña: admin123)
INSERT INTO administradores (nombre, email, password, rol) VALUES
('Administrador', 'admin@aguapotable.com', '$2y$10$YEhPZG0xMjNhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM', 'admin'),
('Operador Demo', 'operador@aguapotable.com', '$2y$10$YEhPZG0xMjNhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM', 'operador');

-- Clientes consumidores
INSERT INTO usuarios (nombre, apellido, direccion, zona, telefono, email, medidor) VALUES
('Juan', 'Pérez García', 'Calle Hidalgo #120', 'Centro', '4521234567', 'juan.perez@email.com', 'MED-001'),
('María', 'López Hernández', 'Av. Reforma #45', 'Norte', '4529876543', 'maria.lopez@email.com', 'MED-002'),
('Carlos', 'Ramírez Torres', 'Calle Morelos #300', 'Sur', '4525551234', 'carlos.ramirez@email.com', 'MED-003'),
('Ana', 'Martínez Ruiz', 'Blvd. Lázaro Cárdenas #80', 'Oriente', '4528887654', 'ana.martinez@email.com', 'MED-004'),
('Roberto', 'Sánchez Díaz', 'Calle Juárez #200', 'Poniente', '4526663344', 'roberto.sanchez@email.com', 'MED-005'),
('Laura', 'González Flores', 'Av. Universidad #15', 'Centro', '4527774455', 'laura.gonzalez@email.com', 'MED-006'),
('Pedro', 'Hernández Castro', 'Calle 5 de Mayo #90', 'Norte', '4523332211', 'pedro.hernandez@email.com', 'MED-007'),
('Sofía', 'Díaz Moreno', 'Priv. Las Flores #12', 'Sur', '4524445566', 'sofia.diaz@email.com', 'MED-008');

-- Tanques
INSERT INTO tanques (nombre, ubicacion, capacidad_litros, nivel_actual, estado) VALUES
('Tanque Principal', 'Cerro del Agua - Zona Centro', 500000.00, 375000.00, 'alto'),
('Tanque Norte', 'Col. Industrial Norte', 300000.00, 120000.00, 'medio'),
('Tanque Sur', 'Fraccionamiento Las Palmas', 250000.00, 50000.00, 'bajo'),
('Tanque Oriente', 'Parque Industrial Oriente', 400000.00, 30000.00, 'critico');

-- Consumos
INSERT INTO consumos (usuario_id, litros, fecha_registro, periodo, observaciones) VALUES
(1, 15000, '2025-01-15', '2025-01', 'Consumo normal'),
(1, 18000, '2025-02-15', '2025-02', 'Incremento por temporada seca'),
(1, 12000, '2025-03-15', '2025-03', 'Consumo reducido'),
(2, 12000, '2025-01-15', '2025-01', 'Consumo normal'),
(2, 13500, '2025-02-15', '2025-02', 'Ligero incremento'),
(2, 11000, '2025-03-15', '2025-03', NULL),
(3, 22000, '2025-01-15', '2025-01', 'Consumo elevado - revisión pendiente'),
(3, 25000, '2025-02-15', '2025-02', 'Posible fuga'),
(3, 20000, '2025-03-15', '2025-03', 'Se reparó fuga'),
(4, 9000, '2025-01-15', '2025-01', NULL),
(4, 9500, '2025-02-15', '2025-02', NULL),
(4, 8500, '2025-03-15', '2025-03', NULL),
(5, 16000, '2025-01-15', '2025-01', NULL),
(5, 17500, '2025-02-15', '2025-02', NULL),
(5, 14000, '2025-03-15', '2025-03', NULL),
(6, 11000, '2025-01-15', '2025-01', NULL),
(6, 12000, '2025-02-15', '2025-02', NULL),
(7, 13000, '2025-01-15', '2025-01', NULL),
(7, 14000, '2025-02-15', '2025-02', NULL),
(8, 10000, '2025-01-15', '2025-01', NULL),
(8, 11000, '2025-02-15', '2025-02', NULL);

-- Registros de calidad de agua
INSERT INTO calidad_agua (tanque_id, ph, cloro_residual, turbidez, temperatura_agua, coliformes, estado, observaciones) VALUES
(1, 7.20, 0.80, 1.20, 18.5, 0, 'optima', 'Parámetros dentro de norma NOM-127'),
(1, 7.15, 0.75, 1.50, 19.0, 0, 'optima', 'Muestreo quincenal - sin novedad'),
(2, 7.50, 0.60, 2.80, 20.0, 0, 'aceptable', 'Turbidez ligeramente elevada'),
(2, 7.80, 0.40, 4.50, 21.0, 0, 'alerta', 'Turbidez alta - requiere tratamiento'),
(3, 6.80, 0.30, 3.20, 19.5, 0, 'alerta', 'Cloro residual bajo - redosificar'),
(3, 7.00, 1.00, 1.80, 18.0, 0, 'optima', 'Cloro corregido después de tratamiento'),
(4, 8.20, 0.15, 6.50, 22.0, 1, 'no_potable', 'Coliformes detectados - suspender distribución'),
(4, 7.40, 0.90, 2.00, 20.5, 0, 'aceptable', 'Parámetros restaurados tras cloración de choque');

-- Alertas (100% enfocadas en agua potable)
INSERT INTO alertas (tipo, titulo, descripcion, prioridad, activa) VALUES
('nivel_bajo', 'Tanque Sur en nivel bajo', 'El Tanque Sur ha descendido al 20% de capacidad. Se recomienda programar abastecimiento.', 'alta', 1),
('consumo_alto', 'Consumo excesivo - MED-003', 'El cliente Carlos Ramírez presenta consumo 60% superior al promedio. Posible fuga.', 'alta', 1),
('calidad_agua', 'Calidad deficiente - Tanque Oriente', 'Se detectaron coliformes en el Tanque Oriente. Se suspendió distribución y se aplicó cloración de choque.', 'critica', 1),
('nivel_bajo', 'Tanque Oriente en nivel crítico', 'El Tanque Oriente ha alcanzado nivel crítico (7.5%). Acción inmediata requerida.', 'critica', 1),
('fuga', 'Posible fuga - Zona Sur', 'Consumo anormal en zona Sur sin correlación con clientes registrados. Revisar tubería principal.', 'alta', 1),
('mantenimiento', 'Mantenimiento programado', 'Revisión trimestral de bombas - Tanque Principal. Programado para el próximo lunes.', 'baja', 0);
