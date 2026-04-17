# 💧 Sistema Inteligente de Gestión de Agua Potable

Sistema web para monitorear, registrar y visualizar información del consumo, distribución, calidad y control del agua potable.

## 🗂️ Estructura del Proyecto

```
agua-potable/
├── index.html              ← Página de login
├── dashboard.html          ← Dashboard principal
├── README.md
│
├── config/
│   └── database.php        ← Conexión a MySQL (PDO)
│
├── css/
│   └── styles.css          ← Estilos completos
│
├── js/
│   └── app.js              ← Lógica JavaScript (navegación, CRUD, gráficas)
│
├── php/
│   ├── auth.php            ← Login, logout, verificar sesión
│   ├── dashboard.php       ← KPIs y estadísticas
│   ├── usuarios.php        ← CRUD usuarios
│   ├── consumos.php        ← CRUD consumos
│   ├── tanques.php         ← CRUD tanques
│   ├── calidad.php         ← Monitoreo de calidad del agua
│   ├── alertas.php         ← CRUD alertas
│   └── setup.php           ← Configuración inicial (ejecutar 1 vez)
│
├── sql/
│   └── database.sql        ← BD completa con datos de ejemplo
│
└── assets/
    └── img/
```

## 🚀 Pasos para Ejecutarlo en XAMPP

1. **Instalar XAMPP** desde https://www.apachefriends.org/
2. **Copiar** la carpeta `agua-potable/` en `C:\xampp\htdocs\`
3. **Iniciar** Apache y MySQL desde el Panel de XAMPP
4. **Importar BD:** en `http://localhost/phpmyadmin` → Importar → seleccionar `sql/database.sql`
5. **Configurar:** abrir `http://localhost/agua-potable/php/setup.php` (solo 1 vez)
6. **Acceder:** `http://localhost/agua-potable/`
   - Email: `admin@aguapotable.com`
   - Contraseña: `admin123`

## 📋 Módulos

| Módulo | Descripción |
|---|---|
| **Dashboard** | KPIs, gráficas de consumo, estado de tanques, calidad del agua, alertas, top consumidores |
| **Usuarios** | CRUD completo de usuarios consumidores con medidor |
| **Consumos** | Registro de consumo por usuario, filtros por fecha/zona, resumen estadístico |
| **Tanques** | Gestión de tanques, actualización de niveles, alertas automáticas |
| **Calidad del Agua** | Muestreos de pH, cloro, turbidez, coliformes. Alertas automáticas si el agua no es potable |
| **Alertas** | Tipos: consumo alto, nivel bajo, calidad del agua, fuga, mantenimiento |

## 🔬 Monitoreo de Calidad del Agua

El sistema incluye un módulo completo de calidad basado en parámetros de la NOM-127-SSA1:

| Parámetro | Rango Normal | Alerta |
|---|---|---|
| pH | 6.5 - 8.5 | Fuera de rango |
| Cloro residual | 0.2 - 1.5 mg/L | < 0.2 o > 1.5 |
| Turbidez | < 5 NTU | > 5 NTU |
| Coliformes | Ausente | Presente → No potable |

El estado se calcula automáticamente: **Óptima**, **Aceptable**, **Alerta** o **No Potable**.

## ⚙️ Tecnologías

- **Frontend:** HTML5, CSS3, JavaScript (vanilla)
- **Backend:** PHP 7.4+ con PDO
- **Base de datos:** MySQL 5.7+
- **Gráficas:** Chart.js 4.4
- **Fuentes:** Plus Jakarta Sans, JetBrains Mono

## 🔧 Conexión a BD

Archivo: `config/database.php`
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'agua_potable');
define('DB_USER', 'root');
define('DB_PASS', '');
```
# AquaSmart
