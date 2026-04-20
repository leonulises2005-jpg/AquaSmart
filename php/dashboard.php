<?php
// =====================================================
// dashboard.php - Datos para el dashboard (KPIs y estadísticas)
// 100% enfocado en agua potable
// =====================================================
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['error' => true, 'mensaje' => 'No autorizado']);
    exit;
}

require_once __DIR__ . '/../config/database.php';

try {
    // 1. Consumo total
    $stmt = $pdo->query("SELECT COALESCE(SUM(litros), 0) as total FROM consumos");
    $consumoTotal = $stmt->fetch()['total'];

    // 2. Consumo del mes actual
    $stmt = $pdo->query("SELECT COALESCE(SUM(litros), 0) as total FROM consumos WHERE MONTH(fecha_registro) = MONTH(CURDATE()) AND YEAR(fecha_registro) = YEAR(CURDATE())");
    $consumoMes = $stmt->fetch()['total'];

    // 3. Total de usuarios activos
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM usuarios WHERE activo = 1");
    $totalUsuarios = $stmt->fetch()['total'];

    // 4. Promedio de nivel de almacenamiento (porcentaje)
    $stmt = $pdo->query("SELECT AVG(nivel_actual / capacidad_litros * 100) as promedio FROM tanques");
    $nivelPromedio = round($stmt->fetch()['promedio'], 1);

    // 5. Alertas activas
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM alertas WHERE activa = 1");
    $alertasActivas = $stmt->fetch()['total'];

    // 6. Agua total disponible (suma de todos los tanques)
    $stmt = $pdo->query("SELECT COALESCE(SUM(nivel_actual), 0) as total_disponible, COALESCE(SUM(capacidad_litros), 0) as capacidad_total FROM tanques");
    $aguaDisponible = $stmt->fetch();

    // 7. Consumo por zona
    $stmt = $pdo->query("
        SELECT u.zona, SUM(c.litros) as total_litros 
        FROM consumos c 
        JOIN usuarios u ON c.usuario_id = u.id 
        GROUP BY u.zona 
        ORDER BY total_litros DESC
    ");
    $consumoPorZona = $stmt->fetchAll();

    // 8. Consumo mensual (últimos 6 meses)
    $stmt = $pdo->query("
        SELECT periodo, SUM(litros) as total_litros 
        FROM consumos 
        GROUP BY periodo 
        ORDER BY periodo DESC 
        LIMIT 6
    ");
    $consumoMensual = array_reverse($stmt->fetchAll());

    // 9. Estado de tanques
    $stmt = $pdo->query("SELECT nombre, capacidad_litros, nivel_actual, estado FROM tanques ORDER BY id");
    $tanques = $stmt->fetchAll();

    // 10. Últimas alertas
    $stmt = $pdo->query("SELECT tipo, titulo, prioridad, fecha_creacion FROM alertas WHERE activa = 1 ORDER BY fecha_creacion DESC LIMIT 5");
    $ultimasAlertas = $stmt->fetchAll();

    // 11. Top 3 usuarios con mayor consumo
    $stmt = $pdo->query("
        SELECT u.nombre, u.apellido, u.medidor, u.zona, SUM(c.litros) as total
        FROM consumos c
        JOIN usuarios u ON c.usuario_id = u.id
        GROUP BY u.id
        ORDER BY total DESC
        LIMIT 3
    ");
    $topConsumidores = $stmt->fetchAll();

    echo json_encode([
        'error' => false,
        'consumo_total' => number_format($consumoTotal, 0, '.', ','),
        'consumo_mes' => number_format($consumoMes, 0, '.', ','),
        'total_usuarios' => $totalUsuarios,
        'nivel_promedio' => $nivelPromedio,
        'alertas_activas' => $alertasActivas,
        'agua_disponible' => number_format($aguaDisponible['total_disponible'], 0, '.', ','),
        'capacidad_total' => number_format($aguaDisponible['capacidad_total'], 0, '.', ','),
        'consumo_por_zona' => $consumoPorZona,
        'consumo_mensual' => $consumoMensual,
        'tanques' => $tanques,
        'ultimas_alertas' => $ultimasAlertas,
        'top_consumidores' => $topConsumidores
    ]);

} catch (PDOException $e) {
    echo json_encode(['error' => true, 'mensaje' => 'Error al obtener datos: ' . $e->getMessage()]);
}
