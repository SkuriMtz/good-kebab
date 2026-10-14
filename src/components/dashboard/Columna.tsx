"use client";

import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/base/Avatar";
import { BarraProgreso } from "@/components/base/BarraProgreso";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Kbd } from "@/components/base/Kbd";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { Destinable } from "./Navegacion";
import type { Cita, DiaSemana, Destino, ItemParaTi } from "./tipos";

/**
 * La columna derecha: casi sin cajas (como la columna de novedades del
 * dashboard de GitHub). Solo el negocio va en una tarjeta pequeña; lo demás
 * son secciones separadas por un filo de 1px y aire.
 */

export function Columna({ children }: { children: ReactNode }) {
  return (
    <aside className="dash-columna" aria-label="Tu negocio y tus pendientes">
      {children}
    </aside>
  );
}

function Seccion({ id, titulo, extra, children }: { id: string; titulo: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="dash-columna__seccion" aria-labelledby={id}>
      <div className="dash-columna__cabeza">
        <h2 id={id} className="dash-columna__titulo">
          {titulo}
        </h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

/* ---------- El negocio y el uso del plan ---------- */

export function TarjetaNegocio({
  nombre,
  giro,
  plan,
  usados,
  limite,
  mes,
  renueva,
  enlace,
}: {
  nombre: string;
  giro?: string;
  plan: string;
  usados: number;
  limite: number;
  mes: string;
  renueva: string;
  enlace?: { etiqueta: string; destino: Destino };
}) {
  const restan = Math.max(0, limite - usados);
  return (
    <section className="dash-negocio" aria-labelledby="dash-negocio">
      <div className="dash-negocio__cabeza">
        <Avatar nombre={nombre} tam={40} />
        <div className="dash-negocio__nombre">
          <h2 id="dash-negocio" className="dash-negocio__titulo">
            {nombre}
          </h2>
          {giro ? <p className="dash-negocio__giro">{giro}</p> : null}
        </div>
        <Insignia tono="azul">{plan}</Insignia>
      </div>
      <BarraProgreso
        etiqueta={`Mensajes de ${mes}`}
        valor={usados}
        max={limite}
        unidad="mensajes"
        detalle={restan > 0 ? `Te quedan ${restan.toLocaleString("es-MX")}. ${renueva}` : `Llegaste al tope de tu plan. ${renueva}`}
      />
      {enlace ? (
        <Destinable destino={enlace.destino} className="dash-cabeza__enlace dash-negocio__enlace">
          {enlace.etiqueta}
          <Icono nombre="chevron-derecha" tam={16} />
        </Destinable>
      ) : null}
    </section>
  );
}

/* ---------- Próximas citas ---------- */

export function ProximasCitas({ citas, resumen, vacio }: { citas: Cita[]; resumen?: string; vacio: ReactNode }) {
  return (
    <Seccion id="dash-citas" titulo="Próximas citas" extra={resumen ? <span className="dash-columna__nota cifras">{resumen}</span> : null}>
      {citas.length ? (
        <ul className="dash-citas">
          {citas.map((c) => (
            <li key={c.id} className="dash-cita">
              <span className="dash-cita__hora cifras">{c.hora}</span>
              <span className="dash-cita__texto">
                <span className="dash-cita__persona">{c.persona}</span>
                <span className="dash-cita__detalle">
                  {c.servicio}
                  <PuntoEstado tono={c.estado.tono} etiqueta={c.estado.etiqueta} mostrarEtiqueta />
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        vacio
      )}
    </Seccion>
  );
}

/* ---------- Esta semana: una cifra y 7 columnas ---------- */

/**
 * Métrica rápida (skill dataviz): una sola serie, así que no lleva leyenda;
 * el título la nombra. Forma "énfasis": hoy en azul de acción, los demás días
 * en el gris de las divisiones. Columnas de 20px con punta redonda de 4px,
 * cuadradas en la base. Cada columna se puede enfocar y dice su valor; la
 * tabla oculta lleva los mismos datos para lectores de pantalla.
 */
export function EstaSemana({ titulo, dias, unidad, vacio }: { titulo: string; dias: DiaSemana[]; unidad: string; vacio?: ReactNode }) {
  const total = dias.reduce((s, d) => s + d.valor, 0);
  const max = Math.max(1, ...dias.map((d) => d.valor));
  const [activo, setActivo] = useState<number | null>(null);
  const formato = new Intl.NumberFormat("es-MX");

  return (
    <Seccion id="dash-semana" titulo="Esta semana">
      {total === 0 && vacio ? (
        vacio
      ) : (
        <>
          <p className="dash-semana__cifra">
            <span className="dash-semana__valor">{formato.format(total)}</span>
            <span className="dash-semana__unidad">{titulo}</span>
          </p>
          <div className="dash-semana__grafica" role="group" aria-label={`${titulo}, últimos 7 días`} onPointerLeave={() => setActivo(null)}>
            {dias.map((d, i) => (
              <div
                key={d.largo}
                className="dash-semana__columna"
                role="img"
                tabIndex={0}
                aria-label={`${d.hoy ? "Hoy, " : ""}${d.largo}: ${formato.format(d.valor)} ${unidad}`}
                data-hoy={d.hoy ? "" : undefined}
                data-activo={activo === i ? "" : undefined}
                onPointerEnter={() => setActivo(i)}
              >
                <span className="dash-semana__dato cifras" aria-hidden="true">
                  <strong>{formato.format(d.valor)}</strong> {d.hoy ? "hoy" : d.largo}
                </span>
                <span className="dash-semana__pista" aria-hidden="true">
                  <span className="dash-semana__barra" style={{ height: `${Math.max(4, (d.valor / max) * 100)}%` }} />
                </span>
                <span className="dash-semana__dia" aria-hidden="true">
                  {d.corto}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Seccion>
  );
}

/* ---------- Para ti: consejos y novedades, uno a la vez ---------- */

export function ParaTi({ items }: { items: ItemParaTi[] }) {
  const [i, setI] = useState(0);
  if (!items.length) return null;
  const item = items[i];
  const mover = (d: number) => setI((v) => (v + d + items.length) % items.length);
  return (
    <Seccion
      id="dash-parati"
      titulo="Para ti"
      extra={
        items.length > 1 ? (
          <div className="dash-pager" role="group" aria-label="Cambiar de consejo">
            <button type="button" className="dash-pager__boton" aria-label="Anterior" onClick={() => mover(-1)}>
              <Icono nombre="chevron-izquierda" tam={14} />
            </button>
            <span className="dash-pager__puntos" aria-hidden="true">
              {items.map((x, n) => (
                <span key={x.id} className="dash-pager__punto" data-actual={n === i ? "" : undefined} />
              ))}
            </span>
            <span className="sr-only">
              {i + 1} de {items.length}
            </span>
            <button type="button" className="dash-pager__boton" aria-label="Siguiente" onClick={() => mover(1)}>
              <Icono nombre="chevron-derecha" tam={14} />
            </button>
          </div>
        ) : null
      }
    >
      <div key={item.id} className="dash-parati" aria-live="polite">
        <p className="dash-parati__tipo">{item.tipo === "consejo" ? "Consejo" : "En Atendel"}</p>
        <p className="dash-parati__titulo">{item.titulo}</p>
        <p className="dash-parati__texto">{item.texto}</p>
        {item.accion ? (
          <Destinable destino={item.accion.destino} className="dash-cabeza__enlace dash-parati__accion">
            {item.accion.etiqueta}
            <Icono nombre="chevron-derecha" tam={16} />
          </Destinable>
        ) : null}
      </div>
    </Seccion>
  );
}

/* ---------- Ayuda según dónde estás ---------- */

export function Ayuda({ texto }: { texto: ReactNode }) {
  return (
    <Seccion id="dash-ayuda" titulo="¿Cómo leo esto?">
      <p className="dash-ayuda__texto">{texto}</p>
      <ul className="dash-ayuda__lista">
        <li className="dash-ayuda__atajo">
          <Kbd>/</Kbd>
          <span>busca en todo tu panel</span>
        </li>
        <li>
          <Destinable destino={{ href: "/preguntas" }} className="dash-cabeza__enlace">
            Preguntas frecuentes
            <Icono nombre="chevron-derecha" tam={16} />
          </Destinable>
        </li>
      </ul>
    </Seccion>
  );
}
