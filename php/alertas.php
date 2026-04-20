<?php
// =====================================================
// alertas.php - CRUD de alertas del sistema
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
        listarAlertas($pdo);
        break;
    case 'agregar':
        agregarAlerta($pdo);
        break;
    case 'desactivar':
        desactivarAlerta($pdo);
        break;
    case 'eliminar':
        eliminarAlerta($pdo);
        break;
    default:
        echo json_encode(['error' => true, 'mensaje' => 'Acción no válida']);
}

function listarAlertas($pdo) {
    $soloActivas = $_GET['solo_activas'] ?? '0';
    $sql = "SELECT * FROM alertas";
    if ($soloActivas === '1') {
        $sql .= " WHERE activa = 1";
    }
    $sql .= " ORDER BY activa DESC, FIELD(prioridad, 'critica', 'alta', 'media', 'baja'), fecha_creacion DESC";

    try {
        $stmt = $pdo->query($sql);
        echo json_encode(['error' => false, 'datos' => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al listar alertas']);
    }
}

function agregarAlerta($pdo) {
    $tipo = $_POST['tipo'] ?? 'general';
    $titulo = trim($_POST['titulo'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');
    $prioridad = $_POST['prioridad'] ?? 'media';

    if (empty($titulo)) {
        echo json_encode(['error' => true, 'mensaje' => 'El título es obligatorio']);
        return;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO alertas (tipo, titulo, descripcion, prioridad) VALUES (?, ?, ?, ?)");
        $stmt->execute([$tipo, $titulo, $descripcion, $prioridad]);
        echo json_encode(['error' => false, 'mensaje' => 'Alerta creada correctamente']);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al crear alerta']);
    }
}

function desactivarAlerta($pdo) {
    $id = intval($_POST['id'] ?? 0);
    try {
        $stmt = $pdo->prepare("UPDATE alertas SET activa = 0 WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['error' => false, 'mensaje' => 'Alerta desactivada']);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al desactivar']);
    }
}

function eliminarAlerta($pdo) {
    $id = intval($_POST['id'] ?? 0);
    try {
        $stmt = $pdo->prepare("DELETE FROM alertas WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['error' => false, 'mensaje' => 'Alerta eliminada']);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al eliminar']);
    }
}
