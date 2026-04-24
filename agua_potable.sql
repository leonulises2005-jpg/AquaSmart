-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 23-04-2026 a las 05:33:12
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `agua_potable`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `administradores`
--

CREATE TABLE `administradores` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('admin','operador') DEFAULT 'operador',
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `administradores`
--

INSERT INTO `administradores` (`id`, `nombre`, `email`, `password`, `rol`, `activo`, `fecha_creacion`) VALUES
(1, 'Administrador', 'admin@aguapotable.com', '$2y$10$kutJhFtOQ3RD7HJJF1Sg9urSe.7gHrTq7QN0I/ZgZV7sVZrDw/DhG', 'admin', 1, '2026-04-17 09:06:25'),
(2, 'Operador Demo', 'operador@aguapotable.com', '$2y$10$kutJhFtOQ3RD7HJJF1Sg9urSe.7gHrTq7QN0I/ZgZV7sVZrDw/DhG', 'operador', 1, '2026-04-17 09:06:25'),
(3, 'Leonidas', 'leon@gmail.com', '$2y$10$OcXJVMY/iuYSfgGRRtvNM.6qcuyDwcqhHe0vqBevNaz/1bXavQTMW', 'operador', 1, '2026-04-17 15:29:34');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alertas`
--

CREATE TABLE `alertas` (
  `id` int(11) NOT NULL,
  `tipo` enum('consumo_alto','nivel_bajo','calidad_agua','fuga','mantenimiento','general') NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `prioridad` enum('baja','media','alta','critica') DEFAULT 'media',
  `activa` tinyint(1) DEFAULT 1,
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `alertas`
--

INSERT INTO `alertas` (`id`, `tipo`, `titulo`, `descripcion`, `prioridad`, `activa`, `fecha_creacion`) VALUES
(1, 'nivel_bajo', 'Tanque Sur en nivel bajo', 'El Tanque Sur ha descendido al 20% de capacidad. Se recomienda programar abastecimiento.', 'alta', 1, '2026-04-17 09:06:25'),
(2, 'consumo_alto', 'Consumo excesivo - MED-003', 'El usuario Carlos Ramírez presenta consumo 60% superior al promedio. Posible fuga.', 'alta', 1, '2026-04-17 09:06:25'),
(3, 'calidad_agua', 'Calidad deficiente - Tanque Oriente', 'Se detectaron coliformes en el Tanque Oriente. Se suspendió distribución y se aplicó cloración de choque.', 'critica', 1, '2026-04-17 09:06:25'),
(4, 'nivel_bajo', 'Tanque Oriente en nivel crítico', 'El Tanque Oriente ha alcanzado nivel crítico (7.5%). Acción inmediata requerida.', 'critica', 1, '2026-04-17 09:06:25'),
(5, 'fuga', 'Posible fuga - Zona Sur', 'Consumo anormal en zona Sur sin correlación con usuarios registrados. Revisar tubería principal.', 'alta', 1, '2026-04-17 09:06:25'),
(6, 'mantenimiento', 'Mantenimiento programado', 'Revisión trimestral de bombas - Tanque Principal. Programado para el próximo lunes.', 'baja', 0, '2026-04-17 09:06:25'),
(7, 'consumo_alto', 'Alto consumo', 'Gastan agua mas d elo normal', 'alta', 1, '2026-04-17 13:23:02'),
(8, 'nivel_bajo', 'Tanque Oriente en nivel crítico', 'El Tanque Oriente ha alcanzado nivel crítico (10%). Se requiere acción inmediata.', 'critica', 1, '2026-04-21 18:58:32'),
(9, 'nivel_bajo', 'Tanque Principal en nivel crítico', 'El Tanque Principal ha alcanzado nivel crítico (4%). Se requiere acción inmediata.', 'critica', 1, '2026-04-21 19:13:15');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `calidad_agua`
--

CREATE TABLE `calidad_agua` (
  `id` int(11) NOT NULL,
  `tanque_id` int(11) NOT NULL,
  `ph` decimal(4,2) NOT NULL,
  `cloro_residual` decimal(4,2) NOT NULL,
  `turbidez` decimal(6,2) NOT NULL,
  `temperatura_agua` decimal(5,2) DEFAULT NULL,
  `coliformes` tinyint(1) DEFAULT 0,
  `estado` enum('optima','aceptable','alerta','no_potable') DEFAULT 'optima',
  `fecha_muestreo` datetime DEFAULT current_timestamp(),
  `observaciones` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `calidad_agua`
--

INSERT INTO `calidad_agua` (`id`, `tanque_id`, `ph`, `cloro_residual`, `turbidez`, `temperatura_agua`, `coliformes`, `estado`, `fecha_muestreo`, `observaciones`) VALUES
(1, 1, 7.20, 0.80, 1.20, 18.50, 0, 'optima', '2026-04-17 09:06:25', 'Parámetros dentro de norma NOM-127'),
(2, 1, 7.15, 0.75, 1.50, 19.00, 0, 'optima', '2026-04-17 09:06:25', 'Muestreo quincenal - sin novedad'),
(3, 2, 7.50, 0.60, 2.80, 20.00, 0, 'aceptable', '2026-04-17 09:06:25', 'Turbidez ligeramente elevada'),
(4, 2, 7.80, 0.40, 4.50, 21.00, 0, 'alerta', '2026-04-17 09:06:25', 'Turbidez alta - requiere tratamiento'),
(5, 3, 6.80, 0.30, 3.20, 19.50, 0, 'alerta', '2026-04-17 09:06:25', 'Cloro residual bajo - redosificar'),
(6, 3, 7.00, 1.00, 1.80, 18.00, 0, 'optima', '2026-04-17 09:06:25', 'Cloro corregido después de tratamiento'),
(7, 4, 8.20, 0.15, 6.50, 22.00, 1, 'no_potable', '2026-04-17 09:06:25', 'Coliformes detectados - suspender distribución'),
(8, 4, 7.40, 0.90, 2.00, 20.50, 0, 'aceptable', '2026-04-17 09:06:25', 'Parámetros restaurados tras cloración de choque');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `consumos`
--

CREATE TABLE `consumos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `litros` decimal(10,2) NOT NULL,
  `fecha_registro` date NOT NULL,
  `periodo` varchar(20) DEFAULT NULL,
  `observaciones` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `consumos`
