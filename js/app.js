// =====================================================
// app.js - Lógica principal del Sistema de Gestión de Agua Potable
// 100% enfocado en agua potable — sin clima ni APIs externas
// =====================================================

// Variables globales para gráficas
let chartConsumoMensual = null;
let chartConsumoZona = null;
let simInterval = null;
let alertasInterval = null;

// Variables para simulación (usadas por consumos en tiempo real)
let simFlujosZonas = { Centro: 0, Norte: 0, Sur: 0, Oriente: 0, Poniente: 0 };
let simTotalFlow = 0;

// Variables para consumos simulados dinámicos
let consumosSimulados = [];
let consumosInterval = null;

// ---- INICIALIZACIÓN ----
document.addEventListener('DOMContentLoaded', () => {
    verificarSesion();
    actualizarFecha();
});

/**
 * Verifica si el usuario tiene sesión activa
 */
function verificarSesion() {
    fetch('php/auth.php?action=check')
        .then(r => r.json())
        .then(data => {
            if (!data.logged_in) {
                window.location.href = 'index.html';
            } else {
                document.getElementById('userName').textContent = data.nombre;
                document.getElementById('userRole').textContent = data.rol === 'admin' ? 'Administrador' : 'Operador';
                document.getElementById('userAvatar').textContent = data.nombre.charAt(0).toUpperCase();
                cargarDashboard();
            }
        })
        .catch(() => {
            window.location.href = 'index.html';
        });
}

/**
 * Muestra la fecha actual en el header
 */
function actualizarFecha() {
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha = new Date().toLocaleDateString('es-MX', opciones);
    document.getElementById('headerDate').textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);
}

// =====================================================
// NAVEGACIÓN
// =====================================================
function navigateTo(section) {
    // Ocultar todas, mostrar la seleccionada
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.getElementById('section-' + section).classList.add('active');

    // Actualizar menú activo
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });

    // Títulos del header
    const titles = {
        dashboard: ['Dashboard', 'Resumen general del sistema'],
        usuarios: ['Usuarios', 'Gestión de usuarios consumidores'],
        consumos: ['Consumos', 'Registro y control de consumo de agua'],
        tanques: ['Tanques', 'Monitoreo de almacenamiento'],
        alertas: ['Alertas', 'Centro de alertas y notificaciones']
    };
    document.getElementById('pageTitle').textContent = titles[section][0];
    document.getElementById('pageSubtitle').textContent = titles[section][1];

    // Detener simulación si se sale del dashboard
    if (section !== 'dashboard') detenerSimulacion();

    // Detener simulación de consumos si se sale de dashboard y consumos
    if (section !== 'dashboard' && section !== 'consumos') detenerSimulacionConsumos();

    // Cargar datos según la sección
    switch(section) {
        case 'dashboard': cargarDashboard(); iniciarSimulacionConsumos(); break;
        case 'usuarios': cargarUsuarios(); break;
        case 'consumos': cargarConsumos(); cargarResumenConsumos(); renderConsumosTiempoReal(); iniciarSimulacionConsumos(); break;
        case 'tanques': cargarTanques(); break;
        case 'alertas': cargarAlertas(); break;
    }

    // Cerrar sidebar en móvil
    document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function cerrarSesion() {
    fetch('php/auth.php?action=logout')
        .then(r => r.json())
        .then(() => { window.location.href = 'index.html'; });
}

// =====================================================
// DASHBOARD
// =====================================================
function cargarDashboard() {
    fetch('php/dashboard.php')
        .then(r => r.json())
        .then(data => {
            if (data.error) { showToast(data.mensaje, 'error'); return; }

            // KPIs
            document.getElementById('kpiConsumo').textContent = data.consumo_total;
            document.getElementById('kpiUsuarios').textContent = data.total_usuarios;
            document.getElementById('kpiAlmacen').textContent = data.nivel_promedio + '%';
            document.getElementById('kpiAlertas').textContent = data.alertas_activas;
            document.getElementById('alertBadge').textContent = data.alertas_activas;

            // Gráficas
            renderChartConsumoTiempoReal();
            renderChartConsumoZona(data.consumo_por_zona);

            // Estado de tanques
            renderDashTanques(data.tanques);

            // Alertas recientes
            renderDashAlertas(data.ultimas_alertas);

            // Top consumidores
            renderTopConsumidores(data.top_consumidores);

            // Iniciar simulación en tiempo real
            iniciarSimulacion();

            // Iniciar actualización automática de alertas
            iniciarActualizacionAlertas();

            // Hacer dashboard interactivo
            hacerDashboardInteractivo();
        })
        .catch(err => console.error('Error cargando dashboard:', err));
}

/**
 * Hace el dashboard interactivo agregando event listeners
 */
