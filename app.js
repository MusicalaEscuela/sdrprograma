/**
 * Salvémoslos del Reggaetón 2026 — Musicala
 * App principal · módulo ES vanilla
 *
 * Responsabilidades:
 *  - Detectar modo público vs admin (?admin en la URL)
 *  - Renderizar y manejar el formulario de feedback
 *  - Guardar comentarios en Firestore
 *  - Mostrar dashboard con estadísticas, filtros y export CSV
 */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  firebaseConfig,
  FEEDBACK_COLLECTION,
  EVENT_NAME
} from "./firebase.config.js";


const ACTIVITY_LINKS = {
  moonwalk: "https://musicalaescuela.github.io/moonwalkchallengesdr/",
  rhythm: "https://musicalaescuela.github.io/theydontcareaboutus"
};

const EVENT_PROGRAM = [
  {
    time: "1:00 p. m.",
    title: "Apertura del lugar",
    text: "Llegada, ubicación en mesas y ambiente musical para empezar la tarde con calma. Sí, primero respiramos, luego rockeamos."
  },
  {
    time: "2:00 p. m.",
    title: "Inicio del bloque Musicala",
    text: "Bienvenida al evento y presentación de la alianza Musicala + Full 80s."
  },
  {
    time: "2:10 p. m.",
    title: "The Office · Banda de adultos Musicala",
    text: "Presentación en vivo con repertorio rock y un guiño especial a Michael Jackson."
  },
  {
    time: "Intermedio",
    title: "Actividad · They Don’t Care About Us",
    text: "Una dinámica rítmica para participar desde la mesa usando palmas, cuerpo, voz y actitud. La humanidad descubriendo que también puede ser percusión, qué peligro."
  },
  {
    time: "3:20 p. m.",
    title: "Young Metal · Banda de jóvenes Musicala",
    text: "Bloque juvenil con energía alta, guitarras y canciones reconocibles para levantar el ambiente."
  },
  {
    time: "Durante el evento",
    title: "Moonwalk Challenge",
    text: "Reto interactivo para jugar desde el celular. No es obligatorio saber bailar como Michael Jackson, tranquilos, sobreviviremos."
  },
  {
    time: "Cierre",
    title: "Full 80s + despedida",
    text: "Continuación del evento, agradecimientos y cierre de la experiencia. Los horarios pueden moverse un poco según la dinámica del lugar."
  }
];

/* =========================================================
   Configuración local
   ========================================================= */

/**
 * Contraseña básica del modo admin.
 * ⚠️ Esta es protección MÍNIMA. Para producción, migrar a Firebase Auth
 *    con custom claims y reglas de Firestore que validen el rol.
 *    Ver README.md sección "Seguridad".
 */
const ADMIN_PASSWORD = "cambiar-esta-clave";

/** Tiempo (ms) que dura la sesión admin guardada en sessionStorage. */
const ADMIN_SESSION_KEY = "musicala_admin_session_v1";

/* =========================================================
   Inicialización Firebase
   ========================================================= */

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================================================
   Helpers de UI
   ========================================================= */

const $app = document.getElementById("app");

/** Escapa HTML para no inyectar markup desde datos del usuario. */
function escapeHTML(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Renderiza estrellas como texto: 4 → "★★★★☆" */
function starsText(rating) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  const full = "★".repeat(r);
  const empty = `<span class="empty">${"★".repeat(5 - r)}</span>`;
  return full + empty;
}

