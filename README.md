# Programa de mano interactivo — Salvémoslos del Reggaetón 2026

App web pública para el QR del evento **Salvémoslos del Reggaetón 2026 · Especial Michael Jackson**. Reúne en una sola página:

- Programa corto del evento.
- Explicación sencilla para asistentes, sean o no estudiantes de Musicala.
- Accesos a las dos actividades interactivas:
  - Moonwalk Challenge: https://musicalaescuela.github.io/moonwalkchallengesdr/
  - They Don’t Care About Us: https://musicalaescuela.github.io/theydontcareaboutus
- Formulario de calificación de experiencia.
- Panel administrador con estadísticas y exportación CSV usando `?admin`.

Hecha con HTML + CSS + JavaScript vanilla, lista para GitHub Pages.

---

## Archivos principales

```text
index.html              Página principal
styles.css              Estilos visuales
app.js                  Contenido, formulario, links, admin y Firestore
firebase.config.js      Configuración Firebase
assets/                 Logos del evento y Musicala
```

---

## Qué se modificó en esta versión

### 1. Nueva vista pública

La página ya no abre solo con la encuesta. Ahora funciona como programa de mano para asistentes:

1. Hero con accesos rápidos: programa, actividades y calificación.
2. Bloque introductorio: qué es el evento y cómo participar.
3. Programa corto: ruta general del evento.
4. Dos tarjetas de actividades con botones directos.
5. Encuesta de calificación al final.

### 2. Lenguaje para público general

El texto está pensado para asistentes del evento, no solo para estudiantes o familias Musicala. Sirve para personas que tocan, no tocan, acompañan, van por Full 80s, van por Musicala o simplemente llegaron a disfrutar.

### 3. Links de actividades integrados

Los enlaces están definidos en `app.js`:

```js
const ACTIVITY_LINKS = {
  moonwalk: "https://musicalaescuela.github.io/moonwalkchallengesdr/",
  rhythm: "https://musicalaescuela.github.io/theydontcareaboutus"
};
```

### 4. Encuesta integrada

La encuesta conserva el guardado en Firestore y el panel admin original.

---

## Configurar Firebase

Edita `firebase.config.js` con los datos de tu proyecto Firebase:

```js
export const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};
```

La colección usada es:

```js
feedback_salvemoslos_2026
```

---

## Reglas básicas de Firestore para evento

Versión simple para permitir que cualquier asistente envíe su calificación:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /feedback_salvemoslos_2026/{docId} {
      allow create: if request.resource.data.rating is number
                    && request.resource.data.rating >= 1
                    && request.resource.data.rating <= 5
                    && request.resource.data.enjoyed is string
                    && request.resource.data.enjoyed.size() > 0
                    && request.resource.data.enjoyed.size() <= 1000;

      // Para demo o evento puntual con panel admin desde cliente.
      // Si quieres máxima privacidad, pon read:false y revisa desde Firebase Console.
      allow read: if true;
      allow update, delete: if false;
    }
  }
}
```

> Nota: el panel admin actual usa contraseña en el cliente. Eso sirve como barrera básica, pero no como seguridad real. Firebase manda: las reglas son la ley, tristemente más coherente que muchas oficinas humanas.

---

## Probar localmente

Como `app.js` usa módulos ES, no abras `index.html` con doble clic. Usa un servidor local:

```bash
python -m http.server 5500
```

Luego entra a:

```text
http://localhost:5500
```

También puedes usar Live Server en VS Code.

---

## Publicar en GitHub Pages

1. Sube todos los archivos a un repositorio.
2. Ve a **Settings → Pages**.
3. Selecciona **Deploy from branch**.
4. Rama: `main`, carpeta: `/root`.
5. Guarda y espera la URL.

---

## Modo administrador

Agrega `?admin` al final de la URL:

```text
https://TU_USUARIO.github.io/TU_REPO/?admin
```

La contraseña se cambia en `app.js`:

```js
const ADMIN_PASSWORD = "cambiar-esta-clave";
```

El panel permite:

- Ver total de respuestas.
- Ver promedio de calificación.
- Filtrar comentarios.
- Exportar CSV.
- Cerrar sesión.

---

## Personalización rápida

Para editar textos del programa, busca en `app.js`:

```js
const EVENT_PROGRAM = [...]
```

Para editar los links de actividades, busca:

```js
const ACTIVITY_LINKS = {...}
```

Para editar colores y estilos, revisa `styles.css`.