function hacerDashboardInteractivo() {
    // Hacer KPIs clickeables
    document.getElementById('kpiConsumo').parentElement.parentElement.addEventListener('click', () => navigateTo('consumos'));
    document.getElementById('kpiUsuarios').parentElement.parentElement.addEventListener('click', () => navigateTo('usuarios'));
    document.getElementById('kpiAlmacen').parentElement.parentElement.addEventListener('click', () => navigateTo('tanques'));
    document.getElementById('kpiAlertas').parentElement.parentElement.addEventListener('click', () => navigateTo('alertas'));

    // Hacer alertas clickeables
    document.getElementById('dashAlertas').addEventListener('click', (e) => {
        if (e.target.closest('.alert-item')) {
            navigateTo('alertas');
        }
    });

    // Hacer top consumidores clickeables para ir a consumos
    document.getElementById('dashTopConsumo').addEventListener('click', () => navigateTo('consumos'));

    // Hacer tanques clickeables
    document.getElementById('dashTanques').addEventListener('click', () => navigateTo('tanques'));

    // Agregar tooltips o efectos visuales
    const kpiCards = document.querySelectorAll('.kpi-card');
    kpiCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-2px)');
        card.addEventListener('mouseleave', () => card.style.transform = 'translateY(0)');
    });
}

// =====================================================
// GRÁFICAS
// =====================================================
function renderChartConsumoTiempoReal() {
    const ctx = document.getElementById('chartConsumoMensual').getContext('2d');
    if (chartConsumoMensual) chartConsumoMensual.destroy();

    // Obtener los consumos simulados más recientes (últimas 2 horas)
    const ahora = new Date();
    const hace2Horas = new Date(ahora.getTime() - 2 * 60 * 60 * 1000);

    const consumosRecientes = consumosSimulados.filter(c => {
        const fechaConsumo = new Date(c.fecha_registro.replace(' ', 'T'));
        return fechaConsumo >= hace2Horas;
    }).slice(-10); // Últimos 10 registros

    // Agrupar por usuario para mostrar consumo acumulado
    const consumosPorUsuario = {};
    consumosRecientes.forEach(c => {
        const nombreCompleto = `${c.nombre} ${c.apellido}`;
        if (!consumosPorUsuario[nombreCompleto]) {
            consumosPorUsuario[nombreCompleto] = 0;
        }
        consumosPorUsuario[nombreCompleto] += parseFloat(c.litros);
    });

    const labels = Object.keys(consumosPorUsuario);
    const data = Object.values(consumosPorUsuario);

    chartConsumoMensual = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Litros consumidos (últimas 2h)',
                data: data,
                backgroundColor: [
                    'rgba(0, 119, 182, 0.8)',
                    'rgba(42, 157, 143, 0.8)',
                    'rgba(233, 196, 106, 0.8)',
                    'rgba(244, 162, 97, 0.8)',
                    'rgba(231, 111, 81, 0.8)'
                ],
                borderColor: [
                    '#0077B6',
                    '#2A9D8F',
                    '#E9C46A',
                    '#F4A261',
                    '#E76F51'
                ],
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ctx.parsed.y.toLocaleString() + ' litros'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: val => (val / 1000).toFixed(1) + 'k'
                    },
                    grid: { color: 'rgba(0,0,0,0.04)' }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

function renderChartConsumoZona(datos) {
    const ctx = document.getElementById('chartConsumoZona').getContext('2d');
    if (chartConsumoZona) chartConsumoZona.destroy();

    const colores = ['#0077B6', '#00B4D8', '#90E0EF', '#2A9D8F', '#F4A261', '#E63946'];
    chartConsumoZona = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: datos.map(d => d.zona || 'Sin zona'),
            datasets: [{ data: datos.map(d => parseFloat(d.total_litros)), backgroundColor: colores.slice(0, datos.length), borderWidth: 2, borderColor: '#fff' }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true } },
                tooltip: { callbacks: { label: ctx => { const total = ctx.dataset.data.reduce((a, b) => a + b, 0); return ctx.label + ': ' + ctx.parsed.toLocaleString() + ' L (' + ((ctx.parsed / total) * 100).toFixed(1) + '%)'; } } }
            }
        }
    });
}

/**
 * Estado visual de tanques en el dashboard
 */
function renderDashTanques(tanques) {
    const container = document.getElementById('dashTanques');
    if (!tanques || tanques.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No hay tanques registrados</p></div>';
        return;
    }
    container.innerHTML = tanques.map(t => {
        const porcentaje = ((parseFloat(t.nivel_actual) / parseFloat(t.capacidad_litros)) * 100).toFixed(1);
        return `
            <div style="margin-bottom:1rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
                    <span style="font-weight:600;font-size:0.88rem;">${t.nombre}</span>
                    <span class="badge-status badge-${t.estado}">${t.estado.toUpperCase()}</span>
                </div>
                <div class="tank-bar">
                    <div class="tank-bar-fill ${t.estado}" style="width:${porcentaje}%">
                        <span class="tank-bar-text">${porcentaje}%</span>
                    </div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-light);margin-top:0.3rem;">
                    <span>${parseFloat(t.nivel_actual).toLocaleString()} L</span>
                    <span>${parseFloat(t.capacidad_litros).toLocaleString()} L</span>
                </div>
            </div>`;
    }).join('');
}

/**
 * Alertas recientes en el dashboard
 */
