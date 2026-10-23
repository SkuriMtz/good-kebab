"use client";

import { useId, type ReactNode } from "react";
import { BarraProgreso } from "@/components/base/BarraProgreso";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import type { Plan } from "@/lib/planes";
import { MarcaAgente } from "./Piezas";
import { mesActualNombre, primeroDelSiguienteMes } from "./tiempo";
import type { Cita, Consejo } from "./tipos";

/* =====================================================================
   Columna derecha, corta a propósito (2 o 3 bloques): tu plan y su uso,
   las citas que vienen y, si hace falta, un solo consejo.
   ===================================================================== */

const formato = new Intl.NumberFormat("es-MX");

/** Tu plan: cuál es y cuántos mensajes llevas este mes (la barra). Sin botón para cambiarlo. */
export function TarjetaPlan({ negocio, plan, usados, ahora, accion }: { negocio: string; plan: Plan; usados: number; ahora: Date | null; accion?: ReactNode }) {
  const id = useId().replace(/:/g, "");
  const restantes = Math.max(0, plan.mensajesMes - usados);
  const mes = ahora ? mesActualNombre(ahora) : "este mes";
  return (
    <section className="dash-tarjeta dash-plan" aria-labelledby={`${id}-plan`}>
      <div className="dash-tarjeta__cabeza">
        <h2 id={`${id}-plan`} className="dash-tarjeta__titulo">
          {plan.nombre}
        </h2>
        <span className="dash-tarjeta__resumen">{negocio}</span>
      </div>
      <BarraProgreso
        etiqueta={ahora ? `Mensajes de ${mes}` : "Mensajes del mes"}
        valor={usados}
        max={plan.mensajesMes}
        unidad="mensajes"
        detalle={
          usados >= plan.mensajesMes
            ? "Llegaste al tope de tu plan este mes."
            : `Te quedan ${formato.format(restantes)}.${ahora ? ` Se renueva el ${primeroDelSiguienteMes(ahora)}.` : ""}`
        }
      />
      {accion ? <div className="dash-plan__pie">{accion}</div> : null}
    </section>
  );
}

/** La agenda que viene: hora, paciente, servicio y si confirmó. */
export function ProximasCitas({ titulo, resumen, citas, vacio, pie }: { titulo: string; resumen?: string; citas: Cita[]; vacio?: ReactNode; pie?: ReactNode }) {
  const id = useId().replace(/:/g, "");
  return (
    <section className="dash-tarjeta dash-citas" aria-labelledby={`${id}-citas`}>
      <div className="dash-tarjeta__cabeza">
        <h2 id={`${id}-citas`} className="dash-tarjeta__titulo">
          {titulo}
        </h2>
        {resumen ? <span className="dash-tarjeta__resumen cifras">{resumen}</span> : null}
      </div>
      {citas.length ? (
        <ul className="dash-citas__lista">
          {citas.map((c) => (
            <li key={c.id} className="dash-cita">
              <span className="dash-cita__hora cifras">{c.hora}</span>
              <span className="dash-cita__texto">
                <span className="dash-cita__paciente">{c.paciente}</span>
                <span className="dash-cita__servicio">{c.servicio}</span>
              </span>
              <Insignia tono={c.estado.tono} conPunto>
                {c.estado.texto}
              </Insignia>
            </li>
          ))}
        </ul>
      ) : (
        vacio
      )}
      {pie ? <div className="dash-tarjeta__pie">{pie}</div> : null}
    </section>
  );
}

/** Recomendaciones: cosas concretas que puedes probar hoy, cada una con su botón. */
export function Consejos({ consejos, titulo = "Te puede servir" }: { consejos: Consejo[]; titulo?: string }) {
  const id = useId().replace(/:/g, "");
  if (!consejos.length) return null;
  return (
    <section className="dash-tarjeta dash-consejos" aria-labelledby={`${id}-consejos`}>
      <div className="dash-tarjeta__cabeza">
        <h2 id={`${id}-consejos`} className="dash-tarjeta__titulo">
          {titulo}
        </h2>
      </div>
      <ul>
        {consejos.map((c) => (
          <li key={c.id} className="dash-consejo">
            <div className="dash-consejo__cabeza">
              {c.agente ? <MarcaAgente id={c.agente} tam={24} /> : <Icono nombre="rayo" tam={16} />}
              <p className="dash-consejo__titulo">{c.titulo}</p>
            </div>
            <p className="dash-consejo__texto">{c.texto}</p>
            {c.href ? (
              <Boton variante="sutil" tam="compacto" href={c.href}>
                {c.etiquetaAccion}
              </Boton>
            ) : c.alElegir ? (
              <Boton variante="sutil" tam="compacto" onClick={c.alElegir}>
                {c.etiquetaAccion}
              </Boton>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
