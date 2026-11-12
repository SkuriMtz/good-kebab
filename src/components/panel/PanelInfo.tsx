"use client";

import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { LOGO_APP } from "@/lib/conexiones/logos";
import { APP_POR_ID } from "@/lib/conexiones/catalogo";
import { PERIODOS, type Periodo } from "@/lib/estadisticas";
import type { Cifra } from "@/lib/estadisticas-negocio";
import type { ResumenInfo } from "@/lib/resumen-negocio";
import type { Documento, IdApp } from "@/lib/nucleo-tipos";
import { AvatarAgente } from "./Mensajes";
import { Enlace } from "./Piezas";
import { useFuenteNegocio } from "./negocio/fuente";

/** Las pestañas del panel de información (los íconos de arriba a la derecha). */
export type TabInfo = "resumen" | "equipo" | "pendientes" | "archivos";
export const TABS_INFO: readonly { id: TabInfo; etiqueta: string; icono: NombreIcono }[] = [
  { id: "resumen", etiqueta: "Resumen", icono: "grafica" },
  { id: "equipo", etiqueta: "Tu equipo", icono: "agentes" },
  { id: "pendientes", etiqueta: "Pendientes", icono: "check-circulo" },
  { id: "archivos", etiqueta: "Documentos y apps", icono: "documento" },
];
export const esTabInfo = (v: unknown): v is TabInfo => TABS_INFO.some((t) => t.id === v);

export type PendienteInfo = { id: string; agente: IdAgente; titulo: string; detalle?: string };

type Props = {
  tab: TabInfo;
  alCambiarTab: (t: TabInfo) => void;
  /** /pruebalo: datos de ejemplo. */
  ejemplo: boolean;
  /** Trae el resumen de un periodo (en /pruebalo se calcula; en /panel se pide a la API). */
  cargar: (p: Periodo) => Promise<ResumenInfo | null>;
  /** Tu equipo (los agentes activos). */
  equipo: readonly IdAgente[];
  /** Los agentes de la conversación abierta, si hay una. */
  enConversacion?: readonly IdAgente[];
  pendientes: number | null;
  /** Los primeros pendientes, si se tienen a la mano (en /pruebalo). */
  pendientesLista?: PendienteInfo[];
  hrefs: { pendientes: string; estadisticas: string; negocio: string; documentos: string; ajustes?: string; chatCon: (a: IdAgente) => string };
  alCerrar: () => void;
};

const numero = new Intl.NumberFormat("es-MX");
const pct = (n: number) => `${n.toLocaleString("es-MX", { maximumFractionDigits: 1 })}%`;

/** Los cuadritos de la leyenda: pocos colores y apagados; lo demás, gris. */
const COLOR = { azul: "#4a86f0", naranja: "#e07b39", verde: "#22a888", gris: "#8b8b90" } as const;

/** Cambio contra el periodo anterior, en %, o null si no hay con qué comparar. */
function cambio(c: Cifra): number | null {
  if (c.valor === null || c.antes === null || c.antes === 0) return null;
  return Math.round(((c.valor - c.antes) / c.antes) * 100);
}
const textoCambio = (c: Cifra) => {
  const d = cambio(c);
  return d === null ? "—" : `${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d)}%`;
};

const ESTADO_DOC: Record<Documento["estado"], string> = { listo: "Listo", procesando: "Leyendo…", error: "Con error" };

/**
 * El panel de la derecha, con la forma sobria de un panel de contexto:
 * secciones con su título, filas de ícono y texto, una barra delgada de
 * proporciones y una leyenda de cuadritos con su número a la derecha;
 * líneas finas entre secciones. Cada ícono de arriba a la derecha abre una
 * pestaña. Lo que no tiene de dónde contarse dice "Sin datos": nada se inventa.
 */