/** Formatea Date (o timestamp Firestore) a "dd MMM yyyy · HH:mm" en es-CO. */
function formatDate(value) {
  let d;
  if (!value) return "—";
  if (value.toDate) d = value.toDate();          // Firestore Timestamp
  else if (value instanceof Date) d = value;
  else d = new Date(value);
  if (isNaN(d.getTime())) return "—";

  return d.toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* =========================================================
   Modo router (público vs admin)
   ========================================================= */

const isAdminMode = new URLSearchParams(window.location.search).has("admin");

if (isAdminMode) {
  $app.classList.add("admin-shell");
  renderAdminEntry();
} else {
  renderUserView();
}

/* =========================================================
   VISTA PÚBLICA — Formulario de feedback
   ========================================================= */

function renderUserView() {
  $app.innerHTML = `
    <section class="hero event-hero">
      <p class="kicker">Programa de mano interactivo</p>
      <h1 class="hero-title"><em>Salvémoslos<br/>del Reggaetón 2026</em></h1>
      <p class="hero-sub">Bienvenido/a al especial Michael Jackson de Musicala + Full 80s. Aquí tienes el mapa rápido del evento, las actividades para participar y la encuesta final en un solo lugar.</p>
      <div class="hero-actions" aria-label="Accesos rápidos">
        <a class="btn btn-primary btn-inline" href="#programa">Ver programa</a>
        <a class="btn btn-ghost btn-inline" href="#actividades">Actividades</a>
        <a class="btn btn-ghost btn-inline" href="#calificacion">Calificar</a>
      </div>
    </section>

    <section class="card intro-card" aria-labelledby="intro-title">
      <div class="section-head">
        <p class="mini-label">Para todos los asistentes</p>
        <h2 id="intro-title">¿Qué va a pasar hoy?</h2>
      </div>
      <p>Hoy tendremos música en vivo, participación del público y actividades inspiradas en Michael Jackson. Puedes tocar, cantar, aplaudir, bailar, mirar desde la mesa o simplemente disfrutar. Aquí nadie viene a presentar audición para Broadway, gracias al cielo. 🕺</p>
      <div class="info-grid">
        <div><strong>Evento</strong><span>Salvémoslos del Reggaetón 2026</span></div>
        <div><strong>Especial</strong><span>Michael Jackson</span></div>
        <div><strong>Organizan</strong><span>Musicala + Full 80s</span></div>
        <div><strong>Formato</strong><span>Música en vivo + actividades con el público</span></div>
      </div>
    </section>

    <section id="programa" class="card program-card" aria-labelledby="program-title">
      <div class="section-head">
        <p class="mini-label">Programa corto</p>
        <h2 id="program-title">Ruta del evento</h2>
        <p>Este es el orden general. Puede ajustarse un poco según sonido, montaje y esas pequeñas aventuras logísticas que los eventos insisten en tener.</p>
      </div>
      <div class="timeline-list">
        ${EVENT_PROGRAM.map(item => `
          <article class="program-item">
            <div class="program-time">${item.time}</div>
            <div>
              <h3>${item.title}</h3>
              <p>${item.text}</p>
            </div>
          </article>
        `).join("")}
      </div>
    </section>

    <section id="actividades" class="activity-section" aria-labelledby="activities-title">
      <div class="section-head center">
        <p class="mini-label">Participa desde tu celular</p>
        <h2 id="activities-title">Actividades del público</h2>
        <p>No necesitas ser estudiante de Musicala ni saber música. Solo entra al link, sigue las instrucciones y ya. El listón está en “ser humano funcional con celular”, más o menos.</p>
      </div>
      <div class="activity-grid">
        <article class="card activity-card">
          <div class="activity-icon">🥁</div>
          <h3>They Don’t Care About Us</h3>
          <p>Actividad rítmica para construir una base colectiva con palmas, pies, cuerpo y voz. Ideal para participar desde la mesa.</p>
          <a class="btn btn-primary" href="${ACTIVITY_LINKS.rhythm}" target="_blank" rel="noopener noreferrer">Abrir actividad rítmica</a>
        </article>

        <article class="card activity-card">
          <div class="activity-icon">🕺</div>
          <h3>Moonwalk Challenge</h3>
          <p>Reto interactivo inspirado en Michael Jackson. Participa desde el celular y sigue las instrucciones durante el evento.</p>
          <a class="btn btn-primary" href="${ACTIVITY_LINKS.moonwalk}" target="_blank" rel="noopener noreferrer">Abrir Moonwalk Challenge</a>
        </article>
      </div>
    </section>

    <section id="calificacion" class="card feedback-card" aria-labelledby="feedback-title">
      <div class="section-head">
        <p class="mini-label">Antes de irte</p>
        <h2 id="feedback-title">Califica tu experiencia</h2>
        <p>Tu opinión nos ayuda a mejorar próximas ediciones, ajustar la experiencia y fingir con menos descaro que todo estaba bajo control desde el inicio.</p>
      </div>

      <div id="form-error" class="alert alert-error" style="display:none;"></div>

      <form id="feedback-form" novalidate>
        <div class="field">
          <label for="name">Tu nombre <span class="hint">(opcional)</span></label>
          <input id="name" name="name" type="text" class="input" maxlength="80" placeholder="Como te gustaría que te llamemos" autocomplete="name" />
        </div>

        <div class="field">
          <label>Calificación general <span class="req">*</span></label>
          <div id="stars" class="stars" role="radiogroup" aria-label="Calificación del 1 al 5">
            ${[1,2,3,4,5].map(n => `
              <button type="button" class="star-btn" data-value="${n}" aria-label="${n} estrella${n>1?'s':''}" role="radio" aria-checked="false">★</button>
            `).join("")}
          </div>
          <div id="stars-label" class="stars-label">Toca para calificar</div>
        </div>

        <div class="field">
          <label for="enjoyed">¿Qué fue lo que más disfrutaste del evento? <span class="req">*</span></label>
          <textarea id="enjoyed" name="enjoyed" class="textarea" maxlength="800" placeholder="Una presentación, una actividad, el ambiente, una canción, un momento..."></textarea>
        </div>

        <div class="field">
          <label for="improvement">¿Qué podríamos mejorar para una próxima edición? <span class="hint">(opcional, pero útil)</span></label>
          <textarea id="improvement" name="improvement" class="textarea" maxlength="800" placeholder="Sonido, tiempos, actividades, comunicación, comodidad..."></textarea>
        </div>

        <div class="field">
          <label for="comment">Comentario adicional <span class="hint">(opcional)</span></label>
          <textarea id="comment" name="comment" class="textarea" maxlength="800" placeholder="Cualquier otra cosa que quieras contarnos."></textarea>
        </div>

        <button type="submit" id="submit-btn" class="btn btn-primary">
          <span class="btn-label">Enviar mi opinión</span>
        </button>
      </form>
    </section>
  `;

  setupStarsInput();
  setupFormSubmit();
}

/** Configura las estrellas como input controlado. */
let currentRating = 0;
function setupStarsInput() {
  const labels = [
    "Toca para calificar",
    "1 estrella · No fue lo que esperaba",
    "2 estrellas · Me faltó algo",
    "3 estrellas · Estuvo bien",
    "4 estrellas · Me gustó mucho",
    "5 estrellas · ¡Inolvidable!"
  ];
  const $stars = document.getElementById("stars");
  const $label = document.getElementById("stars-label");
  const buttons = [...$stars.querySelectorAll(".star-btn")];

  const paint = (value, source = "active") => {
    buttons.forEach(b => {
      const v = Number(b.dataset.value);
      b.classList.toggle(source, v <= value);
      if (source === "active") b.setAttribute("aria-checked", v === value ? "true" : "false");
    });
  };

  buttons.forEach(btn => {
    btn.addEventListener("mouseenter", () => paint(Number(btn.dataset.value), "hover-active"));
    btn.addEventListener("mouseleave", () => {
      buttons.forEach(b => b.classList.remove("hover-active"));
    });
    btn.addEventListener("click", () => {
      currentRating = Number(btn.dataset.value);
      paint(currentRating, "active");
      $label.textContent = labels[currentRating];
    });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
      }
    });
  });
}

