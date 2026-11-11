"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Icono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { LOGO_APP } from "@/lib/conexiones/logos";
import { APP_POR_ID } from "@/lib/conexiones/catalogo";
import { PERIODOS, type Periodo } from "@/lib/estadisticas";
import type { Cifra } from "@/lib/estadisticas-negocio";
import type { ResumenInfo } from "@/lib/resumen-negocio";
import type { IdApp } from "@/lib/nucleo-tipos";
import { AvatarAgente } from "./Mensajes";
import { Enlace } from "./Piezas";
import { useFuenteNegocio } from "./negocio/fuente";

type Props = {
  /** /pruebalo: datos de ejemplo. */
  ejemplo: boolean;
  /** Trae el resumen de un periodo (en /pruebalo se calcula; en /panel se pide a la API). */
  cargar: (p: Periodo) => Promise<ResumenInfo | null>;
  /** Tu equipo (los agentes activos). */
  equipo: readonly IdAgente[];
  /** Los agentes de la conversación abierta, si hay una. */
  enConversacion?: readonly IdAgente[];
  pendientes: number | null;
  hrefs: { pendientes: string; estadisticas: string; negocio: string; chatCon: (a: IdAgente) => string };
  alCerrar: () => void;
};

const numero = new Intl.NumberFormat("es-MX");

/** Cambio contra el periodo anterior, en %, o null si no hay con qué comparar. */
function cambio(c: Cifra): number | null {
  if (c.valor === null || c.antes === null || c.antes === 0) return null;
  return Math.round(((c.valor - c.antes) / c.antes) * 100);
}

/**
 * El panel de la derecha: te informa mientras chateas (como la columna de
 * datos de una mesa de operaciones, con la forma de Atendel). Cifras del
 * periodo con su cambio, los clientes por día, nuevos contra los que
 * regresan, tu equipo (y quién está en esta conversación), lo que espera tu
 * visto bueno, tus apps conectadas y de qué te escriben. Lo que no tiene de
 * dónde contarse dice "Sin datos aún": nada se inventa.
 */
