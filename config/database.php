<?php
// =====================================================
// Configuración de conexión a la base de datos MySQL
// =====================================================
// INSTRUCCIONES:
// 1. Asegúrate de que XAMPP esté corriendo (Apache + MySQL)
// 2. Modifica los datos de conexión si es necesario
// 3. Este archivo se incluye en todos los scripts PHP que necesitan BD

// Datos de conexión - MODIFICA SEGÚN TU ENTORNO
define('DB_HOST', 'localhost');      // Servidor MySQL
define('DB_NAME', 'agua_potable');   // Nombre de la base de datos
define('DB_USER', 'root');           // Usuario MySQL (en XAMPP por defecto es "root")
define('DB_PASS', '');               // Contraseña MySQL (en XAMPP por defecto está vacía)
define('DB_CHARSET', 'utf8mb4');

// Crear conexión usando PDO (más seguro que mysqli)
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,           // Errores como excepciones
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,      // Resultados como arrays asociativos
            PDO::ATTR_EMULATE_PREPARES => false                     // Prepared statements reales
        ]
    );
} catch (PDOException $e) {
    // Si falla la conexión, mostrar error amigable
    die(json_encode([
        'error' => true,
        'mensaje' => 'Error de conexión a la base de datos. Verifica que MySQL esté ejecutándose y que la BD exista.'
    ]));
}