/** Maneja submit + validación + guardado. */
function setupFormSubmit() {
  const $form = document.getElementById("feedback-form");
  const $btn  = document.getElementById("submit-btn");
  const $err  = document.getElementById("form-error");

  $form.addEventListener("submit", async (e) => {
    e.preventDefault();
    $err.style.display = "none";
    $err.textContent = "";

    const data = {
      name:        $form.name.value.trim(),
      rating:      currentRating,
      enjoyed:     $form.enjoyed.value.trim(),
      improvement: $form.improvement.value.trim(),
      comment:     $form.comment.value.trim()
    };

    // Validación
    if (!data.rating) {
      showError($err, "Por favor selecciona una calificación con las estrellas. ⭐");
      return;
    }
    if (!data.enjoyed) {
      showError($err, "Cuéntanos qué fue lo que más disfrutaste. Ese campo es importante para nosotros.");
      document.getElementById("enjoyed").focus();
      return;
    }

    // Lock UI mientras guarda (evita envíos dobles)
    $btn.disabled = true;
    $btn.innerHTML = `<span class="loader"></span><span>Guardando...</span>`;

    try {
      await guardarFeedback(data);
      renderThanksView();
    } catch (err) {
      console.error("[feedback] error guardando:", err);
      showError($err, "No pudimos guardar tu opinión. Revisa tu conexión e intenta de nuevo.");
      $btn.disabled = false;
      $btn.innerHTML = `<span class="btn-label">Enviar mi opinión</span>`;
    }
  });
}

