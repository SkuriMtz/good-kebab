"use client";

import { useEffect, useRef } from "react";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { FormularioLista } from "@/components/FormularioLista";
import { BotonFicha } from "@/components/agentes/BotonFicha";
import { Personaje } from "@/components/agentes/Personaje";
import { Escena3D } from "@/components/escena3d/Escena3D";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";

/*
 * 1. Portada (Grupo 1 · propuesta T5): "Los cuatro te están atendiendo".
 *
 * El título con el halo es el único protagonista. Los personajes de Lola,
 * Clara, Víctor e Iris lo acompañan como las mascotas de una portada de
 * producto: dos de cada lado, a distintas alturas y tamaños (profundidad),
 * flotando sobre el horizonte de partículas (escena 3D tenue, fondo fijo).
 *
 * Su personalidad está en la MIRADA, no en adornos:
 * - Sin hacer nada, miran el título (su mirada lleva tus ojos al mensaje).
 * - Con el mouse, lo siguen; cada uno a su ritmo (Lola rápida, Clara con calma).
 * - Al escribir tu correo, los cuatro voltean a ver el formulario: te atienden.
 * - Cada personaje es un botón que abre su ficha (qué hace y en qué plan está).
 * Con movimiento reducido: quietos, mirando el título. Sin WebGL: solo el halo.
 */

type Temperamento = { seguir: number; inclina: number };
/** Cómo voltea cada uno (de componentes-pendientes/personaje-animado, sin saltos ni parpadeos). */
const ELENCO: { id: IdAgente; temple: Temperamento }[] = [
  { id: "lola", temple: { seguir: 0.16, inclina: 5 } },
  { id: "clara", temple: { seguir: 0.06, inclina: 3 } },
  { id: "victor", temple: { seguir: 0.11, inclina: 4 } },
  { id: "iris", temple: { seguir: 0.08, inclina: 2.5 } },
];

// Medidas del ojo en el dibujo de Personaje.tsx (viewBox 0 0 200 210)
const OJO_X = 100 / 200;
const OJO_Y = 106 / 210;
const MAX_X = 4.4; // cuánto puede moverse la pupila sin salirse del ojo
const MAX_Y = 5.9;
/** Lo vertical se exagera: casi todo lo que miran está de lado, y así se nota cuando bajan la vista. */
const ENFASIS_Y = 1.8;

/** Clases completas (Tailwind no descarta clases armadas, pero así se leen enteras). */
const CLASE: Record<IdAgente, string> = {
  lola: "portada__agente portada__agente--lola",
  clara: "portada__agente portada__agente--clara",
  victor: "portada__agente portada__agente--victor",
  iris: "portada__agente portada__agente--iris",
};