export function PanelInfo({ tab, alCambiarTab, ejemplo, cargar, equipo, enConversacion = [], pendientes, pendientesLista, hrefs, alCerrar }: Props) {
  const [periodo, setPeriodo] = useState<Periodo>("7d");
  const [datos, setDatos] = useState<ResumenInfo | null>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [apps, setApps] = useState<IdApp[] | null>(null);
  const [docs, setDocs] = useState<Documento[] | null>(null);
  const fuente = useFuenteNegocio();
  const idPeriodo = useId();

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

  // Documentos y apps: se leen la primera vez que se abre esa pestaña
  const verArchivos = tab === "archivos";
  useEffect(() => {
    if (!verArchivos) return;
    let vivo = true;
    fuente
      .listarApps()
      .then((l) => vivo && setApps(l.filter((a) => a.estado === "conectada").map((a) => a.id)))
      .catch(() => vivo && setApps([]));
    fuente
      .listarDocumentos()
      .then((l) => vivo && setDocs(l))
      .catch(() => vivo && setDocs([]));
    return () => {
      vivo = false;
    };
  }, [fuente, verArchivos]);

  const enChat = new Set(enConversacion);
  const otros = equipo.filter((a) => !enChat.has(a));

  return (
    <div className="pc-ctx" aria-busy={estado === "cargando"}>
      {/* Angosto (flota) y celular: cerrar y las pestañas van aquí */}
      <div className="pc-ctx__arriba">
        <div className="pc-ctx__tabs" role="tablist" aria-label="Información">
          {TABS_INFO.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={t.id === tab} className="pc-ctx__tab" onClick={() => alCambiarTab(t.id)} title={t.etiqueta} aria-label={t.etiqueta}>
              <Icono nombre={t.icono} tam={17} />
            </button>
          ))}
        </div>
        <button type="button" className="pc-icono" onClick={alCerrar} aria-label="Ocultar la información" title="Ocultar la información">
          <Icono nombre="cerrar" tam={16} />
        </button>
      </div>

      <div key={tab} className="pc-ctx__cuerpo">
        {tab === "resumen" ? (
          <>
            <Seccion titulo="Tu negocio">
              <Fila icono="negocio" texto={datos?.negocio ?? "Tu negocio"} fin={hrefs.ajustes ? <Enlace href={hrefs.ajustes} className="pc-ctx__accion" aria-label="Ajustes" title="Ajustes"><Icono nombre="ajustes" tam={16} /></Enlace> : null} />
              <Fila
                icono="reloj"
                texto={
                  <label className="pc-ctx__selector" htmlFor={idPeriodo}>
                    <select id={idPeriodo} value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>
                      {PERIODOS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.id === "mes" ? "Este mes" : `Últimos ${p.etiqueta}`}
                        </option>
                      ))}
                    </select>
                    <Icono nombre="chevron" tam={14} trazo={2} />
                  </label>
                }
              />
              <Fila icono="rayo" texto={ejemplo ? "Datos de ejemplo" : "En vivo"} fin={<span className={`pc-ctx__luz${ejemplo ? " pc-ctx__luz--ejemplo" : ""}`} aria-hidden="true" />} />
            </Seccion>

            <Seccion titulo="Actividad">
              {estado === "error" ? (
                <p className="pc-ctx__nota">No se pudieron leer tus números. Intenta en un momento.</p>
              ) : (
                <Actividad datos={datos} cargando={estado === "cargando"} hrefEstadisticas={hrefs.estadisticas} />
              )}
            </Seccion>
          </>
        ) : null}

        {tab === "equipo" ? (
          <>
            {enConversacion.length ? (
              <Seccion titulo="En esta conversación">
                {[...enConversacion].map((a) => (
                  <FilaAgente key={a} agente={a} href={hrefs.chatCon(a)} />
                ))}
              </Seccion>
            ) : null}
            <Seccion titulo={enConversacion.length ? "El resto de tu equipo" : "Tu equipo"}>
              {otros.length ? otros.map((a) => <FilaAgente key={a} agente={a} href={hrefs.chatCon(a)} />) : <p className="pc-ctx__nota">Todo tu equipo está en esta conversación.</p>}
            </Seccion>
          </>
        ) : null}

        {tab === "pendientes" ? (
          <Seccion titulo="Por revisar">
            <div className="pc-ctx__total">
              <span>{pendientes === null ? "—" : `${numero.format(pendientes)} ${pendientes === 1 ? "espera" : "esperan"} tu visto bueno`}</span>
            </div>
            {pendientesLista && pendientesLista.length ? (
              <ul className="pc-ctx__leyenda">
                {pendientesLista.slice(0, 8).map((p) => (
                  <li key={p.id}>
                    <Enlace href={hrefs.pendientes} className="pc-ctx__dato pc-ctx__dato--enlace">
                      <span className="pc-ctx__cuadro" style={{ "--c": colorAgente(p.agente) } as CSSProperties} aria-hidden="true" />
                      <span className="pc-ctx__dato-texto">{p.titulo}</span>
                      <span className="pc-ctx__dato-num">{AGENTE_POR_ID[p.agente].nombre}</span>
                    </Enlace>
                  </li>
                ))}
              </ul>
            ) : null}
            <Enlace href={hrefs.pendientes} className="pc-ctx__fila pc-ctx__fila--enlace">
              <Icono nombre="chevron-derecha" tam={14} trazo={2} />
              <span className="pc-ctx__fila-texto">Abrir Pendientes</span>
            </Enlace>
          </Seccion>
        ) : null}

        {tab === "archivos" ? (
          <>
            <Seccion titulo="Apps conectadas">
              {apps === null ? (
                <p className="pc-ctx__nota">Leyendo…</p>
              ) : apps.length ? (
                apps.slice(0, 8).map((id) => (
                  <div key={id} className="pc-ctx__fila">
                    {/* eslint-disable-next-line @next/next/no-img-element -- logo chico y fijo */}
                    <img className="pc-ctx__logo" src={LOGO_APP[id]} alt="" width={18} height={18} loading="lazy" decoding="async" />
                    <span className="pc-ctx__fila-texto">{APP_POR_ID[id]?.nombre ?? id}</span>
                  </div>
                ))
              ) : (
                <p className="pc-ctx__nota">Todavía no conectas ninguna app.</p>
              )}
              <Enlace href={hrefs.negocio} className="pc-ctx__fila pc-ctx__fila--enlace">
                <Icono nombre="mas" tam={16} />
                <span className="pc-ctx__fila-texto">{apps && apps.length ? "Ver o conectar apps" : "Conectar una app"}</span>
              </Enlace>
            </Seccion>
            <Seccion titulo="Documentos">
              {docs === null ? (
                <p className="pc-ctx__nota">Leyendo…</p>
              ) : docs.length ? (
                docs.slice(0, 8).map((d) => (
                  <div key={d.id} className="pc-ctx__fila pc-ctx__fila--tenue">
                    <Icono nombre={d.tipo === "link" ? "enlace" : "documento"} tam={17} />
                    <span className="pc-ctx__fila-texto">{d.nombre}</span>
                    {d.estado !== "listo" ? <span className="pc-ctx__fila-fin">{ESTADO_DOC[d.estado]}</span> : null}
                  </div>
                ))
              ) : (
                <p className="pc-ctx__nota">Todavía no subes documentos.</p>
              )}
              <Enlace href={hrefs.documentos} className="pc-ctx__fila pc-ctx__fila--enlace">
                <Icono nombre="subir" tam={16} />
                <span className="pc-ctx__fila-texto">Subir un documento</span>
              </Enlace>
            </Seccion>
          </>
        ) : null}
      </div>
    </div>
  );
}

