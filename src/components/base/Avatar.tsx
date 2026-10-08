"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { PuntoEstado, type TonoEstado } from "./PuntoEstado";

/**
 * Avatar redondo (estilo en globals.css, ".avatar").
 * - Con `src`: la foto (si no carga, quedan las iniciales).
 * - Sin `src`: las iniciales del nombre en gris sobre --c-elevado.
 * - Con `children`: lo que pases adentro (el personaje de un agente:
 *   <Avatar nombre="Lola"><Personaje agente="lola" avatar /></Avatar>).
 * Tamaños de token: 20 · 24 · 28 · 32 · 40 · 64 (por defecto 32).
 * `estado`: punto de estado en la esquina de abajo, con anillo del color
 * del fondo (cámbialo con `anillo`, ej. "var(--c-superficie)" sobre tarjetas).
 *
 * Accesibilidad: junto al nombre escrito es decorativo (por defecto,
 * aria-hidden). Si va solo, pasa `etiqueta` y se anuncia como imagen
 * (el estado se agrega a la lectura: "Ana López, activa").
 */

export type TamAvatar = 20 | 24 | 28 | 32 | 40 | 64;

// Clases completas para que Tailwind no las descarte al compilar
const TAM: Record<TamAvatar, string> = {
  20: "avatar--20",
  24: "avatar--24",
  28: "avatar--28",
  32: "avatar--32",
  40: "avatar--40",
  64: "avatar--64",
};

/** "Ana Sofía López" → "AL"; "Clínica Luna" → "CL"; "ana@x.mx" → "A". */
export function iniciales(nombre: string) {
  const limpio = nombre.split("@")[0].replace(/[._-]+/g, " ").trim();
  const palabras = limpio.split(/\s+/).filter(Boolean);
  if (!palabras.length) return "?";
  const primera = palabras[0][0] ?? "";
  const ultima = palabras.length > 1 ? palabras[palabras.length - 1][0] ?? "" : "";
  return (primera + ultima).toLocaleUpperCase("es-MX");
}

export function Avatar({
  nombre,
  src,
  tam = 32,
  estado,
  etiquetaEstado,
  etiqueta,
  anillo,
  className = "",
  children,
}: {
  /** Nombre de la persona o del negocio (para las iniciales y la lectura). */
  nombre: string;
  src?: string | null;
  tam?: TamAvatar;
  estado?: TonoEstado;
  /** Qué significa el punto ("activa", "ausente"). */
  etiquetaEstado?: string;
  /** Si el avatar va solo, cómo se lee (ej. "Ana López"). Sin esto, es decorativo. */
  etiqueta?: string;
  /** Color del anillo del punto de estado (el fondo donde está el avatar). */
  anillo?: string;
  className?: string;
  children?: ReactNode;
}) {
  const [fallo, setFallo] = useState(false);
  useEffect(() => setFallo(false), [src]);
  const conFoto = Boolean(src) && !fallo && !children;
  const lectura = etiqueta ? (etiquetaEstado ? `${etiqueta}, ${etiquetaEstado}` : etiqueta) : undefined;
  const estilo = anillo ? ({ "--anillo": anillo } as CSSProperties) : undefined;

  return (
    <span
      className={`avatar ${TAM[tam]} ${className}`}
      role={lectura ? "img" : undefined}
      aria-label={lectura}
      aria-hidden={lectura ? undefined : true}
      style={estilo}
    >
      {children ? (
        <span className="avatar__contenido">{children}</span>
      ) : conFoto ? (
        // Fotos de perfil de servicios externos (Google, Supabase): <img> simple, sin optimizar
        // eslint-disable-next-line @next/next/no-img-element
        <img className="avatar__imagen" src={src ?? undefined} alt="" width={tam} height={tam} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFallo(true)} />
      ) : (
        iniciales(nombre)
      )}
      {estado ? <PuntoEstado tono={estado} sobre grande={tam >= 40} className="avatar__estado" /> : null}
    </span>
  );
}
