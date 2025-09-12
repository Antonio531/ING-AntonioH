const supabaseUrl = "https://wqjbbnvogexdkqsqdxxq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamJibnZvZ2V4ZGtxc3FkeHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMTc3NzgsImV4cCI6MjA3Mjc5Mzc3OH0.xls3PJRJuMTtLomiGpGWLqrRy6s1m6E9cuna9XNoMkw";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);


const tabla = document.getElementById("tablaQuejas");
const detalles = document.getElementById("detalles");

// Cargar quejas agrupadas
async function cargarQuejas() {
  const { data, error } = await supabase
    .from("quejas")
    .select("id, numero_control, nombre, carrera, semestre,correo, descripcion, salon_grupo, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    tabla.innerHTML = `<div class="error">❌ Error al cargar: ${error.message}</div>`;
    return;
  }

  // Filtros
  const carreraSel = document.getElementById("filtroCarrera").value;
  const semestreSel = document.getElementById("filtroSemestre").value;

  const filtradas = data.filter(q => 
    (carreraSel === "" || q.carrera === carreraSel) &&
    (semestreSel === "" || String(q.semestre) === semestreSel)
  );

  // Agrupar por alumno
  const agrupado = {};
  filtradas.forEach(q => {
    if (!agrupado[q.numero_control]) {
      agrupado[q.numero_control] = { ...q, quejas: [] };
    }
    agrupado[q.numero_control].quejas.push({
      descripcion: q.descripcion,
      salon: q.salon_grupo,
      fecha: q.created_at

    });
  });

  // Render tabla
  let html = `
    <table class="tabla-admin">
      <thead>
        <tr>
          <th>No. Control</th>
          <th>Nombre</th>
          <th>Carrera</th>
          <th class="se">Semestre</th>
          <th>Correo</th>
          <th>Total Quejas</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  Object.values(agrupado).forEach(a => {
    html += `
      <tr>
        <td>${a.numero_control}</td>
        <td>${a.nombre}</td>
        <td>${a.carrera}</td>
        <td>${a.semestre || ""}</td>
        <td>${a.correo || ""}</td>
        <td>${a.quejas.length}</td>
        <td><button class="btn-ver" onclick="verDetalles('${a.numero_control}')">👁 Ver</button></td>
      </tr>`;
  });
  html += "</tbody></table>";

  tabla.innerHTML = html;
  window.quejasAgrupadas = agrupado;
}

// Ver detalles en modal
function verDetalles(noControl) {
  const alumno = window.quejasAgrupadas[noControl];
  let html = `
    <div class="modal">
      <div class="modal-content">
        <button class="btn-cerrar" onclick="cerrarModal()">Cerrar</button>
        <h2>Quejas de ${alumno.nombre} (${alumno.carrera})</h2>
        <ul>

        <section>
    <form action="" class="formulario">
      <label for="" class="contestar">
        <input textarea name="correo" class="respuesta" id="correo" cols="30" rows="10" placeholder="Escribe tu mensaje aqui..."></textarea>
      </label>
      <button class="btn-enviar" type="submit">Enviar</button>
    </form>
  </section>

        
  `;
  alumno.quejas.forEach(q => {
    html += `<li><b>${new Date(q.fecha).toLocaleString()}:</b> ${q.descripcion} <br> <i>Salón: ${q.salon || "N/A"}</i></li><hr>`;
  });
  html += "</ul></div></div>";

  detalles.innerHTML = html;
  detalles.style.display = "block";
}


function cerrarModal() {
  detalles.style.display = "none";
  detalles.innerHTML = "";
}

// cargar al inicio
cargarQuejas();

const carreras = [
  "ING INDUSTRIAL",
  "ING INFORMATICA",
  "ING. SISTEMAS COMPUTACIONALES",
  "ING. ELECTRÓNICA",
  "CONTADOR PÚBLICO",
  "ING EN GESTIÓN EMPRESARIAL",
  "ING PETROLERA",
  "ING. IND. ALIMENTARIAS",
  "MAESTRÍA EN INGENIERÍA ADMINISTRATIVA"
];

const filtroCarrera = document.getElementById("filtroCarrera");
carreras.forEach(c => {
  const opt = document.createElement("option");
  opt.value = c;
  opt.textContent = c;
  filtroCarrera.appendChild(opt);
});

const filtroSemestre = document.getElementById("filtroSemestre");
// Solo semestres activos en el periodo actual (agosto-diciembre)
const semestresActuales = [1, 3, 5, 7];
semestresActuales.forEach(s => {
  const opt = document.createElement("option");
  opt.value = String(s);
  opt.textContent = s;
  filtroSemestre.appendChild(opt);
});

filtroCarrera.addEventListener("change", cargarQuejas);
filtroSemestre.addEventListener("change", cargarQuejas);
