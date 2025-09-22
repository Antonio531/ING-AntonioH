// 🍞 SISTEMA DE TOAST NOTIFICATIONS
class ToastManager {
    constructor() {
        this.container = document.getElementById('toastContainer');
        this.toasts = [];
    }

    show(message, type = 'info', duration = 4000) {
        const toast = this.createToast(message, type, duration);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        setTimeout(() => toast.classList.add('show'), 100);

        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }

        return toast;
    }

    createToast(message, type, duration) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: '💡' };

        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icons[type] || icons.info}</span>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close" onclick="toastManager.remove(this.parentElement)">×</button>
        `;

        return toast;
    }

    remove(toast) {
        if (!toast || !toast.parentElement) return;
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 300);
    }

    success(message, duration = 4000) { return this.show(message, 'success', duration); }
    error(message, duration = 6000) { return this.show(message, 'error', duration); }
    warning(message, duration = 5000) { return this.show(message, 'warning', duration); }
    info(message, duration = 4000) { return this.show(message, 'info', duration); }

    confirm(title, message, options = {}) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'confirm-modal';
            
            const { confirmText = 'Confirmar', cancelText = 'Cancelar', icon = '❓' } = options;

            modal.innerHTML = `
                <div class="confirm-content">
                    <div class="confirm-icon">${icon}</div>
                    <h3 class="confirm-title">${title}</h3>
                    <p class="confirm-message">${message}</p>
                    <div class="confirm-buttons">
                        <button class="confirm-btn secondary" onclick="this.resolve(false)">${cancelText}</button>
                        <button class="confirm-btn primary" onclick="this.resolve(true)">${confirmText}</button>
                    </div>
                </div>
            `;

            modal.querySelectorAll('.confirm-btn').forEach(btn => {
                btn.resolve = (result) => {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        if (modal.parentElement) document.body.removeChild(modal);
                    }, 300);
                    resolve(result);
                };
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.querySelector('.confirm-btn.secondary').resolve(false);
                }
            });

            document.body.appendChild(modal);
            setTimeout(() => modal.classList.add('show'), 100);
        });
    }
}

// 📊 DASHBOARD MANAGER
class DashboardManager {
    constructor() {
        this.charts = {};
        this.metricsData = {
            totalQuejas: 0,
            totalEstudiantes: 0,
            quejasPendientes: 0,
            quejasUrgentes: 0,
            carreraMasQuejas: '',
            tasaResolucion: 0
        };
    }

    async actualizarMetricas(quejas) {
        // Calcular métricas
        this.metricsData.totalQuejas = quejas.length;
        this.metricsData.totalEstudiantes = new Set(quejas.map(q => q.numero_control)).size;
        this.metricsData.quejasPendientes = quejas.filter(q => q.estado !== 'cerrado').length;
        this.metricsData.quejasUrgentes = quejas.filter(q => q.prioridad === 'alta').length;
        
        // Carrera con más quejas
        const quejasPorCarrera = {};
        quejas.forEach(q => {
            quejasPorCarrera[q.carrera] = (quejasPorCarrera[q.carrera] || 0) + 1;
        });
        
        const carreraMax = Object.entries(quejasPorCarrera).reduce((a, b) => 
            quejasPorCarrera[a[0]] > quejasPorCarrera[b[0]] ? a : b, ['', 0]
        );
        
        this.metricsData.carreraMasQuejas = carreraMax[0]?.substring(0, 10) || 'N/A';
        this.metricsData.tasaResolucion = Math.round(
            (quejas.filter(q => q.estado === 'cerrado').length / quejas.length) * 100
        ) || 0;

        this.renderMetricas();
        this.actualizarGraficos(quejas, quejasPorCarrera);
    }

    renderMetricas() {
        const elementos = {
            'totalQuejas': this.metricsData.totalQuejas,
            'totalEstudiantes': this.metricsData.totalEstudiantes,
            'quejasPendientes': this.metricsData.quejasPendientes,
            'quejasUrgentes': this.metricsData.quejasUrgentes,
            'carreraMasQuejas': this.metricsData.carreraMasQuejas,
            'tasaResolucion': `${this.metricsData.tasaResolucion}%`
        };

        Object.entries(elementos).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = valor;
                elemento.style.animation = 'none';
                elemento.offsetHeight; // Trigger reflow
                elemento.style.animation = 'fadeInUp 0.6s ease-out';
            }
        });

        // Actualizar textos secundarios
        document.getElementById('estudiantesActivos').textContent = 'con quejas activas';
        document.getElementById('requierenAtencion').textContent = 'requieren atención';
        document.getElementById('porcentajeCarrera').textContent = 
            `${Math.round((this.metricsData.quejasUrgentes / this.metricsData.totalQuejas) * 100) || 0}% del total`;
    }

    actualizarGraficos(quejas, quejasPorCarrera) {
        this.crearGraficoCarreras(quejasPorCarrera);
        this.crearGraficoTendencia(quejas);
    }

    crearGraficoCarreras(quejasPorCarrera) {
        const ctx = document.getElementById('chartCarreras');
        if (!ctx) return;

        if (this.charts.carreras) {
            this.charts.carreras.destroy();
        }

        const carreras = Object.keys(quejasPorCarrera).slice(0, 6);
        const valores = Object.values(quejasPorCarrera).slice(0, 6);

        this.charts.carreras = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: carreras.map(c => c.substring(0, 15)),
                datasets: [{
                    label: 'Quejas',
                    data: valores,
                    backgroundColor: '#00875A',
                    borderColor: '#006c48',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    crearGraficoTendencia(quejas) {
        const ctx = document.getElementById('chartTendencia');
        if (!ctx) return;

        if (this.charts.tendencia) {
            this.charts.tendencia.destroy();
        }

        // Agrupar por mes
        const meses = {};
        quejas.forEach(q => {
            const fecha = new Date(q.created_at);
            const mesAno = `${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
            meses[mesAno] = (meses[mesAno] || 0) + 1;
        });

        const labels = Object.keys(meses).slice(-6);
        const data = Object.values(meses).slice(-6);

        this.charts.tendencia = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Quejas por mes',
                    data: data,
                    borderColor: '#00875A',
                    backgroundColor: 'rgba(0, 135, 90, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }
}

