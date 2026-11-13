import { AGENTE_POR_ID, IDS_AGENTES, type IdAgente } from "./agentes";

/**
 * AJUSTES DE LA CUENTA (tabla ajustes_cuenta, un jsonb por cuenta)
 *
 * Lo que se elige en la ventana de Ajustes y no tiene otra tabla. Todo lo que
 * llega del navegador pasa por `limpiarAjustes`: solo campos conocidos, con
 * valores permitidos y textos recortados. `bloqueParaAgentes` lo convierte en
 * las instrucciones que el chat (/api/chat) le da a los agentes.
 */

export const ACENTOS = ["azul", "morado", "rosa", "rojo", "ambar", "verde", "turquesa", "grafito"] as const;
export type Acento = (typeof ACENTOS)[number];
export const LETRAS = ["chica", "normal", "grande"] as const;
export type Letra = (typeof LETRAS)[number];
/** Apariencia, como la de Claude: la letra del panel y la de las respuestas, el ancho de la conversación y el movimiento. */
export const FUENTES = ["geist", "inter", "dm-sans", "manrope", "plex", "nunito", "grotesk", "atkinson", "sistema"] as const;
export type Fuente = (typeof FUENTES)[number];
/** "sans": la misma letra de la interfaz. */
export const RESPUESTAS = ["sans", "source-serif", "newsreader", "lora", "literata", "merriweather", "fraunces", "atkinson"] as const;
export type LetraRespuestas = (typeof RESPUESTAS)[number];
/** Cómo se llama cada letra en Apariencia (y la variable con que se pinta). */
export const NOMBRE_FUENTE: Record<Fuente, string> = {
  geist: "Predeterminada · Geist",
  inter: "Inter",
  "dm-sans": "DM Sans",
  manrope: "Manrope",
  plex: "IBM Plex Sans",
  nunito: "Nunito",
  grotesk: "Space Grotesk",
  atkinson: "Atkinson Hyperlegible (más fácil de leer)",
  sistema: "La de tu equipo (sistema)",
};
export const NOMBRE_RESPUESTAS: Record<LetraRespuestas, string> = {
  sans: "La misma de la interfaz",
  "source-serif": "Source Serif",
  newsreader: "Newsreader",
  lora: "Lora",
  literata: "Literata",
  merriweather: "Merriweather",
  fraunces: "Fraunces",
  atkinson: "Atkinson Hyperlegible (más fácil de leer)",
};
export const ANCHOS = ["angosto", "normal", "ancho"] as const;
export type AnchoChat = (typeof ANCHOS)[number];
export const MOVIMIENTOS = ["sistema", "reducido"] as const;
export type Movimiento = (typeof MOVIMIENTOS)[number];
/** El espacio entre renglones de las respuestas. */
export const INTERLINEADOS = ["compacto", "normal", "amplio"] as const;
export type Interlineado = (typeof INTERLINEADOS)[number];
/** Qué tan juntas van las cosas: renglones del menú y mensajes. */
export const DENSIDADES = ["compacta", "normal", "espaciosa"] as const;
export type Densidad = (typeof DENSIDADES)[number];
export const CONTRASTES = ["normal", "alto"] as const;
export type Contraste = (typeof CONTRASTES)[number];
export const ENLACES = ["normal", "subrayados"] as const;
export type Enlaces = (typeof ENLACES)[number];
export const HORAS = ["mostrar", "ocultar"] as const;
export type Horas = (typeof HORAS)[number];

/**
 * El idioma de todo: el panel (TraduccionPanel lo traduce con /api/traducir)
 * y las respuestas de tus agentes (también lo que dejan listo para tus
 * clientes). `es`: cómo se le dice al agente en sus instrucciones.
 */
