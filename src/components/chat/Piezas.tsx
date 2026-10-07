"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Texto } from "@/components/Texto";
import { Personaje } from "@/components/agentes/Personaje";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, AGENTES_INFO, IDS_AGENTES, type IdAgente } from "@/lib/agentes";

/*
 * Piezas del chat de Atendel con el lenguaje de producto de la casa (estilo
 * GitHub): superficies #0d1117 / #151a22, bordes de 1px, paneles de 6px,
 * etiquetas en Mona Sans Mono como sellos de hora. Las usan el chat de
 * demostración (ChatDemo, en el inicio y en /pruebalo) y el chat real del
 * panel (/panel/chat). El estilo vive en src/estilos/chat.css (".conversa").
 *
 * Jerarquía de un hilo:
 * - Lo que escribes tú: burbuja a la derecha, en la superficie secundaria.
 * - Lo que escribe un agente: sin caja; su personaje, su nombre, su área y la
 *   hora arriba, y el texto abajo (como una respuesta en un hilo de trabajo).
 * - Lo que el agente dejó hecho (una cita, un archivo): una tarjeta de 6px
 *   pegada a su mensaje. Es la única "caja" y siempre trae un resultado.
 * - Avisos del sistema ("Creaste el grupo…"): una línea con ícono, sin caja.
 */

/** "Lola", "Lola y Víctor", "Lola, Clara e Iris". */
export function nombres(ids: readonly IdAgente[]) {
  const n = ids.map((id) => AGENTE_POR_ID[id].nombre);
  if (n.length < 2) return n.join("");
  const ultimo = n[n.length - 1];
  return `${n.slice(0, -1).join(", ")} ${/^[iIíÍ]/.test(ultimo) ? "e" : "y"} ${ultimo}`;
}

/* ---------------------------------------------------------------------
   Caras: el personaje en un círculo, o los de un grupo encimados
   --------------------------------------------------------------------- */

/** Posición de cada cara en una caja de 40px (se escala al tamaño pedido). */
const ACOMODO: Record<number, { x: number; y: number; s: number }[]> = {
  1: [{ x: 0, y: 0, s: 40 }],
  2: [
    { x: 0, y: 0, s: 28 },
    { x: 12, y: 12, s: 28 },
  ],
  3: [
    { x: 0, y: 2, s: 24 },
    { x: 16, y: 2, s: 24 },
    { x: 8, y: 16, s: 24 },
  ],
  4: [
    { x: 0, y: 0, s: 22 },
    { x: 18, y: 0, s: 22 },
    { x: 0, y: 18, s: 22 },
    { x: 18, y: 18, s: 22 },
  ],
};

export function Caras({ agentes, tam }: { agentes: readonly IdAgente[]; tam: number }) {
  const k = tam / 40;
  const acomodo = ACOMODO[Math.min(Math.max(agentes.length, 1), 4)];
  return (
    <span className="conversa__caras" style={{ width: tam, height: tam }} aria-hidden="true">
      {agentes.slice(0, 4).map((id, i) => {
        const p = acomodo[i];
        return (
          <span
            key={id}
            className="conversa__cara"
            data-sola={agentes.length === 1 ? "" : undefined}
            style={{ left: p.x * k, top: p.y * k, width: p.s * k, height: p.s * k }}
          >
            <Personaje agente={id} avatar />
          </span>
        );
      })}
    </span>
  );
}

/* ---------------------------------------------------------------------
   Piezas del hilo
   --------------------------------------------------------------------- */