const colorAgente = (a: IdAgente) => ({ lola: COLOR.naranja, clara: COLOR.azul, victor: COLOR.verde, iris: COLOR.gris })[a];

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="pc-ctx__seccion">
      <h3 className="pc-ctx__titulo">{titulo}</h3>
      <div className="pc-ctx__filas">{children}</div>
    </section>
  );
}

function Fila({ icono, texto, fin }: { icono: NombreIcono; texto: ReactNode; fin?: ReactNode }) {
  return (
    <div className="pc-ctx__fila">
      <Icono nombre={icono} tam={17} />
      <span className="pc-ctx__fila-texto">{texto}</span>
      {fin ? <span className="pc-ctx__fila-fin">{fin}</span> : null}
    </div>
  );
}

function FilaAgente({ agente, href }: { agente: IdAgente; href: string }) {
  const a = AGENTE_POR_ID[agente];
  return (
    <Enlace href={href} className="pc-ctx__fila pc-ctx__fila--enlace">
      <AvatarAgente agente={agente} tam={20} />
      <span className="pc-ctx__fila-texto">{a.nombre}</span>
      <span className="pc-ctx__fila-fin">{a.area}</span>
    </Enlace>
  );
}

/**
 * Como un medidor de contexto: arriba, cuántos clientes y su cambio; una
 * barra delgada con nuevos contra los que regresan; y la leyenda (cuadrito,
 * nombre, número y su parte o su cambio). Al final, "De qué te escriben"
 * plegado, con su cuenta.
 */
