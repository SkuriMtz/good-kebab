"use client";

import type { CampoPerfil, Documento, EstadoAppPersona, IdApp, PerfilNegocio } from "@/lib/nucleo-tipos";
import { APP_POR_ID } from "@/lib/conexiones/catalogo";
import { DEMO_USUARIA } from "@/lib/demo-dashboard";
import { avisarDocumentos, extensionDe, normalizarLink, perfilCompleto, type FuenteNegocio } from "./fuente";

/* =====================================================================
   "Tu negocio" en /pruebalo: el ejemplo de Estudio Luna. Vive en la
   pestaña (sessionStorage): se puede guardar el perfil, subir y borrar
   documentos, agregar links y pedir "Avísame", sin llamar a ninguna API
   ni a la IA. Al subir, el documento pasa de "Leyendo" a "Listo".
   ===================================================================== */

type EstadoDemo = { perfil: PerfilNegocio; documentos: Documento[]; apps: EstadoAppPersona[] };

const CLAVE = "atendel-demo-negocio-v2";
const DIA = 86_400_000;
/** Lo que tarda en "leerse" un documento de ejemplo. */
const LECTURA_MS = 2400;

const PERFIL_INICIAL: Partial<Record<CampoPerfil, string>> = {
  a_que_se_dedica: "Estudio Luna atiende con cita en Guadalajara. Lo que más nos piden: sesiones de una hora, de seguimiento, asesorías y revisiones.",
  servicios_y_precios: "Sesión de 1 hora: $650\nSesión de seguimiento (30 min): $400\nAsesoría (45 min): $500\nRevisión (20 min): $250",
  horarios: "Lunes a viernes de 9:00 a 19:00. Sábados de 9:00 a 14:00. Domingos cerrado.",
  ubicacion: "Calle de Ejemplo 123, local 3, Guadalajara, Jal. Hay estacionamiento en la esquina.",
  formas_de_pago: "Efectivo, tarjeta y transferencia. Para apartar la primera cita pedimos 30 % de anticipo.",
  politicas: "Puedes cambiar o cancelar tu cita sin costo hasta 24 horas antes. Con más de 15 minutos de retraso, se cambia la hora.",
};

/** En /pruebalo, Gmail, Google Calendar y Stripe están conectadas (de ejemplo); clip, en camino; lo demás, por conectar. */
const APPS_INICIALES: EstadoAppPersona[] = [
  { id: "gmail", estado: "conectada", cuenta: DEMO_USUARIA.correo },
  { id: "google_calendar", estado: "conectada", cuenta: DEMO_USUARIA.correo },
  { id: "stripe", estado: "conectada", cuenta: "Estudio Luna" },
  ...(
    [
      "google_drive",
      "google_sheets",
      "google_contacts",
      "google_business",
      "outlook",
      "outlook_calendar",
      "onedrive",
      "excel",
      "outlook_contacts",
      "whatsapp_business",
      "instagram",
      "messenger",
      "telegram",
      "slack",
      "calendly",
      "zoom",
      "notion",
      "dropbox",
      "airtable",
      "trello",
      "hubspot",
      "mercado_pago",
      "mercado_libre",
      "shopify",
      "tienda_nube",
      "cfdi",
    ] as IdApp[]
  ).map((id) => ({ id, estado: "desconectada" as const })),
  { id: "clip", estado: "en_camino", avisame: false },
];

function inicial(): EstadoDemo {
  const ahora = Date.now();
  return {
    perfil: perfilCompleto({ ...PERFIL_INICIAL, actualizado_en: new Date(ahora - 2 * DIA).toISOString() }),
    documentos: [
      { id: "demo-precios", nombre: "Lista de precios.pdf", tipo: "pdf", estado: "listo", error: null, caracteres: 3412, url: null, creado_en: new Date(ahora - 3 * DIA).toISOString() },
      { id: "demo-politicas", nombre: "Políticas de cancelación.docx", tipo: "docx", estado: "listo", error: null, caracteres: 1860, url: null, creado_en: new Date(ahora - 9 * DIA).toISOString() },
      {
        id: "demo-preguntas",
        nombre: "estudioluna.example/preguntas",
        tipo: "link",
        estado: "listo",
        error: null,
        caracteres: 2240,
        url: "https://estudioluna.example/preguntas",
        creado_en: new Date(ahora - 12 * DIA).toISOString(),
      },
    ],
    apps: APPS_INICIALES,
  };
}

