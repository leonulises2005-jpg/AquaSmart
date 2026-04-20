<?php
// =====================================================
// setup.php - Genera hashes de contraseña y configura datos iniciales
// =====================================================
// INSTRUCCIONES: Ejecuta este archivo UNA VEZ después de crear la BD
// para actualizar las contraseñas con hashes seguros.
// Accede desde el navegador: http://localhost/agua-potable/php/setup.php

require_once __DIR__ . '/../config/database.php';

echo "<h2>Configuración inicial del sistema</h2>";

try {
    // Generar hash seguro para la contraseña 'admin123'
    $passwordHash = password_hash('admin123', PASSWORD_BCRYPT);
    
    // Actualizar contraseñas de los administradores
    $stmt = $pdo->prepare("UPDATE administradores SET password = ?");
    $stmt->execute([$passwordHash]);
    
    echo "<p style='color:green'>✅ Contraseñas actualizadas correctamente.</p>";
    echo "<p><strong>Email:</strong> admin@aguapotable.com</p>";
    echo "<p><strong>Contraseña:</strong> admin123</p>";
    echo "<p><strong>Hash generado:</strong> " . $passwordHash . "</p>";
    echo "<hr>";
    echo "<p>Ya puedes iniciar sesión en el sistema.</p>";
    echo "<p><a href='../index.html'>Ir al login</a></p>";
    
} catch (PDOException $e) {
    echo "<p style='color:red'>❌ Error: " . $e->getMessage() . "</p>";
    echo "<p>Asegúrate de haber ejecutado el script SQL primero.</p>";
}
