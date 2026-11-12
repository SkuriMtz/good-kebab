"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
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
  /** La parte que se está viendo (marca su ícono arriba). */
  tab: TabInfo;
  /** Cada vez que cambia, el panel se desliza hasta `tab` (al picar un ícono). */
  pedido: number;
  /** Ir a una parte (las pestañas de adentro, en pantallas angostas). */
  alIr: (t: TabInfo) => void;
  /** Al desplazarse a mano: qué parte quedó arriba (solo marca su ícono). */
  alVer: (t: TabInfo) => void;
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

const ESTADO_DOC: Record<Documento["estado"], string> = { listo: "Listo", procesando: "Leyendo…", error: "Con error" };

/**
 * El panel de la derecha: todo en una columna que se baja (resumen, tu
 * equipo, por revisar, apps conectadas y documentos), con títulos técnicos y
 * líneas finas entre partes. Los íconos de arriba deslizan hasta su parte.
 * Lo que no tiene de dónde contarse dice "Sin datos": nada se inventa.
 */
export function PanelInfo({ tab, pedido, alIr, alVer, ejemplo, cargar, equipo, enConversacion = [], pendientes, pendientesLista, hrefs, alCerrar }: Props) {
  const [periodo, setPeriodo] = useState<Periodo>("7d");
  const [datos, setDatos] = useState<ResumenInfo | null>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [apps, setApps] = useState<IdApp[] | null>(null);
  const [docs, setDocs] = useState<Documento[] | null>(null);
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

  // Apps y documentos: se leen al abrir el panel
  useEffect(() => {
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
  }, [fuente]);

  // Todo va en una sola columna: los íconos de arriba deslizan hasta su parte,
  // y al bajar a mano se marca el ícono de la parte que quedó arriba.
  const raiz = useRef<HTMLDivElement>(null);
  const quietoHasta = useRef(0);
  const tabActual = useRef(tab);
  tabActual.current = tab;
  const alto = () => raiz.current?.querySelector<HTMLElement>(".pc-ctx__arriba")?.offsetHeight ?? 0;
  useEffect(() => {
    const cont = raiz.current?.closest<HTMLElement>(".pc-lateral");
    const el = document.getElementById(`pc-info-${tabActual.current}`);
    if (!cont || !el) return;
    quietoHasta.current = Date.now() + 800;
    const destino = el.getBoundingClientRect().top - cont.getBoundingClientRect().top + cont.scrollTop - alto();
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cont.scrollTo({ top: Math.max(0, destino), behavior: quieto || pedido === 0 ? "auto" : "smooth" });
  }, [pedido]);
  useEffect(() => {
    const cont = raiz.current?.closest<HTMLElement>(".pc-lateral");
    if (!cont) return;
    let cuadro = 0;
    const revisar = () => {
      cuadro = 0;
      if (Date.now() < quietoHasta.current) return;
      const linea = cont.getBoundingClientRect().top + alto() + 96;
      let visto: TabInfo = TABS_INFO[0].id;
      for (const t of TABS_INFO) {
        const el = document.getElementById(`pc-info-${t.id}`);
        if (el && el.getBoundingClientRect().top <= linea) visto = t.id;
      }
      if (cont.scrollTop + cont.clientHeight >= cont.scrollHeight - 4) visto = TABS_INFO[TABS_INFO.length - 1].id;
      if (visto !== tabActual.current) alVer(visto);
    };
    const alDesplazar = () => {
      if (!cuadro) cuadro = requestAnimationFrame(revisar);
    };
    cont.addEventListener("scroll", alDesplazar, { passive: true });
    return () => {
      cont.removeEventListener("scroll", alDesplazar);
      cancelAnimationFrame(cuadro);
    };
  }, [alVer]);

  const enChat = new Set(enConversacion);
  const otros = equipo.filter((a) => !enChat.has(a));

  return (
    <div ref={raiz} className="pc-ctx" aria-busy={estado === "cargando"}>
      {/* Angosto (flota) y celular: cerrar y las pestañas van aquí */}
      <div className="pc-ctx__arriba">
        <div className="pc-ctx__tabs" role="toolbar" aria-label="Ir a">
          {TABS_INFO.map((t) => (
            <button key={t.id} type="button" aria-pressed={t.id === tab} className="pc-ctx__tab" onClick={() => alIr(t.id)} title={t.etiqueta} aria-label={`Ir a ${t.etiqueta.toLowerCase()}`}>
              <Icono nombre={t.icono} tam={17} />
            </button>
          ))}
        </div>
        <button type="button" className="pc-icono" onClick={alCerrar} aria-label="Ocultar la información" title="Ocultar la información">
          <Icono nombre="cerrar" tam={16} />
        </button>
      </div>

      <div className="pc-ctx__cuerpo">
        <div id="pc-info-resumen" className="pc-ctx__grupo">
          <Tablero datos={datos} estado={estado} periodo={periodo} setPeriodo={setPeriodo} ejemplo={ejemplo} hrefEstadisticas={hrefs.estadisticas} />
        </div>

        <div id="pc-info-equipo" className="pc-ctx__grupo">
            {enConversacion.length ? (
              <Seccion titulo="Tu equipo · en esta conversación">
                {[...enConversacion].map((a) => (
                  <FilaAgente key={a} agente={a} href={hrefs.chatCon(a)} aqui />
                ))}
              </Seccion>
            ) : null}
            <Seccion titulo={enConversacion.length ? "El resto de tu equipo" : "Tu equipo"}>
              {otros.length ? otros.map((a) => <FilaAgente key={a} agente={a} href={hrefs.chatCon(a)} />) : <p className="pc-ctx__nota">Todo tu equipo está en esta conversación.</p>}
            </Seccion>
        </div>

        <div id="pc-info-pendientes" className="pc-ctx__grupo">
          <Seccion titulo="Por revisar">
            <div className="pc-kpi pc-kpi--solo">
              <span className="pc-kpi__valor">{pendientes === null ? "—" : numero.format(pendientes)}</span>
              <span className="pc-kpi__etiqueta">{pendientes === 1 ? "cosa espera tu visto bueno" : "cosas esperan tu visto bueno"}</span>
            </div>
            {pendientesLista && pendientesLista.length ? (
              <ul className="pc-ctx__lista">
                {pendientesLista.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <Enlace href={hrefs.pendientes} className="pc-ctx__fila pc-ctx__fila--enlace pc-ctx__fila--doble">
                      <AvatarAgente agente={p.agente} tam={28} />
                      <span className="pc-ctx__fila-texto">
                        <span className="pc-ctx__fila-nombre">{p.titulo}</span>
                        <span className="pc-ctx__fila-sub">
                          {AGENTE_POR_ID[p.agente].nombre}
                          {p.detalle ? ` · ${p.detalle}` : ""}
                        </span>
                      </span>
                    </Enlace>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pc-ctx__nota">Ábrelos para aprobar, editar o descartar lo que preparó tu equipo.</p>
            )}
            <Enlace href={hrefs.pendientes} className="pc-ctx__boton">
              Abrir Pendientes
              <Icono nombre="flecha" tam={14} />
            </Enlace>
          </Seccion>
        </div>

        <div id="pc-info-archivos" className="pc-ctx__grupo">
            <Seccion titulo="Apps conectadas">
              {apps === null ? (
                <p className="pc-ctx__nota">Leyendo…</p>
              ) : apps.length ? (
                apps.slice(0, 8).map((id) => (
                  <div key={id} className="pc-ctx__fila">
                    {/* eslint-disable-next-line @next/next/no-img-element -- logo chico y fijo */}
                    <img className="pc-ctx__logo" src={LOGO_APP[id]} alt="" width={18} height={18} loading="lazy" decoding="async" />
                    <span className="pc-ctx__fila-texto">{APP_POR_ID[id]?.nombre ?? id}</span>
                    <span className="pc-ctx__estado">
                      <span className="pc-ctx__luz" aria-hidden="true" />
                      Conectada
                    </span>
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
                    <span className={`pc-ctx__estado pc-ctx__estado--${d.estado}`}>{ESTADO_DOC[d.estado]}</span>
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
        </div>
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

function FilaAgente({ agente, href, aqui = false }: { agente: IdAgente; href: string; aqui?: boolean }) {
  const a = AGENTE_POR_ID[agente];
  return (
    <Enlace href={href} className="pc-ctx__fila pc-ctx__fila--enlace pc-ctx__fila--doble">
      <AvatarAgente agente={agente} tam={28} />
      <span className="pc-ctx__fila-texto">
        <span className="pc-ctx__fila-nombre">{a.nombre}</span>
        <span className="pc-ctx__fila-sub">
          {a.area} · {a.abarca}
        </span>
      </span>
      {aqui ? <span className="pc-ctx__etiqueta">En el chat</span> : <Icono nombre="chevron-derecha" tam={14} trazo={2} />}
    </Enlace>
  );
}

const AYUDA_KPI: Record<string, string> = {
  clientes: "Personas distintas que te escribieron",
  citas: "Citas que se agendaron (sin las canceladas)",
  respuestas: "Mensajes que contestó tu equipo",
  correos: "Correos de clientes que tu equipo resumió o respondió",
};

const formatoDia = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" });
const dia = (d: string) => formatoDia.format(new Date(`${d}T12:00:00Z`)).replace(".", "");

/**
 * El resumen, claro y sobrio (como un tablero de empresa): el periodo, cuatro
 * cifras en una cuadrícula con su cambio, los clientes por día en una línea
 * (el periodo anterior, punteado), nuevos contra los que regresan y de qué
 * te escriben.
 */
function Tablero({
  datos,
  estado,
  periodo,
  setPeriodo,
  ejemplo,
  hrefEstadisticas,
}: {
  datos: ResumenInfo | null;
  estado: "cargando" | "listo" | "error";
  periodo: Periodo;
  setPeriodo: (p: Periodo) => void;
  ejemplo: boolean;
  hrefEstadisticas: string;
}) {
  const contra = PERIODOS.find((p) => p.id === periodo)?.contra ?? "";
  const cifras: { id: string; etiqueta: string; c: Cifra; hay: boolean }[] = datos
    ? [
        { id: "clientes", etiqueta: "Clientes", c: datos.clientes, hay: datos.clientes.valor !== null },
        { id: "citas", etiqueta: "Citas agendadas", c: datos.citas.agendadas, hay: datos.canales.citas },
        { id: "respuestas", etiqueta: "Respuestas", c: datos.respuestas, hay: datos.respuestas.valor !== null },
        { id: "correos", etiqueta: "Correos atendidos", c: datos.correos, hay: datos.correos.valor !== null },
      ]
    : ["Clientes", "Citas agendadas", "Respuestas", "Correos atendidos"].map((e, i) => ({ id: `x${i}`, etiqueta: e, c: { valor: null, antes: null }, hay: false }));
  const nuevos = datos?.clientes.nuevos ?? null;
  const regresan = datos?.clientes.regresan ?? null;
  const total = (nuevos ?? 0) + (regresan ?? 0);
  const maxTema = datos?.temas.length ? Math.max(...datos.temas.map((t) => t.total)) : 1;

  return (
    <>
      <section className="pc-ctx__seccion">
        <div className="pc-ctx__cabeza">
          <h3 className="pc-ctx__titulo">Resumen</h3>
          <span className="pc-ctx__estado">
            <span className={`pc-ctx__luz${ejemplo ? " pc-ctx__luz--ejemplo" : ""}`} aria-hidden="true" />
            {ejemplo ? "Datos de ejemplo" : "En vivo"}
          </span>
        </div>
        <Grafica datos={datos} />
        <div className="pc-segmentos" role="radiogroup" aria-label="Periodo">
          {PERIODOS.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={periodo === p.id} className="pc-segmentos__opcion" onClick={() => setPeriodo(p.id)}>
              {p.etiqueta}
            </button>
          ))}
        </div>

        {estado === "error" ? (
          <p className="pc-ctx__nota">No se pudieron leer tus números. Intenta en un momento.</p>
        ) : (
          <>
            <ul className="pc-kpis" data-cargando={estado === "cargando" || undefined}>
              {cifras.map((f) => {
                const d = f.hay ? cambio(f.c) : null;
                return (
                  <li key={f.id} className="pc-kpi">
                    <span className="pc-kpi__etiqueta" title={AYUDA_KPI[f.id]}>{f.etiqueta}</span>
                    <span key={`${periodo}-${f.c.valor}`} className="pc-kpi__valor">
                      {f.hay && f.c.valor !== null ? numero.format(f.c.valor) : "—"}
                    </span>
                    {f.hay ? (
                      d === null ? (
                        <span className="pc-kpi__nota">Sin comparar</span>
                      ) : (
                        <span className={`pc-kpi__cambio pc-kpi__cambio--${d > 0 ? "sube" : d < 0 ? "baja" : "igual"}`}>
                          {d > 0 ? "↑" : d < 0 ? "↓" : "→"} {Math.abs(d)}%
                        </span>
                      )
                    ) : (
                      <span className="pc-kpi__nota">{estado === "cargando" ? " " : "Sin datos aún"}</span>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="pc-ctx__pie-chico">Cambio {contra}.</p>
          </>
        )}
      </section>

      {nuevos !== null && regresan !== null && total > 0 ? (
        <section className="pc-ctx__seccion">
          <h3 className="pc-ctx__titulo">Clientes nuevos y que regresan</h3>
          <div className="pc-ctx__barra pc-ctx__barra--gruesa" aria-hidden="true">
            <span style={{ width: `${(nuevos / total) * 100}%`, background: COLOR.azul }} />
            <span style={{ width: `${(regresan / total) * 100}%`, background: COLOR.verde }} />
          </div>
          <ul className="pc-ctx__leyenda">
            <li className="pc-ctx__dato">
              <span className="pc-ctx__cuadro" style={{ "--c": COLOR.azul } as CSSProperties} aria-hidden="true" />
              <span className="pc-ctx__dato-texto pc-ctx__dato-texto--ayuda" title="Te escribieron por primera vez en este periodo">Nuevos</span>
              <span className="pc-ctx__dato-num">{numero.format(nuevos)}</span>
              <span className="pc-ctx__dato-fin">{pct((nuevos / total) * 100)}</span>
            </li>
            <li className="pc-ctx__dato">
              <span className="pc-ctx__cuadro" style={{ "--c": COLOR.verde } as CSSProperties} aria-hidden="true" />
              <span className="pc-ctx__dato-texto pc-ctx__dato-texto--ayuda" title="Ya te habían escrito antes">Regresan</span>
              <span className="pc-ctx__dato-num">{numero.format(regresan)}</span>
              <span className="pc-ctx__dato-fin">{pct((regresan / total) * 100)}</span>
            </li>
          </ul>
        </section>
      ) : null}

      {datos && datos.temas.length ? (
        <section className="pc-ctx__seccion">
          <h3 className="pc-ctx__titulo">De qué te escriben</h3>
          <ol className="pc-temas">
            {datos.temas.map((t) => (
              <li key={t.texto} className="pc-temas__fila">
                <span className="pc-temas__texto">{t.texto}</span>
                <span className="pc-temas__num">{numero.format(t.total)}</span>
                <span className="pc-temas__barra" style={{ "--w": `${(t.total / maxTema) * 100}%` } as CSSProperties} aria-hidden="true" />
              </li>
            ))}
          </ol>
          <Enlace href={hrefEstadisticas} className="pc-ctx__boton">
            Ver estadísticas completas
            <Icono nombre="flecha" tam={14} />
          </Enlace>
        </section>
      ) : null}
    </>
  );
}

const formatoDiaLargo = new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const diaLargo = (d: string) => {
  if (!d) return "";
  const t = formatoDiaLargo.format(new Date(`${d}T12:00:00Z`)).replace(/\./g, "").replace(",", "");
  return t.charAt(0).toLocaleUpperCase("es-MX") + t.slice(1);
};

type IdGrafica = "clientes" | "citas" | "respuestas" | "correos" | "hora" | "semana";
type Punto = { etiqueta: string; valor: number; antes?: number };
const GRAFICAS: readonly { id: IdGrafica; nombre: string; detalle: string; unidad: [string, string] }[] = [
  { id: "clientes", nombre: "Clientes por día", detalle: "Personas distintas que te escribieron", unidad: ["cliente", "clientes"] },
  { id: "citas", nombre: "Citas agendadas por día", detalle: "Las que se agendaron cada día", unidad: ["cita", "citas"] },
  { id: "respuestas", nombre: "Respuestas por día", detalle: "Mensajes que contestó tu equipo", unidad: ["respuesta", "respuestas"] },
  { id: "correos", nombre: "Correos atendidos por día", detalle: "Correos de clientes que resumió o respondió", unidad: ["correo", "correos"] },
  { id: "hora", nombre: "A qué hora te escriben", detalle: "Mensajes y correos por hora del día", unidad: ["mensaje", "mensajes"] },
  { id: "semana", nombre: "Qué días te escriben más", detalle: "Mensajes y correos por día de la semana", unidad: ["mensaje", "mensajes"] },
];
const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/** Los puntos de cada gráfica, o null si todavía no hay de dónde contar. */
function puntosDe(id: IdGrafica, d: ResumenInfo): { puntos: Punto[]; ejes: [string, string] } | null {
  const porDia = (dias: string[], actual: number[], antes: number[]) =>
    actual.length > 1
      ? { puntos: actual.map((v, i) => ({ etiqueta: diaLargo(dias[i] ?? ""), valor: v, antes: antes.length === actual.length ? antes[i] : undefined })), ejes: [dia(dias[0] ?? ""), dia(dias[dias.length - 1] ?? "")] as [string, string] }
      : null;
  if (id === "clientes") return d.serie ? porDia(d.serie.dias, d.serie.actual, d.serie.antes) : null;
  if (id === "hora") return d.porHora ? { puntos: d.porHora.map((v, h) => ({ etiqueta: `${h}:00 a ${h + 1}:00`, valor: v })), ejes: ["0 h", "23 h"] } : null;
  if (id === "semana") return d.porSemana ? { puntos: d.porSemana.map((v, i) => ({ etiqueta: DIAS_SEMANA[i], valor: v })), ejes: ["lun", "dom"] } : null;
  const s = d.series[id];
  return s ? porDia(s.dias, s.actual, s.antes) : null;
}

/**
 * La gráfica del resumen: arriba, un botón con lo que se está viendo; al
 * picarlo sale un buscador chico con las demás gráficas (clientes, citas,
 * respuestas, correos, a qué hora y qué días te escriben). Lo elegido se
 * dibuja ahí mismo. Las que todavía no tienen datos se ven apagadas.
 */
function Grafica({ datos }: { datos: ResumenInfo | null }) {
  const [id, setId] = useState<IdGrafica>("clientes");
  const actual = GRAFICAS.find((g) => g.id === id) ?? GRAFICAS[0];
  const dibujo = datos ? puntosDe(id, datos) : null;
  const conAntes = !!dibujo?.puntos.some((p) => p.antes !== undefined);
  return (
    <div className="pc-grafica">
      <div className="pc-grafica__cabeza">
        <SelectorGrafica actual={id} datos={datos} alElegir={setId} />
        {conAntes ? (
          <span className="pc-ctx__leyenda-linea">
            <i className="pc-ctx__linea" aria-hidden="true" /> Ahora <i className="pc-ctx__linea pc-ctx__linea--antes" aria-hidden="true" /> Antes
          </span>
        ) : null}
      </div>
      {dibujo ? (
        <Linea key={id} puntos={dibujo.puntos} ejes={dibujo.ejes} unidad={actual.unidad} nombre={actual.nombre} />
      ) : (
        <p className="pc-grafica__vacia">{datos ? "Todavía no hay datos para esta gráfica." : " "}</p>
      )}
    </div>
  );
}

const sinAcentos = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function SelectorGrafica({ actual, datos, alElegir }: { actual: IdGrafica; datos: ResumenInfo | null; alElegir: (id: IdGrafica) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const id = useId();
  const nombre = GRAFICAS.find((g) => g.id === actual)?.nombre ?? "";
  const opciones = GRAFICAS.filter((g) => sinAcentos(`${g.nombre} ${g.detalle}`).includes(sinAcentos(q.trim())));
  const hay = (g: IdGrafica) => !!datos && puntosDe(g, datos) !== null;

  useEffect(() => {
    if (!abierto) return;
    setQ("");
    setCursor(Math.max(0, GRAFICAS.findIndex((g) => g.id === actual)));
    entrada.current?.focus({ preventScroll: true });
    const fuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    window.addEventListener("pointerdown", fuera);
    return () => window.removeEventListener("pointerdown", fuera);
  }, [abierto, actual]);

  const elegir = (g: IdGrafica) => {
    if (!hay(g)) return;
    alElegir(g);
    setAbierto(false);
    boton.current?.focus({ preventScroll: true });
  };

  return (
    <div ref={raiz} className="pc-sel">
      <button ref={boton} type="button" className="pc-sel__boton" aria-haspopup="dialog" aria-expanded={abierto} aria-controls={`${id}-pop`} onClick={() => setAbierto((a) => !a)}>
        <span>{nombre}</span>
        <Icono nombre="chevron" tam={14} trazo={2} />
      </button>
      {abierto ? (
        <div id={`${id}-pop`} className="pc-sel__pop" role="dialog" aria-label="Elegir qué ver en la gráfica">
          <div className="pc-sel__campo">
            <Icono nombre="buscar" tam={14} />
            <input
              ref={entrada}
              className="pc-sel__entrada"
              placeholder="Buscar gráfica…"
              value={q}
              role="combobox"
              aria-expanded="true"
              aria-controls={`${id}-lista`}
              aria-activedescendant={opciones[cursor] ? `${id}-${opciones[cursor].id}` : undefined}
              aria-label="Buscar gráfica"
              onChange={(e) => {
                setQ(e.target.value);
                setCursor(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  if (opciones.length) setCursor((c) => (c + (e.key === "ArrowDown" ? 1 : opciones.length - 1)) % opciones.length);
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (opciones[cursor]) elegir(opciones[cursor].id);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setAbierto(false);
                  boton.current?.focus({ preventScroll: true });
                }
              }}
            />
          </div>
          <ul id={`${id}-lista`} className="pc-sel__lista" role="listbox" aria-label="Gráficas">
            {opciones.map((g, i) => {
              const con = hay(g.id);
              return (
                <li
                  key={g.id}
                  id={`${id}-${g.id}`}
                  role="option"
                  aria-selected={g.id === actual}
                  aria-disabled={!con || undefined}
                  className="pc-sel__opcion"
                  data-cursor={i === cursor || undefined}
                  onPointerEnter={() => setCursor(i)}
                  onClick={() => elegir(g.id)}
                >
                  <span className="pc-sel__textos">
                    <span className="pc-sel__nombre">{g.nombre}</span>
                    <span className="pc-sel__detalle">{con ? g.detalle : "Sin datos aún"}</span>
                  </span>
                  {g.id === actual ? <Icono nombre="check" tam={14} trazo={2} /> : null}
                </li>
              );
            })}
            {opciones.length === 0 ? <li className="pc-sel__nada">Nada coincide con “{q}”.</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Una línea delgada con su sombra (y la del periodo anterior, punteada, si la
 * hay). Al pasar el cursor (o el dedo, o con las flechas) se marca el punto
 * más cercano y una etiqueta dice cuál es y cuánto hubo.
 */
function Linea({ puntos, ejes, unidad, nombre }: { puntos: Punto[]; ejes: [string, string]; unidad: [string, string]; nombre: string }) {
  const id = useId().replace(/:/g, "");
  const [sel, setSel] = useState<number | null>(null);
  const W = 312;
  const H = 96;
  const n = puntos.length;
  const actual = puntos.map((p) => p.valor);
  const antes = puntos.every((p) => p.antes !== undefined) ? puntos.map((p) => p.antes as number) : [];
  const max = Math.max(1, ...actual, ...antes);
  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * W);
  const y = (v: number) => H - 4 - (v / max) * (H - 12);
  const camino = (serie: number[]) => serie.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const linea = camino(actual);
  const area = `${linea} L${W} ${H} L0 ${H} Z`;
  const cuanto = (v: number) => `${numero.format(v)} ${v === 1 ? unidad[0] : unidad[1]}`;

  const elegir = (clientX: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const k = Math.round(((clientX - r.left) / Math.max(1, r.width)) * (n - 1));
    setSel(Math.max(0, Math.min(n - 1, k)));
  };
  const izq = sel === null ? 0 : (x(sel) / W) * 100;
  const hayAntes = sel !== null && antes.length === n;
  // La etiqueta va al lado de la línea, hacia donde hay más espacio
  const lado = izq > 55 ? "der" : "izq";

  return (
    <figure className="pc-linea">
      <div
        className="pc-linea__zona"
        tabIndex={0}
        role="img"
        aria-label={`${nombre}: ${puntos.map((p) => `${p.etiqueta} ${p.valor}`).join(", ")}`}
        onPointerMove={(e) => elegir(e.clientX, e.currentTarget)}
        onPointerDown={(e) => elegir(e.clientX, e.currentTarget)}
        onPointerLeave={() => setSel(null)}
        onFocus={() => setSel((s) => s ?? n - 1)}
        onBlur={() => setSel(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            setSel((s) => Math.max(0, Math.min(n - 1, (s ?? n - 1) + (e.key === "ArrowLeft" ? -1 : 1))));
          } else if (e.key === "Escape") setSel(null);
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={COLOR.azul} stopOpacity="0.22" />
              <stop offset="100%" stopColor={COLOR.azul} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((k) => (
            <line key={k} x1="0" x2={W} y1={H * k} y2={H * k} className="pc-linea__guia" />
          ))}
          {antes.length > 1 ? <path d={camino(antes)} className="pc-linea__antes" /> : null}
          <path d={area} fill={`url(#${id})`} />
          <path d={linea} className="pc-linea__ahora" />
        </svg>
        {sel !== null ? (
          <>
            <span className="pc-linea__vertical" style={{ left: `${izq}%` }} aria-hidden="true" />
            {hayAntes ? <span className="pc-linea__marca pc-linea__marca--antes" style={{ left: `${izq}%`, top: `${(y(antes[sel]) / H) * 100}%` }} aria-hidden="true" /> : null}
            <span className="pc-linea__marca" style={{ left: `${izq}%`, top: `${(y(actual[sel]) / H) * 100}%` }} aria-hidden="true" />
            <span className="pc-linea__tip" data-lado={lado} style={{ left: `${izq}%` }} aria-hidden="true">
              <span className="pc-linea__tip-dia">{puntos[sel].etiqueta}</span>
              <span className="pc-linea__tip-num">{cuanto(actual[sel])}</span>
              {hayAntes ? <span className="pc-linea__tip-antes">Antes: {numero.format(antes[sel])}</span> : null}
            </span>
          </>
        ) : null}
      </div>
      <figcaption className="pc-linea__ejes">
        <span>{ejes[0]}</span>
        <span>máx. {max}</span>
        <span>{ejes[1]}</span>
      </figcaption>
    </figure>
  );
}
