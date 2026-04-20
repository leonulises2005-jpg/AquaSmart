<?php
// =====================================================
// calidad.php - Consulta de registros de calidad del agua
// =====================================================
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['error' => true, 'mensaje' => 'No autorizado']);
    exit;
}

require_once __DIR__ . '/../config/database.php';

$action = $_POST['action'] ?? $_GET['action'] ?? 'resumen';

switch ($action) {
    case 'resumen':
        resumenCalidad($pdo);
        break;
    case 'historial':
        historialCalidad($pdo);
        break;
    case 'agregar':
        agregarMuestreo($pdo);
        break;
    default:
        echo json_encode(['error' => true, 'mensaje' => 'Acción no válida']);
}

/**
 * Obtiene el último muestreo de cada tanque para el panel del dashboard
 */
function resumenCalidad($pdo) {
    try {
        // Último registro de calidad por cada tanque
        $stmt = $pdo->query("
            SELECT ca.*, t.nombre as tanque_nombre, t.ubicacion
            FROM calidad_agua ca
            INNER JOIN (
                SELECT tanque_id, MAX(id) as max_id
                FROM calidad_agua
                GROUP BY tanque_id
            ) ultimo ON ca.id = ultimo.max_id
            JOIN tanques t ON ca.tanque_id = t.id
            ORDER BY ca.estado DESC, t.id
        ");
        $datos = $stmt->fetchAll();

        // Promedios generales
        $stmtProm = $pdo->query("
            SELECT 
                AVG(ph) as ph_promedio,
                AVG(cloro_residual) as cloro_promedio,
                AVG(turbidez) as turbidez_promedio,
                SUM(CASE WHEN estado = 'optima' THEN 1 ELSE 0 END) as optimas,
                SUM(CASE WHEN estado = 'aceptable' THEN 1 ELSE 0 END) as aceptables,
                SUM(CASE WHEN estado = 'alerta' THEN 1 ELSE 0 END) as alertas,
                SUM(CASE WHEN estado = 'no_potable' THEN 1 ELSE 0 END) as no_potables,
                COUNT(*) as total_muestreos
            FROM calidad_agua
        ");
        $promedios = $stmtProm->fetch();

        echo json_encode([
            'error' => false,
            'datos' => $datos,
            'promedios' => $promedios
        ]);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al obtener calidad: ' . $e->getMessage()]);
    }
}

/**
 * Historial completo de muestreos
 */
function historialCalidad($pdo) {
    $tanque_id = $_GET['tanque_id'] ?? '';
    
    $sql = "SELECT ca.*, t.nombre as tanque_nombre FROM calidad_agua ca JOIN tanques t ON ca.tanque_id = t.id";
    $params = [];
    
    if (!empty($tanque_id)) {
        $sql .= " WHERE ca.tanque_id = ?";
        $params[] = $tanque_id;
    }
    $sql .= " ORDER BY ca.fecha_muestreo DESC";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['error' => false, 'datos' => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al obtener historial']);
    }
}

/**
 * Registra un nuevo muestreo de calidad
 */
function agregarMuestreo($pdo) {
    $tanque_id = intval($_POST['tanque_id'] ?? 0);
    $ph = floatval($_POST['ph'] ?? 0);
    $cloro = floatval($_POST['cloro_residual'] ?? 0);
    $turbidez = floatval($_POST['turbidez'] ?? 0);
    $temp = floatval($_POST['temperatura_agua'] ?? 0);
    $coliformes = intval($_POST['coliformes'] ?? 0);
    $observaciones = trim($_POST['observaciones'] ?? '');

    if ($tanque_id === 0) {
        echo json_encode(['error' => true, 'mensaje' => 'Selecciona un tanque']);
        return;
    }

    // Determinar estado según parámetros (NOM-127-SSA1)
    $estado = 'optima';
    if ($coliformes == 1) {
        $estado = 'no_potable';
    } elseif ($turbidez > 5 || $ph < 6.5 || $ph > 8.5 || $cloro < 0.2 || $cloro > 1.5) {
        $estado = 'alerta';
    } elseif ($turbidez > 3 || $ph < 6.8 || $ph > 8.2 || $cloro < 0.3) {
        $estado = 'aceptable';
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO calidad_agua (tanque_id, ph, cloro_residual, turbidez, temperatura_agua, coliformes, estado, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$tanque_id, $ph, $cloro, $turbidez, $temp, $coliformes, $estado, $observaciones]);

        // Alerta automática si el agua no es potable
        if ($estado === 'no_potable' || $estado === 'alerta') {
            $stmtT = $pdo->prepare("SELECT nombre FROM tanques WHERE id = ?");
            $stmtT->execute([$tanque_id]);
            $tanque = $stmtT->fetch();

            $prioridad = ($estado === 'no_potable') ? 'critica' : 'alta';
            $titulo = ($estado === 'no_potable')
                ? "Agua NO potable - {$tanque['nombre']}"
                : "Alerta de calidad - {$tanque['nombre']}";
            $desc = "pH: {$ph} | Cloro: {$cloro} mg/L | Turbidez: {$turbidez} NTU | Coliformes: " . ($coliformes ? 'PRESENTE' : 'Ausente');

            $stmtA = $pdo->prepare("INSERT INTO alertas (tipo, titulo, descripcion, prioridad) VALUES ('calidad_agua', ?, ?, ?)");
            $stmtA->execute([$titulo, $desc, $prioridad]);
        }

        echo json_encode(['error' => false, 'mensaje' => "Muestreo registrado. Estado: {$estado}", 'estado' => $estado]);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al registrar muestreo']);
    }
}