--

INSERT INTO `consumos` (`id`, `usuario_id`, `litros`, `fecha_registro`, `periodo`, `observaciones`) VALUES
(1, 1, 15000.00, '2025-01-15', '2025-01', 'Consumo normal'),
(2, 1, 18000.00, '2025-02-15', '2025-02', 'Incremento por temporada seca'),
(3, 1, 12000.00, '2025-03-15', '2025-03', 'Consumo reducido'),
(4, 2, 12000.00, '2025-01-15', '2025-01', 'Consumo normal'),
(5, 2, 13500.00, '2025-02-15', '2025-02', 'Ligero incremento'),
(6, 2, 11000.00, '2025-03-15', '2025-03', NULL),
(8, 3, 25000.00, '2025-02-15', '2025-02', 'Posible fuga'),
(9, 3, 20000.00, '2025-03-15', '2025-03', 'Se reparó fuga'),
(10, 4, 9000.00, '2025-01-15', '2025-01', NULL),
(11, 4, 9500.00, '2025-02-15', '2025-02', NULL),
(12, 4, 8500.00, '2025-03-15', '2025-03', NULL),
(13, 5, 16000.00, '2025-01-15', '2025-01', NULL),
(14, 5, 17500.00, '2025-02-15', '2025-02', NULL),
(15, 5, 14000.00, '2025-03-15', '2025-03', NULL),
(16, 6, 11000.00, '2025-01-15', '2025-01', NULL),
(17, 6, 12000.00, '2025-02-15', '2025-02', NULL),
(18, 7, 13000.00, '2025-01-15', '2025-01', NULL),
(19, 7, 14000.00, '2025-02-15', '2025-02', NULL),
(20, 8, 10000.00, '2025-01-15', '2025-01', NULL),
(21, 8, 11000.00, '2025-02-15', '2025-02', NULL),
(22, 8, 5000.00, '2026-04-20', '2026-04', 'como su normal');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tanques`
--

CREATE TABLE `tanques` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `ubicacion` varchar(200) DEFAULT NULL,
  `capacidad_litros` decimal(12,2) NOT NULL,
  `nivel_actual` decimal(12,2) NOT NULL DEFAULT 0.00,
  `estado` enum('critico','bajo','medio','alto','lleno') DEFAULT 'medio',
  `ultima_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `tanques`
