"use client";

import { useCallback, useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import { Icono } from "@/components/base/Iconos";
import { Enlace } from "./Piezas";

/**
 * EL GLOBO DE NOVEDAD (como el de Claude): cuando algo es nuevo, un globito
 * junto a donde está, con su título, la etiqueta «Beta», el texto y una ✕.
 * Sale una sola vez (se guarda en este aparato) y no tapa nada: se va con la
 * ✕, al tocar su botón o al entrar a lo nuevo.
 *
 * Se pega al primer `ancla` que se vea: en compu, el elemento del menú (el
 * globo sale a su derecha); en celular, el ☰ de arriba (sale debajo). Algo
 * hasta abajo de la pantalla lo lleva encima. Si ninguna se ve, espera.
 */

type Props = {
  /** Con qué nombre se guarda que ya se vio (atendel-novedad-<clave>). */
  clave: string;
  /** Selectores CSS donde se puede pegar, en orden. */
  anclas: string[];
  titulo: string;
  texto: string;
  etiqueta?: string;
  accion?: { texto: string; href: string };
  /** Mientras sea false no sale (la entrada del panel, una ventana abierta…). */
  puede: boolean;
  /** Ya se vio lo nuevo (por ejemplo, ya estás en esa sección): no sale más. */
  visto?: boolean;
};

type Lugar = { lado: "derecha" | "arriba" | "abajo"; x: number; y: number; flecha: number };

const ANCHO = 300;
const MARGEN = 16;

function guardado(clave: string) {
  try {
    return window.localStorage.getItem(`atendel-novedad-${clave}`) === "1";
  } catch {
    return true; // sin almacenamiento: mejor no insistir
  }
}

function guardar(clave: string) {
  try {
    window.localStorage.setItem(`atendel-novedad-${clave}`, "1");
  } catch {
    /* sin almacenamiento */
  }
}

export function Novedad({ clave, anclas, titulo, texto, etiqueta = "Beta", accion, puede, visto = false }: Props) {
  const [pendiente, setPendiente] = useState(false);
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [saliendo, setSaliendo] = useState(false);
  const id = `pc-novedad-${clave}`;

  useEffect(() => {
    setPendiente(!guardado(clave));
  }, [clave]);

  const cerrar = useCallback(() => {
    guardar(clave);
    setSaliendo(true);
    window.setTimeout(() => setPendiente(false), 160);
  }, [clave]);

  // Si ya entraste a lo nuevo, cuenta como visto
  useEffect(() => {
    if (visto && pendiente) {
      guardar(clave);
      setPendiente(false);
    }
  }, [visto, pendiente, clave]);

  const medir = useCallback(() => {
    for (const sel of anclas) {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      // Escondido o fuera de la pantalla (el menú cerrado en celular): el siguiente
      if (r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > window.innerHeight || r.right <= 0 || r.left >= window.innerWidth) continue;
      const ancho = Math.min(ANCHO, window.innerWidth - MARGEN * 2);
      const centro = r.left + r.width / 2;
      const x = Math.max(MARGEN, Math.min(centro - ancho / 2, window.innerWidth - MARGEN - ancho));
      if (r.top > window.innerHeight * 0.6) {
        // Abajo de la pantalla: el globo sale encima
        setLugar({ lado: "arriba", x, y: window.innerHeight - r.top + 10, flecha: centro - x });
      } else if (r.bottom < 80) {
        // Hasta arriba (el ☰ del celular): el globo sale debajo
        setLugar({ lado: "abajo", x, y: r.bottom + 10, flecha: centro - x });
      } else {
        setLugar({ lado: "derecha", x: r.right + 12, y: Math.max(MARGEN, r.top + r.height / 2 - 28), flecha: r.top + r.height / 2 - Math.max(MARGEN, r.top + r.height / 2 - 28) });
      }
      return;
    }
    setLugar(null);
  }, [anclas]);

  const activo = pendiente && puede && !visto;
  useLayoutEffect(() => {
    if (!activo) return;
    // Un respiro antes de salir (que primero se acomode la página)
    const t = window.setTimeout(medir, 600);
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
    };
  }, [activo, medir]);

  // Esc lo cierra
  useEffect(() => {
    if (!activo || !lugar) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [activo, lugar, cerrar]);

  if (!activo || !lugar) return null;
  return (
    <div
      id={id}
      className="pc-novedad"
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${id}-t`}
      aria-describedby={`${id}-d`}
      data-lado={lugar.lado}
      data-saliendo={saliendo ? "" : undefined}
      style={
        {
          left: lugar.x,
          ...(lugar.lado === "arriba" ? { bottom: lugar.y } : { top: lugar.y }),
          "--flecha": `${lugar.flecha}px`,
        } as unknown as CSSProperties
      }
    >
      <span className="pc-novedad__flecha" aria-hidden="true" />
      <div className="pc-novedad__cabeza">
        <p id={`${id}-t`} className="pc-novedad__titulo">
          {titulo}
        </p>
        {etiqueta ? <span className="pc-novedad__etiqueta">{etiqueta}</span> : null}
        <button type="button" className="pc-icono pc-novedad__cerrar" onClick={cerrar} aria-label="Cerrar">
          <Icono nombre="cerrar" tam={16} />
        </button>
      </div>
      <p id={`${id}-d`} className="pc-novedad__texto">
        {texto}
      </p>
      {accion ? (
        <Enlace href={accion.href} className="pc-novedad__accion" onClick={cerrar}>
          {accion.texto}
          <Icono nombre="flecha" tam={14} />
        </Enlace>
      ) : null}
    </div>
  );
}