export function PanelInfo({ ejemplo, cargar, equipo, enConversacion = [], pendientes, hrefs, alCerrar }: Props) {
  const [periodo, setPeriodo] = useState<Periodo>("7d");
  const [datos, setDatos] = useState<ResumenInfo | null>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [apps, setApps] = useState<IdApp[] | null>(null);
  const fuente = useFuenteNegocio();

  useEffect(() => {
    let vivo = true;
    setEstado("cargando");
    cargar(periodo)
      .then((d) => {
        if (!vivo) return;
        setDatos(d);
        setEstado(d ? "listo" : "error");
      })
      .catch(() => vivo && setEstado("error"));
    return () => {
      vivo = false;
    };
  }, [cargar, periodo]);

  useEffect(() => {
    let vivo = true;
    fuente
      .listarApps()
      .then((l) => vivo && setApps(l.filter((a) => a.estado === "conectada").map((a) => a.id)))
      .catch(() => vivo && setApps(null));
    return () => {
      vivo = false;
    };
  }, [fuente]);

  const cifras: { id: string; etiqueta: string; c: Cifra; hay: boolean }[] = datos
    ? [
        { id: "clientes", etiqueta: "Clientes", c: datos.clientes, hay: datos.clientes.valor !== null },
        { id: "citas", etiqueta: "Citas", c: datos.citas.agendadas, hay: datos.canales.citas },
        { id: "respuestas", etiqueta: "Respuestas", c: datos.respuestas, hay: datos.respuestas.valor !== null },
        { id: "correos", etiqueta: "Correos", c: datos.correos, hay: datos.correos.valor !== null },
      ]
    : [];
  const serie = datos?.serie;
  const maximo = serie ? Math.max(1, ...serie.actual) : 1;
  const nuevos = datos?.clientes.nuevos ?? null;
  const regresan = datos?.clientes.regresan ?? null;
  const totalNR = (nuevos ?? 0) + (regresan ?? 0);
  const enChat = new Set(enConversacion);

  return (
    <div className="pc-info" aria-busy={estado === "cargando"}>
      <header className="pc-info__cabeza">
        <div className="pc-info__titulos">
          <p className="pc-info__eyebrow">
            <span className={`pc-info__punto${ejemplo ? " pc-info__punto--ejemplo" : ""}`} aria-hidden="true" />
            {ejemplo ? "Datos de ejemplo" : "En vivo"}
          </p>
          <h2 className="pc-info__negocio">{datos?.negocio ?? "Tu negocio"}</h2>
        </div>
        <button type="button" className="pc-icono" onClick={alCerrar} aria-label="Ocultar la información" title="Ocultar la información">
          <Icono nombre="cerrar" tam={16} />
        </button>
      </header>

      <div className="pc-info__periodos" role="radiogroup" aria-label="Periodo">
        {PERIODOS.map((p) => (
          <button key={p.id} type="button" role="radio" aria-checked={periodo === p.id} className="pc-info__periodo" onClick={() => setPeriodo(p.id)}>
            {p.etiqueta}
          </button>
        ))}
      </div>

      {estado === "error" ? (
        <p className="pc-info__nota">No se pudieron leer tus números. Intenta en un momento.</p>
      ) : (
        <ul className="pc-info__cifras">
          {(cifras.length ? cifras : [0, 1, 2, 3].map((i) => ({ id: `x${i}`, etiqueta: "", c: { valor: null, antes: null }, hay: false }))).map((f) => {
            const d = f.hay ? cambio(f.c) : null;
            return (
              <li key={f.id} className="pc-info__cifra" data-cargando={estado === "cargando" || undefined}>
                <span className="pc-info__cifra-etiqueta">{f.etiqueta || " "}</span>
                <span className="pc-info__cifra-valor">{f.hay && f.c.valor !== null ? numero.format(f.c.valor) : "—"}</span>
                <span className={`pc-info__cambio${d === null ? "" : d >= 0 ? " pc-info__cambio--sube" : " pc-info__cambio--baja"}`}>
                  {!f.hay ? (estado === "cargando" ? " " : "Sin datos aún") : d === null ? "Sin comparar" : `${d >= 0 ? "▲" : "▼"} ${Math.abs(d)}%`}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {serie && serie.actual.length ? (
        <section className="pc-info__bloque" aria-label="Clientes por día">
          <div className="pc-info__bloque-cabeza">
            <h3 className="pc-info__subtitulo">Clientes por día</h3>
            <Enlace href={hrefs.estadisticas} className="pc-info__mas">
              Ver más
            </Enlace>
          </div>
          <div className="pc-info__barras" role="img" aria-label={`Clientes por día: ${serie.actual.join(", ")}`}>
            {serie.actual.map((v, i) => (
              <span key={serie.dias[i] ?? i} className="pc-info__barra" style={{ "--h": `${Math.max(4, (v / maximo) * 100)}%` } as CSSProperties} title={`${serie.dias[i]}: ${v}`} />
            ))}
          </div>
        </section>
      ) : null}

      {nuevos !== null && regresan !== null && totalNR > 0 ? (
        <section className="pc-info__bloque" aria-label="Clientes nuevos y que regresan">
          <div className="pc-info__par">
            <span>
              <strong>{numero.format(nuevos)}</strong> nuevos
            </span>
            <span>
              <strong>{numero.format(regresan)}</strong> regresan
            </span>
          </div>
          <div className="pc-info__division" aria-hidden="true">
            <span className="pc-info__division-a" style={{ flexGrow: nuevos || 0.001 }} />
            <span className="pc-info__division-b" style={{ flexGrow: regresan || 0.001 }} />
          </div>
        </section>
      ) : null}

      <section className="pc-info__bloque" aria-labelledby="pc-info-equipo">
        <div className="pc-info__bloque-cabeza">
          <h3 id="pc-info-equipo" className="pc-info__subtitulo">
            {enConversacion.length ? "En esta conversación" : "Tu equipo"}
          </h3>
        </div>
        <ul className="pc-info__equipo">
          {[...equipo].sort((a, b) => Number(enChat.has(b)) - Number(enChat.has(a))).map((a) => (
            <li key={a}>
              <Enlace href={hrefs.chatCon(a)} className="pc-info__agente" data-aqui={enChat.has(a) || undefined}>
                <AvatarAgente agente={a} tam={28} />
                <span className="pc-info__agente-textos">
                  <span className="pc-info__agente-nombre">{AGENTE_POR_ID[a].nombre}</span>
                  <span className="pc-info__agente-area">{AGENTE_POR_ID[a].area}</span>
                </span>
                {enChat.has(a) ? <span className="pc-estado pc-estado--exito">Aquí</span> : <Icono nombre="chevron-derecha" tam={14} trazo={2} />}
              </Enlace>
            </li>
          ))}
        </ul>
      </section>

      <Enlace href={hrefs.pendientes} className="pc-info__pendientes">
        <span className="pc-info__pendientes-num">{pendientes === null ? "—" : numero.format(pendientes)}</span>
        <span className="pc-info__pendientes-texto">{pendientes === 1 ? "cosa espera tu visto bueno" : "cosas esperan tu visto bueno"}</span>
        <Icono nombre="chevron-derecha" tam={14} trazo={2} />
      </Enlace>

      <section className="pc-info__bloque" aria-labelledby="pc-info-apps">
        <div className="pc-info__bloque-cabeza">
          <h3 id="pc-info-apps" className="pc-info__subtitulo">
            Apps conectadas
          </h3>
          <Enlace href={hrefs.negocio} className="pc-info__mas">
            {apps && apps.length ? "Ver todas" : "Conectar"}
          </Enlace>
        </div>
        {apps === null ? (
          <p className="pc-info__nota">—</p>
        ) : apps.length ? (
          <ul className="pc-info__apps">
            {apps.slice(0, 10).map((id) => (
              <li key={id} className="pc-info__app" title={APP_POR_ID[id]?.nombre ?? id}>
                {/* eslint-disable-next-line @next/next/no-img-element -- logo chico y fijo */}
                <img src={LOGO_APP[id]} alt={APP_POR_ID[id]?.nombre ?? id} width={18} height={18} loading="lazy" decoding="async" />
              </li>
            ))}
            {apps.length > 10 ? <li className="pc-info__app pc-info__app--mas">+{apps.length - 10}</li> : null}
          </ul>
        ) : (
          <p className="pc-info__nota">Todavía no conectas ninguna app.</p>
        )}
      </section>

      {datos && datos.temas.length ? (
        <section className="pc-info__bloque" aria-labelledby="pc-info-temas">
          <h3 id="pc-info-temas" className="pc-info__subtitulo">
            De qué te escriben
          </h3>
          <ol className="pc-info__temas">
            {datos.temas.map((t) => (
              <li key={t.texto} className="pc-info__tema">
                <span className="pc-info__tema-texto">{t.texto}</span>
                <span className="pc-info__tema-total">{numero.format(t.total)}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
