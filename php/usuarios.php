<?php
// =====================================================
// usuarios.php - CRUD de usuarios consumidores
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
        listarUsuarios($pdo);
        break;
    case 'obtener':
        obtenerUsuario($pdo);
        break;
    case 'agregar':
        agregarUsuario($pdo);
        break;
    case 'editar':
        editarUsuario($pdo);
        break;
    case 'eliminar':
        eliminarUsuario($pdo);
        break;
    default:
        echo json_encode(['error' => true, 'mensaje' => 'Acción no válida']);
}

function listarUsuarios($pdo) {
    try {
        $stmt = $pdo->query("SELECT * FROM usuarios ORDER BY id DESC");
        echo json_encode(['error' => false, 'datos' => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al listar usuarios']);
    }
}

function obtenerUsuario($pdo) {
    $id = intval($_GET['id'] ?? 0);
    try {
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE id = ?");
        $stmt->execute([$id]);
        $usuario = $stmt->fetch();
        if ($usuario) {
            echo json_encode(['error' => false, 'datos' => $usuario]);
        } else {
            echo json_encode(['error' => true, 'mensaje' => 'Usuario no encontrado']);
        }
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al obtener usuario']);
    }
}

function agregarUsuario($pdo) {
    $nombre = trim($_POST['nombre'] ?? '');
    $apellido = trim($_POST['apellido'] ?? '');
    $direccion = trim($_POST['direccion'] ?? '');
    $zona = trim($_POST['zona'] ?? '');
    $telefono = trim($_POST['telefono'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $medidor = trim($_POST['medidor'] ?? '');

    if (empty($nombre) || empty($apellido) || empty($medidor)) {
        echo json_encode(['error' => true, 'mensaje' => 'Nombre, apellido y medidor son obligatorios']);
        return;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO usuarios (nombre, apellido, direccion, zona, telefono, email, medidor) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$nombre, $apellido, $direccion, $zona, $telefono, $email, $medidor]);
        echo json_encode(['error' => false, 'mensaje' => 'Usuario agregado correctamente', 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        $msg = (strpos($e->getMessage(), 'Duplicate') !== false) ? 'El número de medidor ya existe' : 'Error al agregar usuario';
        echo json_encode(['error' => true, 'mensaje' => $msg]);
    }
}

function editarUsuario($pdo) {
    $id = intval($_POST['id'] ?? 0);
    $nombre = trim($_POST['nombre'] ?? '');
    $apellido = trim($_POST['apellido'] ?? '');
    $direccion = trim($_POST['direccion'] ?? '');
    $zona = trim($_POST['zona'] ?? '');
    $telefono = trim($_POST['telefono'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $medidor = trim($_POST['medidor'] ?? '');
    $activo = intval($_POST['activo'] ?? 1);

    if (empty($nombre) || empty($apellido) || $id === 0) {
        echo json_encode(['error' => true, 'mensaje' => 'Datos incompletos']);
        return;
    }

    try {
        $stmt = $pdo->prepare("UPDATE usuarios SET nombre=?, apellido=?, direccion=?, zona=?, telefono=?, email=?, medidor=?, activo=? WHERE id=?");
        $stmt->execute([$nombre, $apellido, $direccion, $zona, $telefono, $email, $medidor, $activo, $id]);
        echo json_encode(['error' => false, 'mensaje' => 'Usuario actualizado correctamente']);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al actualizar usuario']);
    }
}

function eliminarUsuario($pdo) {
    $id = intval($_POST['id'] ?? 0);
    if ($id === 0) {
        echo json_encode(['error' => true, 'mensaje' => 'ID no válido']);
        return;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['error' => false, 'mensaje' => 'Usuario eliminado correctamente']);
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error al eliminar. Puede tener consumos asociados.']);
    }
}