export const IDIOMAS = [
  { id: "es-MX", nombre: "Español (México)", es: "español de México" },
  { id: "es-ES", nombre: "Español (España)", es: "español de España" },
  { id: "es-419", nombre: "Español (Latinoamérica)", es: "español neutro de Latinoamérica" },
  { id: "en-US", nombre: "English (US)", es: "inglés de Estados Unidos" },
  { id: "en-GB", nombre: "English (UK)", es: "inglés británico" },
  { id: "pt-BR", nombre: "Português (Brasil)", es: "portugués de Brasil" },
  { id: "pt-PT", nombre: "Português (Portugal)", es: "portugués de Portugal" },
  { id: "fr-FR", nombre: "Français", es: "francés" },
  { id: "fr-CA", nombre: "Français (Canada)", es: "francés de Canadá" },
  { id: "de-DE", nombre: "Deutsch", es: "alemán" },
  { id: "it-IT", nombre: "Italiano", es: "italiano" },
  { id: "nl-NL", nombre: "Nederlands", es: "neerlandés" },
  { id: "ca-ES", nombre: "Català", es: "catalán" },
  { id: "eu-ES", nombre: "Euskara", es: "euskera" },
  { id: "gl-ES", nombre: "Galego", es: "gallego" },
  { id: "pl-PL", nombre: "Polski", es: "polaco" },
  { id: "cs-CZ", nombre: "Čeština", es: "checo" },
  { id: "sk-SK", nombre: "Slovenčina", es: "eslovaco" },
  { id: "hu-HU", nombre: "Magyar", es: "húngaro" },
  { id: "ro-RO", nombre: "Română", es: "rumano" },
  { id: "bg-BG", nombre: "Български", es: "búlgaro" },
  { id: "hr-HR", nombre: "Hrvatski", es: "croata" },
  { id: "sr-RS", nombre: "Srpski", es: "serbio" },
  { id: "sl-SI", nombre: "Slovenščina", es: "esloveno" },
  { id: "el-GR", nombre: "Ελληνικά", es: "griego" },
  { id: "sv-SE", nombre: "Svenska", es: "sueco" },
  { id: "nb-NO", nombre: "Norsk", es: "noruego" },
  { id: "da-DK", nombre: "Dansk", es: "danés" },
  { id: "fi-FI", nombre: "Suomi", es: "finés" },
  { id: "is-IS", nombre: "Íslenska", es: "islandés" },
  { id: "et-EE", nombre: "Eesti", es: "estonio" },
  { id: "lv-LV", nombre: "Latviešu", es: "letón" },
  { id: "lt-LT", nombre: "Lietuvių", es: "lituano" },
  { id: "uk-UA", nombre: "Українська", es: "ucraniano" },
  { id: "ru-RU", nombre: "Русский", es: "ruso" },
  { id: "tr-TR", nombre: "Türkçe", es: "turco" },
  { id: "ar", nombre: "العربية", es: "árabe" },
  { id: "he-IL", nombre: "עברית", es: "hebreo" },
  { id: "fa-IR", nombre: "فارسی", es: "persa" },
  { id: "hi-IN", nombre: "हिन्दी", es: "hindi" },
  { id: "bn-BD", nombre: "বাংলা", es: "bengalí" },
  { id: "ur-PK", nombre: "اردو", es: "urdu" },
  { id: "ta-IN", nombre: "தமிழ்", es: "tamil" },
  { id: "id-ID", nombre: "Bahasa Indonesia", es: "indonesio" },
  { id: "ms-MY", nombre: "Bahasa Melayu", es: "malayo" },
  { id: "fil-PH", nombre: "Filipino", es: "filipino" },
  { id: "vi-VN", nombre: "Tiếng Việt", es: "vietnamita" },
  { id: "th-TH", nombre: "ไทย", es: "tailandés" },
  { id: "zh-CN", nombre: "中文（简体）", es: "chino simplificado" },
  { id: "zh-TW", nombre: "中文（繁體）", es: "chino tradicional" },
  { id: "ja-JP", nombre: "日本語", es: "japonés" },
  { id: "ko-KR", nombre: "한국어", es: "coreano" },
  { id: "sw-KE", nombre: "Kiswahili", es: "suajili" },
  { id: "af-ZA", nombre: "Afrikaans", es: "afrikáans" },
  { id: "gn-PY", nombre: "Avañe'ẽ (guaraní)", es: "guaraní" },
  { id: "nah-MX", nombre: "Náhuatl", es: "náhuatl" },
  { id: "yua-MX", nombre: "Maaya t'aan (maya)", es: "maya yucateco" },
] as const;
export type IdIdioma = (typeof IDIOMAS)[number]["id"];

export const ZONAS_HORARIAS = [
  { id: "America/Mexico_City", nombre: "Centro (CDMX, Guadalajara, Monterrey)" },
  { id: "America/Cancun", nombre: "Sureste (Quintana Roo)" },
  { id: "America/Mazatlan", nombre: "Pacífico (Sinaloa, Nayarit, BCS)" },
  { id: "America/Hermosillo", nombre: "Sonora" },
  { id: "America/Tijuana", nombre: "Noroeste (Baja California)" },
] as const;

