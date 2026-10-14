"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Boton } from "@/components/base/Boton";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Kbd } from "@/components/base/Kbd";
import { PuntoEstado, type TonoEstado } from "@/components/base/PuntoEstado";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { useTablero } from "./contexto";
import { MarcaAgente, MarcaConversacion } from "./Marcas";
import type { ConversacionReciente, Destacado, Destino, DiaActividad, Evento, Pendiente } from "./tipos";

/* =====================================================================
   Piezas del centro de la vista Resumen (las usan la demo y el panel).
   ===================================================================== */

/** Enlace o botón según el destino (en la demo no se recarga la página). */
export function Ir({ destino, className, children, etiqueta }: { destino: Destino; className: string; children: ReactNode; etiqueta?: string }) {
  if (destino.href)
    return (
      <Link href={destino.href} className={className} aria-label={etiqueta}>
        {children}
      </Link>
    );
  return (
    <button type="button" className={className} onClick={destino.alElegir} aria-label={etiqueta}>
      {children}
    </button>
  );
}

/** Encabezado de un bloque: título a la izquierda, un enlace discreto a la derecha. */
export function CabezaBloque({ id, titulo, extra, ver }: { id: string; titulo: string; extra?: ReactNode; ver?: Destino & { etiqueta: string } }) {
  return (
    <div className="bloque__cabeza">
      <h2 id={id} className="t-app-mediano">
        {titulo}
      </h2>
      {extra}
      {ver ? (
        <Ir destino={ver} className="bloque__ver">
          {ver.etiqueta}
          <Icono nombre="chevron-derecha" tam={16} />
        </Ir>
      ) : null}
    </div>
  );
}