// 📧 TEMPLATES MANAGER
class TemplatesManager {
    constructor() {
        this.templates = {
            agradecimiento: {
                asunto: 'Recepción de su queja - Seguimiento',
                mensaje: `Estimado/a estudiante,

Hemos recibido su queja y queremos agradecerle por tomarse el tiempo de comunicarnos su preocupación.

Su caso ha sido registrado y será revisado por nuestro equipo. Le estaremos contactando en un plazo no mayor a 48 horas con una respuesta detallada.

Atentamente,
Dirección Académica`
            },
            investigacion: {
                asunto: 'Su queja está en proceso de investigación',
                mensaje: `Estimado/a estudiante,

Le informamos que su queja está siendo investigada por el área correspondiente.

Estamos recopilando toda la información necesaria para brindarle una solución adecuada. Este proceso puede tomar entre 3-5 días hábiles.

Le mantendremos informado del progreso.

Atentamente,
Dirección Académica`
            },
            solucion: {
                asunto: 'Propuesta de solución a su queja',
                mensaje: `Estimado/a estudiante,

Después de revisar detalladamente su queja, hemos desarrollado la siguiente propuesta de solución:

[Escriba aquí la solución específica]

Le solicitamos confirme si esta propuesta es satisfactoria para usted.

Atentamente,
Dirección Académica`
            },
            derivacion: {
                asunto: 'Derivación de su queja al área competente',
                mensaje: `Estimado/a estudiante,

Su queja ha sido derivada al área de [ÁREA ESPECÍFICA] que es la competente para atender este tipo de situaciones.

El área correspondiente se pondrá en contacto con usted en las próximas 24 horas.

Atentamente,
Dirección Académica`
            },
            seguimiento: {
                asunto: 'Seguimiento de su queja',
                mensaje: `Estimado/a estudiante,

Nos ponemos en contacto para dar seguimiento a su queja y conocer si la solución implementada ha sido satisfactoria.

Por favor, responda este correo indicándonos:
1. ¿Se resolvió su problema?
2. ¿Está satisfecho con la solución?
3. ¿Algún comentario adicional?

Atentamente,
Dirección Académica`
            },
            cierre: {
                asunto: 'Cierre de su queja - Caso resuelto',
                mensaje: `Estimado/a estudiante,

Nos complace informarle que su queja ha sido resuelta satisfactoriamente.

El caso ha sido cerrado en nuestro sistema. Si tiene alguna pregunta adicional o surge algún problema relacionado, no dude en contactarnos.

Agradecemos su paciencia y comprensión.

Atentamente,
Dirección Académica`
            }
        };
    }

    obtenerTemplate(tipo) {
        return this.templates[tipo] || null;
    }

    aplicarTemplate(tipo, textareaId) {
        const template = this.obtenerTemplate(tipo);
        const textarea = document.getElementById(textareaId);
        
        if (template && textarea) {
            textarea.value = template.mensaje;
            textarea.focus();
            toastManager.success(`Template "${tipo}" aplicado correctamente`);
        }
    }
}


// 📧 SERVICIO DE EMAIL CON RESEND
class ResendEmailService {
       constructor() {
        // Usar la función de Vercel en producción
        this.apiUrl = '/api/send-email';
    }

