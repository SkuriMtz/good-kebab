"use client";

import Link from "next/link";
import { Fragment, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import { Avatar } from "@/components/base/Avatar";
import type { IdAgente } from "@/lib/agentes";
import { EVENTO_TEMA, temaActual, type Tema } from "@/lib/tema";
import type { Destino, QuienRelevo } from "./tipos";

/** Pinta **negritas** dentro de un texto de datos (sin HTML crudo). */
export function Negritas({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
        parte.startsWith("**") && parte.endsWith("**") ? (
          <strong key={i} className="tb-fuerte">
            {parte.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{parte}</Fragment>
        ),
      )}
    </>
  );
}

const TAM_MARCA = { 20: "tb-marca--20", 24: "tb-marca--24", 28: "marca-agente--mini", 32: "tb-marca--32", 40: "marca-agente--chica", 64: "marca-agente--grande" } as const;

/** El personaje de un agente en su círculo de color (la marca del agente). */
export function MarcaAgente({
  agente,
  tam = 28,
  apagado = false,
  className = "",
}: {
  agente: IdAgente;
  tam?: keyof typeof TAM_MARCA;
  apagado?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`marca-agente ${TAM_MARCA[tam]}${apagado ? " tb-marca--apagada" : ""} ${className}`}
      style={{ "--agente": `var(--agente-${agente})` } as CSSProperties}
      aria-hidden="true"
    >
      <Personaje agente={agente} avatar />
    </span>
  );
}

/**
 * Las caras de un chat: un agente (su marca) o un grupo (dos marcas
 * encimadas en diagonal, cada una con su color, como un grupo de avatares).
 */
export function CarasAgentes({ agentes, tam = 32 }: { agentes: IdAgente[]; tam?: 28 | 32 }) {
  if (agentes.length <= 1) return agentes[0] ? <MarcaAgente agente={agentes[0]} tam={tam} /> : null;
  return (
    <span className={`tb-caras tb-caras--${tam}`} aria-hidden="true">
      {agentes.slice(0, 2).map((a) => (
        <MarcaAgente key={a} agente={a} tam={20} className="tb-caras__cara" />
      ))}
    </span>
  );
}

/** Quien hizo algo: un agente (su personaje) o tú (tus iniciales). */
export function Quien({ quien, tam = 24, nombreTu }: { quien: QuienRelevo; tam?: 20 | 24 | 28 | 32; nombreTu: string }) {
  if (quien === "tu") return <Avatar nombre={nombreTu} tam={tam} />;
  return <MarcaAgente agente={quien} tam={tam} />;
}

/** Enlace o botón según el destino (navega con next/link o hace algo aquí). */
export function Tocable({
  destino,
  className = "",
  children,
  etiqueta,
  actual,
}: {
  destino: Destino;
  className?: string;
  children: ReactNode;
  etiqueta?: string;
  actual?: boolean;
}) {
  if (destino.href) {
    return (
      <Link href={destino.href} className={className} aria-label={etiqueta} aria-current={actual ? "page" : undefined} onClick={destino.alElegir}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={className} aria-label={etiqueta} aria-current={actual ? "page" : undefined} onClick={destino.alElegir}>
      {children}
    </button>
  );
}

/** Modo actual (claro u oscuro), al día con el botón de modo. */
export function useTema() {
  const [tema, setTema] = useState<Tema>("oscuro");
  useEffect(() => {
    setTema(temaActual());
    const alCambiar = (e: Event) => setTema((e as CustomEvent<Tema>).detail);
    window.addEventListener(EVENTO_TEMA, alCambiar);
    return () => window.removeEventListener(EVENTO_TEMA, alCambiar);
  }, []);
  return tema;
}

/** Saludo según la hora de quien mira (se calcula en su navegador, no en el servidor). */
export function useSaludo() {
  const [saludo, setSaludo] = useState<{ texto: string; fecha: string } | null>(null);
  useEffect(() => {
    const ahora = new Date();
    const h = ahora.getHours();
    const texto = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
    const fecha = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long" }).format(ahora);
    setSaludo({ texto, fecha: fecha.charAt(0).toLocaleUpperCase("es-MX") + fecha.slice(1) });
  }, []);
  return saludo;
}

/** "Paulina Herrera" → "Paulina"; "ana.lopez@x.mx" → "Ana". */
export function primerNombre(nombre: string) {
  const base = nombre.includes("@") ? nombre.split("@")[0].replace(/[._-]+/g, " ") : nombre;
  const primero = base.trim().split(/\s+/)[0] ?? "";
  return primero ? primero.charAt(0).toLocaleUpperCase("es-MX") + primero.slice(1) : "";
}

/** Cabecera de un bloque del centro: título a la izquierda, algo a la derecha. */
export function CabezaBloque({ id, titulo, children }: { id: string; titulo: ReactNode; children?: ReactNode }) {
  return (
    <div className="tb-bloque__cabeza">
      <h2 id={id} className="tb-bloque__titulo">
        {titulo}
      </h2>
      {children}
    </div>
  );
}

/* ---------- Fechas del panel (hora de México, igual en servidor y navegador) ---------- */

const ZONA = "America/Mexico_City";
const fmtHora = new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hour12: false });
const fmtClaveDia = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });
const fmtDia = new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, weekday: "long", day: "numeric", month: "short" });

/** "09:41" */
export function horaDe(iso: string) {
  return fmtHora.format(new Date(iso));
}

/** "Hoy", "Ayer" o "lunes 12 oct" (con mayúscula inicial). */
export function diaDe(iso: string, ahora = new Date()) {
  const clave = fmtClaveDia.format(new Date(iso));
  if (clave === fmtClaveDia.format(ahora)) return "Hoy";
  if (clave === fmtClaveDia.format(new Date(ahora.getTime() - 86400000))) return "Ayer";
  const t = fmtDia.format(new Date(iso)).replace(".", "");
  return t.charAt(0).toLocaleUpperCase("es-MX") + t.slice(1);
}

/** Para listas: la hora si es de hoy; si no, el día. */
export function cuandoCorto(iso: string, ahora = new Date()) {
  const d = diaDe(iso, ahora);
  return d === "Hoy" ? horaDe(iso) : d;
}