/** Catálogo c_RegimenFiscal del SAT (los más comunes en un negocio chico). */
export const REGIMENES_FISCALES = [
  { id: "626", nombre: "626 · Régimen Simplificado de Confianza" },
  { id: "612", nombre: "612 · Personas Físicas con Actividades Empresariales y Profesionales" },
  { id: "625", nombre: "625 · Actividades Empresariales por Plataformas Tecnológicas" },
  { id: "606", nombre: "606 · Arrendamiento" },
  { id: "601", nombre: "601 · General de Ley Personas Morales" },
  { id: "603", nombre: "603 · Personas Morales con Fines no Lucrativos" },
  { id: "616", nombre: "616 · Sin obligaciones fiscales" },
] as const;

/** Catálogo c_UsoCFDI del SAT (los que aplican a una suscripción). */
export const USOS_CFDI = [
  { id: "G03", nombre: "G03 · Gastos en general" },
  { id: "S01", nombre: "S01 · Sin efectos fiscales" },
] as const;

export type Avisos = {
  pendientes: boolean;
  citas: boolean;
  urgentes: boolean;
  resumen: boolean;
  correo: boolean;
  silencio: boolean;
  desde: string;
  hasta: string;
};

export type DatosCfdi = { rfc: string; razonSocial: string; regimen: string; codigoPostal: string; uso: string; correo: string };

export type AjustesCuenta = {
  /** Cómo quiere que le escriban a sus clientes, con sus palabras (como las instrucciones de una IA). */
  instrucciones: string;
  firma: string;
  reglas: Partial<Record<IdAgente, string>>;
  zonaHoraria: string;
  acento: Acento;
  letra: Letra;
  fuente: Fuente;
  respuestas: LetraRespuestas;
  ancho: AnchoChat;
  movimiento: Movimiento;
  idioma: IdIdioma;
  interlineado: Interlineado;
  densidad: Densidad;
  contraste: Contraste;
  enlaces: Enlaces;
  horas: Horas;
  avisos: Avisos;
  cfdi: DatosCfdi;
};

/** Lo de Apariencia que se ve en todo el panel en cuanto cambia. */
export const CLAVES_APARIENCIA = ["acento", "letra", "fuente", "respuestas", "ancho", "movimiento", "idioma", "interlineado", "densidad", "contraste", "enlaces", "horas"] as const;
export type Apariencia = Pick<AjustesCuenta, (typeof CLAVES_APARIENCIA)[number]>;
/** Solo lo de Apariencia, de unos ajustes. */
export const aparienciaDe = (a: AjustesCuenta): Apariencia => Object.fromEntries(CLAVES_APARIENCIA.map((k) => [k, a[k]])) as Apariencia;

export const MAX_INSTRUCCIONES = 1500;
export const MAX_FIRMA = 80;
export const MAX_REGLAS = 600;

export const AJUSTES_INICIALES: AjustesCuenta = {
  instrucciones: "",
  firma: "",
  reglas: {},
  zonaHoraria: "America/Mexico_City",
  acento: "azul",
  letra: "normal",
  fuente: "geist",
  respuestas: "sans",
  ancho: "normal",
  movimiento: "sistema",
  idioma: "es-MX",
  interlineado: "normal",
  densidad: "normal",
  contraste: "normal",
  enlaces: "normal",
  horas: "mostrar",
  avisos: { pendientes: true, citas: true, urgentes: true, resumen: false, correo: false, silencio: false, desde: "21:00", hasta: "08:00" },
  cfdi: { rfc: "", razonSocial: "", regimen: "", codigoPostal: "", uso: "G03", correo: "" },
};

const texto = (v: unknown, max: number) =>
  typeof v === "string"
    ? v
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
        .trim()
        .slice(0, max)
    : "";
