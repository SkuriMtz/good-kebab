"use client";

import Link from "next/link";
import { useId, type ReactNode } from "react";
import { Avatar } from "@/components/base/Avatar";
import { BarraProgreso } from "@/components/base/BarraProgreso";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Kbd } from "@/components/base/Kbd";
import type { IdAgente } from "@/lib/agentes";
import type { Plan } from "@/lib/planes";
import { nombresAgentes } from "./nombres";
import { NOVEDADES } from "./novedades";
import { CabezaBloque, EnlaceMas, MarcaAgente, PilaAgentes } from "./Piezas";
import { fechaCorta, mesActualNombre, primeroDelSiguienteMes } from "./tiempo";
import type { Accion, Cita, Consejo, Metrica } from "./tipos";

/* =====================================================================
   Columna derecha: lo que en GitHub son "Últimos cambios" y "Explorar".
   Aquí: tu negocio y tu plan, la agenda de mañana, la semana en números,
   las novedades de Atendel, una recomendación y ayuda. Varía la forma a
   propósito: tarjetas solo donde hay algo que tocar; lo demás, sin caja.
   ===================================================================== */

const formato = new Intl.NumberFormat("es-MX");

/** Tu negocio + tu plan: nombre, plan, mensajes del mes (barra), tu equipo. */
export function TarjetaPlan({
  negocio,
  giro,
  plan,
  usados,
  equipo,
  ahora,
  accion,
}: {
  negocio: string;
  giro?: string;
  plan: Plan;
  usados: number;
  equipo: readonly IdAgente[];
  ahora: Date | null;
  accion?: ReactNode;
}) {
  const id = useId().replace(/:/g, "");
  const restantes = Math.max(0, plan.mensajesMes - usados);
  const mes = ahora ? mesActualNombre(ahora) : "este mes";
  return (
    <section className="dash-tarjeta dash-plan" aria-labelledby={`${id}-negocio`}>
      <div className="dash-plan__negocio">
        <Avatar nombre={negocio} tam={40} />
        <div className="dash-plan__nombres">
          <h2 id={`${id}-negocio`} className="dash-plan__nombre">
            {negocio}
          </h2>
          <p className="dash-plan__giro">{giro ?? "Tu negocio"}</p>
        </div>
      </div>
      <div className="dash-plan__fila">
        <span className="dash-plan__plan">{plan.nombre}</span>
        <Insignia tono="azul">Activo</Insignia>
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
      <p className="dash-plan__equipo">
        <PilaAgentes ids={equipo} tam={20} />
        <span>
          {equipo.length === 1 ? "1 agente" : `${equipo.length} agentes`} en tu equipo: {nombresAgentes(equipo)}
        </span>
      </p>
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

/** La semana (o el mes) en números: etiqueta, valor y contra qué se compara. Sin colores de estado. */
export function Metricas({ titulo, nota, metricas }: { titulo: string; nota?: string; metricas: Metrica[] }) {
  const id = useId().replace(/:/g, "");
  return (
    <section className="dash-bloque dash-metricas" aria-labelledby={`${id}-metricas`}>
      <CabezaBloque id={`${id}-metricas`} titulo={titulo} nivel={2} accion={nota ? <span className="dash-nota">{nota}</span> : undefined} />
      <dl className="dash-metricas__lista">
        {metricas.map((m) => (
          <div key={m.id} className="dash-metrica">
            <dt className="dash-metrica__etiqueta">{m.etiqueta}</dt>
            <dd className="dash-metrica__valor">{formato.format(m.valor)}</dd>
            {typeof m.delta === "number" ? (
              <dd className="dash-metrica__delta">
                <Icono nombre="flecha-arriba-derecha" tam={16} className={m.delta >= 0 ? "" : "dash-metrica__baja"} />
                <span className="cifras">
                  {m.delta > 0 ? "+" : m.delta < 0 ? "−" : ""}
                  {formato.format(Math.abs(m.delta))}
                </span>
                <span className="sr-only"> contra {m.periodo}</span>
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Novedades de Atendel: línea de tiempo con fechas reales (como "Últimos cambios"). */
export function Novedades({ cuantas = 4 }: { cuantas?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <section className="dash-bloque dash-novedades" aria-labelledby={`${id}-novedades`}>
      <CabezaBloque id={`${id}-novedades`} titulo="Novedades de Atendel" />
      <ol className="dash-novedades__lista">
        {NOVEDADES.slice(0, cuantas).map((n) => (
          <li key={n.id} className="dash-novedad">
            <time className="dash-novedad__fecha cifras" dateTime={n.fecha}>
              {fechaCorta(n.fecha)}
            </time>
            <p className="dash-novedad__titulo">{n.titulo}</p>
            <p className="dash-novedad__texto">{n.texto}</p>
          </li>
        ))}
      </ol>
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

/** Ayuda contextual: dónde preguntar y el atajo del buscador. */
export function Ayuda({ extra }: { extra?: (Accion & { etiqueta: string })[] }) {
  const id = useId().replace(/:/g, "");
  return (
    <section className="dash-bloque dash-ayuda" aria-labelledby={`${id}-ayuda`}>
      <CabezaBloque id={`${id}-ayuda`} titulo="¿Dudas?" />
      <ul className="dash-ayuda__lista">
        <li>
          <Link href="/preguntas" className="dash-ayuda__enlace">
            <Icono nombre="ayuda" tam={16} />
            Preguntas frecuentes
          </Link>
        </li>
        <li>
          <Link href="/preguntas#seguridad" className="dash-ayuda__enlace">
            <Icono nombre="escudo" tam={16} />
            Cómo cuidamos tus datos
          </Link>
        </li>
        {extra?.map((e) => (
          <li key={e.etiqueta}>
            <EnlaceMas accion={e}>{e.etiqueta}</EnlaceMas>
          </li>
        ))}
      </ul>
      <p className="dash-ayuda__atajo">
        Pulsa <Kbd>/</Kbd> para buscar desde cualquier parte.
      </p>
    </section>
  );
}