function Actividad({ datos, cargando, hrefEstadisticas }: { datos: ResumenInfo | null; cargando: boolean; hrefEstadisticas: string }) {
  const [temas, setTemas] = useState(false);
  const idTemas = useId();
  const clientes = datos?.clientes.valor ?? null;
  const nuevos = datos?.clientes.nuevos ?? null;
  const regresan = datos?.clientes.regresan ?? null;
  const total = (nuevos ?? 0) + (regresan ?? 0);
  const parte = (n: number | null) => (n !== null && total > 0 ? (n / total) * 100 : 0);

  const filas: { id: string; color: string; texto: string; ayuda?: string; num: string; fin: string }[] = datos
    ? [
        ...(nuevos !== null && regresan !== null && total > 0
          ? [
              { id: "nuevos", color: COLOR.azul, texto: "Clientes nuevos", ayuda: "Escribieron por primera vez en este periodo", num: numero.format(nuevos), fin: pct(parte(nuevos)) },
              { id: "regresan", color: COLOR.verde, texto: "Clientes que regresan", ayuda: "Ya te habían escrito antes", num: numero.format(regresan), fin: pct(parte(regresan)) },
            ]
          : []),
        { id: "citas", color: COLOR.naranja, texto: "Citas agendadas", num: datos.canales.citas && datos.citas.agendadas.valor !== null ? numero.format(datos.citas.agendadas.valor) : "Sin datos", fin: datos.canales.citas ? textoCambio(datos.citas.agendadas) : "" },
        { id: "respuestas", color: COLOR.gris, texto: "Respuestas de tu equipo", num: datos.respuestas.valor !== null ? numero.format(datos.respuestas.valor) : "Sin datos", fin: datos.respuestas.valor !== null ? textoCambio(datos.respuestas) : "" },
        { id: "correos", color: COLOR.gris, texto: "Correos atendidos", num: datos.correos.valor !== null ? numero.format(datos.correos.valor) : "Sin datos", fin: datos.correos.valor !== null ? textoCambio(datos.correos) : "" },
      ]
    : [];

  return (
    <div className="pc-ctx__medidor" data-cargando={cargando || undefined}>
      <div className="pc-ctx__total">
        <span>{clientes === null ? (cargando ? " " : "Sin datos de clientes") : `${numero.format(clientes)} ${clientes === 1 ? "cliente" : "clientes"}`}</span>
        {datos && clientes !== null ? <span className="pc-ctx__total-fin">{textoCambio(datos.clientes)} vs. antes</span> : null}
      </div>
      <div className="pc-ctx__barra" aria-hidden="true">
        {total > 0 ? (
          <>
            <span style={{ width: `${parte(nuevos)}%`, background: COLOR.azul }} />
            <span style={{ width: `${parte(regresan)}%`, background: COLOR.verde }} />
          </>
        ) : null}
      </div>
      <ul className="pc-ctx__leyenda">
        {filas.map((f) => (
          <li key={f.id} className="pc-ctx__dato">
            <span className="pc-ctx__cuadro" style={{ "--c": f.color } as CSSProperties} aria-hidden="true" />
            <span className={`pc-ctx__dato-texto${f.ayuda ? " pc-ctx__dato-texto--ayuda" : ""}`} title={f.ayuda}>
              {f.texto}
            </span>
            <span className="pc-ctx__dato-num">{f.num}</span>
            <span className="pc-ctx__dato-fin">{f.fin}</span>
          </li>
        ))}
      </ul>
      {datos && datos.temas.length ? (
        <>
          <button type="button" className="pc-ctx__plegar" aria-expanded={temas} aria-controls={idTemas} onClick={() => setTemas((t) => !t)}>
            <Icono nombre="chevron-derecha" tam={14} trazo={2} />
            <span className="pc-ctx__dato-texto">De qué te escriben</span>
            <span className="pc-ctx__dato-num">{datos.temas.length}</span>
          </button>
          <ul id={idTemas} className="pc-ctx__leyenda pc-ctx__leyenda--temas" hidden={!temas}>
            {datos.temas.map((t) => (
              <li key={t.texto} className="pc-ctx__dato">
                <span className="pc-ctx__cuadro" style={{ "--c": COLOR.gris } as CSSProperties} aria-hidden="true" />
                <span className="pc-ctx__dato-texto">{t.texto}</span>
                <span className="pc-ctx__dato-num">{numero.format(t.total)}</span>
                <span className="pc-ctx__dato-fin" />
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p className="pc-ctx__pie">
        <Enlace href={hrefEstadisticas} className="pc-ctx__enlace">
          Ver estadísticas
        </Enlace>
      </p>
    </div>
  );
}