/** Resalta @menciones y /acciones dentro del mensaje de la persona. */
function TextoTuyo({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/((?:^|\s)[@/][\wÀ-ÿ-]+)/g).map((p, i) =>
        /^\s?[@/]/.test(p) ? (
          <Fragment key={i}>
            {/^\s/.test(p) ? p[0] : ""}
            <span className="conversa__token">{p.trim()}</span>
          </Fragment>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

export type Fila = {
  /** Primer mensaje de un bloque seguido de la misma persona: lleva encabezado. */
  primero: boolean;
  /** Último del bloque: lleva la hora (en tus mensajes). */
  ultimo: boolean;
  /** Recién llegado: entra con un fundido corto. */
  nueva?: boolean;
  /** Separación amplia arriba (empieza un bloque nuevo). */
  bloque?: boolean;
  hora?: string;
};

const clasesFila = (base: string, { nueva, bloque }: Pick<Fila, "nueva" | "bloque">) =>
  `${base}${nueva ? " conversa__entra" : ""}${bloque ? " conversa__fila--bloque" : ""}`;

/** Separador del día: línea fina con "HOY", "AYER", "LUNES 12 SEP." en Mono. */
export function Dia({ children }: { children: ReactNode }) {
  return (
    <p className="conversa__dia">
      <span>{children}</span>
    </p>
  );
}

/** Aviso del sistema ("Creaste el grupo…") o error: una línea con ícono, sin caja. */
export function Sistema({
  texto,
  error = false,
  icono = "usuarios",
  ...fila
}: Partial<Fila> & { texto: string; error?: boolean; icono?: NombreIcono }) {
  return (
    <p
      className={clasesFila(`conversa__evento${error ? " conversa__evento--error" : ""}`, fila)}
      role={error ? "alert" : undefined}
    >
      <span className="conversa__evento-icono">
        <Icono nombre={error ? "alerta" : icono} tam={16} />
      </span>
      <span className="conversa__evento-texto">{texto}</span>
      {fila.hora ? <time className="conversa__hora">{fila.hora}</time> : null}
    </p>
  );
}

/** Lo tuyo: burbuja a la derecha, superficie secundaria y borde de 1px. */
export function MensajeTuyo({ texto, ...fila }: Fila & { texto: string }) {
  return (
    <div className={clasesFila("conversa__fila conversa__fila--tu", fila)}>
      <p className="conversa__burbuja" data-primero={fila.primero ? "" : undefined} data-ultimo={fila.ultimo ? "" : undefined}>
        <TextoTuyo texto={texto} />
      </p>
      {fila.ultimo && fila.hora ? (
        <time className="conversa__hora conversa__hora--tu">
          <span className="sr-only">Tú, a las </span>
          {fila.hora}
        </time>
      ) : null}
    </div>
  );
}

/** Encabezado del bloque de un agente: nombre, área (en grupos) y hora. */
function Encabezado({ agente, area, hora }: { agente: IdAgente; area?: boolean; hora?: string }) {
  const info = AGENTE_POR_ID[agente];
  return (
    <p className="conversa__quien">
      <span className="conversa__nombre">{info.nombre}</span>
      {area ? <span className="conversa__area">{info.area}</span> : null}
      {hora ? <time className="conversa__hora">{hora}</time> : null}
    </p>
  );
}

/** Algo que el agente dejó hecho y se adjunta a su mensaje (una cita, un archivo). */
export type Tarjeta = {
  icono: NombreIcono;
  /** Sello en Mono: "CITA CONFIRMADA", "ARCHIVO · EXCEL". */
  sello: string;
  titulo: string;
  detalle: string;
  /** Línea final con el estado (ej. "Confirmación enviada por WhatsApp"). */
  pie?: string;
};

export function TarjetaResultado({ tarjeta }: { tarjeta: Tarjeta }) {
  return (
    <div className="conversa__tarjeta">
      <span className="conversa__tarjeta-icono">
        <Icono nombre={tarjeta.icono} tam={20} />
      </span>
      <div className="min-w-0">
        <p className="conversa__tarjeta-sello">{tarjeta.sello}</p>
        <p className="conversa__tarjeta-titulo">{tarjeta.titulo}</p>
        <p className="conversa__tarjeta-detalle">{tarjeta.detalle}</p>
        {tarjeta.pie ? (
          <p className="conversa__tarjeta-pie">
            <Icono nombre="check" tam={16} />
            {tarjeta.pie}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Lo que escribe un agente: su personaje, encabezado y el texto, sin caja. */
export function MensajeAgente({
  agente,
  texto,
  enGrupo = false,
  tarjeta,
  pie,
  ...fila
}: Fila & { agente: IdAgente; texto: string; enGrupo?: boolean; tarjeta?: Tarjeta; pie?: ReactNode }) {
  return (
    <div className={clasesFila("conversa__fila conversa__fila--agente", fila)}>
      <span className="conversa__avatar">{fila.primero ? <Caras agentes={[agente]} tam={28} /> : null}</span>
      <div className="conversa__columna">
        {fila.primero ? <Encabezado agente={agente} area={enGrupo} hora={fila.hora} /> : null}
        <div className="conversa__texto">
          <Texto texto={texto} />
        </div>
        {tarjeta ? <TarjetaResultado tarjeta={tarjeta} /> : null}
        {pie}
      </div>
    </div>
  );
}

/** "Lola está escribiendo": su personaje y tres puntos que laten (solo opacidad). */
export function Escribiendo({ agente, sigue, enGrupo = false }: { agente: IdAgente; sigue: boolean; enGrupo?: boolean }) {
  const info = AGENTE_POR_ID[agente];
  return (
    <div className={`conversa__fila conversa__fila--agente conversa__entra${sigue ? "" : " conversa__fila--bloque"}`}>
      <span className="conversa__avatar">{sigue ? null : <Caras agentes={[agente]} tam={28} />}</span>
      <div className="conversa__columna">
        {sigue ? null : <Encabezado agente={agente} area={enGrupo} />}
        <span className="conversa__puntos" role="status" aria-label={`${info.nombre} está escribiendo`}>
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Barra lateral: secciones, filas de conversación, filtro
   --------------------------------------------------------------------- */

/** Título de sección de la lista ("GRUPOS 2") en Mono, con su contador. */
export function SeccionLista({ titulo, cuenta, children }: { titulo: string; cuenta?: number; children: ReactNode }) {
  return (
    <div className="conversa__seccion">
      <p className="conversa__seccion-titulo">
        {titulo}
        {cuenta !== undefined ? <span className="conversa__contador">{cuenta}</span> : null}
      </p>
      {children}
    </div>
  );
}

/** Contenido de una fila de la lista: caras, nombre, hora y una línea de vista previa. */
export function ContenidoFila({
  agentes,
  nombre,
  hora,
  linea,
  escribiendo,
  sinLeer,
}: {
  agentes: readonly IdAgente[];
  nombre: ReactNode;
  hora?: string;
  linea: ReactNode;
  /** Si alguien escribe ahora, la línea lo dice en azul cielo. */
  escribiendo?: string | null;
  sinLeer?: number;
}) {
  return (
    <>
      <Caras agentes={agentes} tam={32} />
      <span className="conversa__fila-cuerpo">
        <span className="conversa__fila-arriba">
          <span className="conversa__fila-nombre">{nombre}</span>
          {hora ? <span className="conversa__fila-hora">{hora}</span> : null}
        </span>
        <span className="conversa__fila-abajo">
          {escribiendo ? (
            <span className="conversa__fila-linea conversa__fila-linea--escribe">{escribiendo}</span>
          ) : (
            <span className="conversa__fila-linea">{linea}</span>
          )}
          {sinLeer ? (
            <span className="conversa__sin-leer">
              {sinLeer}
              <span className="sr-only"> sin leer</span>
            </span>
          ) : null}
        </span>
      </span>
    </>
  );
}

/** Campo para filtrar la lista de chats. */
export function FiltroChats({ valor, alCambiar }: { valor: string; alCambiar: (v: string) => void }) {
  return (
    <label className="conversa__filtro">
      <span className="sr-only">Buscar en tus chats</span>
      <svg className="conversa__filtro-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
      <input
        type="search"
        value={valor}
        placeholder="Buscar en tus chats"
        autoComplete="off"
        enterKeyHint="search"
        onChange={(e) => alCambiar(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && valor && (e.stopPropagation(), alCambiar(""))}
      />
    </label>
  );
}

/**
 * Fila que se desliza para borrar (en pantallas táctiles): al arrastrarla a
 * la izquierda aparece "Borrar" detrás; si pasa la mitad o se suelta con
 * impulso, se borra; si no, regresa. Con mouse y teclado está el botón ✕.
 * Solo se mueve con transform; con movimiento reducido no hay animación de
 * regreso (la base deja solo opacidad).
 */
export function FilaDeslizable({ children, alBorrar, etiqueta }: { children: ReactNode; alBorrar: () => void; etiqueta: string }) {
  const filaRef = useRef<HTMLDivElement>(null);
  const toque = useRef<{ id: number; x: number; y: number; t: number; dx: number; activo: boolean } | null>(null);
  const [arrastra, setArrastra] = useState(false);
  const recienArrastrada = useRef(false);
  const ANCHO = 88;

  const mover = (dx: number) => {
    const el = filaRef.current;
    if (!el) return;
    // Más allá del botón, con resistencia
    const x = dx < -ANCHO * 2 ? -ANCHO * 2 + (dx + ANCHO * 2) * 0.25 : Math.min(0, dx);
    el.style.transform = x ? `translateX(${x}px)` : "";
  };

  const abajo = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse" || toque.current) return;
    toque.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, activo: false };
  };
  const mueve = (e: ReactPointerEvent) => {
    const t = toque.current;
    if (!t || t.id !== e.pointerId) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    if (!t.activo) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        toque.current = null; // es scroll vertical
        return;
      }
      if (Math.abs(dx) < 10) return;
      t.activo = true;
      setArrastra(true);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* sin captura no pasa nada */
      }
    }
    t.dx = dx;
    mover(dx);
  };
  const suelta = (e: ReactPointerEvent) => {
    const t = toque.current;
    toque.current = null;
    if (!t || t.id !== e.pointerId || !t.activo) return;
    setArrastra(false);
    recienArrastrada.current = true;
    window.setTimeout(() => (recienArrastrada.current = false), 0);
    const velocidad = Math.abs(t.dx) / Math.max(1, performance.now() - t.t);
    const borra = t.dx < -ANCHO * 1.4 || (t.dx < -24 && velocidad > 0.6);
    mover(0);
    if (borra) alBorrar();
  };

  return (
    <div className="conversa__desliza" data-arrastra={arrastra ? "" : undefined}>
      <span className="conversa__desliza-fondo" aria-hidden="true">
        <Icono nombre="cerrar" tam={16} />
        Borrar
      </span>
      <div
        ref={filaRef}
        className="conversa__desliza-fila"
        onPointerDown={abajo}
        onPointerMove={mueve}
        onPointerUp={suelta}
        onPointerCancel={suelta}
        onClickCapture={(e) => {
          // Un arrastre no debe abrir la conversación
          if (recienArrastrada.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        aria-label={etiqueta}
        role="group"
      >
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Panel de detalles (derecha): secciones con título en Mono
   --------------------------------------------------------------------- */

export function SeccionDetalles({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="conversa__detalle">
      <h3 className="conversa__detalle-titulo">{titulo}</h3>
      {children}
    </section>
  );
}

/** Integrantes de la conversación: personaje, nombre y lo que lleva. */
export function Integrantes({ agentes }: { agentes: readonly IdAgente[] }) {
  return (
    <ul className="conversa__integrantes">
      {agentes.map((id) => {
        const a = AGENTE_POR_ID[id];
        return (
          <li key={id}>
            <Caras agentes={[id]} tam={24} />
            <span className="min-w-0">
              <span className="conversa__integrante-nombre">{a.nombre}</span>
              <span className="conversa__integrante-papel">
                {a.area} · {a.abarca}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Lista de acciones "/" que se pueden pedir con un clic. */
export function ListaAcciones({
  acciones,
  alElegir,
  deshabilitada = false,
}: {
  acciones: readonly { key: string; name: string; description?: string; agente?: IdAgente }[];
  alElegir: (nombre: string) => void;
  deshabilitada?: boolean;
}) {
  return (
    <ul className="conversa__acciones">
      {acciones.map((a) => (
        <li key={a.key}>
          <button type="button" className="conversa__accion" disabled={deshabilitada} onClick={() => alElegir(a.name)}>
            <span className="conversa__accion-nombre">{a.name}</span>
            {a.description ? <span className="conversa__accion-desc">{a.description}</span> : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------------
   Nuevo grupo: ventana para elegir agentes y ponerle nombre
   --------------------------------------------------------------------- */

export function NuevoGrupo({
  onCrear,
  onCerrar,
  disponibles = IDS_AGENTES,
  nombreObligatorio = true,
  maxNombre = 40,
}: {
  onCrear: (nombre: string, agentes: IdAgente[]) => void;
  onCerrar: () => void;
  /** Agentes que se pueden elegir (los demás se ven apagados). */
  disponibles?: readonly IdAgente[];
  nombreObligatorio?: boolean;
  maxNombre?: number;
}) {
  const [elegidos, setElegidos] = useState<IdAgente[]>([]);
  const [nombre, setNombre] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const faltaNombre = nombreObligatorio && nombre.trim().length === 0;
  const listo = elegidos.length >= 2 && !faltaNombre;
  const ayuda =
    elegidos.length < 2
      ? `Elige ${elegidos.length === 0 ? "a dos o más" : "a uno más"}`
      : faltaNombre
        ? "Falta el nombre del grupo"
        : `Con ${nombres(elegidos)}`;

  const cerrarRef = useRef(onCerrar);
  cerrarRef.current = onCerrar;
  useEffect(() => {
    const antes = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLButtonElement>("button[aria-pressed]:not(:disabled)")?.focus({ preventScroll: true });
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrarRef.current();
      // Mantener el foco dentro de la ventana
      if (e.key === "Tab" && panelRef.current) {
        const focos = panelRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), input");
        const primero = focos[0];
        const ultimo = focos[focos.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    };
    window.addEventListener("keydown", tecla);
    return () => {
      window.removeEventListener("keydown", tecla);
      antes?.focus?.({ preventScroll: true });
    };
  }, []);

  const alternar = (id: IdAgente) =>
    setElegidos((e) => (e.includes(id) ? e.filter((x) => x !== id) : IDS_AGENTES.filter((x) => x === id || e.includes(x))));
  const crear = () => listo && onCrear(nombre.trim(), elegidos);

  return (
    <div className="conversa__capa" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div ref={panelRef} className="conversa__ventana" role="dialog" aria-modal="true" aria-labelledby="nuevo-grupo-titulo">
        <div className="conversa__ventana-cabeza">
          <h2 id="nuevo-grupo-titulo" className="conversa__ventana-titulo">
            Nuevo grupo
          </h2>
          <button type="button" className="conversa__icono" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" tam={16} />
          </button>
        </div>

        <div className="conversa__ventana-cuerpo">
          <p className="conversa__ventana-texto">
            Elige a quién incluir. Contesta quien sepa del tema y se complementan entre ellos.
          </p>
          <ul className="conversa__elegir-lista" aria-label="Agentes">
            {AGENTES_INFO.map((a) => {
              const puede = disponibles.includes(a.id);
              const elegido = elegidos.includes(a.id);
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    className="conversa__elegir"
                    aria-pressed={elegido}
                    disabled={!puede}
                    onClick={() => alternar(a.id)}
                  >
                    <span className="conversa__casilla" aria-hidden="true">
                      <Icono nombre="check" tam={12} trazo={2} />
                    </span>
                    <Caras agentes={[a.id]} tam={28} />
                    <span className="min-w-0 flex-1 text-left">
                      <span className="conversa__integrante-nombre">{a.nombre}</span>
                      <span className="conversa__integrante-papel">{puede ? `${a.area} · ${a.abarca}` : "No está en tu equipo"}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <label className="conversa__etiqueta-campo" htmlFor="nuevo-grupo-nombre">
            {nombreObligatorio ? "Nombre del grupo" : "Nombre o tema (opcional)"}
          </label>
          <input
            id="nuevo-grupo-nombre"
            className="conversa__campo"
            value={nombre}
            maxLength={maxNombre}
            placeholder={nombreObligatorio ? "Ej. Promociones de diciembre" : "Ej. Recepción, campaña de noviembre"}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && crear()}
            enterKeyHint="done"
            autoComplete="off"
          />
        </div>

        <div className="conversa__ventana-pie">
          <p className="conversa__ventana-ayuda" aria-live="polite">
            {ayuda}
          </p>
          <div className="conversa__ventana-botones">
            <button type="button" className="boton boton--fantasma boton--chico" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="button" className="boton boton--principal boton--chico" disabled={!listo} onClick={crear}>
              Crear grupo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