function showError($el, msg) {
  $el.textContent = msg;
  $el.style.display = "block";
  $el.scrollIntoView({ behavior: "smooth", block: "center" });
}

/** Pantalla de agradecimiento. */
function renderThanksView() {
  $app.innerHTML = `
    <section class="card thanks">
      <div class="check">✓</div>
      <h2>¡Gracias por compartir tu experiencia! 💜</h2>
      <p>Tu respuesta quedó registrada. Gracias por hacer parte de esta edición de Salvémoslos del Reggaetón 2026.</p>
      <div class="thanks-actions">
        <a class="btn btn-ghost btn-inline" href="${ACTIVITY_LINKS.rhythm}" target="_blank" rel="noopener noreferrer">Volver a They Don’t Care About Us</a>
        <a class="btn btn-ghost btn-inline" href="${ACTIVITY_LINKS.moonwalk}" target="_blank" rel="noopener noreferrer">Volver al Moonwalk Challenge</a>
      </div>
      <p class="script">— el equipo de Musicala</p>
    </section>
  `;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================================================
   FIRESTORE — operaciones
   ========================================================= */

/**
 * Guarda un documento de feedback en Firestore.
 * @param {{name:string, rating:number, enjoyed:string, improvement:string, comment:string}} data
 */
async function guardarFeedback(data) {
  const payload = {
    name:        data.name || "",
    rating:      Number(data.rating),
    enjoyed:     data.enjoyed,
    improvement: data.improvement || "",
    comment:     data.comment || "",
    createdAt:   serverTimestamp(),
    userAgent:   (navigator.userAgent || "").slice(0, 240),
    eventName:   EVENT_NAME
  };
  return await addDoc(collection(db, FEEDBACK_COLLECTION), payload);
}

/**
 * Obtiene todos los comentarios ordenados por fecha desc.
 * @returns {Promise<Array<object>>}
 */
async function obtenerFeedback() {
  const q = query(collection(db, FEEDBACK_COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const items = [];
  snap.forEach(doc => {
    items.push({ id: doc.id, ...doc.data() });
  });
  return items;
}

/* =========================================================
   MODO ADMINISTRADOR
   ========================================================= */

function renderAdminEntry() {
  // Si ya hay sesión válida en sessionStorage, saltamos el login
  if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "ok") {
    renderAdminDashboard();
  } else {
    renderAdminLogin();
  }
}

function renderAdminLogin() {
  $app.innerHTML = `
    <section class="admin-header">
      <h1>Panel de administración</h1>
      <p>Ingresa la contraseña para ver los comentarios del evento.</p>
    </section>

    <section class="card admin-login">
      <div id="login-error" class="alert alert-error" style="display:none;"></div>
      <form id="login-form">
        <div class="field">
          <label for="pwd">Contraseña de administrador</label>
          <input id="pwd" type="password" class="input" autocomplete="current-password" autofocus />
        </div>
        <button type="submit" class="btn btn-primary">Entrar</button>
      </form>
    </section>
  `;

  const $form = document.getElementById("login-form");
  const $err  = document.getElementById("login-error");

  $form.addEventListener("submit", (e) => {
    e.preventDefault();
    const pwd = document.getElementById("pwd").value;
    if (pwd === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "ok");
      renderAdminDashboard();
    } else {
      $err.textContent = "Contraseña incorrecta.";
      $err.style.display = "block";
    }
  });
}

/** Estado del dashboard */
const adminState = {
  all: [],
  filter: "all"   // "all" | "five" | "low"
};

async function renderAdminDashboard() {
  $app.innerHTML = `
    <section class="admin-header">
      <h1>Panel de comentarios</h1>
      <p>Salvémoslos del Reggaetón 2026 · Musicala</p>
    </section>

    <div id="dashboard-content">
      <div class="skeleton">Cargando comentarios...</div>
    </div>
  `;

  try {
    adminState.all = await obtenerFeedback();
    paintDashboard();
  } catch (err) {
    console.error("[admin] error cargando feedback:", err);
    document.getElementById("dashboard-content").innerHTML = `
      <div class="alert alert-error">
        No pudimos cargar los comentarios. Verifica las reglas de Firestore y la conexión.
        <br/><small>${escapeHTML(err.message || "")}</small>
      </div>
    `;
  }
}

function paintDashboard() {
  const all = adminState.all;
  const total = all.length;
  const avg = total ? (all.reduce((s, x) => s + (Number(x.rating) || 0), 0) / total) : 0;
  const fives = all.filter(x => Number(x.rating) === 5).length;
  const lows  = all.filter(x => Number(x.rating) <= 4).length;

  let filtered = all;
  if (adminState.filter === "five") filtered = all.filter(x => Number(x.rating) === 5);
  if (adminState.filter === "low")  filtered = all.filter(x => Number(x.rating) <= 4);

  document.getElementById("dashboard-content").innerHTML = `
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total de respuestas</div>
        <div class="stat-value">${total}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Promedio</div>
        <div class="stat-value">${avg.toFixed(2)}<small>/ 5</small></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">5 estrellas</div>
        <div class="stat-value">${fives}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">4 estrellas o menos</div>
        <div class="stat-value">${lows}</div>
      </div>
    </section>

    <div class="toolbar">
      <div class="filter-group" id="filter-group">
        <button class="filter-btn ${adminState.filter==='all'?'active':''}" data-filter="all">Todos (${total})</button>
        <button class="filter-btn ${adminState.filter==='five'?'active':''}" data-filter="five">Solo 5 ★ (${fives})</button>
        <button class="filter-btn ${adminState.filter==='low'?'active':''}" data-filter="low">4 ★ o menos (${lows})</button>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="export-csv">⬇ Exportar CSV</button>
        <button class="btn btn-ghost btn-sm" id="logout-btn">Cerrar sesión</button>
      </div>
    </div>

    <section class="comments">
      ${filtered.length === 0
        ? `<div class="alert alert-info">No hay comentarios para mostrar con este filtro.</div>`
        : filtered.map(renderCommentCard).join("")
      }
    </section>
  `;

  // Listeners
  document.querySelectorAll("#filter-group .filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      adminState.filter = btn.dataset.filter;
      paintDashboard();
    });
  });
  document.getElementById("export-csv").addEventListener("click", () => exportarCSV(adminState.all));
  document.getElementById("logout-btn").addEventListener("click", () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    renderAdminLogin();
  });
}

