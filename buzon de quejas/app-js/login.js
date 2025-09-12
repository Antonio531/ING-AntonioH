const supabaseUrl = "https://wqjbbnvogexdkqsqdxxq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamJibnZvZ2V4ZGtxc3FkeHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMTc3NzgsImV4cCI6MjA3Mjc5Mzc3OH0.xls3PJRJuMTtLomiGpGWLqrRy6s1m6E9cuna9XNoMkw";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Crear partículas animadas
function createParticles() {
    const particlesContainer = document.querySelector('.particles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 1 + 10) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Función de login usando la función de PostgreSQL
async function login(email, password) {
    try {
        const { data, error } = await supabase.rpc('usuario_login', {
            _email: email,
            _password: password
        });

        if (error) {
            console.error('Error en login:', error);
            
            return false;
        }

        if (!data || data.length === 0) {
            return false;
        } else {
            // Usuario encontrado, acceso permitido
            const usuario = data[0];
            alert(`¡Bienvenido! Rol: ${usuario.rol}`);
            sessionStorage.setItem('usuario', JSON.stringify(usuario));

            // Redirigir según el rol
            if (usuario.rol === 'director') {
                window.location.href = 'Admin.html';
            } else {
                window.location.href = 'Admin.html';
            }

            return true;
        }
    } catch (err) {
        console.error('Error inesperado:', err);
        alert('Error inesperado. Inténtalo de nuevo.');
        return false;
    }
}

// Manejar el formulario
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const button = document.querySelector('.login-button');
    const originalText = button.textContent;
    
    // Deshabilitar el botón durante la petición
    button.disabled = true;
    button.textContent = 'Iniciando...';
    button.style.background = 'linear-gradient(135deg, #6c757d, #495057)';
    
    try {
        const success = await login(email, password);
        
        if (success) {
            button.textContent = '✓ ¡Éxito!';
            button.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
        } else {
            button.textContent = '✗ Error';
            button.style.background = 'linear-gradient(135deg, #dc3545, #e74c3c)';
        }
    } catch (error) {
        button.textContent = '✗ Error';
        button.style.background = 'linear-gradient(135deg, #dc3545, #e74c3c)';
    }
    
    // Restaurar el botón después de 2 segundos
    setTimeout(() => {
        button.disabled = false;
        button.textContent = originalText;
        button.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    }, 2000);
});

// Efectos de entrada para los inputs
document.querySelectorAll('.form-group input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});

// Efectos para botones sociales (si los tienes)
document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'translateY(-2px)';
        }, 100);
    });
});

// Función adicional para crear usuarios (solo para pruebas)
async function crearUsuario(email, password, rol = 'director') {
    try {
        const { data, error } = await supabase.rpc('usuario_create', {
            _email: email,
            _password: password,
            _rol: rol
        });

        if (error) {
            console.error('Error creando usuario:', error);
            return false;
        }

        console.log('Usuario creado exitosamente');
        return true;
    } catch (err) {
        console.error('Error inesperado:', err);
        return false;
    }
}

// Inicializar partículas cuando carga la página
createParticles();

