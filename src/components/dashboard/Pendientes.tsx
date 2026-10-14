"use client";

import { useId, useState, type ReactNode } from "react";
import { Avatar } from "@/components/base/Avatar";
import { Boton } from "@/components/base/Boton";
import { Campo } from "@/components/base/Campo";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { AGENTE_POR_ID } from "@/lib/agentes";
import type { Pendiente, PasoRelevo, VistaPrevia as TipoVista } from "./tipos";
import { MarcaAgente, Negritas, Quien } from "./util";

/* =====================================================================
   "ESPERA TU VISTO BUENO": la bandeja de lo que prepararon los agentes.
   Como una bandeja de notificaciones: filas que se abren (una a la vez)
   y, adentro, lo que preparó el agente, el camino que siguió (relevos
   entre agentes, como la historia de un pull request) y la caja de
   aprobación con UN solo botón principal.
   ===================================================================== */

export type Aviso = { texto: string; tono: "exito" | "neutro"; accion?: { etiqueta: string; alElegir: () => void } };

/** Fila que se despliega (botón con aria-expanded + región). */
export function FilaDesplegable({
  abierta,
  alAlternar,
  cabeza,
  children,
  className = "",
}: {
  abierta: boolean;
  alAlternar: () => void;
  cabeza: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <li className={`tb-pendiente ${className}`} data-abierta={abierta ? "true" : undefined}>
      <button type="button" className="tb-pendiente__fila" aria-expanded={abierta} aria-controls={`${id}-detalle`} onClick={alAlternar}>
        {cabeza}
        <Icono nombre="chevron" tam={16} className="tb-pendiente__chevron" />
      </button>
      {/* Cerrada: el detalle queda con visibility: hidden (fuera del orden de tabulación) */}
      <div id={`${id}-detalle`} className="tb-pendiente__detalle" role="region" aria-label="Detalle">
        <div className="tb-pendiente__recorte">
          <div className="tb-pendiente__interior">{children}</div>
        </div>
      </div>
    </li>
  );
}

/** La cabeza de la fila: personaje, título, detalle, urgencia y hora. */
export function CabezaPendiente({
  agente,
  titulo,
  detalle,
  hora,
  urgencia,
  nuevo,
}: {
  agente: Pendiente["agente"];
  titulo: string;
  detalle: string;
  hora: string;
  urgencia?: Pendiente["urgencia"];
  nuevo?: boolean;
}) {
  return (
    <>
      <span className="tb-pendiente__nuevo" aria-hidden="true">
        {nuevo ? <PuntoEstado tono="azul" /> : null}
      </span>
      <MarcaAgente agente={agente} tam={32} />
      <span className="tb-pendiente__texto">
        <span className="tb-pendiente__titulo">
          {nuevo ? <span className="sr-only">Nuevo: </span> : null}
          {titulo}
        </span>
        <span className="tb-pendiente__meta">{detalle}</span>
      </span>
      <span className="tb-pendiente__lado">
        {urgencia ? <Insignia tono={urgencia.tono}>{urgencia.texto}</Insignia> : null}
        <time className="tb-pendiente__hora cifras">{hora}</time>
      </span>
    </>
  );
}

/* ---------- Lo que preparó el agente (vista previa) ---------- */

function listaNombres(nombres: string[]) {
  if (nombres.length <= 2) return nombres.join(" y ");
  return `${nombres.slice(0, 2).join(", ")} y ${nombres.length - 2} más`;
}

