"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { createClient } from "@/lib/supabase/client";
import { AvatarAgente } from "./Mensajes";
import { Enlace, Modal, Tarjeta, TituloSeccion, Vacio, claseBoton, retrasoEscalon } from "./Piezas";
import { Seccion } from "./Secciones";
import { RevisionDiaria, type DatosRevision } from "./RevisionDiaria";

/* =====================================================================
   OFICINA: lo que tu equipo te dejó mientras no estabas (una presentación,
   un Excel, un informe). Llega "por revisar"; lo abres y lo apruebas o
   pides cambios (eso va al chat, con Atendel). Solo cambia tu revisión:
   el archivo no se toca. En /panel sale de la tabla archivos (RLS: solo
   lo tuyo; solo puedes cambiar la revisión); en /pruebalo, de ejemplo.
   ===================================================================== */

export type Revision = "revisar" | "aprobado" | "cambios";
export type TipoArchivo = "pptx" | "xlsx" | "docx" | "pdf";

/** Lo que se ve al abrirlo en la demostración (en la cuenta real se descarga el archivo). */
export type VistaPrevia =
  | { tipo: "tabla"; columnas: string[]; filas: string[][]; nota?: string }
  | { tipo: "laminas"; laminas: { titulo: string; puntos: string[] }[] }
  | { tipo: "texto"; partes: { titulo: string; texto: string }[] };

export type ItemOficina = {
  id: string;
  nombre: string;
  tipo: TipoArchivo;
  agente: IdAgente | null;
  /** Cuándo te lo dejó (ISO). */
  en: string;
  revision: Revision;
  /** Para qué es, en una línea. */
  detalle?: string;
  /** Dónde se descarga (cuenta real). */
  abrir?: string;
  /** La conversación donde se pidió (cuenta real). */
  conversacion?: string;
  vista?: VistaPrevia;
};

const TIPOS: Record<TipoArchivo, { nombre: string; icono: NombreIcono }> = {
  pptx: { nombre: "Presentación", icono: "documento" },
  xlsx: { nombre: "Excel", icono: "documento" },
  docx: { nombre: "Documento", icono: "documento" },
  pdf: { nombre: "PDF", icono: "documento" },
};

const ESTADO: Record<Revision, { texto: string; clase: string }> = {
  revisar: { texto: "Por revisar", clase: "pc-estado pc-estado--atencion" },
  aprobado: { texto: "Aprobado", clase: "pc-estado pc-estado--exito" },
  cambios: { texto: "Pediste cambios", clase: "pc-estado" },
};

function cuando(iso: string, ahora: number) {
  const min = Math.max(0, Math.round((ahora - Date.parse(iso)) / 60_000));
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

/** La miniatura de la tarjeta: un dibujo chiquito según el tipo (sin colores de marca). */
function Miniatura({ tipo }: { tipo: TipoArchivo }) {
  return (
    <span className="pc-oficina__mini" data-tipo={tipo} aria-hidden="true">
      {tipo === "xlsx" ? (
        <span className="pc-oficina__mini-tabla">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} />
          ))}
        </span>
      ) : tipo === "pptx" ? (
        <span className="pc-oficina__mini-lamina">
          <span />
          <span />
          <span />
        </span>
      ) : (
        <span className="pc-oficina__mini-hoja">
          <span />
          <span />
          <span />
          <span />
        </span>
      )}
      <span className="pc-oficina__mini-tipo">{tipo.toUpperCase()}</span>
    </span>
  );
}