function renderDashAlertas(alertas) {
    const container = document.getElementById('dashAlertas');
    if (!alertas || alertas.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No hay alertas activas</p></div>';
        return;
    }
    container.innerHTML = alertas.map(a => `
        <div class="alert-item">
            <div class="alert-dot ${a.prioridad}"></div>
            <div class="alert-content">
                <h4>${a.titulo}</h4>
                <div class="alert-meta">${a.tipo.replace('_', ' ')} · ${formatearFecha(a.fecha_creacion)}</div>
            </div>
        </div>
    `).join('');
}

/**
 * Top 3 consumidores
 */
function renderTopConsumidores(top) {
    const container = document.getElementById('dashTopConsumo');
    if (!top || top.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Sin datos</p></div>';
        return;
    }
    container.innerHTML = top.map((t, i) => `
        <div class="top-item">
            <div class="top-rank r${i + 1}">${i + 1}</div>
            <div class="top-info">
                <div class="top-name">${t.nombre} ${t.apellido}</div>
                <div class="top-detail">${t.medidor} · ${t.zona || 'Sin zona'}</div>
            </div>
            <div class="top-value">${parseFloat(t.total).toLocaleString()} L</div>
        </div>
    `).join('');
}

// =====================================================
// MÓDULO: USUARIOS
// =====================================================
function cargarUsuarios() {
    fetch('php/usuarios.php?action=listar')
        .then(r => r.json())
        .then(data => {
            if (data.error) return;
            const tbody = document.getElementById('tablaUsuarios');
            if (data.datos.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay usuarios</td></tr>'; return; }
            tbody.innerHTML = data.datos.map(u => `
                <tr>
                    <td>${u.id}</td>
                    <td><strong>${u.nombre} ${u.apellido}</strong><br><small style="color:var(--text-light)">${u.email || ''}</small></td>
                    <td>${u.zona || '-'}</td>
                    <td><code style="font-family:'JetBrains Mono',monospace;font-size:0.82rem;background:var(--bg-body);padding:2px 6px;border-radius:4px;">${u.medidor}</code></td>
                    <td>${u.telefono || '-'}</td>
                    <td><span class="badge-status ${u.activo == 1 ? 'badge-alto' : 'badge-bajo'}">${u.activo == 1 ? 'Activo' : 'Inactivo'}</span></td>
                    <td>
                        <button class="btn btn-outline btn-sm" onclick="editarUsuario(${u.id})">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${u.id}, '${u.nombre}')">Eliminar</button>
                    </td>
                </tr>
            `).join('');
        });
}

function modalUsuario() {
    document.getElementById('modalUsuarioTitle').textContent = 'Agregar Usuario';
    document.getElementById('usuarioId').value = '';
    document.getElementById('usuarioNombre').value = '';
    document.getElementById('usuarioApellido').value = '';
    document.getElementById('usuarioDireccion').value = '';
    document.getElementById('usuarioZona').value = '';
    document.getElementById('usuarioTelefono').value = '';
    document.getElementById('usuarioEmail').value = '';
    document.getElementById('usuarioMedidor').value = '';
    abrirModal('modalUsuario');
}

function editarUsuario(id) {
    fetch('php/usuarios.php?action=obtener&id=' + id)
        .then(r => r.json())
        .then(data => {
            if (data.error) { showToast(data.mensaje, 'error'); return; }
            const u = data.datos;
            document.getElementById('modalUsuarioTitle').textContent = 'Editar Usuario';
            document.getElementById('usuarioId').value = u.id;
            document.getElementById('usuarioNombre').value = u.nombre;
            document.getElementById('usuarioApellido').value = u.apellido;
            document.getElementById('usuarioDireccion').value = u.direccion || '';
            document.getElementById('usuarioZona').value = u.zona || '';
            document.getElementById('usuarioTelefono').value = u.telefono || '';
            document.getElementById('usuarioEmail').value = u.email || '';
            document.getElementById('usuarioMedidor').value = u.medidor;
            abrirModal('modalUsuario');
        });
}

function guardarUsuario() {
    const id = document.getElementById('usuarioId').value;
    const formData = new FormData();
    formData.append('action', id ? 'editar' : 'agregar');
    if (id) formData.append('id', id);
    formData.append('nombre', document.getElementById('usuarioNombre').value);
    formData.append('apellido', document.getElementById('usuarioApellido').value);
    formData.append('direccion', document.getElementById('usuarioDireccion').value);
    formData.append('zona', document.getElementById('usuarioZona').value);
    formData.append('telefono', document.getElementById('usuarioTelefono').value);
    formData.append('email', document.getElementById('usuarioEmail').value);
    formData.append('medidor', document.getElementById('usuarioMedidor').value);
    if (id) formData.append('activo', 1);

    fetch('php/usuarios.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            showToast(data.mensaje, data.error ? 'error' : 'success');
            if (!data.error) { cerrarModal('modalUsuario'); cargarUsuarios(); }
        });
}

function eliminarUsuario(id, nombre) {
    if (!confirm('¿Eliminar al usuario "' + nombre + '"? Se borrarán sus registros de consumo.')) return;
    const formData = new FormData();
    formData.append('action', 'eliminar');
    formData.append('id', id);
    fetch('php/usuarios.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            showToast(data.mensaje, data.error ? 'error' : 'success');
            if (!data.error) cargarUsuarios();
        });
}