export function VistaPrevia({ vista, texto }: { vista: TipoVista; texto?: string }) {
  if (vista.tipo === "whatsapp") {
    return (
      <div className="tb-previa">
        <div className="tb-previa__para">
          <span className="tb-previa__etiqueta">Para</span>
          <span className="tb-pila" aria-hidden="true">
            {vista.para.slice(0, 3).map((n) => (
              <Avatar key={n} nombre={n} tam={20} />
            ))}
          </span>
          <span className="tb-previa__nombres">{listaNombres(vista.para)}</span>
        </div>
        <div className="tb-burbuja">
          <p>{texto ?? vista.texto}</p>
          <span className="tb-burbuja__pie">
            WhatsApp
            {vista.para.length > 1 ? ` · con el nombre de cada paciente` : null}
          </span>
        </div>
      </div>
    );
  }
  if (vista.tipo === "correo") {
    return (
      <div className="tb-previa">
        <dl className="tb-correo">
          <div>
            <dt>Para</dt>
            <dd>{vista.para}</dd>
          </div>
          <div>
            <dt>Asunto</dt>
            <dd>{vista.asunto}</dd>
          </div>
        </dl>
        <p className="tb-correo__texto">{texto ?? vista.texto}</p>
      </div>
    );
  }
  if (vista.tipo === "documento") {
    return (
      <div className="tb-previa">
        <div className="tb-archivo">
          <span className="tb-archivo__icono" aria-hidden="true">
            <Icono nombre="documento" tam={20} />
          </span>
          <span className="tb-archivo__texto">
            <span className="tb-archivo__nombre">{vista.archivo}</span>
            <span className="tb-archivo__detalle">{vista.detalle}</span>
          </span>
        </div>
        <ul className="tb-puntos">
          {vista.puntos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <div className="tb-previa__para">
          <span className="tb-previa__etiqueta">Para</span>
          <span className="tb-previa__nombres">{vista.para}</span>
        </div>
        <p className="tb-correo__texto">{texto ?? vista.texto}</p>
      </div>
    );
  }
  return (
    <div className="tb-previa">
      <div className="tb-previa__para">
        <span className="tb-previa__etiqueta">De</span>
        <span className="tb-previa__nombres">{vista.de}</span>
      </div>
      <p className="tb-previa__asunto">{vista.asunto}</p>
      <p className="tb-correo__texto">{vista.resumen}</p>
      {vista.sugerencia ? (
        <p className="tb-sugerencia">
          <Icono nombre="flecha" tam={16} />
          <span>
            <span className="tb-fuerte">Clara sugiere:</span> {vista.sugerencia}
          </span>
        </p>
      ) : null}
    </div>
  );
}

/* ---------- Cómo llegó aquí: relevos entre agentes ---------- */

export function Relevos({ pasos, nombreTu }: { pasos: PasoRelevo[]; nombreTu: string }) {
  return (
    <ol className="tb-relevos">
      {pasos.map((p, i) => {
        const tu = p.quien === "tu";
        return (
          <li key={i} className={`tb-relevo${tu ? " tb-relevo--tu" : ""}`}>
            <span className="tb-relevo__quien">
              <Quien quien={p.quien} tam={24} nombreTu={nombreTu} />
            </span>
            <p className="tb-relevo__texto">
              {tu ? null : <span className="tb-fuerte">{AGENTE_POR_ID[p.quien as Exclude<typeof p.quien, "tu">].nombre} </span>}
              <Negritas texto={p.texto} />
              {p.hora ? <time className="tb-relevo__hora cifras">{p.hora}</time> : null}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- La caja de aprobación (un solo botón principal) ---------- */

export function CajaAprobacion({
  titulo,
  detalle,
  revisiones,
  acciones,
  estado = { tono: "atencion", texto: "Espera tu visto bueno" },
}: {
  titulo: string;
  detalle: string;
  revisiones?: string[];
  acciones: ReactNode;
  estado?: { tono: "atencion" | "neutra" | "azul"; texto: string };
}) {
  return (
    <div className="tb-caja">
      <div className="tb-caja__cabeza">
        <div className="tb-caja__titulos">
          <Insignia tono={estado.tono} conPunto>
            {estado.texto}
          </Insignia>
          <p className="tb-caja__titulo">{titulo}</p>
          <p className="tb-caja__detalle">{detalle}</p>
        </div>
      </div>
      {revisiones?.length ? (
        <ul className="tb-caja__revisiones">
          {revisiones.map((r) => (
            <li key={r}>
              <Icono nombre="check" tam={16} className="tb-ok" />
              {r}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="tb-caja__acciones">{acciones}</div>
    </div>
  );
}

/* ---------- La bandeja completa (ejemplo de /pruebalo) ---------- */

export function BandejaPendientes({
  pendientes,
  abierto,
  alAbrir,
  enviando,
  alAprobar,
  alDescartar,
  alGuardarTexto,
  aviso,
  nombreTu,
  vacio,
  cabeza,
}: {
  pendientes: Pendiente[];
  abierto: string | null;
  alAbrir: (id: string | null) => void;
  enviando: string | null;
  alAprobar: (p: Pendiente) => void;
  alDescartar: (p: Pendiente) => void;
  alGuardarTexto: (id: string, texto: string) => void;
  aviso: Aviso | null;
  nombreTu: string;
  vacio: ReactNode;
  cabeza?: ReactNode;
}) {
  const [editando, setEditando] = useState<string | null>(null);
  const [borrador, setBorrador] = useState("");

  const textoDe = (p: Pendiente) => ("texto" in p.vista ? p.vista.texto : "");

  return (
    <section className="tb-tarjeta tb-bandeja" aria-label="Lo que espera tu visto bueno">
      <div className="tb-bandeja__cabeza">
        <div className="tb-bandeja__titulos">
          <p className="tb-bandeja__titulo">
            {pendientes.length
              ? `${pendientes.length} ${pendientes.length === 1 ? "cosa espera" : "cosas esperan"} tu visto bueno`
              : "Nada espera tu visto bueno"}
          </p>
          <p className="tb-bandeja__nota">
            <Icono nombre="escudo" tam={16} />
            Nada sale a tus clientes sin tu permiso.
          </p>
        </div>
        {cabeza}
      </div>

      <div className="tb-bandeja__aviso" role="status" aria-live="polite">
        {aviso ? (
          <p className={`tb-aviso tb-aviso--${aviso.tono}`}>
            <Icono nombre={aviso.tono === "exito" ? "check-circulo" : "alerta"} tam={16} />
            <span className="tb-aviso__texto">
              <Negritas texto={aviso.texto} />
            </span>
            {aviso.accion ? (
              <button type="button" className="tb-enlace" onClick={aviso.accion.alElegir}>
                {aviso.accion.etiqueta}
              </button>
            ) : null}
          </p>
        ) : null}
      </div>

      {pendientes.length === 0 ? (
        vacio
      ) : (
        <ul className="tb-pendientes">
          {pendientes.map((p) => {
            const abierta = abierto === p.id;
            const edita = editando === p.id;
            const agente = AGENTE_POR_ID[p.agente].nombre;
            return (
              <FilaDesplegable
                key={p.id}
                abierta={abierta}
                alAlternar={() => {
                  setEditando(null);
                  alAbrir(abierta ? null : p.id);
                }}
                cabeza={<CabezaPendiente {...p} />}
              >
                <div className="tb-detalle">
                  <div className="tb-detalle__rejilla">
                    <div className="tb-detalle__bloque">
                      <p className="tb-micro">Lo que preparó {agente}</p>
                      {edita ? (
                        <div className="tb-editor">
                          <Campo
                            multilinea
                            etiqueta="Mensaje"
                            value={borrador}
                            alCambiar={setBorrador}
                            maxLength={600}
                            rows={5}
                          />
                          <div className="tb-editor__acciones">
                            <Boton
                              variante="sutil"
                              tam="compacto"
                              disabled={!borrador.trim()}
                              onClick={() => {
                                alGuardarTexto(p.id, borrador.trim());
                                setEditando(null);
                              }}
                            >
                              Guardar cambios
                            </Boton>
                            <Boton variante="fantasma" tam="compacto" onClick={() => setEditando(null)}>
                              Cancelar
                            </Boton>
                          </div>
                        </div>
                      ) : (
                        <VistaPrevia vista={p.vista} />
                      )}
                    </div>
                    <div className="tb-detalle__bloque">
                      <p className="tb-micro">Cómo llegó aquí</p>
                      <Relevos pasos={p.relevos} nombreTu={nombreTu} />
                    </div>
                  </div>
                  <CajaAprobacion
                    titulo={p.caja.titulo}
                    detalle={p.caja.detalle}
                    revisiones={p.caja.revisiones}
                    acciones={
                      <>
                        <Boton
                          tam="compacto"
                          icono={<Icono nombre="check" />}
                          cargando={enviando === p.id}
                          disabled={edita || (enviando !== null && enviando !== p.id)}
                          onClick={() => alAprobar(p)}
                        >
                          {enviando === p.id ? "Enviando…" : p.caja.accion}
                        </Boton>
                        <Boton
                          variante="sutil"
                          tam="compacto"
                          icono={<Icono nombre="documento" />}
                          disabled={edita || enviando === p.id}
                          onClick={() => {
                            setBorrador(textoDe(p));
                            setEditando(p.id);
                          }}
                        >
                          Editar
                        </Boton>
                        <Boton variante="fantasma" tam="compacto" disabled={enviando === p.id} onClick={() => alDescartar(p)}>
                          Descartar
                        </Boton>
                      </>
                    }
                  />
                </div>
              </FilaDesplegable>
            );
          })}
        </ul>
      )}
    </section>
  );
}