export function Portada() {
  const seccion = useRef<HTMLElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const formulario = useRef<HTMLDivElement>(null);
  const cuerpos = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const raiz = seccion.current;
    if (!raiz) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const estado = ELENCO.map(() => ({ x: 0, y: 0, giro: 0 }));
    const pupilas = cuerpos.current.map((c) => Array.from(c?.querySelectorAll<SVGCircleElement>("g[clip-path] circle") ?? []));

    const puntero = { x: 0, y: 0, desde: -Infinity, tipo: "mouse" as "mouse" | "toque" };
    const alMover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.type === "pointermove") return;
      puntero.x = e.clientX;
      puntero.y = e.clientY;
      puntero.desde = performance.now();
      puntero.tipo = e.pointerType === "mouse" ? "mouse" : "toque";
    };

    /** ¿A dónde miran? Formulario con foco → cursor reciente → el título. */
    const objetivo = () => {
      const activo = document.activeElement;
      if (activo instanceof HTMLElement && formulario.current?.contains(activo)) {
        const r = activo.getBoundingClientRect();
        return { x: r.left + Math.min(r.width / 2, 160), y: r.top + r.height / 2 };
      }
      const vigente = puntero.tipo === "mouse" ? 4000 : 2500;
      if (performance.now() - puntero.desde < vigente) return { x: puntero.x, y: puntero.y };
      const r = titulo.current?.getBoundingClientRect();
      return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: 0, y: 0 };
    };

    const mirar = (inmediato: boolean) => {
      const meta = objetivo();
      ELENCO.forEach(({ temple }, i) => {
        const cuerpo = cuerpos.current[i];
        if (!cuerpo) return;
        const r = cuerpo.getBoundingClientRect();
        if (!r.width) return;
        const dx = meta.x - (r.left + r.width * OJO_X);
        const dy = meta.y - (r.top + r.height * OJO_Y);
        const d = Math.hypot(dx, dy) || 1;
        const fuerza = Math.min(1, d / Math.max(120, r.width * 1.4));
        let tx = (dx / d) * fuerza;
        let ty = Math.max(-1, Math.min(1, (dy / d) * fuerza * ENFASIS_Y));
        // Dentro del ojo (elipse): nunca se sale
        const largo = Math.hypot(tx, ty);
        if (largo > 1) {
          tx /= largo;
          ty /= largo;
        }
        const e = estado[i];
        const k = inmediato ? 1 : temple.seguir;
        e.x += (tx - e.x) * k;
        e.y += (ty - e.y) * k;
        e.giro += (tx * temple.inclina - e.giro) * (inmediato ? 1 : 0.05);
        for (const p of pupilas[i]) p.style.transform = `translate(${(e.x * MAX_X).toFixed(2)}px, ${(e.y * MAX_Y).toFixed(2)}px)`;
        // El cuerpo acompaña a la mirada: se inclina y se asoma un poco hacia allá
        cuerpo.style.transform = `translate(${(e.x * 3).toFixed(2)}px, ${(e.y * 2).toFixed(2)}px) rotate(${e.giro.toFixed(2)}deg)`;
      });
    };

    mirar(true);
    if (quieto) {
      const alRedimensionar = () => mirar(true);
      window.addEventListener("resize", alRedimensionar);
      return () => window.removeEventListener("resize", alRedimensionar);
    }

    // Solo se anima mientras la portada se ve
    let raf = 0;
    let corriendo = false;
    const ciclo = () => {
      raf = requestAnimationFrame(ciclo);
      mirar(false);
    };
    const observador = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !corriendo) {
        corriendo = true;
        raf = requestAnimationFrame(ciclo);
      } else if (!e.isIntersecting) {
        corriendo = false;
        cancelAnimationFrame(raf);
      }
    });
    observador.observe(raiz);
    window.addEventListener("pointermove", alMover, { passive: true });
    window.addEventListener("pointerdown", alMover, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      observador.disconnect();
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener("pointerdown", alMover);
    };
  }, []);

  return (
    <section ref={seccion} aria-labelledby="portada-titulo" className="portada seccion--portada con-halo">
      <Escena3D tenue />
      <Halo y="40%" ancho="min(1040px, 150vw)" className="portada__halo" />

      <div className="contenedor portada__escenario">
        <div className="portada__texto">
          <Etiqueta tono="cielo" className="portada__entra">
            Para clínicas, consultorios y estéticas
          </Etiqueta>
          <h1 ref={titulo} id="portada-titulo" className="t-display portada__titulo portada__entra">
            Tu recepción, atendida mientras tú atiendes
          </h1>
          <p className="t-intro portada__intro portada__entra">
            Lola contesta tu WhatsApp y agenda citas, Clara ordena tu correo, Víctor trae de regreso a tus clientes e Iris hace el
            trabajo de oficina. Nada importante sale sin tu visto bueno.
          </p>
          <div ref={formulario} className="portada__formulario portada__entra">
            <FormularioLista centrado />
          </div>
          {/* data-fin-portada: el horizonte de partículas cae debajo de esta línea */}
          <div data-fin-portada="">
            <Etiqueta tono="tenue" className="portada__condiciones portada__entra">
              Plan Free · Gratis · Entras con tu correo, sin contraseña
            </Etiqueta>
          </div>
        </div>

        {ELENCO.map(({ id }, i) => {
          const a = AGENTE_POR_ID[id];
          return (
            <BotonFicha
              key={id}
              agente={id}
              className={CLASE[id]}
              ariaLabel={`${a.nombre}, ${a.area}: ${a.abarca}. Ver su ficha`}
            >
              <span className="portada__flota">
                <span
                  className="portada__cuerpo"
                  ref={(el) => {
                    cuerpos.current[i] = el;
                  }}
                >
                  <Personaje agente={id} className="portada__personaje" />
                </span>
              </span>
              <span className="portada__nombre" aria-hidden="true">
                {a.nombre} · {a.area}
              </span>
            </BotonFicha>
          );
        })}
      </div>
    </section>
  );
}