// =====================================================
// MÓDULO: CONSUMOS
// =====================================================
function cargarConsumos() {
    const params = new URLSearchParams({
        action: 'listar',
        fecha_inicio: document.getElementById('filtroFechaInicio').value,
        fecha_fin: document.getElementById('filtroFechaFin').value,
        zona: document.getElementById('filtroZona').value
    });
    fetch('php/consumos.php?' + params)
        .then(r => r.json())
        .then(data => {
            if (data.error) return;
            const tbody = document.getElementById('tablaConsumos');
            // Combinar datos reales y simulados
            const todosLosDatos = [...consumosSimulados, ...data.datos];
            // Ordenar por fecha descendente
            todosLosDatos.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));

            if (todosLosDatos.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay registros</td></tr>'; return; }
            tbody.innerHTML = todosLosDatos.map(c => `
                <tr class="${c.simulado ? 'simulado-row' : ''}">
                    <td>${formatearFecha(c.fecha_registro)}</td>
                    <td>${c.nombre} ${c.apellido} ${c.simulado ? '<small style="color:#0077B6">(simulado)</small>' : ''}</td>
                    <td><code style="font-family:'JetBrains Mono',monospace;font-size:0.82rem;">${c.medidor}</code></td>
                    <td>${c.zona || '-'}</td>
                    <td><strong>${parseFloat(c.litros).toLocaleString()}</strong> L</td>
                    <td>${c.periodo}</td>
                    <td>${c.simulado ? '<small style="color:#666">Auto</small>' : '<button class="btn btn-danger btn-sm" onclick="eliminarConsumo(' + c.id + ')">Eliminar</button>'}</td>
                </tr>
            `).join('');
        });
}

function cargarResumenConsumos() {
    fetch('php/consumos.php?action=resumen')
        .then(r => r.json())
        .then(data => {
            if (data.error) return;
            document.getElementById('tablaResumen').innerHTML = data.resumen.map(r => `
                <tr>
                    <td>${r.nombre} ${r.apellido}</td>
                    <td>${r.zona || '-'}</td>
                    <td>${r.registros}</td>
                    <td><strong>${r.total ? parseFloat(r.total).toLocaleString() : '0'}</strong></td>
                    <td>${r.promedio ? parseFloat(r.promedio).toLocaleString(undefined, {maximumFractionDigits: 0}) : '0'}</td>
                </tr>
            `).join('');
            // Llenar filtro de zonas
            const select = document.getElementById('filtroZona');
            if (select.options.length <= 1) {
                data.zonas.forEach(z => { const opt = document.createElement('option'); opt.value = z; opt.textContent = z; select.appendChild(opt); });
            }
        });
}

function modalConsumo() {
    fetch('php/usuarios.php?action=listar')
        .then(r => r.json())
        .then(data => {
            const select = document.getElementById('consumoUsuario');
            select.innerHTML = '<option value="">Seleccionar usuario</option>';
            if (!data.error) data.datos.forEach(u => { select.innerHTML += `<option value="${u.id}" data-zona="${u.zona}">${u.nombre} ${u.apellido} (${u.medidor})</option>`; });

            // Agregar event listener para sugerencia
            select.addEventListener('change', actualizarSugerenciaConsumo);
        });
    document.getElementById('consumoFecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('consumoPeriodo').value = new Date().toISOString().slice(0, 7);
    document.getElementById('consumoLitros').value = '';
    document.getElementById('consumoObservaciones').value = '';
    document.getElementById('consumoSugerencia').textContent = 'Sugerencia basada en simulación: -- L';
    abrirModal('modalConsumo');
}

/**
 * Actualiza la sugerencia de litros basada en la zona del usuario y la simulación
 */
function actualizarSugerenciaConsumo() {
    const select = document.getElementById('consumoUsuario');
    const selectedOption = select.options[select.selectedIndex];
    const zona = selectedOption.getAttribute('data-zona');
    const sugerenciaElem = document.getElementById('consumoSugerencia');

    if (!zona) {
        sugerenciaElem.textContent = 'Sugerencia basada en simulación: -- L';
        return;
    }

    // Obtener flujo actual de la zona desde variables globales
    const flujo = simFlujosZonas[zona] || 0;
    // Estimar consumo diario: flujo * 60 min * 24 horas / número de usuarios en zona (aprox)
    // Para simplificar, asumir un consumo diario basado en flujo
    const consumoDiarioEstimado = Math.round(flujo * 60 * 24 * 0.1); // 10% del flujo total diario por usuario
    sugerenciaElem.textContent = `Sugerencia basada en simulación: ${consumoDiarioEstimado.toLocaleString()} L (diario)`;
}

function guardarConsumo() {
    const formData = new FormData();
    formData.append('action', 'agregar');
    formData.append('usuario_id', document.getElementById('consumoUsuario').value);
    formData.append('litros', document.getElementById('consumoLitros').value);
    formData.append('fecha_registro', document.getElementById('consumoFecha').value);
    formData.append('periodo', document.getElementById('consumoPeriodo').value);
    formData.append('observaciones', document.getElementById('consumoObservaciones').value);
    fetch('php/consumos.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            showToast(data.mensaje, data.error ? 'error' : 'success');
            if (!data.error) { cerrarModal('modalConsumo'); cargarConsumos(); cargarResumenConsumos(); }
        });
}

