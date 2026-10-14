"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/base/Avatar";
import { BarraProgreso } from "@/components/base/BarraProgreso";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Kbd } from "@/components/base/Kbd";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import type { Plan } from "@/lib/planes";
import type { Cita, Consejo, Metrica, Novedad } from "./tipos";
import { Negritas, Tocable } from "./util";

/* =====================================================================
   COLUMNA DERECHA: tu negocio y tu plan, próximas citas, métricas,
   consejos, novedades de Atendel y ayuda. Pocas cajas: lo que no necesita
   tarjeta (novedades, ayuda) va suelto, como "Latest changes".
   ===================================================================== */

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** "Mensajes de octubre" y "Se renueva el 1 de noviembre", según la fecha de quien mira. */
export function textosDelMes(fecha: Date | null) {
  if (!fecha) return { etiqueta: "Mensajes de este mes", renueva: "Se renueva el día 1 de cada mes." };
  const mes = fecha.getMonth();
  return { etiqueta: `Mensajes de ${MESES[mes]}`, renueva: `Se renueva el 1 de ${MESES[(mes + 1) % 12]}.` };
}

/** Tu negocio, tu plan y cuánto llevas usado. El plan no se cambia desde aquí. */
export function TarjetaNegocio({
  negocio,
  giro,
  correo,
  plan,
  usados,
  fecha,
  pie,
}: {
  negocio: string;
  giro?: string;
  correo?: string;
  plan: Plan;
  usados: number;
  fecha: Date | null;
  pie?: ReactNode;
}) {
  const mes = textosDelMes(fecha);
  const quedan = Math.max(0, plan.mensajesMes - usados);
  const detalle =
    usados >= plan.mensajesMes
      ? "Llegaste al tope de tu plan este mes."
      : usados / plan.mensajesMes >= 0.8
        ? `Te quedan ${quedan.toLocaleString("es-MX")} mensajes este mes.`
        : mes.renueva;
  return (
    <section className="tb-tarjeta tb-negocio" aria-labelledby="tb-negocio">
      <div className="tb-negocio__cabeza">
        <Avatar nombre={negocio} tam={40} />
        <div className="tb-negocio__texto">
          <h2 id="tb-negocio" className="tb-negocio__nombre">
            {negocio}
          </h2>
          <p className="tb-negocio__giro">{giro ?? correo}</p>
        </div>
      </div>
      <div className="tb-negocio__plan">
        <div className="tb-negocio__plan-fila">
          <span className="tb-fuerte">{plan.nombre}</span>
          <Insignia tono="azul">{plan.nivel}</Insignia>
        </div>
        <BarraProgreso etiqueta={mes.etiqueta} valor={usados} max={plan.mensajesMes} unidad="mensajes" detalle={detalle} />
      </div>
      {pie ? <div className="tb-negocio__pie">{pie}</div> : null}
    </section>
  );
}

export function ProximasCitas({
  titulo,
  total,
  citas,
  vacio,
}: {
  titulo: string;
  total: number;
  citas: Cita[];
  vacio?: ReactNode;
}) {
  return (
    <section className="tb-tarjeta tb-citas" aria-labelledby="tb-citas">
      <div className="tb-tarjeta__cabeza">
        <h2 id="tb-citas" className="tb-tarjeta__titulo">
          Próximas citas
        </h2>
        {citas.length ? (
          <span className="tb-texto-2 cifras">
            {titulo} · {total}
          </span>
        ) : null}
      </div>
      {citas.length ? (
        <>
          <ol className="tb-agenda">
            {citas.map((c) => (
              <li key={`${c.hora}-${c.nombre}`} className="tb-agenda__cita">
                <time className="tb-agenda__hora cifras">{c.hora}</time>
                <span className="tb-agenda__texto">
                  <span className="tb-agenda__nombre">{c.nombre}</span>
                  <span className="tb-agenda__servicio">{c.servicio}</span>
                </span>
                <PuntoEstado tono={c.estado.tono} etiqueta={c.estado.texto} />
              </li>
            ))}
          </ol>
          {total > citas.length ? (
            <p className="tb-agenda__mas">
              y {total - citas.length} más · <span className="tb-texto-2">el punto dice si ya confirmaron</span>
            </p>
          ) : null}
        </>
      ) : (
        vacio
      )}
    </section>
  );
}

export function Metricas({ titulo, nota, metricas }: { titulo: string; nota?: string; metricas: Metrica[] }) {
  return (
    <section className="tb-tarjeta tb-metricas" aria-labelledby="tb-metricas">
      <div className="tb-tarjeta__cabeza">
        <h2 id="tb-metricas" className="tb-tarjeta__titulo">
          {titulo}
        </h2>
        {nota ? <span className="tb-texto-2">{nota}</span> : null}
      </div>
      <dl className="tb-metricas__rejilla">
        {metricas.map((m) => (
          <div key={m.etiqueta} className="tb-metrica">
            <dt className="tb-metrica__etiqueta">{m.etiqueta}</dt>
            <dd className="tb-metrica__valor">
              {m.valor}
              {m.cambio ? (
                <Insignia tono={m.cambio.tono} className="tb-metrica__cambio">
                  {m.cambio.texto}
                </Insignia>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Consejos({ consejos }: { consejos: Consejo[] }) {
  if (!consejos.length) return null;
  return (
    <section className="tb-tarjeta tb-consejos" aria-labelledby="tb-consejos">
      <div className="tb-tarjeta__cabeza">
        <h2 id="tb-consejos" className="tb-tarjeta__titulo">
          Para ti
        </h2>
        <Icono nombre="rayo" tam={16} className="tb-texto-2" />
      </div>
      <ul className="tb-consejos__lista">
        {consejos.map((c) => (
          <li key={c.id} className="tb-consejo">
            <p>
              <Negritas texto={c.texto} />
            </p>
            <Tocable destino={c} className="tb-enlace tb-enlace--flecha">
              {c.accion}
              <Icono nombre="flecha" tam={16} />
            </Tocable>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "Latest changes": novedades reales del producto, en una línea de puntos. */
export function Novedades({ novedades }: { novedades: Novedad[] }) {
  return (
    <section className="tb-novedades" aria-labelledby="tb-novedades">
      <h2 id="tb-novedades" className="tb-novedades__titulo">
        Novedades de Atendel
      </h2>
      <ol className="tb-novedades__lista">
        {novedades.map((n) => (
          <li key={n.titulo} className="tb-novedad">
            <span className="tb-novedad__fecha cifras">{n.fecha}</span>
            <span className="tb-novedad__titulo">{n.titulo}</span>
            <span className="tb-novedad__detalle">{n.detalle}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Ayuda({ contexto }: { contexto: ReactNode }) {
  return (
    <section className="tb-ayuda" aria-labelledby="tb-ayuda">
      <h2 id="tb-ayuda" className="tb-novedades__titulo">
        ¿Dudas?
      </h2>
      <p className="tb-ayuda__texto">{contexto}</p>
      <ul className="tb-ayuda__enlaces">
        <li>
          <Link href="/preguntas" className="tb-enlace">
            Preguntas frecuentes
          </Link>
        </li>
        <li>
          <Link href="/preguntas#seguridad" className="tb-enlace">
            Cómo cuidamos tus datos
          </Link>
        </li>
      </ul>
      <p className="tb-ayuda__atajo">
        <Kbd>/</Kbd> busca en todo el panel
      </p>
    </section>
  );
}