/* ---------- Bienvenida: el momento protagonista de la pantalla ---------- */
export function Bienvenida({
  fecha,
  marca,
  saludo,
  resumen,
  acciones,
  equipo,
}: {
  fecha: string;
  marca?: ReactNode;
  saludo: string;
  resumen: ReactNode;
  acciones: ReactNode;
  /** Quién trabaja hoy: los personajes en fila, arriba a la derecha. */
  equipo?: { id: IdAgente; etiqueta: string }[];
}) {
  const { abrirPaleta, abrirAtajos, esMac } = useTablero();
  return (
    <section className="bienvenida" aria-labelledby="bienvenida-saludo">
      <div className="bienvenida__fecha">
        <span className="cifras" suppressHydrationWarning>
          {fecha}
        </span>
        {marca}
        {equipo?.length ? (
          <ul className="bienvenida__equipo" aria-label="Tu equipo hoy">
            {equipo.map((a) => (
              <li key={a.id} title={`${AGENTE_POR_ID[a.id].nombre}: ${a.etiqueta}`}>
                <MarcaAgente agente={a.id} />
                <span className="sr-only">
                  {AGENTE_POR_ID[a.id].nombre}: {a.etiqueta}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <h1 id="bienvenida-saludo" className="t-app-saludo bienvenida__saludo" suppressHydrationWarning>
        {saludo}
      </h1>
      <p className="bienvenida__resumen">{resumen}</p>
      <div className="bienvenida__acciones">{acciones}</div>
      <p className="bienvenida__consejo">
        <Icono nombre="rayo" tam={16} />
        <span>
          Pulsa{" "}
          <button type="button" className="bienvenida__tecla" onClick={abrirPaleta} aria-label="Abrir la paleta de comandos">
            <Kbd teclas={[esMac ? "⌘" : "Ctrl", "K"]} />
          </button>{" "}
          para saltar a cualquier vista, agente o conversación, o{" "}
          <button type="button" className="bienvenida__tecla" onClick={abrirAtajos} aria-label="Ver los atajos de teclado">
            <Kbd>?</Kbd>
          </button>{" "}
          para ver todos los atajos.
        </span>
      </p>
    </section>
  );
}

/* ---------- Línea de tiempo de actividad (como el feed de un repositorio) ---------- */
const ICONO_EVENTO: Record<Evento["tipo"], NombreIcono> = {
  cita: "calendario",
  correo: "correo",
  recordatorio: "reloj",
  relevo: "repetir",
  archivo: "documento",
  mensaje: "mensaje",
  reporte: "grafica",
};

function DetalleEvento({ e }: { e: Evento }) {
  const d = e.detalle;
  if (!d) return null;
  if (d.tipo === "lista")
    return (
      <div className="evento__detalle">
        {d.titulo ? <p className="evento__detalle-titulo">{d.titulo}</p> : null}
        <ul className="evento__renglones">
          {d.renglones.map((r) => (
            <li key={r.texto}>
              <Insignia tono={r.tono}>{r.marca}</Insignia>
              <span>{r.texto}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  if (d.tipo === "archivo")
    return (
      <div className="evento__detalle evento__detalle--fila">
        <span className="evento__archivo" aria-hidden="true">
          <Icono nombre="documento" tam={20} />
        </span>
        <span className="evento__archivo-texto">
          <span className="evento__archivo-nombre">{d.nombre}</span>
          <span className="evento__sub">{d.descripcion}</span>
        </span>
      </div>
    );
  if (d.tipo === "cita")
    return (
      <div className="evento__detalle evento__detalle--fila">
        <span className="evento__archivo" aria-hidden="true">
          <Icono nombre="calendario" tam={20} />
        </span>
        <span className="evento__archivo-texto">
          <span className="evento__archivo-nombre">{d.quien}</span>
          <span className="evento__sub">{d.servicio}</span>
        </span>
        <span className="evento__cuando cifras">{d.cuando}</span>
      </div>
    );
  return (
    <div className="evento__detalle evento__detalle--fila">
      {e.para ? (
        <>
          <Icono nombre="flecha" tam={16} className="evento__flecha" />
          <MarcaAgente agente={e.para} />
        </>
      ) : null}
      <span className="evento__sub evento__sub--texto">{d.texto}</span>
    </div>
  );
}

export function LineaTiempo({ dias, vacio }: { dias: DiaActividad[]; vacio?: ReactNode }) {
  if (!dias.length) return <>{vacio}</>;
  return (
    <div className="linea">
      {dias.map((d) => (
        <section key={d.dia} className="linea__dia" aria-label={d.dia}>
          <h3 className="linea__titulo">{d.dia}</h3>
          <ol className="linea__lista">
            {d.eventos.map((e) => (
              <li key={e.id} className="evento">
                <span className="evento__riel">
                  <MarcaAgente agente={e.agente} />
                  <span className="evento__tipo" title={e.tipo}>
                    <Icono nombre={ICONO_EVENTO[e.tipo]} tam={16} />
                  </span>
                </span>
                <div className="evento__cuerpo">
                  <div className="evento__linea">
                    <p className="evento__texto">
                      <strong>{AGENTE_POR_ID[e.agente].nombre}</strong> {e.texto}
                    </p>
                    <time className="evento__hora cifras">{e.hora}</time>
                  </div>
                  {e.insignia ? (
                    <Insignia tono={e.insignia.tono} conPunto className="evento__insignia">
                      {e.insignia.texto}
                    </Insignia>
                  ) : null}
                  <DetalleEvento e={e} />
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/* ---------- Espera tu visto bueno ---------- */
export function ListaPendientes({
  pendientes,
  aprobados,
  alAprobar,
  alDeshacer,
  alEditar,
}: {
  pendientes: Pendiente[];
  aprobados: Set<string>;
  alAprobar: (id: string) => void;
  alDeshacer: (id: string) => void;
  alEditar: (p: Pendiente) => void;
}) {
  return (
    <ul className="pendientes">
      {pendientes.map((p) => {
        const listo = aprobados.has(p.id);
        const info = AGENTE_POR_ID[p.agente];
        return (
          <li key={p.id} className="pendiente" data-listo={listo || undefined}>
            <div className="pendiente__cabeza">
              <MarcaAgente agente={p.agente} />
              <p className="pendiente__titulo">
                <strong>{info.nombre}</strong> preparó: {p.titulo}
              </p>
              <span className="evento__hora cifras">{p.cuando}</span>
            </div>
            <blockquote className="pendiente__mensaje">{p.mensaje}</blockquote>
            <p className="pendiente__para">
              <Icono nombre="usuarios" tam={16} />
              Para {p.para} · {p.canal}
            </p>
            {p.nota ? <p className="pendiente__nota">{p.nota}</p> : null}
            <div className="pendiente__acciones" aria-live="polite">
              {listo ? (
                <>
                  <Insignia tono="exito" conPunto>
                    Aprobado: {info.nombre} lo envía
                  </Insignia>
                  <Boton variante="fantasma" tam="compacto" onClick={() => alDeshacer(p.id)}>
                    Deshacer
                  </Boton>
                </>
              ) : (
                <>
                  <Boton variante="sutil" tam="compacto" icono={<Icono nombre="check" tam={16} />} onClick={() => alAprobar(p.id)}>
                    Aprobar
                  </Boton>
                  <Boton variante="fantasma" tam="compacto" onClick={() => alEditar(p)}>
                    Cambiar algo en el chat
                  </Boton>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Destacados ---------- */
export function ListaDestacados({ destacados, vacio }: { destacados: Destacado[]; vacio?: ReactNode }) {
  if (!destacados.length) return <>{vacio}</>;
  return (
    <ul className="lista-caja">
      {destacados.map((d) => (
        <li key={d.id} className="destacado">
          <MarcaAgente agente={d.agente} />
          <div className="destacado__texto">
            <Insignia tono={d.tono}>{d.marca}</Insignia>
            <p>{d.texto}</p>
          </div>
          <span className="evento__hora cifras">{d.cuando}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Agentes fijados (como los repositorios fijados) ---------- */
export type TarjetaFijada = Destino & {
  id: IdAgente;
  tono: TonoEstado;
  estado: string;
  pulso?: boolean;
  dato?: string;
  bloqueado?: string;
};

export function AgentesFijados({ agentes }: { agentes: TarjetaFijada[] }) {
  return (
    <ul className="fijados">
      {agentes.map((a) => {
        const info = AGENTE_POR_ID[a.id];
        return (
          <li key={a.id} className="fijado" data-bloqueado={a.bloqueado ? "true" : undefined}>
            <div className="fijado__cabeza">
              <MarcaAgente agente={a.id} apagado={Boolean(a.bloqueado)} />
              <Ir destino={a} className="fijado__nombre" etiqueta={a.bloqueado ? `${info.nombre}: ${a.bloqueado}` : `Hablar con ${info.nombre}`}>
                {info.nombre}
              </Ir>
              <span className="fijado__area">{info.area}</span>
              <Icono nombre={a.bloqueado ? "candado" : "fijar"} tam={16} className="fijado__pin" />
            </div>
            <p className="fijado__lema">{info.lema}</p>
            <div className="fijado__pie">
              {a.bloqueado ? (
                <span>{a.bloqueado}</span>
              ) : (
                <>
                  <PuntoEstado tono={a.tono} etiqueta={a.estado} mostrarEtiqueta pulso={a.pulso} />
                  {a.dato ? <span className="cifras">{a.dato}</span> : null}
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Conversaciones recientes ---------- */
export function ConversacionesRecientes({ conversaciones, vacio }: { conversaciones: ConversacionReciente[]; vacio?: ReactNode }) {
  if (!conversaciones.length) return <>{vacio}</>;
  return (
    <ul className="lista-caja">
      {conversaciones.map((c) => (
        <li key={c.id}>
          <Ir destino={c} className="reciente">
            <MarcaConversacion agentes={c.agentes} tam={40} />
            <span className="reciente__texto">
              <span className="reciente__nombre">{c.nombre}</span>
              <span className="reciente__vista">{c.vistaPrevia}</span>
            </span>
            <span className="reciente__fin">
              <span className="cifras" suppressHydrationWarning>
                {c.cuando}
              </span>
              {c.sinLeer ? <Insignia contador={c.sinLeer} solida etiqueta={`${c.sinLeer} sin leer`} /> : null}
            </span>
          </Ir>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Estado vacío ---------- */
export function Vacio({
  agente,
  icono = "check-circulo",
  titulo,
  texto,
  accion,
  pronto,
}: {
  agente?: IdAgente;
  icono?: NombreIcono;
  titulo: string;
  texto: ReactNode;
  accion?: ReactNode;
  pronto?: boolean;
}) {
  return (
    <div className="vacio">
      {agente ? <MarcaAgente agente={agente} tam="chica" /> : <span className="vacio__icono"><Icono nombre={icono} tam={20} /></span>}
      <div className="vacio__texto">
        <p className="t-app-mediano">
          {titulo} {pronto ? <Insignia tono="pronto">Pronto</Insignia> : null}
        </p>
        <p>{texto}</p>
        {accion ? <div className="vacio__accion">{accion}</div> : null}
      </div>
    </div>
  );
}

/** Esqueleto mientras carga: tres renglones que respiran (solo opacidad). */
export function Cargando({ renglones = 3, etiqueta = "Cargando…" }: { renglones?: number; etiqueta?: string }) {
  return (
    <div className="cargando" role="status" aria-label={etiqueta}>
      {Array.from({ length: renglones }, (_, i) => (
        <div key={i} className="cargando__renglon">
          <span className="cargando__circulo" />
          <span className="cargando__lineas">
            <span />
            <span />
          </span>
        </div>
      ))}
    </div>
  );
}