let memoria: EstadoDemo | null = null;

function leer(): EstadoDemo {
  if (!memoria) {
    try {
      const t = window.sessionStorage.getItem(CLAVE);
      memoria = t ? (JSON.parse(t) as EstadoDemo) : inicial();
    } catch {
      memoria = inicial();
    }
    // Lo que se quedó "leyendo" al recargar ya terminó
    memoria = { ...memoria, documentos: memoria.documentos.map((d) => (d.estado === "procesando" ? { ...d, estado: "listo" } : d)) };
  }
  return memoria;
}

function escribir(cambio: (e: EstadoDemo) => EstadoDemo) {
  memoria = cambio(leer());
  try {
    window.sessionStorage.setItem(CLAVE, JSON.stringify(memoria));
  } catch {
    /* sin almacenamiento: se queda en memoria */
  }
  return memoria;
}

/** Una pausa corta: para que se vea el estado de cargando, como en tu cuenta real. */
const pausa = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
const nuevoId = () => `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function agregarDocumento(doc: Documento) {
  escribir((e) => ({ ...e, documentos: [doc, ...e.documentos] }));
  // "Leyendo" → "Listo"
  window.setTimeout(() => {
    escribir((e) => ({ ...e, documentos: e.documentos.map((d) => (d.id === doc.id ? { ...d, estado: "listo" } : d)) }));
    avisarDocumentos();
  }, LECTURA_MS);
  return doc;
}

export const fuenteDemo: FuenteNegocio = {
  demo: true,
  base: "/pruebalo",
  async leerPerfil() {
    await pausa(180);
    return leer().perfil;
  },
  async guardarPerfil(cambios) {
    await pausa(520);
    return escribir((e) => ({ ...e, perfil: { ...e.perfil, ...cambios, actualizado_en: new Date().toISOString() } })).perfil;
  },
  async listarDocumentos() {
    await pausa(120);
    return leer().documentos;
  },
  async subirArchivo(archivo) {
    const ext = extensionDe(archivo.name) ?? "txt";
    // TXT y MD se pueden contar aquí mismo; PDF y DOCX se leen en tu cuenta real
    const caracteres = ext === "txt" || ext === "md" ? (await archivo.text()).length : 0;
    await pausa(650);
    return agregarDocumento({ id: nuevoId(), nombre: archivo.name, tipo: ext, estado: "procesando", error: null, caracteres, url: null, creado_en: new Date().toISOString() });
  },
  async agregarLink(texto) {
    const url = new URL(normalizarLink(texto));
    await pausa(500);
    const nombre = `${url.hostname.replace(/^www\./, "")}${url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "")}`;
    return agregarDocumento({ id: nuevoId(), nombre, tipo: "link", estado: "procesando", error: null, caracteres: 0, url: url.toString(), creado_en: new Date().toISOString() });
  },
  async borrarDocumento(id) {
    await pausa(300);
    escribir((e) => ({ ...e, documentos: e.documentos.filter((d) => d.id !== id) }));
  },
  async listarApps() {
    await pausa(150);
    return leer().apps;
  },
  async avisame(app, quiere) {
    await pausa(350);
    escribir((e) => ({ ...e, apps: e.apps.map((a) => (a.id === app ? { ...a, avisame: quiere } : a)) }));
  },
  async desconectar(proveedor, app) {
    await pausa(450);
    // Como en tu cuenta real: se quita esa app; si era la última de su proveedor, se "revoca" la cuenta
    const e = escribir((s) => ({ ...s, apps: s.apps.map((a) => (a.id === app ? { id: a.id, estado: "desconectada" as const } : a)) }));
    const quedan = e.apps.filter((a) => a.estado === "conectada" && APP_POR_ID[a.id]?.proveedor === proveedor).map((a) => a.id);
    return { revocada: quedan.length === 0, quedan };
  },
  async guardarLlave(_proveedor, app) {
    // En /pruebalo no se guarda ninguna llave: el modal explica qué pasaría en tu cuenta real
    return { id: app, estado: "desconectada" };
  },
  async guardarDeDrive() {
    // En /pruebalo, Drive no está conectada: el botón lleva a Apps
    return { documentos: [], fallidos: 0 };
  },
};
