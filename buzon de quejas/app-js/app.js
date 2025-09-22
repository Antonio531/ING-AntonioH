const supabaseUrl = "https://wqjbbnvogexdkqsqdxxq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamJibnZvZ2V4ZGtxc3FkeHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMTc3NzgsImV4cCI6MjA3Mjc5Mzc3OH0.xls3PJRJuMTtLomiGpGWLqrRy6s1m6E9cuna9XNoMkw";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const form = document.getElementById("formIdentidad");
const btnEnviar = document.getElementById("btnEnviar");

const noControlInput = document.getElementById("no_control");
const nombreInput = document.getElementById("nombre");
const carreraInput = document.getElementById("carrera");
const semestreInput = document.getElementById("semestre");
const correoInput = document.getElementById("email");
const salonInput = document.getElementById("salon");
const quejaInput = document.getElementById("queja");

// 🔹 Función para validar el formulario
function validateForm() {
  const noControl = noControlInput.value.trim();
  const nombre = nombreInput.value.trim();
  const carrera = carreraInput.value.trim();
  const semestre = semestreInput.value.trim();
  const correo = correoInput.value.trim();
  const salon = salonInput.value.trim();
  const queja = quejaInput.value.trim();

  // 🆕 Si es maestría, no validar semestre
  const esMaestria = carrera === "MAESTRÍA EN INGENIERÍA ADMINISTRATIVA";
  const semestreValido = esMaestria || semestre; // Si es maestría, omitir validación de semestre

  if (noControl && nombre && carrera && semestreValido && correo && salon && queja) {
    btnEnviar.disabled = false;
    btnEnviar.classList.add("neon-pulse");
  } else {
    btnEnviar.disabled = true;
    btnEnviar.classList.remove("neon-pulse");
  }
}

// 🔹 Ya NO autollenar con número de control
noControlInput.addEventListener("input", () => {
  validateForm();
});

// 🆕 Manejar cambio en la selección de carrera
carreraInput.addEventListener("change", () => {
  const carreraSeleccionada = carreraInput.value;
  const semestreLabel = semestreInput.parentElement; // El elemento <label> que contiene el select
  
  if (carreraSeleccionada === "MAESTRÍA EN INGENIERÍA ADMINISTRATIVA") {
    // Ocultar el campo de semestre para maestría
    semestreLabel.style.display = "none";
    semestreInput.value = ""; // Limpiar valor
    semestreInput.removeAttribute("required"); // Quitar requerido
  } else {
    // Mostrar el campo de semestre para carreras normales
    semestreLabel.style.display = "block";
    semestreInput.setAttribute("required", ""); // Hacer requerido
    configurarSemestres(); // Configurar opciones de semestre
  }
  
  validateForm();
});

// 🔹 Guardar la queja en la tabla "quejas"
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const data = {
    numero_control: noControlInput.value,
    nombre: nombreInput.value,
    carrera: carreraInput.value,
    semestre: semestreInput.value || null, // Si está vacío, enviar null
    correo: correoInput.value,
    salon_grupo: salonInput.value,
    descripcion: quejaInput.value,
  };
  
  btnEnviar.disabled = true;
  btnEnviar.classList.remove("neon-pulse");
  const btnSpan = btnEnviar.querySelector("span");
  btnSpan.textContent = "Enviando...";
  
  const { error } = await supabase.from("quejas").insert([data]);
  
  const msg = document.getElementById("msg");
  const lottie = document.getElementById("successAnim");
  
  if (error) {
    msg.textContent = "❌ Error al enviar: " + error.message;
    msg.style.color = "red";
    
    btnEnviar.disabled = false;
    btnSpan.textContent = "Enviar";
    btnEnviar.classList.add("neon-pulse");
  } else {
    msg.textContent = "✅ Queja enviada correctamente";
    msg.style.color = "green";
    
    // 🔹 Limpiar formulario completamente
    form.reset();
    
    // 🔹 Limpiar campos manualmente por si acaso
    noControlInput.value = '';
    nombreInput.value = '';
    carreraInput.value = '';
    correoInput.value = '';
    salonInput.value = '';
    quejaInput.value = '';
    
    // 🆕 Restaurar visibilidad del campo semestre al limpiar
    const semestreLabel = semestreInput.parentElement;
    semestreLabel.style.display = "block";
    semestreInput.setAttribute("required", "");
    
    // ✅ OCULTAR el botón completamente
    btnEnviar.style.display = "none";
    
    // Mostrar animación Lottie
    const lottie = document.getElementById("successAnim");

    // mostrar + reproducir desde el inicio cada vez
    lottie.style.display = "block";
    lottie.stop();
    requestAnimationFrame(() => {
      lottie.play();
    });

    // cuando termine (o cumplido el fallback), ocultar y restaurar botón
    const hide = () => {
      lottie.stop();
      lottie.style.display = "none";
      msg.textContent = "";

      btnEnviar.style.display = "block";
      btnEnviar.disabled = true;
      btnEnviar.classList.remove("neon-pulse");
      btnSpan.textContent = "Enviar";
      validateForm();
    };

    // si la animación emite "complete"
    lottie.addEventListener("complete", hide, { once: true });

    // Fallback por si no llega el evento (1.8s–2.5s según tu JSON)
    setTimeout(() => {
      if (lottie.style.display !== "none") hide();
    }, 2000);
  }
});

// 🔹 Activar / desactivar botón según campos
form.addEventListener("input", validateForm);

const semestreSelect = document.getElementById("semestre");

// 🆕 Función separada para configurar semestres
function configurarSemestres() {
  // Determina el periodo actual y los semestres disponibles
  const hoy = new Date();
  const year = hoy.getFullYear();
  const mes = hoy.getMonth() + 1; // Enero = 1

  let semestresDisponibles = [];
  if ((mes >= 8 && mes <= 12)) {
    // Periodo agosto-diciembre
    semestresDisponibles = [1, 3, 5, 7];
  } else if (mes >= 1 && mes <= 7) {
    // Periodo enero-julio
    semestresDisponibles = [2, 4, 6, 8];
  }

  semestreSelect.innerHTML = '<option value="" disabled selected>Selecciona tu semestre</option>';
  semestresDisponibles.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    semestreSelect.appendChild(opt);
  });
}

// 🔹 Configurar semestres al cargar la página
configurarSemestres();

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

// Inicializar partículas
createParticles();