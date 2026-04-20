<?php
// =====================================================
// consumos.php - CRUD de registros de consumo de agua
// =====================================================
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['error' => true, 'mensaje' => 'No autorizado']);
    exit;
}

require_once __DIR__ . '/../config/database.php';

$action = $_POST['action'] ?? $_GET['action'] ?? 'listar';

switch ($action) {
    case 'listar':
        listarConsumos($pdo);
        break;
    case 'agregar':
        agregarConsumo($pdo);
        break;
    case 'eliminar':
        eliminarConsumo($pdo);
        break;
    case 'resumen':
        resumenConsumo($pdo);
        break;
    default:
        echo json_encode(['error' => true, 'mensaje' => 'Acción no válida']);
}

function listarConsumos($pdo) {
    // Filtros opcionales
    $fechaInicio = $_GET['fecha_inicio'] ?? '';
    $fechaFin = $_GET['fecha_fin'] ?? '';
    $zona = $_GET['zona'] ?? '';

    $sql = "SELECT c.*, u.nombre, u.apellido, u.medidor, u.zona 
            FROM consumos c 
            JOIN usuarios u ON c.usuario_id = u.id 
            WHERE 1=1";
    $params = [];

    if (!empty($fechaInicio)) {
        $sql .= " AND c.fecha_registro >= ?";
        $params[] = $fechaInicio;
    }
    if (!empty($fechaFin)) {
        $sql .= " AND c.fecha_registro <= ?";
        $params[] = $fechaFin;
    }
    if (!empty($zona)) {
        $sql .= " AND u.zona = ?";
        $params[] = $zona;
    }

    $sql .= " ORDER BY c.fecha_registro DESC, c.id DESC";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['error' => false, 'datos' => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al listar consumos']);
    }
}

function agregarConsumo($pdo) {
    $usuario_id = intval($_POST['usuario_id'] ?? 0);
    $litros = floatval($_POST['litros'] ?? 0);
    $fecha = $_POST['fecha_registro'] ?? date('Y-m-d');
    $periodo = $_POST['periodo'] ?? date('Y-m');
    $observaciones = trim($_POST['observaciones'] ?? '');

    if ($usuario_id === 0 || $litros <= 0) {
        echo json_encode(['error' => true, 'mensaje' => 'Usuario y litros son obligatorios']);
        return;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO consumos (usuario_id, litros, fecha_registro, periodo, observaciones) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$usuario_id, $litros, $fecha, $periodo, $observaciones]);

        // Verificar si el consumo es alto (>20,000 litros) y crear alerta automática
        if ($litros > 20000) {
            $stmtU = $pdo->prepare("SELECT nombre, apellido, medidor FROM usuarios WHERE id = ?");
            $stmtU->execute([$usuario_id]);
            $usr = $stmtU->fetch();
            
            $stmtA = $pdo->prepare("INSERT INTO alertas (tipo, titulo, descripcion, prioridad) VALUES ('consumo_alto', ?, ?, 'alta')");
            $stmtA->execute([
                "Consumo alto - {$usr['medidor']}",
                "El usuario {$usr['nombre']} {$usr['apellido']} registró {$litros} litros, superando el umbral de 20,000L."
            ]);
        }

        echo json_encode(['error' => false, 'mensaje' => 'Consumo registrado correctamente']);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al registrar consumo']);
    }
}

function eliminarConsumo($pdo) {
    $id = intval($_POST['id'] ?? 0);
    try {
        $stmt = $pdo->prepare("DELETE FROM consumos WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['error' => false, 'mensaje' => 'Registro eliminado']);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al eliminar']);
    }
}

function resumenConsumo($pdo) {
    try {
        // Promedio por usuario
        $stmt = $pdo->query("
            SELECT u.nombre, u.apellido, u.zona, 
                   COUNT(c.id) as registros, 
                   SUM(c.litros) as total, 
                   AVG(c.litros) as promedio
            FROM usuarios u 
            LEFT JOIN consumos c ON u.id = c.usuario_id 
            GROUP BY u.id 
            ORDER BY total DESC
        ");
        $resumen = $stmt->fetchAll();

        // Zonas disponibles
        $stmtZ = $pdo->query("SELECT DISTINCT zona FROM usuarios WHERE zona IS NOT NULL AND zona != '' ORDER BY zona");
        $zonas = $stmtZ->fetchAll(PDO::FETCH_COLUMN);

        echo json_encode(['error' => false, 'resumen' => $resumen, 'zonas' => $zonas]);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al obtener resumen']);
    }
}