function Previa({ vista }: { vista: VistaPrevia }) {
  if (vista.tipo === "tabla")
    return (
      <div className="pc-previa">
        <div className="pc-previa__tabla-caja">
          <table className="pc-previa__tabla">
            <thead>
              <tr>
                {vista.columnas.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vista.filas.map((f, i) => (
                <tr key={i}>
                  {f.map((c, j) => (
                    <td key={j} className={j ? "cifras" : undefined}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {vista.nota ? <p className="pc-previa__nota">{vista.nota}</p> : null}
      </div>
    );
  if (vista.tipo === "laminas")
    return (
      <ol className="pc-previa pc-previa__laminas">
        {vista.laminas.map((l, i) => (
          <li key={l.titulo} className="pc-previa__lamina">
            <span className="pc-previa__numero cifras">{i + 1}</span>
            <p className="pc-previa__lamina-titulo">{l.titulo}</p>
            <ul>
              {l.puntos.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    );
  return (
    <div className="pc-previa pc-previa__hoja">
      {vista.partes.map((p) => (
        <section key={p.titulo}>
          <h3>{p.titulo}</h3>
          <p>{p.texto}</p>
        </section>
      ))}
    </div>
  );
}

/**
 * La Oficina (sin datos): pestañas Por revisar y Revisado, las tarjetas y
 * las ventanas de revisar y de pedir cambios. Quien la usa decide qué pasa
 * al aprobar o al pedir cambios (guardar en la cuenta o solo en pantalla).
 */
export function Oficina({
  items,
  ahora,
  alAprobar,
  alPedirCambios,
  hrefChat,
  demo = false,
  arriba,
}: {
  /** Arriba de los archivos: la revisión diaria de tu equipo. */
  arriba?: ReactNode;
  items: ItemOficina[];
  ahora: number;
  /** Devuelve un error o null. */
  alAprobar: (id: string) => Promise<string | null> | string | null;
  alPedirCambios: (item: ItemOficina, texto: string) => Promise<string | null> | string | null;
  hrefChat: string;
  demo?: boolean;
}) {
  const [tab, setTab] = useState<"revisar" | "revisado">("revisar");
  const [abierto, setAbierto] = useState<ItemOficina | null>(null);
  const [cambios, setCambios] = useState<ItemOficina | null>(null);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ tono: "ok" | "error"; texto: string } | null>(null);

  const porRevisar = items.filter((i) => i.revision === "revisar");
  const revisados = items.filter((i) => i.revision !== "revisar");
  const lista = tab === "revisar" ? porRevisar : revisados;

  async function aprobar(i: ItemOficina) {
    setOcupado(true);
    const e = await alAprobar(i.id);
    setOcupado(false);
    setAbierto(null);
    setAviso(e ? { tono: "error", texto: e } : { tono: "ok", texto: `Aprobaste «${i.nombre}».` });
  }
  async function mandarCambios() {
    if (!cambios || !texto.trim()) return;
    setOcupado(true);
    const e = await alPedirCambios(cambios, texto.trim());
    setOcupado(false);
    if (e) return setAviso({ tono: "error", texto: e });
    setAviso({ tono: "ok", texto: demo ? `Le pasaste tus cambios de «${cambios.nombre}» a Atendel. En la cuenta real lo corrige y te lo vuelve a dejar aquí.` : `Le pasaste tus cambios de «${cambios.nombre}» a Atendel.` });
    setCambios(null);
    setTexto("");
  }
  const pedirCambios = (i: ItemOficina) => {
    setAbierto(null);
    setTexto("");
    setCambios(i);
  };

  return (
    <Seccion>
      <TituloSeccion titulo="Oficina" texto="Lo que tu equipo te dejó mientras no estabas: su revisión del día y los archivos que te hizo. Ábrelos, apruébalos o pide cambios." />
      {arriba}
      <h2 className="pc-oficina__titulo">Archivos</h2>
      <div className="pc-filtros" role="group" aria-label="Qué ver">
        <button type="button" className="pc-pildora" aria-pressed={tab === "revisar"} onClick={() => setTab("revisar")}>
          Por revisar
          {porRevisar.length ? <span className="pc-pildora__cuenta">{porRevisar.length}</span> : null}
        </button>
        <button type="button" className="pc-pildora" aria-pressed={tab === "revisado"} onClick={() => setTab("revisado")}>
          Revisado
          {revisados.length ? <span className="pc-pildora__cuenta">{revisados.length}</span> : null}
        </button>
      </div>
      {aviso ? (
        <p className={`pc-citas-aviso${aviso.tono === "error" ? " pc-citas-aviso--error" : ""}`} role={aviso.tono === "error" ? "alert" : "status"}>
          <Icono nombre={aviso.tono === "error" ? "alerta" : "check"} tam={16} trazo={2} />
          {aviso.texto}
        </p>
      ) : null}

      {lista.length ? (
        <ul className="pc-oficina">
          {lista.map((i, n) => {
            const quien = i.agente ? AGENTE_POR_ID[i.agente] : null;
            return (
              <li key={i.id} className="pc-entra" style={{ "--d": `${retrasoEscalon(n)}ms` } as CSSProperties}>
                <Tarjeta como="article" className="pc-oficina__tarjeta" etiqueta={i.nombre}>
                  <Miniatura tipo={i.tipo} />
                  <div className="pc-oficina__cuerpo">
                    <div className="pc-oficina__arriba">
                      <span className={ESTADO[i.revision].clase}>{ESTADO[i.revision].texto}</span>
                      <span className="pc-oficina__tipo">{TIPOS[i.tipo].nombre}</span>
                    </div>
                    <p className="pc-oficina__nombre">{i.nombre}</p>
                    {i.detalle ? <p className="pc-oficina__detalle">{i.detalle}</p> : null}
                    <p className="pc-oficina__quien">
                      {i.agente ? <AvatarAgente agente={i.agente} tam={18} /> : null}
                      {quien ? `${quien.nombre} · ` : ""}
                      {cuando(i.en, ahora)}
                    </p>
                    <div className="pc-oficina__acciones">
                      {i.vista ? (
                        <button type="button" className={claseBoton("borde", true)} onClick={() => setAbierto(i)}>
                          Revisar
                        </button>
                      ) : i.abrir ? (
                        <a href={i.abrir} className={claseBoton("borde", true)}>
                          <Icono nombre="flecha-arriba-derecha" tam={14} />
                          Abrir
                        </a>
                      ) : null}
                      {i.revision !== "aprobado" ? (
                        <button type="button" className={claseBoton("borde", true)} disabled={ocupado} onClick={() => aprobar(i)}>
                          <Icono nombre="check" tam={14} trazo={2} />
                          Aprobar
                        </button>
                      ) : null}
                      <button type="button" className={claseBoton("fantasma", true)} onClick={() => pedirCambios(i)}>
                        Pedir cambios
                      </button>
                    </div>
                  </div>
                </Tarjeta>
              </li>
            );
          })}
        </ul>
      ) : (
        <Vacio
          agente="iris"
          titulo={tab === "revisar" ? "Nada por revisar" : "Todavía no revisas nada"}
          texto={
            tab === "revisar"
              ? "Cuando tu equipo te deje algo (una presentación, un Excel, un informe), aparece aquí para que lo revises."
              : "Lo que apruebes o mandes a corregir se queda aquí."
          }
          accion={
            <Enlace href={hrefChat} className={claseBoton("borde", true)}>
              Pedirle algo a Atendel
            </Enlace>
          }
        />
      )}

      {/* Revisar (en la demostración): lo que trae y los botones */}
      <Modal
        abierto={abierto !== null}
        alCerrar={() => setAbierto(null)}
        ancho="ancho"
        titulo={abierto?.nombre ?? ""}
        descripcion={abierto ? `${abierto.agente ? `${AGENTE_POR_ID[abierto.agente].nombre} · ` : ""}${TIPOS[abierto.tipo].nombre} · ${cuando(abierto.en, ahora)}` : undefined}
        pie={
          abierto ? (
            <>
              <button type="button" className={claseBoton("fantasma")} onClick={() => pedirCambios(abierto)}>
                Pedir cambios
              </button>
              {abierto.revision !== "aprobado" ? (
                <button type="button" className={claseBoton("principal")} disabled={ocupado} onClick={() => aprobar(abierto)}>
                  Aprobar
                </button>
              ) : null}
            </>
          ) : null
        }
      >
        {abierto?.vista ? <Previa vista={abierto.vista} /> : null}
      </Modal>

      {/* Pedir cambios: qué le cambia; va a Atendel */}
      <Modal
        abierto={cambios !== null}
        alCerrar={() => setCambios(null)}
        titulo="Pedir cambios"
        descripcion={cambios ? `Dile a Atendel qué cambiarle a «${cambios.nombre}». Lo corrige y te lo vuelve a dejar aquí.` : undefined}
        pie={
          <>
            <button type="button" className={claseBoton("fantasma")} onClick={() => setCambios(null)}>
              Cancelar
            </button>
            <button type="button" className={claseBoton("principal")} disabled={!texto.trim() || ocupado} onClick={mandarCambios}>
              Mandar a Atendel
            </button>
          </>
        }
      >
        <label className="pc-campo">
          <span className="pc-campo__etiqueta">Qué le cambio</span>
          <textarea
            className="pc-campo__entrada pc-campo__entrada--largo"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ej.: agrega una lámina con los precios y quita la última."
            maxLength={1500}
          />
        </label>
      </Modal>
    </Seccion>
  );
}

/** La Oficina de la cuenta real: aprobar guarda la revisión; pedir cambios la guarda y abre el chat con lo que pediste. */
export function OficinaReal({
  items,
  ahora,
  revision,
  hoy,
  hora,
  activa,
  zona,
}: {
  zona: string;
  items: ItemOficina[];
  ahora: number;
  revision: DatosRevision | null;
  hoy: string;
  hora: string;
  activa: boolean;
}) {
  const router = useRouter();
  const [lista, setLista] = useState(items);
  // Ya la viste: se marca leída (solo cambia leido_en)
  useEffect(() => {
    if (!revision?.id || revision.leida) return;
    void createClient().from("revisiones").update({ leido_en: new Date().toISOString() }).eq("id", revision.id).then(() => router.refresh());
  }, [revision?.id, revision?.leida, router]);
  const marcar = async (id: string, revision: Revision) => {
    const { error } = await createClient().from("archivos").update({ revision, revisado_en: new Date().toISOString() }).eq("id", id);
    if (error) return "No se pudo guardar. Intenta de nuevo.";
    setLista((l) => l.map((x) => (x.id === id ? { ...x, revision } : x)));
    router.refresh();
    return null;
  };
  return (
    <Oficina
      items={lista}
      ahora={ahora}
      hrefChat="/panel"
      arriba={
        <RevisionDiaria
          revision={revision}
          hoy={hoy}
          hora={hora}
          activa={activa}
          zona={zona}
          hrefAjustes="/panel?vista=ajustes&seccion=atendel"
          alRevisar={async () => {
            const { error } = await createClient().rpc("revisar_ahora");
            if (error) return "No se pudo revisar ahora. Intenta de nuevo.";
            router.refresh();
            return null;
          }}
        />
      }
      alAprobar={(id) => marcar(id, "aprobado")}
      alPedirCambios={async (item, texto) => {
        const e = await marcar(item.id, "cambios");
        if (e) return e;
        router.push(`/panel?pide=${encodeURIComponent(`Corrige «${item.nombre}» que me dejaste: ${texto}`)}`);
        return null;
      }}
    />
  );
}
