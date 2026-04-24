<?php
// =====================================================
// tanques.php - CRUD de tanques de almacenamiento
// =====================================================
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['error' => true, 'mensaje' => 'No autorizado']);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/mailer.php';

$action = $_POST['action'] ?? $_GET['action'] ?? 'listar';

switch ($action) {
    case 'listar':
        listarTanques($pdo);
        break;
    case 'agregar':
        agregarTanque($pdo);
        break;
    case 'editar':
        editarTanque($pdo);
        break;
    case 'actualizar_nivel':
        actualizarNivel($pdo);
        break;
    case 'eliminar':
        eliminarTanque($pdo);
        break;
    default:
        echo json_encode(['error' => true, 'mensaje' => 'Acción no válida']);
}

/**
 * Calcula el estado del tanque según su porcentaje de llenado
 */
function calcularEstado($nivel, $capacidad) {
    if ($capacidad <= 0) return 'critico';
    $porcentaje = ($nivel / $capacidad) * 100;
    if ($porcentaje <= 10) return 'critico';
    if ($porcentaje <= 30) return 'bajo';
    if ($porcentaje <= 60) return 'medio';
    if ($porcentaje <= 90) return 'alto';
    return 'lleno';
}

function listarTanques($pdo) {
    try {
        $stmt = $pdo->query("SELECT *, ROUND(nivel_actual / capacidad_litros * 100, 1) as porcentaje FROM tanques ORDER BY id");
        echo json_encode(['error' => false, 'datos' => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al listar tanques']);
    }
}

function agregarTanque($pdo) {
    $nombre = trim($_POST['nombre'] ?? '');
    $ubicacion = trim($_POST['ubicacion'] ?? '');
    $capacidad = floatval($_POST['capacidad_litros'] ?? 0);
    $nivel = floatval($_POST['nivel_actual'] ?? 0);

    if (empty($nombre) || $capacidad <= 0) {
        echo json_encode(['error' => true, 'mensaje' => 'Nombre y capacidad son obligatorios']);
        return;
    }

    $estado = calcularEstado($nivel, $capacidad);

    try {
        $stmt = $pdo->prepare("INSERT INTO tanques (nombre, ubicacion, capacidad_litros, nivel_actual, estado) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$nombre, $ubicacion, $capacidad, $nivel, $estado]);
        echo json_encode(['error' => false, 'mensaje' => 'Tanque agregado correctamente']);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al agregar tanque']);
    }
}

function editarTanque($pdo) {
    $id = intval($_POST['id'] ?? 0);
    $nombre = trim($_POST['nombre'] ?? '');
    $ubicacion = trim($_POST['ubicacion'] ?? '');
    $capacidad = floatval($_POST['capacidad_litros'] ?? 0);

    if ($id === 0 || empty($nombre)) {
        echo json_encode(['error' => true, 'mensaje' => 'Datos incompletos']);
        return;
    }

    try {
        $stmt = $pdo->prepare("UPDATE tanques SET nombre=?, ubicacion=?, capacidad_litros=? WHERE id=?");
        $stmt->execute([$nombre, $ubicacion, $capacidad, $id]);
        echo json_encode(['error' => false, 'mensaje' => 'Tanque actualizado']);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al actualizar']);
    }
}

function actualizarNivel($pdo) {
    $id = intval($_POST['id'] ?? 0);
    $nivel = floatval($_POST['nivel_actual'] ?? 0);

    if ($id === 0) {
        echo json_encode(['error' => true, 'mensaje' => 'ID no válido']);
        return;
    }

    try {
        // Obtener capacidad para calcular estado
        $stmt = $pdo->prepare("SELECT capacidad_litros FROM tanques WHERE id = ?");
        $stmt->execute([$id]);
        $tanque = $stmt->fetch();

        if (!$tanque) {
            echo json_encode(['error' => true, 'mensaje' => 'Tanque no encontrado']);
            return;
        }

        $estado = calcularEstado($nivel, $tanque['capacidad_litros']);

        $stmt = $pdo->prepare("UPDATE tanques SET nivel_actual = ?, estado = ? WHERE id = ?");
        $stmt->execute([$nivel, $estado, $id]);

        // Si el nivel es crítico, crear alerta automática
        if ($estado === 'critico') {
            $stmtT = $pdo->prepare("SELECT nombre FROM tanques WHERE id = ?");
            $stmtT->execute([$id]);
            $t = $stmtT->fetch();
            
            $porcentaje = round(($nivel / $tanque['capacidad_litros']) * 100, 1);
            $tituloA = "{$t['nombre']} en nivel crítico";
            $descA = "El {$t['nombre']} ha alcanzado nivel crítico ({$porcentaje}%). Se requiere acción inmediata.";
            
            $stmtA = $pdo->prepare("INSERT INTO alertas (tipo, titulo, descripcion, prioridad) VALUES ('nivel_bajo', ?, ?, 'critica')");
            $stmtA->execute([$tituloA, $descA]);

            // Enviar notificación por email
            enviarEmailAlerta($tituloA, $descA, 'critica');
        }

        echo json_encode(['error' => false, 'mensaje' => 'Nivel actualizado', 'estado' => $estado]);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al actualizar nivel']);
    }
}

function eliminarTanque($pdo) {
    $id = intval($_POST['id'] ?? 0);
    try {
        $stmt = $pdo->prepare("DELETE FROM tanques WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['error' => false, 'mensaje' => 'Tanque eliminado']);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al eliminar tanque']);
    }
}