const uno = <T extends string>(v: unknown, permitidos: readonly T[], si: T): T => (typeof v === "string" && (permitidos as readonly string[]).includes(v) ? (v as T) : si);
const si = (v: unknown, base: boolean) => (typeof v === "boolean" ? v : base);
const hora = (v: unknown, base: string) => (typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : base);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** Lo que llega (del navegador o de la tabla) → ajustes válidos, con lo de fábrica en lo que falte. */
export function limpiarAjustes(entrada: unknown): AjustesCuenta {
  const a = obj(entrada);
  const b = AJUSTES_INICIALES;
  const av = obj(a.avisos);
  const cf = obj(a.cfdi);
  const re = obj(a.reglas);
  const reglas: Partial<Record<IdAgente, string>> = {};
  for (const id of IDS_AGENTES) {
    const r = texto(re[id], MAX_REGLAS);
    if (r) reglas[id] = r;
  }
  return {
    instrucciones: texto(a.instrucciones, MAX_INSTRUCCIONES),
    firma: texto(a.firma, MAX_FIRMA),
    reglas,
    zonaHoraria: uno(
      a.zonaHoraria,
      ZONAS_HORARIAS.map((z) => z.id),
      b.zonaHoraria,
    ),
    acento: uno(a.acento, ACENTOS, b.acento),
    letra: uno(a.letra, LETRAS, b.letra),
    fuente: uno(a.fuente, FUENTES, b.fuente),
    // "serif" era la única serif antes de que hubiera varias
    respuestas: uno(a.respuestas === "serif" ? "source-serif" : a.respuestas, RESPUESTAS, b.respuestas),
    ancho: uno(a.ancho, ANCHOS, b.ancho),
    movimiento: uno(a.movimiento, MOVIMIENTOS, b.movimiento),
    interlineado: uno(a.interlineado, INTERLINEADOS, b.interlineado),
    densidad: uno(a.densidad, DENSIDADES, b.densidad),
    contraste: uno(a.contraste, CONTRASTES, b.contraste),
    enlaces: uno(a.enlaces, ENLACES, b.enlaces),
    horas: uno(a.horas, HORAS, b.horas),
    idioma: uno(
      a.idioma,
      IDIOMAS.map((i) => i.id),
      b.idioma,
    ),
    avisos: {
      pendientes: si(av.pendientes, b.avisos.pendientes),
      citas: si(av.citas, b.avisos.citas),
      urgentes: si(av.urgentes, b.avisos.urgentes),
      resumen: si(av.resumen, b.avisos.resumen),
      correo: si(av.correo, b.avisos.correo),
      silencio: si(av.silencio, b.avisos.silencio),
      desde: hora(av.desde, b.avisos.desde),
      hasta: hora(av.hasta, b.avisos.hasta),
    },
    cfdi: {
      rfc: texto(cf.rfc, 13)
        .toUpperCase()
        .replace(/[^A-ZÑ&0-9]/g, ""),
      razonSocial: texto(cf.razonSocial, 254),
      regimen: uno(
        cf.regimen,
        REGIMENES_FISCALES.map((r) => r.id),
        "" as string,
      ),
      codigoPostal: texto(cf.codigoPostal, 5).replace(/\D/g, ""),
      uso: uno(
        cf.uso,
        USOS_CFDI.map((u) => u.id),
        b.cfdi.uso,
      ),
      correo: texto(cf.correo, 254),
    },
  };
}

/** RFC de persona física (13) o moral (12), con el formato del SAT. */
export const rfcValido = (rfc: string) => /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc);

/** Las preferencias de la cuenta, como instrucciones para los agentes de esta conversación. */
export function bloqueParaAgentes(a: AjustesCuenta, agentes: readonly IdAgente[]): string {
  const zona = ZONAS_HORARIAS.find((z) => z.id === a.zonaHoraria)?.nombre ?? "Centro";
  const idioma = IDIOMAS.find((i) => i.id === a.idioma);
  const lineas = [
    idioma && idioma.id !== "es-MX"
      ? `- Idioma: contesta SIEMPRE en ${idioma.es} (${idioma.nombre}), también los mensajes que dejes listos para sus clientes, aunque estas instrucciones estén en español. Si el dueño te escribe en otro idioma, contéstale en ${idioma.es} de todos modos, salvo que te pida cambiar.`
      : null,
    a.instrucciones ? `- Cómo escribirles a sus clientes (con sus palabras): «${a.instrucciones}»` : null,
    a.firma ? `- Si escribes un mensaje para que el dueño lo mande a un cliente, fírmalo como: «${a.firma}».` : null,
    `- Zona horaria del negocio: ${zona} (${a.zonaHoraria}). Las horas que menciones van en esa zona.`,
    ...agentes.filter((id) => a.reglas[id]).map((id) => `- Reglas del dueño para ${AGENTE_POR_ID[id].nombre}: «${a.reglas[id]}»`),
  ].filter(Boolean);
  return `\n\nPREFERENCIAS DEL DUEÑO (las eligió en Ajustes; síguelas, salvo que pidan algo inseguro o que vaya contra tus reglas de solo lectura):\n${lineas.join("\n")}`;
}
