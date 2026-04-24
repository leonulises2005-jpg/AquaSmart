<?php
/**
 * mailer.php - Utilidad para envío de correos electrónicos
 * =====================================================
 * Este archivo centraliza la lógica de notificaciones por email.
 */

require_once __DIR__ . '/../config/database.php';

/**
 * Envía una notificación de alerta por correo electrónico
 */
function enviarEmailAlerta($titulo, $descripcion, $prioridad) {
    // 1. Configuración del destinatario
    // Por defecto usamos el admin configurado en el sistema
    $destinatario = "argometros@gmail.com"; // CAMBIA ESTO por tu correo real
    
    // 2. Preparar el asunto y cuerpo
    $asunto = "⚠️ AQUASMART ALERTA [" . strtoupper($prioridad) . "]: " . $titulo;
    
    $mensaje = "
    <html>
    <head>
      <title>Notificación de AquaSmart</title>
      <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .header { background: #0077B6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
        .prioridad { font-weight: bold; padding: 4px 8px; border-radius: 4px; }
        .critica { background: #FEE2E2; color: #DC2626; }
        .alta { background: #FED7AA; color: #EA580C; }
        .media { background: #FEF3C7; color: #D97706; }
        .baja { background: #E0E7FF; color: #4338CA; }
        .footer { font-size: 12px; color: #777; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class='header'>
        <h1>AquaSmart - Centro de Alertas</h1>
      </div>
      <div class='content'>
        <h2>{$titulo}</h2>
        <p><span class='prioridad {$prioridad}'>Prioridad: " . strtoupper($prioridad) . "</span></p>
        <p><strong>Descripción:</strong><br>{$descripcion}</p>
        <hr>
        <p>Este es un mensaje automático generado por el sistema de monitoreo.</p>
        <p><a href='http://localhost/agua-potable/dashboard.html'>Ir al Panel de Control</a></p>
      </div>
      <div class='footer'>
        © " . date('Y') . " AquaSmart - Sistema Inteligente de Gestión de Agua Potable.
      </div>
    </body>
    </html>
    ";

    // 3. Cabeceras para HTML
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: AquaSmart System <noreply@aguapotable.com>" . "\r\n";

    // 4. Intento de envío
    // NOTA: En XAMPP local, mail() suele requerir configuración de SMTP.
    // Si estás en un servidor real, funcionará de inmediato.
    try {
        return @mail($destinatario, $asunto, $mensaje, $headers);
    } catch (Exception $e) {
        return false;
    }
}
