"use client";

import { useEffect, useState, type CSSProperties } from "react";
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
  hrefs: { pendientes: string; estadisticas: string; negocio: string; documentos: string; chatCon: (a: IdAgente) => string };
  alCerrar: () => void;
};

const numero = new Intl.NumberFormat("es-MX");

/** Cambio contra el periodo anterior, en %, o null si no hay con qué comparar. */
function cambio(c: Cifra): number | null {
  if (c.valor === null || c.antes === null || c.antes === 0) return null;
  return Math.round(((c.valor - c.antes) / c.antes) * 100);
}

const ESTADO_DOC: Record<Documento["estado"], { texto: string; tono: string }> = {
  listo: { texto: "Listo", tono: "exito" },
  procesando: { texto: "Leyendo…", tono: "atencion" },
  error: { texto: "Con error", tono: "error" },
};

/**
 * El panel de la derecha: te informa mientras chateas. Cada ícono de arriba
 * a la derecha abre una pestaña: Resumen (cifras del periodo, clientes por
 * día, nuevos contra los que regresan, de qué te escriben), Tu equipo (y
 * quién está en esta conversación), Pendientes y Documentos y apps. Lo que
 * no tiene de dónde contarse dice "Sin datos aún": nada se inventa.
 */
export function PanelInfo({ tab, alCambiarTab, ejemplo, cargar, equipo, enConversacion = [], pendientes, pendientesLista, hrefs, alCerrar }: Props) {
  const [periodo, setPeriodo] = useState<Periodo>("7d");
  const [datos, setDatos] = useState<ResumenInfo | null>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [apps, setApps] = useState<IdApp[] | null>(null);
  const [docs, setDocs] = useState<Documento[] | null>(null);
  const fuente = useFuenteNegocio();
  const actual = TABS_INFO.find((t) => t.id === tab) ?? TABS_INFO[0];

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

  return (
    <div className="pc-info" aria-busy={estado === "cargando"}>
      <header className="pc-info__cabeza">
        <div className="pc-info__titulos">
          <p className="pc-info__eyebrow">
            <span className={`pc-info__punto${ejemplo ? " pc-info__punto--ejemplo" : ""}`} aria-hidden="true" />
            <span className="pc-info__eyebrow-texto">
              {ejemplo ? "Datos de ejemplo" : "En vivo"}
              {datos?.negocio ? ` · ${datos.negocio}` : ""}
            </span>
          </p>
          <h2 className="pc-info__negocio">{actual.etiqueta}</h2>
        </div>
        <button type="button" className="pc-icono" onClick={alCerrar} aria-label="Ocultar la información" title="Ocultar la información">
          <Icono nombre="cerrar" tam={16} />
        </button>
      </header>

      {/* En el celular las pestañas van aquí (arriba a la derecha solo cabe un ícono) */}
      <div className="pc-info__tabs" role="tablist" aria-label="Información">
        {TABS_INFO.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={t.id === tab} className="pc-info__tab" onClick={() => alCambiarTab(t.id)}>
            <Icono nombre={t.icono} tam={16} />
            <span>{t.etiqueta}</span>
          </button>
        ))}
      </div>

      <div key={tab} className="pc-info__cuerpo">
        {tab === "resumen" ? <Resumen periodo={periodo} setPeriodo={setPeriodo} datos={datos} estado={estado} hrefs={hrefs} /> : null}

        {tab === "equipo" ? (
          <section className="pc-info__bloque" aria-label="Tu equipo">
            {enConversacion.length ? <h3 className="pc-info__subtitulo">En esta conversación, arriba</h3> : null}
            <ul className="pc-info__equipo">
              {[...equipo]
                .sort((a, b) => Number(enChat.has(b)) - Number(enChat.has(a)))
                .map((a) => (
                  <li key={a}>
                    <Enlace href={hrefs.chatCon(a)} className="pc-info__agente" data-aqui={enChat.has(a) || undefined}>
                      <AvatarAgente agente={a} tam={32} />
                      <span className="pc-info__agente-textos">
                        <span className="pc-info__agente-nombre">{AGENTE_POR_ID[a].nombre}</span>
                        <span className="pc-info__agente-area">
                          {AGENTE_POR_ID[a].area} · {AGENTE_POR_ID[a].abarca}
                        </span>
                      </span>
                      {enChat.has(a) ? <span className="pc-estado pc-estado--exito">Aquí</span> : <Icono nombre="chevron-derecha" tam={14} trazo={2} />}
                    </Enlace>
                  </li>
                ))}
            </ul>
          </section>
        ) : null}

        {tab === "pendientes" ? (
          <>
            <Enlace href={hrefs.pendientes} className="pc-info__pendientes">
              <span className="pc-info__pendientes-num">{pendientes === null ? "—" : numero.format(pendientes)}</span>
              <span className="pc-info__pendientes-texto">{pendientes === 1 ? "cosa espera tu visto bueno" : "cosas esperan tu visto bueno"}</span>
              <Icono nombre="chevron-derecha" tam={14} trazo={2} />
            </Enlace>
            {pendientesLista && pendientesLista.length ? (
              <ul className="pc-info__lista">
                {pendientesLista.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <Enlace href={hrefs.pendientes} className="pc-info__fila">
                      <AvatarAgente agente={p.agente} tam={24} />
                      <span className="pc-info__fila-textos">
                        <span className="pc-info__fila-titulo">{p.titulo}</span>
                        {p.detalle ? <span className="pc-info__fila-detalle">{p.detalle}</span> : null}
                      </span>
                    </Enlace>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pc-info__nota">Ábrelos para aprobar, editar o descartar lo que preparó tu equipo.</p>
            )}
          </>
        ) : null}

        {tab === "archivos" ? (
          <>
            <section className="pc-info__bloque" aria-labelledby="pc-info-docs">
              <div className="pc-info__bloque-cabeza">
                <h3 id="pc-info-docs" className="pc-info__subtitulo">
                  Documentos que conoce tu equipo
                </h3>
                <Enlace href={hrefs.documentos} className="pc-info__mas">
                  {docs && docs.length ? "Ver todos" : "Subir"}
                </Enlace>
              </div>
              {docs === null ? (
                <p className="pc-info__nota">Leyendo…</p>
              ) : docs.length ? (
                <ul className="pc-info__lista">
                  {docs.slice(0, 8).map((d) => (
                    <li key={d.id} className="pc-info__fila pc-info__fila--quieta">
                      <span className="pc-info__doc-icono" aria-hidden="true">
                        <Icono nombre={d.tipo === "link" ? "enlace" : "documento"} tam={15} />
                      </span>
                      <span className="pc-info__fila-textos">
                        <span className="pc-info__fila-titulo">{d.nombre}</span>
                      </span>
                      <span className={`pc-estado pc-estado--${ESTADO_DOC[d.estado].tono}`}>{ESTADO_DOC[d.estado].texto}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pc-info__nota">Todavía no subes documentos. Con tus precios o políticas, tu equipo contesta mejor.</p>
              )}
            </section>
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
                <p className="pc-info__nota">Leyendo…</p>
              ) : apps.length ? (
                <ul className="pc-info__apps">
                  {apps.map((id) => (
                    <li key={id} className="pc-info__app" title={APP_POR_ID[id]?.nombre ?? id}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- logo chico y fijo */}
                      <img src={LOGO_APP[id]} alt={APP_POR_ID[id]?.nombre ?? id} width={18} height={18} loading="lazy" decoding="async" />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pc-info__nota">Todavía no conectas ninguna app.</p>
              )}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Resumen({
  periodo,
  setPeriodo,
  datos,
  estado,
  hrefs,
}: {
  periodo: Periodo;
  setPeriodo: (p: Periodo) => void;
  datos: ResumenInfo | null;
  estado: "cargando" | "listo" | "error";
  hrefs: Props["hrefs"];
}) {
  const cifras: { id: string; etiqueta: string; c: Cifra; hay: boolean }[] = datos
    ? [
        { id: "clientes", etiqueta: "Clientes", c: datos.clientes, hay: datos.clientes.valor !== null },
        { id: "citas", etiqueta: "Citas", c: datos.citas.agendadas, hay: datos.canales.citas },
        { id: "respuestas", etiqueta: "Respuestas", c: datos.respuestas, hay: datos.respuestas.valor !== null },
        { id: "correos", etiqueta: "Correos", c: datos.correos, hay: datos.correos.valor !== null },
      ]
    : [0, 1, 2, 3].map((i) => ({ id: `x${i}`, etiqueta: "", c: { valor: null, antes: null }, hay: false }));
  const serie = datos?.serie;
  const maximo = serie ? Math.max(1, ...serie.actual) : 1;
  const nuevos = datos?.clientes.nuevos ?? null;
  const regresan = datos?.clientes.regresan ?? null;
  const totalNR = (nuevos ?? 0) + (regresan ?? 0);

  return (
    <>
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
          {cifras.map((f) => {
            const d = f.hay ? cambio(f.c) : null;
            return (
              <li key={f.id} className="pc-info__cifra" data-cargando={estado === "cargando" || undefined}>
                <span className="pc-info__cifra-etiqueta">{f.etiqueta || " "}</span>
                <span key={`${periodo}-${f.c.valor}`} className="pc-info__cifra-valor">
                  {f.hay && f.c.valor !== null ? numero.format(f.c.valor) : "—"}
                </span>
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
    </>
  );
}