    async enviarRespuestaAlumno(datosEmail) {
        try {
            console.log('Enviando email a:', datosEmail.correoAlumno);
            
            const emailData = {
                from: 'onboarding@resend.dev',
                to: [datosEmail.correoAlumno],
                subject: datosEmail.asunto,
                html: this.crearTemplateEmail(datosEmail)
            };

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error enviando email');
            }

            return { success: true, data: result };

        } catch (error) {
            console.error('Error enviando email:', error);
            return { 
                success: false, 
                error: error.message || 'Error desconocido'
            };
        }
    }
    crearTemplateEmail(datos) {
        return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Respuesta a tu queja</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    background-color: #f8fafc; 
                    line-height: 1.6;
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: white; 
                    border-radius: 12px; 
                    overflow: hidden; 
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
                }
                .header { 
                    background: linear-gradient(135deg, #00875A 0%, #006c48 100%); 
                    color: white; 
                    padding: 30px 20px; 
                    text-align: center; 
                }
                .content { 
                    padding: 40px 30px; 
                }
                .student-info {
                    background: #f7fafc;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 25px;
                    border-left: 4px solid #00875A;
                }
                .response-box {
                    background: #ffffff;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 25px;
                    margin: 25px 0;
                }
                .footer { 
                    background: #f8f9fa; 
                    padding: 30px 20px; 
                    text-align: center; 
                    color: #718096; 
                    border-top: 1px solid #e2e8f0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Instituto Tecnológico Superior de Poza Rica</h1>
                    <p>Respuesta Oficial a tu Queja</p>
                </div>
                
                <div class="content">
                    <div class="student-info">
                        <h3>Información del Estudiante</h3>
                        <p><strong>Nombre:</strong> ${datos.nombreAlumno}</p>
                        <p><strong>Número de Control:</strong> ${datos.numeroControl}</p>
                        <p><strong>Carrera:</strong> ${datos.carrera}</p>
                        <p><strong>Fecha de Respuesta:</strong> ${new Date().toLocaleDateString('es-MX')}</p>
                    </div>

                    <div class="response-box">
                        <h3>📝 Respuesta del Director Académico</h3>
                        <div style="color: #2d3748; font-size: 16px; line-height: 1.7; white-space: pre-line;">${datos.mensaje}</div>
                    </div>
                </div>
                
                <div class="footer">
                    <h4>Dirección Académica</h4>
                    <p>Instituto Tecnológico Superior de Poza Rica</p>
                    <p>Tel: (782) 826-1900</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

// Variables globales
const toastManager = new ToastManager();
const dashboardManager = new DashboardManager();
const templatesManager = new TemplatesManager();

let quejasData = [];
let quejasAgrupadas = {};
let filtrosActivos = {
    carrera: '',
    semestre: '',
    fecha: '',
    estado: '',
    prioridad: '',
    busqueda: ''
};

// PROTECCIÓN AL INICIO
function verificarAcceso() {
    const usuario = sessionStorage.getItem('usuario');
    
    if (!usuario) {
        toastManager.error('🚫 Acceso denegado. Debes iniciar sesión primero.');
        setTimeout(() => window.location.href = 'login.html', 2000);
        return false;
    }
    
    try {
        const userData = JSON.parse(usuario);
        if (!userData || (userData.rol !== 'director' && userData.rol !== 'admin')) {
            toastManager.error('🚫 Acceso denegado. Solo directores pueden acceder.');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return false;
        }
        
        toastManager.success(`¡Bienvenido, ${userData.email}!`, 3000);
        return true;
    } catch (error) {
        toastManager.error('🚫 Sesión inválida. Inicia sesión nuevamente.');
        setTimeout(() => window.location.href = 'login.html', 2000);
        return false;
    }
}

if (!verificarAcceso()) {
    throw new Error('Acceso denegado');
}

// CONFIGURACIÓN SUPABASE
const supabaseUrl = "https://wqjbbnvogexdkqsqdxxq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamJibnZvZ2V4ZGtxc3FkeHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMTc3NzgsImV4cCI6MjA3Mjc5Mzc3OH0.xls3PJRJuMTtLomiGpGWLqrRy6s1m6E9cuna9XNoMkw";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// FUNCIONES DE USUARIO
function mostrarInfoUsuario() {
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    const header = document.querySelector('header');
    
    if (header && usuario) {
        let userContainer = document.getElementById('userContainer');
        if (!userContainer) {
            userContainer = document.createElement('div');
            userContainer.id = 'userContainer';
            userContainer.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(255,255,255,0.95);
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 12px;
                backdrop-filter: blur(10px);
            `;
            header.style.position = 'relative';
            header.appendChild(userContainer);
        }
        
        userContainer.innerHTML = `
            <span style="font-size: 14px; color: #333;">
                👤 ${usuario.email} <br>
                <small style="color: #666; font-weight: 500;">${usuario.rol.toUpperCase()}</small>
            </span>
            <button onclick="cerrarSesion()" style="
                background: #dc3545;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: all 0.2s ease;
            ">🚪 Salir</button>
        `;
    }
}

async function cerrarSesion() {
    const confirmed = await toastManager.confirm(
        '¿Cerrar Sesión?',
        '¿Estás seguro de que quieres cerrar tu sesión?',
        { confirmText: 'Sí, cerrar sesión', cancelText: 'Cancelar', icon: '🚪' }
    );
    
    if (confirmed) {
        sessionStorage.removeItem('usuario');
        toastManager.success('Sesión cerrada correctamente');
        setTimeout(() => window.location.href = 'login.html', 1500);
    }
}

// FUNCIÓN PRINCIPAL DE CARGA - Mejorada para debugging
async function cargarQuejas() {
    console.log('🔄 Iniciando carga de quejas...');
    const loadingToast = toastManager.info('🔄 Cargando sistema...', 0);
    
    try {
        const { data, error } = await supabase
            .from("quejas")
            .select("*")
            .order("created_at", { ascending: false });

        toastManager.remove(loadingToast);

        if (error) {
            console.error('❌ Error de Supabase:', error);
            toastManager.error(`Error al cargar: ${error.message}`);
            return;
        }

        console.log('📦 Datos recibidos:', data?.length || 0, 'quejas');

        // Agregar campos faltantes si no existen
        quejasData = data.map(queja => ({
            ...queja,
            estado: queja.estado || 'nuevo',
            prioridad: queja.prioridad || 'media'
        }));

        console.log('✅ Datos procesados:', quejasData.length, 'quejas');

        await dashboardManager.actualizarMetricas(quejasData);
        filtrarYMostrarQuejas(); // Cambio aquí
        toastManager.success(`✅ ${quejasData.length} quejas cargadas correctamente`);

    } catch (err) {
        toastManager.remove(loadingToast);
        toastManager.error('Error inesperado al cargar datos');
        console.error('❌ Error inesperado:', err);
        
        // Mostrar datos de prueba si falla la carga
        console.log('🧪 Mostrando datos de prueba...');
        mostrarDatosPrueba();
    }
}

// Función para mostrar datos de prueba si no hay conexión
function mostrarDatosPrueba() {
    quejasData = [
        {
            id: 1,
            numero_control: '20180001',
            nombre: 'Juan Pérez García',
            carrera: 'ING. SISTEMAS COMPUTACIONALES',
            semestre: 5,
            correo: 'juan.perez@alumno.itsp.edu.mx',
            descripcion: 'Problema con el laboratorio de computación, las máquinas están muy lentas',
            salon_grupo: 'Lab-A',
            created_at: '2024-01-15T10:30:00',
            estado: 'nuevo',
            prioridad: 'media'
        },
        {
            id: 2,
            numero_control: '20190002',
            nombre: 'María González López',
            carrera: 'ING INDUSTRIAL',
            semestre: 7,
            correo: 'maria.gonzalez@alumno.itsp.edu.mx',
            descripcion: 'No hay suficientes espacios en la biblioteca para estudiar',
            salon_grupo: 'Biblioteca',
            created_at: '2024-01-16T14:20:00',
            estado: 'revision',
            prioridad: 'alta'
        },
        {
            id: 3,
            numero_control: '20180001',
            nombre: 'Juan Pérez García',
            carrera: 'ING. SISTEMAS COMPUTACIONALES',
            semestre: 5,
            correo: 'juan.perez@alumno.itsp.edu.mx',
            descripcion: 'El aire acondicionado del aula 201 no funciona correctamente',
            salon_grupo: 'Aula-201',
            created_at: '2024-01-17T09:15:00',
            estado: 'nuevo',
            prioridad: 'baja'
        }
    ];

    dashboardManager.actualizarMetricas(quejasData);
    filtrarYMostrarQuejas(); // Cambio aquí
    toastManager.warning('🧪 Mostrando datos de ejemplo (sin conexión a BD)');
}

// Función global para aplicar filtros (llamada desde HTML) - SIMPLIFICADA
window.aplicarFiltrosBoton = function() {
    console.log('🔍 Botón filtrar presionado');
    actualizarFiltros();
    filtrarYMostrarQuejas();
    toastManager.info('🔍 Filtros aplicados');
};

// Función separada para filtrar y mostrar (evita recursión)
function filtrarYMostrarQuejas() {
    let quejasFiltradas = [...quejasData];

    // Aplicar filtros
    if (filtrosActivos.carrera) {
        quejasFiltradas = quejasFiltradas.filter(q => q.carrera === filtrosActivos.carrera);
    }

    if (filtrosActivos.semestre) {
        quejasFiltradas = quejasFiltradas.filter(q => String(q.semestre) === filtrosActivos.semestre);
    }

    if (filtrosActivos.estado) {
        quejasFiltradas = quejasFiltradas.filter(q => q.estado === filtrosActivos.estado);
    }

    if (filtrosActivos.prioridad) {
        quejasFiltradas = quejasFiltradas.filter(q => q.prioridad === filtrosActivos.prioridad);
    }

    if (filtrosActivos.fecha) {
        const ahora = new Date();
        let fechaLimite;

        switch (filtrosActivos.fecha) {
            case 'hoy':
                fechaLimite = new Date(ahora.setHours(0, 0, 0, 0));
                break;
            case 'semana':
                fechaLimite = new Date(ahora.setDate(ahora.getDate() - 7));
                break;
            case 'mes':
                fechaLimite = new Date(ahora.setMonth(ahora.getMonth() - 1));
                break;
            case 'trimestre':
                fechaLimite = new Date(ahora.setMonth(ahora.getMonth() - 3));
                break;
        }

        if (fechaLimite) {
            quejasFiltradas = quejasFiltradas.filter(q => new Date(q.created_at) >= fechaLimite);
        }
    }

    if (filtrosActivos.busqueda) {
        const termino = filtrosActivos.busqueda.toLowerCase();
        quejasFiltradas = quejasFiltradas.filter(q => 
            q.nombre.toLowerCase().includes(termino) ||
            q.numero_control.toLowerCase().includes(termino) ||
            q.descripcion.toLowerCase().includes(termino)
        );
    }

    console.log('🔍 Quejas filtradas:', quejasFiltradas.length);
    renderTablaQuejas(quejasFiltradas);
}

function renderTablaQuejas(quejas) {
    const tabla = document.getElementById("tablaQuejas");
    
    if (!tabla) {
        console.error('Elemento tablaQuejas no encontrado');
        return;
    }
    
    // Agrupar por estudiante
    quejasAgrupadas = {};
    quejas.forEach(q => {
        if (!quejasAgrupadas[q.numero_control]) {
            quejasAgrupadas[q.numero_control] = { ...q, quejas: [] };
        }
        quejasAgrupadas[q.numero_control].quejas.push(q);
    });

    const totalEstudiantes = Object.keys(quejasAgrupadas).length;
    const totalQuejas = quejas.length;

    // Actualizar contador si existe
    const resultadosCount = document.getElementById('resultadosCount');
    if (resultadosCount) {
        resultadosCount.textContent = `${totalEstudiantes} estudiantes • ${totalQuejas} quejas`;
    }

    let html = `
        <table class="tabla-admin">
            <thead>
                <tr>
                    <th>No. Control</th>
                    <th>Nombre</th>
                    <th>Carrera</th>
                    <th>Semestre</th>
                    <th>Quejas</th>
                    <th>Estado</th>
                    <th>Prioridad</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (totalEstudiantes === 0) {
        html += `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    📋 No hay quejas que mostrar con los filtros seleccionados
                </td>
            </tr>
        `;
    } else {
        Object.values(quejasAgrupadas).forEach(estudiante => {
            const ultimaQueja = estudiante.quejas[0];
            const estadoPrincipal = obtenerEstadoPrincipal(estudiante.quejas);
            const prioridadMaxima = obtenerPrioridadMaxima(estudiante.quejas);

            html += `
                <tr>
                    <td><strong>${estudiante.numero_control}</strong></td>
                    <td>${estudiante.nombre}</td>
                    <td title="${estudiante.carrera}">${estudiante.carrera.substring(0, 15)}${estudiante.carrera.length > 15 ? '...' : ''}</td>
                    <td style="text-align: center;">${estudiante.semestre || 'N/A'}</td>
                    <td style="text-align: center;">
                        <span style="background: #e3f2fd; padding: 4px 8px; border-radius: 12px; font-weight: bold; color: #1976d2;">
                            ${estudiante.quejas.length}
                        </span>
                    </td>
                    <td>
                        <span class="estado-badge estado-${estadoPrincipal}">
                            ${obtenerTextoEstado(estadoPrincipal)}
                        </span>
                        <button class="btn-estado" onclick="cambiarEstado('${estudiante.numero_control}', '${estadoPrincipal}')" title="Cambiar estado">
                            🔄
                        </button>
                    </td>
                    <td>
                        <span class="prioridad-badge prioridad-${prioridadMaxima}">
                            ${obtenerTextoPrioridad(prioridadMaxima)}
                        </span>
                        <button class="btn-prioridad" onclick="cambiarPrioridad('${estudiante.numero_control}', '${prioridadMaxima}')" title="Cambiar prioridad">
                            ⭐
                        </button>
                    </td>
                    <td>
                        <button class="btn-ver" onclick="verDetalles('${estudiante.numero_control}')" title="Ver detalles">
                            👁 Ver
                        </button>
                    </td>
                </tr>`;
        });
    }

    console.log('Renderizando tabla con', totalQuejas, 'quejas y', totalEstudiantes, 'estudiantes');
    tabla.innerHTML = html;
}

// FUNCIONES DE UTILIDAD PARA ESTADOS Y PRIORIDADES
function obtenerEstadoPrincipal(quejas) {
    const prioridades = { 'nuevo': 4, 'revision': 3, 'respondido': 2, 'cerrado': 1 };
    return quejas.reduce((a, b) => prioridades[a.estado] > prioridades[b.estado] ? a : b).estado;
}

function obtenerPrioridadMaxima(quejas) {
    const prioridades = { 'alta': 3, 'media': 2, 'baja': 1 };
    return quejas.reduce((a, b) => prioridades[a.prioridad] > prioridades[b.prioridad] ? a : b).prioridad;
}

function obtenerTextoEstado(estado) {
    const textos = {
        'nuevo': '🔴 Nuevo',
        'revision': '🟡 Revisión',
        'respondido': '🟢 Respondido',
        'cerrado': '⚫ Cerrado'
    };
    return textos[estado] || estado;
}

function obtenerTextoPrioridad(prioridad) {
    const textos = {
        'alta': '🔴 Alta',
        'media': '🟡 Media',
        'baja': '🟢 Baja'
    };
    return textos[prioridad] || prioridad;
}

// FUNCIONES DE CAMBIO DE ESTADO Y PRIORIDAD
async function cambiarEstado(numeroControl, estadoActual) {
    const estados = ['nuevo', 'revision', 'respondido', 'cerrado'];
    const opciones = estados.map(estado => `
        <option value="${estado}" ${estado === estadoActual ? 'selected' : ''}>
            ${obtenerTextoEstado(estado)}
        </option>
    `).join('');

    const modal = document.createElement('div');
    modal.className = 'confirm-modal show';
    modal.innerHTML = `
        <div class="confirm-content">
            <h3>🔄 Cambiar Estado</h3>
            <p>Selecciona el nuevo estado para las quejas de este estudiante:</p>
            <select id="nuevoEstado" style="width: 100%; padding: 10px; margin: 15px 0; border: 2px solid #e2e8f0; border-radius: 6px;">
                ${opciones}
            </select>
            <div class="confirm-buttons">
                <button class="confirm-btn secondary" onclick="cerrarModal(this)">Cancelar</button>
                <button class="confirm-btn primary" onclick="aplicarCambioEstado('${numeroControl}', this)">Aplicar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function cambiarPrioridad(numeroControl, prioridadActual) {
    const prioridades = ['baja', 'media', 'alta'];
    const opciones = prioridades.map(prioridad => `
        <option value="${prioridad}" ${prioridad === prioridadActual ? 'selected' : ''}>
            ${obtenerTextoPrioridad(prioridad)}
        </option>
    `).join('');

    const modal = document.createElement('div');
    modal.className = 'confirm-modal show';
    modal.innerHTML = `
        <div class="confirm-content">
            <h3>⭐ Cambiar Prioridad</h3>
            <p>Selecciona la nueva prioridad para las quejas de este estudiante:</p>
            <select id="nuevaPrioridad" style="width: 100%; padding: 10px; margin: 15px 0; border: 2px solid #e2e8f0; border-radius: 6px;">
                ${opciones}
            </select>
            <div class="confirm-buttons">
                <button class="confirm-btn secondary" onclick="cerrarModal(this)">Cancelar</button>
                <button class="confirm-btn primary" onclick="aplicarCambioPrioridad('${numeroControl}', this)">Aplicar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function cerrarModal(btn) {
    const modal = btn.closest('.confirm-modal');
    modal.classList.remove('show');
    setTimeout(() => document.body.removeChild(modal), 300);
}

async function aplicarCambioEstado(numeroControl, btn) {
    const nuevoEstado = document.getElementById('nuevoEstado').value;
    
    try {
        // Intentar actualizar en base de datos solo si hay conexión
        let errorDB = null;
        
        try {
            const { error } = await supabase
                .from('quejas')
                .update({ estado: nuevoEstado })
                .eq('numero_control', numeroControl);
            
            errorDB = error;
        } catch (err) {
            console.log('Sin conexión a BD, actualizando solo localmente');
            errorDB = null; // Continuar con actualización local
        }

        if (errorDB) {
            console.warn('Error en BD pero continuando:', errorDB.message);
        }

        // Actualizar datos locales (siempre funciona)
        quejasData.forEach(queja => {
            if (queja.numero_control === numeroControl) {
                queja.estado = nuevoEstado;
            }
        });

        cerrarModal(btn);
        filtrarYMostrarQuejas();
        await dashboardManager.actualizarMetricas(quejasData);
        toastManager.success(`Estado actualizado a: ${obtenerTextoEstado(nuevoEstado)}`);

    } catch (error) {
        console.error('Error al actualizar estado:', error);
        // Aún así actualizar localmente
        quejasData.forEach(queja => {
            if (queja.numero_control === numeroControl) {
                queja.estado = nuevoEstado;
            }
        });
        
        cerrarModal(btn);
        filtrarYMostrarQuejas();
        toastManager.warning(`Estado actualizado localmente: ${obtenerTextoEstado(nuevoEstado)}`);
    }
}

async function aplicarCambioPrioridad(numeroControl, btn) {
    const nuevaPrioridad = document.getElementById('nuevaPrioridad').value;
    
    try {
        // Intentar actualizar en base de datos solo si hay conexión
        let errorDB = null;
        
        try {
            const { error } = await supabase
                .from('quejas')
                .update({ prioridad: nuevaPrioridad })
                .eq('numero_control', numeroControl);
            
            errorDB = error;
        } catch (err) {
            console.log('Sin conexión a BD, actualizando solo localmente');
            errorDB = null; // Continuar con actualización local
        }

        if (errorDB) {
            console.warn('Error en BD pero continuando:', errorDB.message);
        }

        // Actualizar datos locales (siempre funciona)
        quejasData.forEach(queja => {
            if (queja.numero_control === numeroControl) {
                queja.prioridad = nuevaPrioridad;
            }
        });

        cerrarModal(btn);
        filtrarYMostrarQuejas();
        await dashboardManager.actualizarMetricas(quejasData);
        toastManager.success(`Prioridad actualizada a: ${obtenerTextoPrioridad(nuevaPrioridad)}`);

    } catch (error) {
        console.error('Error al actualizar prioridad:', error);
        // Aún así actualizar localmente
        quejasData.forEach(queja => {
            if (queja.numero_control === numeroControl) {
                queja.prioridad = nuevaPrioridad;
            }
        });
        
        cerrarModal(btn);
        filtrarYMostrarQuejas();
        toastManager.warning(`Prioridad actualizada localmente: ${obtenerTextoPrioridad(nuevaPrioridad)}`);
    }
}

// MODAL DE DETALLES MEJORADO - Corregido
function verDetalles(numeroControl) {
    console.log('🔍 Abriendo detalles para:', numeroControl);
    
    const estudiante = quejasAgrupadas[numeroControl];
    if (!estudiante) {
        console.error('No se encontró estudiante:', numeroControl);
        toastManager.error('No se encontraron datos del estudiante');
        return;
    }

    // Crear modal directamente en el body
    const modal = document.createElement('div');
    modal.className = 'detalles-modal';
    modal.style.display = 'block';
    modal.id = 'modalDetalles';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📋 Quejas de ${estudiante.nombre}</h3>
                <button class="btn-close" onclick="cerrarDetalles()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="estudiante-info" style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p><strong>📚 Carrera:</strong> ${estudiante.carrera}</p>
                    <p><strong>📖 Semestre:</strong> ${estudiante.semestre || 'N/A'}</p>
                    <p><strong>📧 Correo:</strong> ${estudiante.correo || 'No especificado'}</p>
                    <p><strong>📝 Total de quejas:</strong> ${estudiante.quejas.length}</p>
                </div>
                
                <h4>📋 Historial de Quejas</h4>
                <div class="quejas-list">
                    ${estudiante.quejas.map(queja => `
                        <div class="queja-item" style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #00875A;">
                            <div class="queja-meta" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 0.9rem; color: #718096;">
                                <span><strong>📅 ${new Date(queja.created_at).toLocaleDateString()}</strong></span>
                                <div style="display: flex; gap: 8px;">
                                    <span class="estado-badge estado-${queja.estado}">${obtenerTextoEstado(queja.estado)}</span>
                                    <span class="prioridad-badge prioridad-${queja.prioridad}">${obtenerTextoPrioridad(queja.prioridad)}</span>
                                </div>
                            </div>
                            <p><strong>📝 Descripción:</strong> ${queja.descripcion}</p>
                            <p><strong>🏫 Salón/Grupo:</strong> ${queja.salon_grupo || 'No especificado'}</p>
                        </div>
                    `).join('')}
                </div>

                <div class="response-section" style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #e2e8f0; margin-top: 20px;">
                    <h4 style="margin: 0 0 15px 0; color: #2d3748; display: flex; justify-content: space-between; align-items: center;">
                        📧 Responder al Estudiante
                        <button class="btn-templates" onclick="abrirTemplates()" style="background: #4299e1; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">📝 Templates</button>
                    </h4>
                    <textarea 
                        class="response-textarea" 
                        id="respuesta-${numeroControl}" 
                        placeholder="Escriba su respuesta al estudiante..."
                        style="width: 100%; min-height: 120px; padding: 15px; border: 2px solid #e2e8f0; border-radius: 8px; font-family: inherit; font-size: 1rem; resize: vertical; margin-bottom: 15px;"
                    ></textarea>
                    <div class="response-actions" style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="btn-save-draft" onclick="guardarBorrador('${numeroControl}')" style="padding: 12px 20px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; background: #f8f9fa; color: #2d3748; border: 1px solid #e2e8f0;">💾 Guardar Borrador</button>
                        <button class="btn-send" onclick="enviarRespuesta('${numeroControl}')" style="padding: 12px 20px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; background: #00875A; color: white;">📤 Enviar Respuesta</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Cerrar modal existente si hay uno
    const modalExistente = document.getElementById('modalDetalles');
    if (modalExistente) {
        modalExistente.remove();
    }
    
    // Agregar modal al body
    document.body.appendChild(modal);
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            cerrarDetalles();
        }
    });
    
    console.log('✅ Modal de detalles creado');
    toastManager.info(`Mostrando ${estudiante.quejas.length} queja(s) de ${estudiante.nombre}`);
}

function cerrarDetalles() {
    console.log('🚪 Cerrando modal de detalles');
    const modal = document.getElementById('modalDetalles');
    if (modal) {
        modal.remove();
    }
    
    // También limpiar el div detalles por si acaso
    const detallesDiv = document.getElementById('detalles');
    if (detallesDiv) {
        detallesDiv.innerHTML = '';
        detallesDiv.style.display = 'none';
    }
}

// SISTEMA DE TEMPLATES
function abrirTemplates() {
    document.getElementById('templatesModal').style.display = 'block';
}

function cerrarTemplates() {
    document.getElementById('templatesModal').style.display = 'none';
}

function usarTemplate(tipo) {
    const textareas = document.querySelectorAll('.response-textarea');
    const textarea = textareas[textareas.length - 1]; // Último textarea abierto
    
    if (textarea) {
        const template = templatesManager.obtenerTemplate(tipo);
        if (template) {
            textarea.value = template.mensaje;
            textarea.focus();
            cerrarTemplates();
            toastManager.success(`Template "${tipo}" aplicado correctamente`);
        }
    }
}

// FUNCIONES DE RESPUESTA
async function enviarRespuesta(numeroControl) {
    const textarea = document.getElementById(`respuesta-${numeroControl}`);
    const respuesta = textarea.value.trim();
    
    if (!respuesta) {
        toastManager.warning('Por favor escriba una respuesta antes de enviar');
        return;
    }

    const estudiante = quejasAgrupadas[numeroControl];
    
    if (!estudiante.correo) {
        toastManager.error('El estudiante no tiene correo electrónico registrado');
        return;
    }

    const confirmed = await toastManager.confirm(
        'Enviar Respuesta por Email',
        `Se enviará la respuesta al correo: ${estudiante.correo}. ¿Continuar?`,
        { 
            confirmText: 'Sí, enviar email', 
            cancelText: 'Cancelar', 
            icon: '📧' 
        }
    );

    if (!confirmed) return;

    const loadingToast = toastManager.info('📧 Enviando email al estudiante...', 0);

    try {
        const datosEmail = {
            correoAlumno: estudiante.correo,
            nombreAlumno: estudiante.nombre,
            numeroControl: estudiante.numero_control,
            carrera: estudiante.carrera,
            asunto: `Respuesta a tu queja - Instituto Tecnológico Superior de Poza Rica`,
            mensaje: respuesta
        };

        const emailService = new ResendEmailService();
        const resultado = await emailService.enviarRespuestaAlumno(datosEmail);

        toastManager.remove(loadingToast);

        if (resultado.success) {
            try {
                const { error } = await supabase
                    .from('quejas')
                    .update({ estado: 'respondido' })
                    .eq('numero_control', numeroControl);
            } catch (err) {
                console.log('Actualizando estado solo localmente');
            }

            quejasData.forEach(queja => {
                if (queja.numero_control === numeroControl) {
                    queja.estado = 'respondido';
                }
            });
            
            toastManager.success(`✅ Email enviado exitosamente a ${estudiante.correo}`);
            
            textarea.value = '';
            cerrarDetalles();
            filtrarYMostrarQuejas();
            await dashboardManager.actualizarMetricas(quejasData);
            
        } else {
            toastManager.error(`❌ Error enviando email: ${resultado.error}`);
        }

    } catch (error) {
        toastManager.remove(loadingToast);
        toastManager.error('❌ Error inesperado enviando email');
        console.error('Error completo:', error);
    }
}

function guardarBorrador(numeroControl) {
    const textarea = document.getElementById(`respuesta-${numeroControl}`);
    const respuesta = textarea.value.trim();
    
    if (!respuesta) {
        toastManager.warning('⚠️ No hay contenido para guardar');
        return;
    }

    // Guardar en localStorage
    const borradores = JSON.parse(localStorage.getItem('borradores') || '{}');
    borradores[numeroControl] = {
        contenido: respuesta,
        fecha: new Date().toISOString()
    };
    localStorage.setItem('borradores', JSON.stringify(borradores));
    
    toastManager.success('💾 Borrador guardado correctamente');
}

// FUNCIONES DE FILTROS
function actualizarFiltros() {
    console.log('📋 Actualizando valores de filtros...');
    
    const carreraElement = document.getElementById('filtroCarrera');
    const semestreElement = document.getElementById('filtroSemestre');
    const fechaElement = document.getElementById('filtroFecha');
    const estadoElement = document.getElementById('filtroEstado');
    const prioridadElement = document.getElementById('filtroPrioridad');
    const busquedaElement = document.getElementById('busquedaTexto');
    
    filtrosActivos.carrera = carreraElement ? carreraElement.value : '';
    filtrosActivos.semestre = semestreElement ? semestreElement.value : '';
    filtrosActivos.fecha = fechaElement ? fechaElement.value : '';
    filtrosActivos.estado = estadoElement ? estadoElement.value : '';
    filtrosActivos.prioridad = prioridadElement ? prioridadElement.value : '';
    filtrosActivos.busqueda = busquedaElement ? busquedaElement.value : '';
    
    console.log('📊 Filtros activos:', filtrosActivos);
}

function limpiarFiltros() {
    document.getElementById('filtroCarrera').value = '';
    document.getElementById('filtroSemestre').value = '';
    document.getElementById('filtroFecha').value = '';
    document.getElementById('filtroEstado').value = '';
    document.getElementById('filtroPrioridad').value = '';
    document.getElementById('busquedaTexto').value = '';
    
    filtrosActivos = { carrera: '', semestre: '', fecha: '', estado: '', prioridad: '', busqueda: '' };
    filtrarYMostrarQuejas(); // Cambio aquí
    toastManager.info('🗑️ Filtros limpiados');
}

// EXPORTACIÓN DE DATOS
async function exportarDatos() {
    const confirmed = await toastManager.confirm(
        '📊 Exportar Datos',
        '¿Desea exportar los datos actuales a CSV?',
        { confirmText: 'Sí, exportar', cancelText: 'Cancelar', icon: '📊' }
    );

    if (!confirmed) return;

    try {
        let csv = 'Numero Control,Nombre,Carrera,Semestre,Correo,Descripcion,Estado,Prioridad,Fecha\n';
        
        Object.values(quejasAgrupadas).forEach(estudiante => {
            estudiante.quejas.forEach(queja => {
                csv += `"${queja.numero_control}","${queja.nombre}","${queja.carrera}","${queja.semestre || ''}","${queja.correo || ''}","${queja.descripcion.replace(/"/g, '""')}","${queja.estado}","${queja.prioridad}","${new Date(queja.created_at).toLocaleDateString()}"\n`;
            });
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `quejas_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        toastManager.success('📊 Datos exportados correctamente');
        
    } catch (error) {
        toastManager.error('❌ Error al exportar datos');
        console.error(error);
    }
}

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
    mostrarInfoUsuario();
    inicializarFiltros();
    configurarEventListeners();
    cargarQuejas();
});

function inicializarFiltros() {
    // Carreras
    const carreras = [
        "ING INDUSTRIAL", "ING INFORMATICA", "ING. SISTEMAS COMPUTACIONALES",
        "ING. ELECTRÓNICA", "CONTADOR PÚBLICO", "ING EN GESTIÓN EMPRESARIAL",
        "ING PETROLERA", "ING. IND. ALIMENTARIAS", "MAESTRÍA EN INGENIERÍA ADMINISTRATIVA"
    ];

    const filtroCarrera = document.getElementById("filtroCarrera");
    carreras.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        filtroCarrera.appendChild(opt);
    });

    // Semestres
    const filtroSemestre = document.getElementById("filtroSemestre");
    const semestres = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    semestres.forEach(s => {
        const opt = document.createElement("option");
        opt.value = String(s);
        opt.textContent = `${s}° Semestre`;
        filtroSemestre.appendChild(opt);
    });
}

function configurarEventListeners() {
    console.log('⚙️ Configurando event listeners...');
    
    // REMOVER eventos automáticos para evitar bucles
    // Los filtros solo se aplicarán cuando el usuario haga clic en "Filtrar"
    
    // Solo configurar atajos de teclado
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            const busqueda = document.getElementById('busquedaTexto');
            if (busqueda) busqueda.focus();
        }
        if (e.key === 'Escape') {
            cerrarDetalles();
            cerrarTemplates();
        }
    });
    
    console.log('✅ Event listeners configurados (solo teclado)');
}

// Funciones globales para el HTML - SIMPLIFICADAS
window.aplicarFiltrosBoton = aplicarFiltrosBoton; // Ya definida arriba
window.limpiarFiltros = limpiarFiltros;
window.exportarDatos = exportarDatos;
window.verDetalles = verDetalles;
window.cerrarDetalles = cerrarDetalles;
window.cargarQuejas = cargarQuejas;
window.cerrarSesion = cerrarSesion;
window.abrirTemplates = abrirTemplates;
window.cerrarTemplates = cerrarTemplates;
window.usarTemplate = usarTemplate;
window.enviarRespuesta = enviarRespuesta;
window.guardarBorrador = guardarBorrador;
window.cambiarEstado = cambiarEstado;
window.cambiarPrioridad = cambiarPrioridad;