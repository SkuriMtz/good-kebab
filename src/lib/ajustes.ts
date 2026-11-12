import { AGENTE_POR_ID, IDS_AGENTES, type IdAgente } from "./agentes";

/**
 * AJUSTES DE LA CUENTA (tabla ajustes_cuenta, un jsonb por cuenta)
 *
 * Lo que se elige en la ventana de Ajustes y no tiene otra tabla. Todo lo que
 * llega del navegador pasa por `limpiarAjustes`: solo campos conocidos, con
 * valores permitidos y textos recortados. `bloqueParaAgentes` lo convierte en
 * las instrucciones que el chat (/api/chat) le da a los agentes.
 */

export const ACENTOS = ["azul", "morado", "verde", "ambar"] as const;
export type Acento = (typeof ACENTOS)[number];
export const LETRAS = ["chica", "normal", "grande"] as const;
export type Letra = (typeof LETRAS)[number];

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
  trato: "tu" | "usted";
  estilo: "cercano" | "formal" | "breve";
  emojis: boolean;
  firma: string;
  reglas: Partial<Record<IdAgente, string>>;
  zonaHoraria: string;
  acento: Acento;
  letra: Letra;
  avisos: Avisos;
  cfdi: DatosCfdi;
};

export const MAX_FIRMA = 80;
export const MAX_REGLAS = 600;

export const AJUSTES_INICIALES: AjustesCuenta = {
  trato: "tu",
  estilo: "cercano",
  emojis: false,
  firma: "",
  reglas: {},
  zonaHoraria: "America/Mexico_City",
  acento: "azul",
  letra: "normal",
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
    trato: uno(a.trato, ["tu", "usted"] as const, b.trato),
    estilo: uno(a.estilo, ["cercano", "formal", "breve"] as const, b.estilo),
    emojis: si(a.emojis, b.emojis),
    firma: texto(a.firma, MAX_FIRMA),
    reglas,
    zonaHoraria: uno(
      a.zonaHoraria,
      ZONAS_HORARIAS.map((z) => z.id),
      b.zonaHoraria,
    ),
    acento: uno(a.acento, ACENTOS, b.acento),
    letra: uno(a.letra, LETRAS, b.letra),
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
  const lineas = [
    `- Trato con sus clientes: ${a.trato === "usted" ? "de usted" : "de tú"}.`,
    `- Estilo: ${a.estilo === "formal" ? "formal y respetuoso" : a.estilo === "breve" ? "breve y directo, sin rodeos" : "cercano y cálido"}.`,
    `- Emojis en mensajes para clientes: ${a.emojis ? "sí, pocos y con medida" : "no uses emojis"}.`,
    a.firma ? `- Si escribes un mensaje para que el dueño lo mande a un cliente, fírmalo como: «${a.firma}».` : null,
    `- Zona horaria del negocio: ${zona} (${a.zonaHoraria}). Las horas que menciones van en esa zona.`,
    ...agentes.filter((id) => a.reglas[id]).map((id) => `- Reglas del dueño para ${AGENTE_POR_ID[id].nombre}: «${a.reglas[id]}»`),
  ].filter(Boolean);
  return `\n\nPREFERENCIAS DEL DUEÑO (las eligió en Ajustes; síguelas, salvo que pidan algo inseguro o que vaya contra tus reglas de solo lectura):\n${lineas.join("\n")}`;
}