function eliminarConsumo(id) {
    if (!confirm('¿Eliminar este registro?')) return;
    const formData = new FormData();
    formData.append('action', 'eliminar');
    formData.append('id', id);
    fetch('php/consumos.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            showToast(data.mensaje, data.error ? 'error' : 'success');
            if (!data.error) { cargarConsumos(); cargarResumenConsumos(); }
        });
}

/**
 * Renderiza consumos en tiempo real basados en la simulación
 */
function renderConsumosTiempoReal() {
    const container = document.getElementById('consumosTiempoReal');
    if (!container) return;

    // Usar datos de simulación globales
    const zonas = ['Centro', 'Norte', 'Sur', 'Oriente', 'Poniente'];
    const consumosEstimados = zonas.map(zona => {
        const flujo = simFlujosZonas[zona] || 0;
        // Estimar consumo por hora: flujo * 60 minutos
        const consumoHora = Math.round(flujo * 60);
        return { zona, flujo, consumoHora };
    });

    const totalFlujo = simTotalFlow;
    const totalConsumoHora = Math.round(totalFlujo * 60);

    container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1rem;">
            ${consumosEstimados.map(c => `
                <div class="kpi-card" style="background:var(--bg-card);border:1px solid var(--border);cursor:default;">
                    <div class="kpi-header">
                        <span class="label">${c.zona}</span>
                        <div class="icon" style="background:rgba(0,119,182,0.1);color:#0077B6;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;">
                            ${c.zona.charAt(0)}
                        </div>
                    </div>
                    <div class="kpi-value">${c.consumoHora.toLocaleString()}</div>
                    <div class="kpi-sub">L/hora estimado</div>
                </div>
            `).join('')}
        </div>
        <div style="text-align:center;padding:1rem;background:var(--bg-body);border-radius:8px;border:1px solid var(--border);">
            <div style="font-size:1.2rem;font-weight:600;color:#0077B6;margin-bottom:0.5rem;">
                Consumo Total Estimado: ${totalConsumoHora.toLocaleString()} L/hora
            </div>
            <div style="font-size:0.9rem;color:var(--text-light);">
                Basado en flujo actual de ${totalFlujo.toFixed(1)} L/min
            </div>
        </div>
    `;
}

// =====================================================
// MÓDULO: TANQUES
// =====================================================
function cargarTanques() {
    fetch('php/tanques.php?action=listar')
        .then(r => r.json())
        .then(data => {
            if (data.error) return;
            const tbody = document.getElementById('tablaTanques');
            if (data.datos.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay tanques</td></tr>'; return; }
            tbody.innerHTML = data.datos.map(t => {
                const pct = parseFloat(t.porcentaje);
                return `
                <tr>
                    <td><strong>${t.nombre}</strong></td>
                    <td>${t.ubicacion || '-'}</td>
                    <td>${parseFloat(t.capacidad_litros).toLocaleString()}</td>
                    <td style="min-width:200px;">
                        <div class="tank-bar"><div class="tank-bar-fill ${t.estado}" style="width:${pct}%"><span class="tank-bar-text">${pct}%</span></div></div>
                        <small style="color:var(--text-light)">${parseFloat(t.nivel_actual).toLocaleString()} L</small>
                    </td>
                    <td><span class="badge-status badge-${t.estado}">${t.estado.toUpperCase()}</span></td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="modalActualizarNivel(${t.id}, '${t.nombre}', ${t.capacidad_litros})">Nivel</button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarTanque(${t.id}, '${t.nombre}')">Eliminar</button>
                    </td>
                </tr>`;
            }).join('');
        });
}

function modalTanque() {
    document.getElementById('modalTanqueTitle').textContent = 'Agregar Tanque';
    document.getElementById('tanqueId').value = '';
    document.getElementById('tanqueNombre').value = '';
    document.getElementById('tanqueUbicacion').value = '';
    document.getElementById('tanqueCapacidad').value = '';
    document.getElementById('tanqueNivel').value = '';
    abrirModal('modalTanque');
}

function guardarTanque() {
    const formData = new FormData();
    const id = document.getElementById('tanqueId').value;
    formData.append('action', id ? 'editar' : 'agregar');
    if (id) formData.append('id', id);
    formData.append('nombre', document.getElementById('tanqueNombre').value);
    formData.append('ubicacion', document.getElementById('tanqueUbicacion').value);
    formData.append('capacidad_litros', document.getElementById('tanqueCapacidad').value);
    formData.append('nivel_actual', document.getElementById('tanqueNivel').value || 0);
    fetch('php/tanques.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            showToast(data.mensaje, data.error ? 'error' : 'success');
            if (!data.error) { cerrarModal('modalTanque'); cargarTanques(); }
        });
}

function modalActualizarNivel(id, nombre, capacidad) {
    document.getElementById('nivelTanqueId').value = id;
    document.getElementById('nivelTanqueInfo').textContent = `${nombre} — Capacidad: ${parseFloat(capacidad).toLocaleString()} litros`;
    document.getElementById('nivelNuevo').value = '';
    document.getElementById('nivelNuevo').max = capacidad;
    abrirModal('modalNivel');
}

function actualizarNivelTanque() {
    const formData = new FormData();
    formData.append('action', 'actualizar_nivel');
    formData.append('id', document.getElementById('nivelTanqueId').value);
    formData.append('nivel_actual', document.getElementById('nivelNuevo').value);
    fetch('php/tanques.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            showToast(data.mensaje, data.error ? 'error' : 'success');
            if (!data.error) { cerrarModal('modalNivel'); cargarTanques(); }
        });
}

function eliminarTanque(id, nombre) {
    if (!confirm('¿Eliminar "' + nombre + '"?')) return;
    const formData = new FormData();
    formData.append('action', 'eliminar');
    formData.append('id', id);
    fetch('php/tanques.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            showToast(data.mensaje, data.error ? 'error' : 'success');
            if (!data.error) cargarTanques();
        });
}

// =====================================================
// MÓDULO: ALERTAS
// =====================================================
function cargarAlertas() {
    fetch('php/alertas.php?action=listar')
        .then(r => r.json())
        .then(data => {
            if (data.error) return;
            const container = document.getElementById('listaAlertas');
            if (data.datos.length === 0) { container.innerHTML = '<div class="empty-state"><p>No hay alertas</p></div>'; return; }
            container.innerHTML = data.datos.map(a => `
                <div class="alert-item" style="${!a.activa ? 'opacity:0.5' : ''}">
                    <div class="alert-dot ${a.prioridad}"></div>
                    <div class="alert-content">
                        <h4>${a.titulo} ${!a.activa ? '<small style="color:var(--text-light)">(resuelta)</small>' : ''}</h4>
                        <p>${a.descripcion || ''}</p>
                        <div class="alert-meta">
                            <span class="badge-status badge-${a.prioridad}">${a.prioridad}</span>
                            · ${a.tipo.replace('_', ' ')} · ${formatearFecha(a.fecha_creacion)}
                        </div>
                    </div>
                    <div class="alert-actions">
                        ${a.activa ? `<button class="btn btn-success btn-sm" onclick="desactivarAlerta(${a.id})">Resolver</button>` : ''}
                        <button class="btn btn-danger btn-sm" onclick="eliminarAlerta(${a.id})">Eliminar</button>
                    </div>
                </div>
            `).join('');
        });
}

function modalAlerta() {
    document.getElementById('alertaTipo').value = 'general';
    document.getElementById('alertaTitulo').value = '';
    document.getElementById('alertaDescripcion').value = '';
    document.getElementById('alertaPrioridad').value = 'media';
    abrirModal('modalAlerta');
}

function guardarAlerta() {
    const formData = new FormData();
    formData.append('action', 'agregar');
    formData.append('tipo', document.getElementById('alertaTipo').value);
    formData.append('titulo', document.getElementById('alertaTitulo').value);
    formData.append('descripcion', document.getElementById('alertaDescripcion').value);
    formData.append('prioridad', document.getElementById('alertaPrioridad').value);
    fetch('php/alertas.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            showToast(data.mensaje, data.error ? 'error' : 'success');
            if (!data.error) { cerrarModal('modalAlerta'); cargarAlertas(); }
        });
}

function desactivarAlerta(id) {
    const formData = new FormData();
    formData.append('action', 'desactivar');
    formData.append('id', id);
    fetch('php/alertas.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            showToast(data.mensaje, data.error ? 'error' : 'success');
            if (!data.error) cargarAlertas();
        });
}

function eliminarAlerta(id) {
    if (!confirm('¿Eliminar esta alerta?')) return;
    const formData = new FormData();
    formData.append('action', 'eliminar');
    formData.append('id', id);
    fetch('php/alertas.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            showToast(data.mensaje, data.error ? 'error' : 'success');
            if (!data.error) cargarAlertas();
        });
}

// =====================================================
// UTILIDADES
// =====================================================
function abrirModal(id) { document.getElementById(id).classList.add('show'); }
function cerrarModal(id) { document.getElementById(id).classList.remove('show'); }

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('show');
});

function formatearFecha(fecha) {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function showToast(mensaje, tipo = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast ' + tipo;
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'fadeIn 0.3s ease reverse'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// =====================================================
// SIMULACIÓN EN TIEMPO REAL DE CONSUMO DE AGUA
// Genera datos simulados cada 5 segundos
// =====================================================

let simAcumulado = 0;          // Litros acumulados en la sesión
let simMaxFlow = 0;            // Flujo máximo registrado
let simHistorial = [];         // Historial de datos para la gráfica
let simHistorialZonas = {};    // Historial por zona para líneas secundarias
let simLabels = [];            // Etiquetas de hora para la gráfica

// Flujos base por zona (litros/min simulados)
const ZONAS_CONFIG = {
    Centro:   { base: 85, variacion: 30, usuarios: 2 },
    Norte:    { base: 65, variacion: 25, usuarios: 2 },
    Sur:      { base: 55, variacion: 20, usuarios: 2 },
    Oriente:  { base: 45, variacion: 35, usuarios: 1 },
    Poniente: { base: 50, variacion: 15, usuarios: 1 }
};

const MAX_FLOW_REFERENCE = 200; // Referencia máxima para las barras de progreso

/**
 * Inicia la simulación — se ejecuta cada 5 segundos
 */
function iniciarSimulacion() {
    // Evitar duplicar intervalos
    if (simInterval) return;

    // Primera ejecución inmediata
    actualizarSimulacion();

    // Repetir cada 5 segundos
    simInterval = setInterval(actualizarSimulacion, 5000);
}

/**
 * Detiene la simulación al salir del dashboard
 */
function detenerSimulacion() {
    if (simInterval) {
        clearInterval(simInterval);
        simInterval = null;
    }
    if (alertasInterval) {
        clearInterval(alertasInterval);
        alertasInterval = null;
    }
    if (consumosInterval) {
        clearInterval(consumosInterval);
        consumosInterval = null;
    }
}

/**
 * Inicia la simulación de consumos dinámicos
 */
function iniciarSimulacionConsumos() {
    // Evitar duplicar intervalos
    if (consumosInterval) return;

    // Generar algunos consumos simulados iniciales
    generarConsumosSimulados(5);

    // Primera actualización
    actualizarConsumosSimulados();

    // Repetir cada 5 segundos
    consumosInterval = setInterval(actualizarConsumosSimulados, 5000);
}

/**
 * Detiene la simulación de consumos
 */
function detenerSimulacionConsumos() {
    if (consumosInterval) {
        clearInterval(consumosInterval);
        consumosInterval = null;
    }
}

/**
 * Genera consumos simulados iniciales
 */
function generarConsumosSimulados(cantidad) {
    const usuariosSimulados = [
        { id: 'sim1', nombre: 'María', apellido: 'García', medidor: 'M001', zona: 'Centro' },
        { id: 'sim2', nombre: 'Juan', apellido: 'López', medidor: 'M002', zona: 'Norte' },
        { id: 'sim3', nombre: 'Ana', apellido: 'Martínez', medidor: 'M003', zona: 'Sur' },
        { id: 'sim4', nombre: 'Carlos', apellido: 'Rodríguez', medidor: 'M004', zona: 'Oriente' },
        { id: 'sim5', nombre: 'Laura', apellido: 'Hernández', medidor: 'M005', zona: 'Poniente' }
    ];

    for (let i = 0; i < cantidad; i++) {
        const usuario = usuariosSimulados[Math.floor(Math.random() * usuariosSimulados.length)];
        const litros = Math.round((Math.random() * 500 + 100) * 10) / 10; // 100-600 L
        const ahora = new Date();
        const fechaAleatoria = new Date(ahora.getTime() - Math.random() * 24 * 60 * 60 * 1000); // Últimas 24 horas

        consumosSimulados.push({
            id: 'sim_' + Date.now() + '_' + i,
            fecha_registro: fechaAleatoria.toISOString().split('T')[0] + ' ' + fechaAleatoria.toTimeString().split(' ')[0],
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            medidor: usuario.medidor,
            zona: usuario.zona,
            litros: litros,
            periodo: fechaAleatoria.toISOString().slice(0, 7),
            simulado: true
        });
    }

    // Mantener máximo 50 registros simulados
    if (consumosSimulados.length > 50) {
        consumosSimulados = consumosSimulados.slice(-50);
    }
}

/**
 * Actualiza los consumos simulados agregando nuevos
 */
function actualizarConsumosSimulados() {
    // Agregar 1-3 nuevos consumos simulados
    const cantidadNueva = Math.floor(Math.random() * 3) + 1;
    generarConsumosSimulados(cantidadNueva);

    // Actualizar gráfica del dashboard en tiempo real
    renderChartConsumoTiempoReal();

    // Si estamos en la sección de consumos, recargar la tabla
    if (document.getElementById('section-consumos').classList.contains('active')) {
        cargarConsumos();
        renderConsumosTiempoReal();
    }
}

/**
 * Inicia actualización automática de alertas
 */
function iniciarActualizacionAlertas() {
    // Evitar duplicar intervalos
    if (alertasInterval) return;

    // Primera ejecución inmediata
    actualizarAlertas();

    // Repetir cada 30 segundos
    alertasInterval = setInterval(actualizarAlertas, 30000);
}

/**
 * Actualiza alertas automáticamente
 */
function actualizarAlertas() {
    fetch('php/alertas.php?action=listar&solo_activas=1')
        .then(r => r.json())
        .then(data => {
            if (data.error) return;
            const alertasActivas = data.datos.length;
            document.getElementById('kpiAlertas').textContent = alertasActivas;
            document.getElementById('alertBadge').textContent = alertasActivas;

            // Si estamos en dashboard, actualizar el panel de alertas
            if (document.getElementById('section-dashboard').classList.contains('active')) {
                renderDashAlertas(data.datos.slice(0, 5));
            }

            // Si estamos en alertas, actualizar la lista
            if (document.getElementById('section-alertas').classList.contains('active')) {
                cargarAlertas();
            }
        })
        .catch(err => console.error('Error actualizando alertas:', err));
}

/**
 * Genera datos aleatorios realistas y actualiza la interfaz
 */
function actualizarSimulacion() {
    const ahora = new Date();
    const hora = ahora.getHours();
    
    // Factor horario: simula que de noche hay menos consumo
    let factorHorario = 1.0;
    if (hora >= 0 && hora < 6) factorHorario = 0.3;        // Madrugada: bajo
    else if (hora >= 6 && hora < 9) factorHorario = 1.4;    // Mañana: pico
    else if (hora >= 9 && hora < 12) factorHorario = 1.1;   // Media mañana
    else if (hora >= 12 && hora < 14) factorHorario = 1.3;  // Mediodía: pico
    else if (hora >= 14 && hora < 18) factorHorario = 0.9;  // Tarde
    else if (hora >= 18 && hora < 21) factorHorario = 1.2;  // Noche
    else factorHorario = 0.6;                                // Noche tardía

    let totalFlow = 0;
    const zonas = ['Centro', 'Norte', 'Sur', 'Oriente', 'Poniente'];

    zonas.forEach(zona => {
        const config = ZONAS_CONFIG[zona];
        // Generar flujo con variación aleatoria + factor horario
        const variacion = (Math.random() - 0.5) * 2 * config.variacion;
        const flujo = Math.max(0, (config.base + variacion) * factorHorario);
        const flujoRedondeado = Math.round(flujo * 10) / 10;

        // Actualizar variables globales
        simFlujosZonas[zona] = flujoRedondeado;

        totalFlow += flujoRedondeado;
    });

    // Total
    const totalRedondeado = Math.round(totalFlow * 10) / 10;
    simTotalFlow = totalRedondeado;

    // Acumulado (convertir L/min * 5seg = L/min * (5/60) min)
    simAcumulado += totalRedondeado * (5 / 60);

    // Flujo máximo
    if (totalRedondeado > simMaxFlow) simMaxFlow = totalRedondeado;

    // Actualizar consumos en tiempo real si estamos en esa sección
    if (document.getElementById('section-consumos').classList.contains('active')) {
        renderConsumosTiempoReal();
    }
}

/**
 * Crea la gráfica de línea para la simulación — estilo profesional
 */
function crearChartSimulacion() {
    if (chartSimulacion) chartSimulacion.destroy();
    
    simHistorial = [];
    simLabels = [];
    simHistorialZonas = { Centro: [], Norte: [], Sur: [], Oriente: [], Poniente: [] };
    simAcumulado = 0;
    simMaxFlow = 0;

    const ctx = document.getElementById('chartSimulacion').getContext('2d');

    // Gradiente para el área bajo la curva principal
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(0, 119, 182, 0.35)');
    gradient.addColorStop(0.5, 'rgba(0, 180, 216, 0.15)');
    gradient.addColorStop(1, 'rgba(144, 224, 239, 0.02)');

    chartSimulacion = new Chart(ctx, {
        type: 'line',
        data: {
            labels: simLabels,
            datasets: [
                {
                    label: 'Flujo total (L/min)',
                    data: simHistorial,
                    borderColor: '#0077B6',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.45,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#0077B6',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 3,
                    order: 0
                },
                {
                    label: 'Centro',
                    data: simHistorialZonas.Centro,
                    borderColor: 'rgba(42, 157, 143, 0.6)',
                    borderWidth: 1.5,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    borderDash: [4, 3],
                    order: 1
                },
                {
                    label: 'Norte',
                    data: simHistorialZonas.Norte,
                    borderColor: 'rgba(0, 180, 216, 0.5)',
                    borderWidth: 1.5,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    borderDash: [4, 3],
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 800, easing: 'easeInOutCubic' },
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 15,
                        font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" },
                        color: '#5A6B7F'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 22, 40, 0.9)',
                    titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
                    bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: ctx => ' ' + ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(1) + ' L/min'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: 450,
                    ticks: {
                        callback: val => val + '',
                        font: { size: 10, family: "'JetBrains Mono', monospace" },
                        color: '#8E9AAF',
                        padding: 8
                    },
                    grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
                    border: { display: false },
                    title: { display: true, text: 'L/min', font: { size: 10 }, color: '#8E9AAF' }
                },
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        maxTicksLimit: 8,
                        font: { size: 10, family: "'JetBrains Mono', monospace" },
                        color: '#8E9AAF'
                    }
                }
            }
        }
    });
}

/**
 * Agrega un nuevo punto a la gráfica de simulación
 */
function actualizarChartSimulacion(fecha, valor) {
    if (!chartSimulacion) return;

    const label = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    simLabels.push(label);
    simHistorial.push(valor);

    // Agregar datos individuales de zonas al historial
    const centroVal = parseFloat(document.getElementById('simZonaCentro').textContent) || 0;
    const norteVal = parseFloat(document.getElementById('simZonaNorte').textContent) || 0;
    simHistorialZonas.Centro.push(centroVal);
    simHistorialZonas.Norte.push(norteVal);

    // Mantener máximo 30 puntos (2.5 minutos de datos)
    if (simLabels.length > 30) {
        simLabels.shift();
        simHistorial.shift();
        simHistorialZonas.Centro.shift();
        simHistorialZonas.Norte.shift();
    }

    chartSimulacion.update('none');
}