function renderCommentCard(item) {
  const name = item.name && item.name.trim()
    ? `<span class="comment-name">${escapeHTML(item.name)}</span>`
    : `<span class="comment-name anon">Anónimo</span>`;
  const date = formatDate(item.createdAt);

  return `
    <article class="comment">
      <header class="comment-head">
        <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
          ${name}
          <span class="comment-stars" aria-label="${item.rating} de 5 estrellas">${starsText(item.rating)}</span>
        </div>
        <span class="comment-date">${escapeHTML(date)}</span>
      </header>

      <div class="comment-block">
        <div class="q">Lo que más disfrutó</div>
        <div class="a">${item.enjoyed ? escapeHTML(item.enjoyed) : `<span class="muted">— sin respuesta —</span>`}</div>
      </div>

      <div class="comment-block">
        <div class="q">Qué mejorar</div>
        <div class="a ${item.improvement ? '' : 'muted'}">${item.improvement ? escapeHTML(item.improvement) : `— sin sugerencia —`}</div>
      </div>

      ${item.comment ? `
        <div class="comment-block">
          <div class="q">Comentario adicional</div>
          <div class="a">${escapeHTML(item.comment)}</div>
        </div>
      ` : ""}
    </article>
  `;
}

/* =========================================================
   EXPORTAR CSV
   ========================================================= */

/**
 * Genera y descarga un CSV con todos los comentarios.
 * Escapa correctamente comillas y saltos de línea.
 */
function exportarCSV(items) {
  if (!items || !items.length) {
    alert("No hay comentarios para exportar todavía.");
    return;
  }

  const headers = [
    "Fecha",
    "Nombre",
    "Calificación",
    "Lo que más disfrutó",
    "Qué mejorar",
    "Comentario adicional",
    "Evento"
  ];

  const esc = (val) => {
    const s = String(val ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = items.map(it => [
    formatDate(it.createdAt),
    it.name || "Anónimo",
    it.rating ?? "",
    it.enjoyed || "",
    it.improvement || "",
    it.comment || "",
    it.eventName || EVENT_NAME
  ].map(esc).join(","));

  // BOM para que Excel reconozca UTF-8 con acentos
  const csv = "\uFEFF" + headers.map(esc).join(",") + "\n" + rows.join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `feedback-salvemoslos-2026-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
