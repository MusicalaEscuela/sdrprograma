/**
 * Configuración de Firebase para "Salvémoslos del Reggaetón 2026" — Musicala
 *
 * Reemplaza los valores placeholder con los de TU proyecto de Firebase.
 * Cómo obtenerlos:
 *   1. Entra a https://console.firebase.google.com
 *   2. Crea un proyecto (o usa uno existente)
 *   3. Agrega una "App web" (icono </>)
 *   4. Copia el objeto firebaseConfig que te muestra y pégalo aquí.
 *
 * NOTA DE SEGURIDAD:
 * Estas claves son públicas por diseño (Firebase las expone en cliente).
 * La seguridad real vive en las REGLAS de Firestore. Ver README.md.
 */

export const firebaseConfig = {
  apiKey:            "TU_API_KEY",
  authDomain:        "TU_PROJECT.firebaseapp.com",
  projectId:         "TU_PROJECT_ID",
  storageBucket:     "TU_PROJECT.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId:             "TU_APP_ID"
};

/** Nombre de la colección donde se guardan los comentarios del evento. */
export const FEEDBACK_COLLECTION = "feedback_salvemoslos_2026";

/** Nombre del evento (se guarda en cada documento para futuras consultas cruzadas). */
export const EVENT_NAME = "Salvémoslos del Reggaetón 2026";
