<?php
// =====================================================
// auth.php - Manejo de autenticación (login/logout)
// =====================================================
session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';

// Determinar qué acción ejecutar
$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        login($pdo);
        break;
    case 'logout':
        logout();
        break;
    case 'check':
        checkSession();
        break;
    default:
        echo json_encode(['error' => true, 'mensaje' => 'Acción no válida']);
}

// ---- FUNCIONES ----

/**
 * Iniciar sesión: valida email y contraseña contra MySQL
 */
function login($pdo) {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        echo json_encode(['error' => true, 'mensaje' => 'Completa todos los campos']);
        return;
    }

    try {
        // Buscar administrador por email
        $stmt = $pdo->prepare("SELECT id, nombre, email, password, rol FROM administradores WHERE email = ? AND activo = 1");
        $stmt->execute([$email]);
        $admin = $stmt->fetch();

        if ($admin && password_verify($password, $admin['password'])) {
            // Credenciales correctas: crear sesión
            $_SESSION['admin_id'] = $admin['id'];
            $_SESSION['admin_nombre'] = $admin['nombre'];
            $_SESSION['admin_email'] = $admin['email'];
            $_SESSION['admin_rol'] = $admin['rol'];
            $_SESSION['logged_in'] = true;

            echo json_encode([
                'error' => false,
                'mensaje' => 'Bienvenido, ' . $admin['nombre'],
                'nombre' => $admin['nombre'],
                'rol' => $admin['rol']
            ]);
        } else {
            echo json_encode(['error' => true, 'mensaje' => 'Email o contraseña incorrectos']);
        }
    } catch (PDOException $e) {
        echo json_encode(['error' => true, 'mensaje' => 'Error del servidor']);
    }
}

/**
 * Cerrar sesión: destruir sesión PHP
 */
function logout() {
    session_unset();
    session_destroy();
    echo json_encode(['error' => false, 'mensaje' => 'Sesión cerrada']);
}

/**
 * Verificar si hay sesión activa
 */
function checkSession() {
    if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
        echo json_encode([
            'logged_in' => true,
            'nombre' => $_SESSION['admin_nombre'],
            'rol' => $_SESSION['admin_rol']
        ]);
    } else {
        echo json_encode(['logged_in' => false]);
    }
}
