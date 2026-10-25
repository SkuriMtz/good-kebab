import Link from "next/link";
import type { ReactNode } from "react";
import { Acordeon } from "./base/Acordeon";
import { PREGUNTAS } from "@/lib/contenido";
import { PLAN_POR_ID } from "@/lib/planes";

export type Pregunta = { p: string; r: string };

/** Preguntas frecuentes en el acordeón de la base: se abre una a la vez. */
export function Preguntas({
  preguntas,
  abiertaInicial = 0,
  nivelTitulo = 3,
}: {
  preguntas: Pregunta[];
  /** Índice de la pregunta que empieza abierta (null: todas cerradas). */
  abiertaInicial?: number | null;
  nivelTitulo?: 2 | 3 | 4;
}) {
  return (
    <Acordeon
      className="faq"
      unoALaVez
      nivelTitulo={nivelTitulo}
      abiertos={abiertaInicial !== null && preguntas[abiertaInicial] ? [String(abiertaInicial)] : []}
      items={preguntas.map((q) => ({ titulo: q.p, contenido: <p>{q.r}</p> }))}
    />
  );
}

/* ---------------------------------------------------------------------
   Preguntas sobre planes (para /precios y /preguntas). Todo sale de lo que
   ya hace la app: src/lib/planes.ts (precios, mensajes, agentes), el chat
   (avisa al llegar al límite del mes; el conteo es por mes) y
   /panel/agentes (con Max eliges tu equipo). El plan no lo cambia la
   persona desde su cuenta.
   --------------------------------------------------------------------- */
const free = PLAN_POR_ID.free;
const one = PLAN_POR_ID.one;
const max = PLAN_POR_ID.max;
const n = (x: number) => x.toLocaleString("es-MX");

export const PREGUNTAS_PLANES: Pregunta[] = [
  {
    p: "¿Cuánto cuesta?",
    r: `${free.nombre} es gratis. Los precios de ${one.nombre} y ${max.nombre} todavía no se publican: déjanos tu correo en la lista de espera y te avisamos cuando abran.`,
  },
  {
    p: "¿Necesito tarjeta para empezar con Free?",
    r: "No. Entras con tu correo, sin contraseña, y empiezas a trabajar con Clara, tu agente de correo.",
  },
  {
    p: "¿Qué pasa si llego al límite de mensajes?",
    r: `El chat te avisa que llegaste a los mensajes del mes (${n(free.mensajesMes)} en Free, ${n(one.mensajesMes)} en One y ${n(max.mensajesMes)} en Max) y deja de enviar hasta el mes siguiente, cuando el conteo empieza de nuevo.`,
  },
  {
    p: "¿Puedo cambiar de plan desde mi cuenta?",
    r: "No. El plan no se cambia desde tu panel: One y Max abren por etapas. Anótate en la lista de espera y te escribimos cuando abramos tu lugar.",
  },
  {
    p: "Con Max, ¿cómo elijo a mi equipo?",
    r: "En tu panel, en Mis agentes, decides quién está en tu equipo: Lola, Clara, Víctor e Iris.",
  },
];

/* ---------------------------------------------------------------------
   Temas: agrupan las preguntas para la vista de dos columnas (temas a la
   izquierda, preguntas a la derecha). Se arman con las PREGUNTAS de
   src/lib/contenido.ts sin cambiar su texto.
   --------------------------------------------------------------------- */
export type Tema = { id: string; nombre: string; preguntas: Pregunta[] };

const buscar = (inicio: string) => PREGUNTAS.filter((q) => q.p.startsWith(inicio));

const EMPEZAR = [...buscar("¿Necesito saber"), ...buscar("¿Qué funciona hoy")];
const CLIENTES = [...buscar("¿Mis clientes"), ...buscar("¿Y si se equivoca")];
const DATOS = buscar("¿Qué pasa con los datos");
const PLANES_BASE = buscar("¿Qué cambia entre");
// Lo que no haya quedado en un tema (si alguien agrega preguntas) va al final
const SUELTAS = PREGUNTAS.filter((q) => ![...EMPEZAR, ...CLIENTES, ...DATOS, ...PLANES_BASE].includes(q));

/** Temas del inicio: solo PREGUNTAS. */
export const TEMAS_INICIO: Tema[] = [
  { id: "faq-empezar", nombre: "Para empezar", preguntas: EMPEZAR },
  { id: "faq-planes", nombre: "Planes", preguntas: PLANES_BASE },
  { id: "faq-clientes", nombre: "Con tus clientes", preguntas: CLIENTES },
  { id: "faq-datos", nombre: "Tus datos", preguntas: [...DATOS, ...SUELTAS] },
].filter((t) => t.preguntas.length > 0);

/** Temas de /preguntas: todas, con las de planes completas. */
export const TEMAS_TODAS: Tema[] = [
  { id: "empezar", nombre: "Para empezar", preguntas: EMPEZAR },
  { id: "planes", nombre: "Planes y precios", preguntas: [...PLANES_BASE, ...PREGUNTAS_PLANES] },
  { id: "clientes", nombre: "Con tus clientes", preguntas: CLIENTES },
  { id: "datos", nombre: "Tus datos", preguntas: [...DATOS, ...SUELTAS] },
].filter((t) => t.preguntas.length > 0);

/**
 * Un grupo de preguntas con su rótulo en Mono (destino de cada enlace del índice).
 * `nivel`: el rótulo es h3 dentro de una sección con h2 (inicio) y h2 en una
 * página cuyo único título mayor es el h1 (/preguntas). Las preguntas van un
 * nivel abajo, así los títulos nunca se saltan un nivel.
 */
export function GrupoPreguntas({
  tema,
  abiertaInicial = null,
  pie,
  nivel = 3,
}: {
  tema: Tema;
  abiertaInicial?: number | null;
  pie?: ReactNode;
  nivel?: 2 | 3;
}) {
  const idTitulo = `${tema.id}-titulo`;
  const Rotulo = nivel === 2 ? "h2" : "h3";
  return (
    <section id={tema.id} aria-labelledby={idTitulo} className="faq-grupo">
      <Rotulo id={idTitulo} className="faq-grupo__titulo etiqueta">
        {tema.nombre}
        <span className="etiqueta--tenue" aria-hidden="true">
          {String(tema.preguntas.length).padStart(2, "0")}
        </span>
      </Rotulo>
      <Preguntas preguntas={tema.preguntas} abiertaInicial={abiertaInicial} nivelTitulo={nivel === 2 ? 3 : 4} />
      {pie}
    </section>
  );
}

/** "¿No está tu pregunta? Escríbenos" (a /contacto). */
export function NoEstaTuPregunta({ className = "" }: { className?: string }) {
  return (
    <p className={`t-chico ${className}`}>
      ¿No está tu pregunta?{" "}
      <Link href="/contacto" className="enlace">
        Escríbenos
      </Link>
    </p>
  );
}