--

INSERT INTO `tanques` (`id`, `nombre`, `ubicacion`, `capacidad_litros`, `nivel_actual`, `estado`, `ultima_actualizacion`) VALUES
(1, 'Tanque Principal', 'Cerro del Agua - Zona Centro', 500000.00, 400000.00, 'alto', '2026-04-21 19:13:41'),
(2, 'Tanque Norte', 'Col. Industrial Norte', 300000.00, 120000.00, 'medio', '2026-04-17 09:06:25'),
(3, 'Tanque Sur', 'Fraccionamiento Las Palmas', 250000.00, 50000.00, 'bajo', '2026-04-17 09:06:25'),
(4, 'Tanque Oriente', 'Parque Industrial Oriente', 400000.00, 40000.00, 'critico', '2026-04-21 18:58:32');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `zona` varchar(50) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `medidor` varchar(50) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_registro` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `apellido`, `direccion`, `zona`, `telefono`, `email`, `medidor`, `activo`, `fecha_registro`) VALUES
(1, 'Pedro', 'Hernandez', 'Calle del Panteon', 'Centro', '9487465382920', 'pedrohdz@email.com', 'MED-001', 1, '2026-04-17 09:06:25'),
(2, 'María', 'López Hernández', 'Av. Reforma #45', 'Norte', '4529876543', 'maria.lopez@email.com', 'MED-002', 1, '2026-04-17 09:06:25'),
(3, 'Carlos', 'Ramírez Torres', 'Calle Morelos #300', 'Sur', '4525551234', 'carlos.ramirez@email.com', 'MED-003', 1, '2026-04-17 09:06:25'),
(4, 'Ana', 'Martínez Ruiz', 'Blvd. Lázaro Cárdenas #80', 'Oriente', '4528887654', 'ana.martinez@email.com', 'MED-004', 1, '2026-04-17 09:06:25'),
(5, 'Roberto', 'Sánchez Díaz', 'Calle Juárez #200', 'Poniente', '4526663344', 'roberto.sanchez@email.com', 'MED-005', 1, '2026-04-17 09:06:25'),
(6, 'Laura', 'González Flores', 'Av. Universidad #15', 'Centro', '4527774455', 'laura.gonzalez@email.com', 'MED-006', 1, '2026-04-17 09:06:25'),
(7, 'Pedro', 'Hernández Castro', 'Calle 5 de Mayo #90', 'Norte', '4523332211', 'pedro.hernandez@email.com', 'MED-007', 1, '2026-04-17 09:06:25'),
(8, 'Sofía', 'Díaz Moreno', 'Priv. Las Flores #12', 'Sur', '4524445566', 'sofia.diaz@email.com', 'MED-008', 1, '2026-04-17 09:06:25');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `administradores`
--
ALTER TABLE `administradores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indices de la tabla `alertas`
--
ALTER TABLE `alertas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `calidad_agua`
--
ALTER TABLE `calidad_agua`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tanque_id` (`tanque_id`);

--
-- Indices de la tabla `consumos`
--
ALTER TABLE `consumos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `tanques`
--
ALTER TABLE `tanques`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `medidor` (`medidor`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `administradores`
--
ALTER TABLE `administradores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `alertas`
--
ALTER TABLE `alertas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `calidad_agua`
--
ALTER TABLE `calidad_agua`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `consumos`
--
ALTER TABLE `consumos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `tanques`
--
ALTER TABLE `tanques`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `calidad_agua`
--
ALTER TABLE `calidad_agua`
  ADD CONSTRAINT `calidad_agua_ibfk_1` FOREIGN KEY (`tanque_id`) REFERENCES `tanques` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `consumos`
--
ALTER TABLE `consumos`
  ADD CONSTRAINT `consumos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
