"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { Marca } from "@/components/Logo";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import {
  ACENTOS,
  MAX_FIRMA,
  MAX_REGLAS,
  REGIMENES_FISCALES,
  USOS_CFDI,
  ZONAS_HORARIAS,
  rfcValido,
  type Acento,
  type AjustesCuenta,
  type Avisos,
  type DatosCfdi,
  type Letra,
} from "@/lib/ajustes";
import type { CampoPerfil } from "@/lib/nucleo-tipos";
import { planMinimo } from "@/lib/planes";
import { EVENTO_TEMA, ponerTema, preferenciaActual, type PreferenciaTema } from "@/lib/tema";
import { AvatarAgente } from "./Mensajes";
import { Enlace, Modal, claseBoton } from "./Piezas";

/**
 * AJUSTES: una ventana (no una página) que se abre con el engrane del pie del
 * menú o con cualquier enlace a ?vista=ajustes. A la izquierda, un buscador y
 * las partes; a la derecha, cada ajuste en un renglón (qué es a la izquierda,
 * el control a la derecha), con las medidas de los ajustes de Claude.
 *
 * Todo se guarda de verdad en la cuenta real: el perfil del negocio
 * (perfil_negocio), el equipo (agentes_elegidos), el nombre (la sesión) y lo
 * demás en ajustes_cuenta (src/lib/ajustes.ts), que el chat les pasa a los
 * agentes. Lo que todavía no existe (invitar personas, cobros, avisos por
 * WhatsApp) dice "Pronto". En /pruebalo nada se guarda.
 */

export const IDS_AJUSTE = ["atendel", "apariencia", "negocio", "agentes", "conexiones", "equipo", "notificaciones", "uso", "plan", "privacidad", "cuenta"] as const;
export type IdAjuste = (typeof IDS_AJUSTE)[number];
export const esIdAjuste = (v: unknown): v is IdAjuste => typeof v === "string" && (IDS_AJUSTE as readonly string[]).includes(v);

/** Los campos del perfil del negocio que se editan aquí (los demás, en Tu negocio). */
export const CAMPOS_AJUSTES: { id: CampoPerfil; etiqueta: string; texto: string; ejemplo: string }[] = [
  { id: "a_que_se_dedica", etiqueta: "A qué te dedicas", texto: "En dos o tres líneas, como se lo dirías a un cliente nuevo.", ejemplo: "Atendemos con cita y también vendemos en el local." },
  { id: "servicios_y_precios", etiqueta: "Servicios y precios", texto: "Uno por renglón, con su precio.", ejemplo: "Servicio básico · $350" },
  { id: "horarios", etiqueta: "Horario", texto: "Los días y horas en que atiendes.", ejemplo: "Lunes a viernes de 10:00 a 19:00" },
  { id: "ubicacion", etiqueta: "Ubicación", texto: "Dirección y cómo llegar.", ejemplo: "Calle, número, colonia y ciudad" },
  { id: "formas_de_pago", etiqueta: "Formas de pago", texto: "Cómo te pueden pagar.", ejemplo: "Efectivo, transferencia y tarjeta" },
];

export type DatosAjustes = {
  /** Nombre completo. */
  nombre: string;
  correo: string;
  negocio: string;
  plan: { id: string; nombre: string; usados: number; total: number; agentes: readonly IdAgente[] };
  activos: IdAgente[];
  gmail: boolean;
  /** Las apps conectadas (IdApp). */
  conectadas: string[];
  ajustes: AjustesCuenta;
  /** En /pruebalo, el perfil de ejemplo (en la cuenta real se lee de /api/negocio/perfil). */
  perfil?: Partial<Record<CampoPerfil, string>>;
  hrefs: { agentes: string; apps: string; documentos: string; negocio: string };
  /** Cerrar sesión (cuenta real) o salir de la demostración. */
  salir: { etiqueta: string; texto: string; href?: string; alSalir?: () => void | Promise<void> };
  /** Solo en la cuenta real: cerrar la sesión en todos los dispositivos. */
  salirDeTodo?: () => Promise<void>;
  /** Solo en la cuenta real: cómo se guarda cada cosa (devuelven un error o null). Sin esto, nada se guarda. */
  guardar?: {
    ajustes: (a: AjustesCuenta) => Promise<string | null>;
    perfil: (cambios: Partial<Record<CampoPerfil, string>>) => Promise<string | null>;
    equipo: (agentes: IdAgente[]) => Promise<string | null>;
    nombre: (nombre: string) => Promise<string | null>;
  };
  /** En /pruebalo: los datos son de ejemplo. */
  demo?: boolean;
};

/** Lo que vive en el armazón y se cambia desde aquí. */
export type PreferenciasPanel = {
  menuCompacto: boolean;
  alCambiarMenu: (compacto: boolean) => void;
  infoAlAbrir: boolean;
  alCambiarInfo: (abierta: boolean) => void;
  verEntrada: () => void;
  /** El acento y la letra se ven en todo el panel. */
  alCambiarApariencia: (a: { acento: Acento; letra: Letra }) => void;
};

type Parte = { id: IdAjuste; etiqueta: string; icono: NombreIcono | "marca"; claves: string; grupo: number; sub: string };
const PARTES: Parte[] = [
  { id: "atendel", etiqueta: "Atendel", icono: "marca", claves: "agentes trato tu usted estilo firma emojis tono saben", grupo: 0, sub: "Cómo trabajan tus agentes y lo que saben de tu negocio." },
  { id: "apariencia", etiqueta: "Apariencia", icono: "sol", claves: "tema oscuro claro colores acento letra idioma menu", grupo: 0, sub: "Tema, colores, letra e idioma." },
  { id: "negocio", etiqueta: "Mi negocio", icono: "negocio", claves: "datos horario servicios precios ubicacion pago", grupo: 1, sub: "Datos, horario y servicios. Tus agentes lo leen antes de contestar." },
  { id: "agentes", etiqueta: "Agentes", icono: "agentes", claves: "lola clara victor iris activar desactivar reglas", grupo: 1, sub: "Activa o desactiva a cada uno y dale sus reglas." },
  { id: "conexiones", etiqueta: "Conexiones", icono: "enlace", claves: "whatsapp correo gmail outlook calendario redes instagram google business apps", grupo: 1, sub: "WhatsApp, correo, calendario, redes y Google Business." },
  { id: "equipo", etiqueta: "Equipo", icono: "usuarios", claves: "invitar personas roles agendas", grupo: 1, sub: "Invitar personas, roles y agendas." },
  { id: "notificaciones", etiqueta: "Notificaciones", icono: "campana", claves: "avisos silencio correo noche", grupo: 2, sub: "Qué avisos llegan, por dónde y horas de silencio." },
  { id: "uso", etiqueta: "Uso", icono: "grafica", claves: "mensajes mes reinicia limite", grupo: 2, sub: "Cuánto llevas del plan y cuándo se reinicia." },
  { id: "plan", etiqueta: "Plan y facturación", icono: "facturacion", claves: "plan pago facturas cfdi rfc sat", grupo: 2, sub: "Plan, pago, facturas y datos para CFDI." },
  { id: "privacidad", etiqueta: "Privacidad", icono: "escudo", claves: "aviso borrar exportar datos seguridad", grupo: 3, sub: "Aviso de privacidad, borrar o exportar tus datos y seguridad." },
  { id: "cuenta", etiqueta: "Cuenta", icono: "persona", claves: "perfil nombre correo zona horaria sesion salir", grupo: 3, sub: "Tus datos, zona horaria y sesión." },
];

const COLOR_ACENTO: Record<Acento, { nombre: string; color: string }> = {
  azul: { nombre: "Azul", color: "#3d7bff" },
  morado: { nombre: "Morado", color: "#8052ff" },
  verde: { nombre: "Verde", color: "#1fa77e" },
  ambar: { nombre: "Ámbar", color: "#e09a12" },
};

/** Al abrir, el foco va al contenido (no a la X, que en celular saldría con el anillo azul). React no pasa `autofocus` como atributo: así sí. */
const AUTOFOCO = { autofocus: "" } as unknown as Record<string, never>;

const sinAcentos = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
const numero = new Intl.NumberFormat("es-MX");

/* ---------- Piezas ---------- */

/** Un renglón: qué es (con una línea de ayuda) a la izquierda y el control a la derecha. `hija`: depende del de arriba (va con sangría). */
function Fila({ titulo, texto, children, hija = false, apilada = false }: { titulo: ReactNode; texto?: ReactNode; children?: ReactNode; hija?: boolean; apilada?: boolean }) {
  return (
    <div className="pc-aj-fila" data-hija={hija ? "" : undefined} data-apilada={apilada ? "" : undefined}>
      <div className="pc-aj-fila__texto">
        <p className="pc-aj-fila__titulo">{titulo}</p>
        {texto ? <p className="pc-aj-fila__sub">{texto}</p> : null}
      </div>
      {children ? <div className="pc-aj-fila__control">{children}</div> : null}
    </div>
  );
}

function Grupo({ titulo, texto, children }: { titulo?: string; texto?: string; children: ReactNode }) {
  return (
    <section className="pc-aj-grupo">
      {titulo ? <h3 className="pc-aj-grupo__titulo">{titulo}</h3> : null}
      {texto ? <p className="pc-aj-grupo__texto">{texto}</p> : null}
      {children}
    </section>
  );
}

function Interruptor({ activo, alCambiar, etiqueta, deshabilitado = false }: { activo: boolean; alCambiar?: (v: boolean) => void; etiqueta: string; deshabilitado?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={activo} aria-label={etiqueta} className="pc-aj-switch" disabled={deshabilitado} onClick={() => alCambiar?.(!activo)}>
      <span className="pc-aj-switch__bola" />
    </button>
  );
}

function Segmentos<T extends string>({ opciones, activa, alElegir, etiqueta }: { opciones: { id: T; etiqueta: string }[]; activa: T; alElegir: (id: T) => void; etiqueta: string }) {
  return (
    <div className="pc-aj-seg" role="radiogroup" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={o.id === activa} className="pc-aj-seg__op" onClick={() => alElegir(o.id)}>
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}

function Campo({ valor, alCambiar, etiqueta, ejemplo, max, tipo = "text", ancho = "normal", deshabilitado = false, invalido = false }: { valor: string; alCambiar: (v: string) => void; etiqueta: string; ejemplo?: string; max?: number; tipo?: string; ancho?: "normal" | "chico"; deshabilitado?: boolean; invalido?: boolean }) {
  return (
    <input
      type={tipo}
      className="pc-aj-campo"
      data-ancho={ancho}
      aria-label={etiqueta}
      aria-invalid={invalido || undefined}
      value={valor}
      placeholder={ejemplo}
      maxLength={max}
      disabled={deshabilitado}
      onChange={(e) => alCambiar(e.target.value)}
    />
  );
}

function Area({ valor, alCambiar, etiqueta, ejemplo, max }: { valor: string; alCambiar: (v: string) => void; etiqueta: string; ejemplo?: string; max: number }) {
  return <textarea className="pc-aj-area" aria-label={etiqueta} value={valor} placeholder={ejemplo} maxLength={max} rows={3} onChange={(e) => alCambiar(e.target.value)} />;
}

function Selector({ valor, alCambiar, etiqueta, opciones, vacio }: { valor: string; alCambiar: (v: string) => void; etiqueta: string; opciones: readonly { id: string; nombre: string }[]; vacio?: string }) {
  return (
    <span className="pc-aj-select">
      <select aria-label={etiqueta} value={valor} onChange={(e) => alCambiar(e.target.value)}>
        {vacio ? <option value="">{vacio}</option> : null}
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nombre}
          </option>
        ))}
      </select>
      <Icono nombre="chevron" tam={14} />
    </span>
  );
}

const Pronto = () => <span className="pc-aj-pronto">Pronto</span>;
const Estado = ({ tono, children }: { tono: "exito" | "neutro"; children: ReactNode }) => <span className={`pc-estado pc-estado--${tono}`}>{children}</span>;
const Valor = ({ children }: { children: ReactNode }) => <span className="pc-aj-valor">{children}</span>;

/** El tema: lo de siempre (oscuro, claro o como el sistema), como segmentos. */
function SegmentosTema() {
  const [actual, setActual] = useState<PreferenciaTema>("oscuro");
  useEffect(() => {
    const leer = () => setActual(preferenciaActual());
    leer();
    window.addEventListener(EVENTO_TEMA, leer);
    return () => window.removeEventListener(EVENTO_TEMA, leer);
  }, []);
  return (
    <Segmentos
      etiqueta="Tema"
      activa={actual}
      alElegir={(p) => {
        setActual(p);
        ponerTema(p);
      }}
      opciones={[
        { id: "oscuro", etiqueta: "Oscuro" },
        { id: "claro", etiqueta: "Claro" },
        { id: "sistema", etiqueta: "Sistema" },
      ]}
    />
  );
}

/** Guarda solo, un momento después del último cambio. */
function useGuardadoDiferido<T>(valor: T, guardar: ((v: T) => Promise<string | null>) | undefined, alEstado: (e: EstadoGuardado) => void, espera = 700) {
  const primero = useRef(true);
  useEffect(() => {
    if (primero.current) {
      primero.current = false;
      return;
    }
    if (!guardar) return;
    alEstado("guardando");
    const t = window.setTimeout(async () => {
      const e = await guardar(valor);
      alEstado(e ? { error: e } : "guardado");
    }, espera);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo cuando cambia el valor
  }, [valor]);
}

type EstadoGuardado = "listo" | "guardando" | "guardado" | { error: string };

/* ---------- La ventana ---------- */

export function VentanaAjustes({
  abierta,
  seccion,
  alElegir,
  alCerrar,
  datos,
  preferencias,
}: {
  abierta: boolean;
  seccion: IdAjuste;
  alElegir: (s: IdAjuste) => void;
  alCerrar: () => void;
  datos: DatosAjustes;
  preferencias: PreferenciasPanel;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [saliendo, setSaliendo] = useState(false);
  const [estado, setEstado] = useState<EstadoGuardado>("listo");
  const [ajustes, setAjustes] = useState<AjustesCuenta>(datos.ajustes);
  const [nombre, setNombre] = useState(datos.nombre);
  const [activos, setActivos] = useState<IdAgente[]>(datos.activos);
  const [avisoEquipo, setAvisoEquipo] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Partial<Record<CampoPerfil, string>> | null>(datos.perfil ?? null);
  const [cambiosPerfil, setCambiosPerfil] = useState<Partial<Record<CampoPerfil, string>>>({});
  const guardar = datos.guardar;

  useEffect(() => {
    if (!abierta) setBusqueda("");
  }, [abierta]);

  // Lo que se guarda solo: ajustes, nombre y perfil (el equipo se guarda al momento)
  useGuardadoDiferido(ajustes, guardar?.ajustes, setEstado);
  useGuardadoDiferido(nombre.trim(), guardar ? (n) => (n ? guardar.nombre(n) : Promise.resolve("Escribe tu nombre.")) : undefined, setEstado, 900);
  useGuardadoDiferido(cambiosPerfil, guardar ? (c) => (Object.keys(c).length ? guardar.perfil(c) : Promise.resolve(null)) : undefined, setEstado, 900);

  // El acento y la letra se ven en todo el panel en cuanto cambian
  const { alCambiarApariencia } = preferencias;
  useEffect(() => {
    alCambiarApariencia({ acento: ajustes.acento, letra: ajustes.letra });
  }, [ajustes.acento, ajustes.letra, alCambiarApariencia]);

  // El perfil del negocio se lee la primera vez que se abre "Mi negocio" (cuenta real)
  useEffect(() => {
    if (!abierta || seccion !== "negocio" || perfil || !guardar) return;
    let vivo = true;
    fetch("/api/negocio/perfil", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((p: Partial<Record<CampoPerfil, string>>) => vivo && setPerfil(p))
      .catch(() => vivo && setPerfil({}));
    return () => {
      vivo = false;
    };
  }, [abierta, seccion, perfil, guardar]);

  const cambiar = useCallback(<K extends keyof AjustesCuenta>(k: K, v: AjustesCuenta[K]) => setAjustes((a) => ({ ...a, [k]: v })), []);
  const cambiarAviso = <K extends keyof Avisos>(k: K, v: Avisos[K]) => setAjustes((a) => ({ ...a, avisos: { ...a.avisos, [k]: v } }));
  const cambiarCfdi = <K extends keyof DatosCfdi>(k: K, v: DatosCfdi[K]) => setAjustes((a) => ({ ...a, cfdi: { ...a.cfdi, [k]: v } }));
  const cambiarPerfil = (c: CampoPerfil, v: string) => {
    setPerfil((p) => ({ ...(p ?? {}), [c]: v }));
    setCambiosPerfil((x) => ({ ...x, [c]: v }));
  };

  async function alternarAgente(id: IdAgente) {
    const esta = activos.includes(id);
    if (esta && activos.length === 1) return setAvisoEquipo("Tu equipo necesita al menos un agente.");
    const nuevos = esta ? activos.filter((x) => x !== id) : [...activos, id];
    const antes = activos;
    setActivos(nuevos);
    setAvisoEquipo(null);
    if (!guardar) return;
    setEstado("guardando");
    const e = await guardar.equipo(nuevos);
    if (e) {
      setActivos(antes);
      setEstado({ error: e });
    } else setEstado("guardado");
  }

  const partes = useMemo(() => {
    const q = sinAcentos(busqueda.trim());
    return q ? PARTES.filter((p) => sinAcentos(`${p.etiqueta} ${p.claves} ${p.sub}`).includes(q)) : PARTES;
  }, [busqueda]);
  const parte = PARTES.find((p) => p.id === seccion) ?? PARTES[0];
  const libre = datos.plan.id !== "free";
  const pct = Math.min(100, Math.round((datos.plan.usados / Math.max(1, datos.plan.total)) * 100));
  const reinicio = useMemo(() => {
    const d = new Date();
    return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)));
  }, []);
  const conectada = (app: string) => (app === "gmail" && datos.gmail) || datos.conectadas.includes(app);

  let contenido: ReactNode;
  if (seccion === "atendel") {
    contenido = (
      <>
        <Grupo titulo="Cómo hablan con tus clientes">
          <Fila titulo="Trato" texto="Cómo se dirigen a tus clientes en los mensajes que te proponen.">
            <Segmentos
              etiqueta="Trato"
              activa={ajustes.trato}
              alElegir={(v) => cambiar("trato", v)}
              opciones={[
                { id: "tu", etiqueta: "Tú" },
                { id: "usted", etiqueta: "Usted" },
              ]}
            />
          </Fila>
          <Fila titulo="Estilo" texto="Cálido, formal o al grano.">
            <Segmentos
              etiqueta="Estilo"
              activa={ajustes.estilo}
              alElegir={(v) => cambiar("estilo", v)}
              opciones={[
                { id: "cercano", etiqueta: "Cercano" },
                { id: "formal", etiqueta: "Formal" },
                { id: "breve", etiqueta: "Breve" },
              ]}
            />
          </Fila>
          <Fila titulo="Emojis" texto="Pocos y con medida, en los mensajes para tus clientes.">
            <Interruptor etiqueta="Emojis" activo={ajustes.emojis} alCambiar={(v) => cambiar("emojis", v)} />
          </Fila>
          <Fila titulo="Firma" texto="Con qué nombre firman los mensajes para tus clientes.">
            <Campo etiqueta="Firma" valor={ajustes.firma} alCambiar={(v) => cambiar("firma", v)} ejemplo={datos.negocio} max={MAX_FIRMA} />
          </Fila>
        </Grupo>
        <Grupo titulo="Lo que saben de tu negocio">
          <Fila titulo="Perfil del negocio" texto="A qué te dedicas, servicios, horario y más: lo leen antes de contestar.">
            <button type="button" className={claseBoton("borde", true)} onClick={() => alElegir("negocio")}>
              Editar
            </button>
          </Fila>
          <Fila titulo="Documentos" texto="Listas de precios, políticas, menús: tus agentes los consultan.">
            <Enlace href={datos.hrefs.documentos} className={claseBoton("borde", true)}>
              Ver documentos
            </Enlace>
          </Fila>
        </Grupo>
        <Grupo titulo="Siempre">
          <Fila titulo="Tu visto bueno antes de enviar" texto="Por ahora tus agentes solo leen y te proponen: nada sale a tus clientes sin ti.">
            <Interruptor etiqueta="Tu visto bueno antes de enviar" activo deshabilitado />
          </Fila>
        </Grupo>
      </>
    );
  } else if (seccion === "apariencia") {
    contenido = (
      <>
        <Grupo>
          <Fila titulo="Tema" texto="Oscuro es el de siempre; claro es una tarjeta sobre gris.">
            <SegmentosTema />
          </Fila>
          <Fila titulo="Color" texto="El de los botones, los enlaces y las barras.">
            <div className="pc-aj-colores" role="radiogroup" aria-label="Color">
              {ACENTOS.map((a) => (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={ajustes.acento === a}
                  aria-label={COLOR_ACENTO[a].nombre}
                  title={COLOR_ACENTO[a].nombre}
                  className="pc-aj-color"
                  style={{ background: COLOR_ACENTO[a].color }}
                  onClick={() => cambiar("acento", a)}
                />
              ))}
            </div>
          </Fila>
          <Fila titulo="Tamaño de la letra" texto="La de los mensajes del chat.">
            <Segmentos
              etiqueta="Tamaño de la letra"
              activa={ajustes.letra}
              alElegir={(v) => cambiar("letra", v)}
              opciones={[
                { id: "chica", etiqueta: "Chica" },
                { id: "normal", etiqueta: "Normal" },
                { id: "grande", etiqueta: "Grande" },
              ]}
            />
          </Fila>
          <Fila titulo="Idioma" texto="El panel y tus agentes hablan español. Inglés llega pronto.">
            <Valor>Español (México)</Valor>
          </Fila>
        </Grupo>
        <Grupo titulo="Panel">
          <Fila titulo="Menú lateral" texto="Compacto deja solo los íconos.">
            <Segmentos
              etiqueta="Menú lateral"
              activa={preferencias.menuCompacto ? "compacto" : "completo"}
              alElegir={(id) => preferencias.alCambiarMenu(id === "compacto")}
              opciones={[
                { id: "completo", etiqueta: "Completo" },
                { id: "compacto", etiqueta: "Compacto" },
              ]}
            />
          </Fila>
          <Fila titulo="Información a la derecha" texto="Que el resumen de tu negocio se abra solo al entrar (en pantallas anchas).">
            <Interruptor etiqueta="Información a la derecha" activo={preferencias.infoAlAbrir} alCambiar={preferencias.alCambiarInfo} />
          </Fila>
          <Fila titulo="Animación de entrada" texto="Los fragmentos que forman el logo al entrar. Sale una vez por pestaña.">
            <button type="button" className={claseBoton("borde", true)} onClick={preferencias.verEntrada}>
              Verla otra vez
            </button>
          </Fila>
        </Grupo>
      </>
    );
  } else if (seccion === "negocio") {
    contenido = (
      <>
        <Grupo>
          <Fila titulo="Nombre del negocio">
            <Valor>{datos.negocio}</Valor>
          </Fila>
          {perfil === null ? (
            <p className="pc-aj-cargando">Cargando tu perfil…</p>
          ) : (
            CAMPOS_AJUSTES.map((c) => (
              <Fila key={c.id} titulo={c.etiqueta} texto={c.texto} apilada>
                <Area etiqueta={c.etiqueta} valor={perfil[c.id] ?? ""} alCambiar={(v) => cambiarPerfil(c.id, v)} ejemplo={c.ejemplo} max={2000} />
              </Fila>
            ))
          )}
        </Grupo>
        <Grupo>
          <Fila titulo="Más de tu negocio" texto="Políticas, preguntas frecuentes, el tono y tus documentos.">
            <Enlace href={datos.hrefs.negocio} className={claseBoton("borde", true)}>
              Ir a Tu negocio
            </Enlace>
          </Fila>
        </Grupo>
      </>
    );
  } else if (seccion === "agentes") {
    contenido = (
      <>
        {!libre ? <p className="pc-aj-nota">Con Atendel Free trabajas con Clara. Con One se suma Lola, y con Max tienes a todo el equipo.</p> : null}
        {avisoEquipo ? <p className="pc-aj-nota pc-aj-nota--error">{avisoEquipo}</p> : null}
        <Grupo>
          {AGENTES_INFO.map((a) => {
            const enPlan = datos.plan.agentes.includes(a.id);
            const activo = activos.includes(a.id) && enPlan;
            return (
              <div key={a.id} className="pc-aj-bloque">
                <Fila
                  titulo={
                    <span className="pc-aj-agente">
                      <AvatarAgente agente={a.id} tam={26} />
                      {a.nombre} · {a.area}
                    </span>
                  }
                  texto={enPlan ? a.lema : `Disponible con ${planMinimo(a.id).nombre}.`}
                >
                  <Interruptor etiqueta={`${a.nombre} en tu equipo`} activo={activo} deshabilitado={!enPlan || !libre} alCambiar={() => alternarAgente(a.id)} />
                </Fila>
                {activo ? (
                  <Fila titulo={`Reglas para ${a.nombre}`} texto="Lo que siempre debe tomar en cuenta." hija apilada>
                    <Area
                      etiqueta={`Reglas para ${a.nombre}`}
                      valor={ajustes.reglas[a.id] ?? ""}
                      alCambiar={(v) => cambiar("reglas", { ...ajustes.reglas, [a.id]: v })}
                      ejemplo={a.id === "lola" ? "Ej.: Confirma las citas un día antes. No des precios por mensaje." : a.id === "clara" ? "Ej.: Lo de proveedores no es urgente." : a.id === "victor" ? "Ej.: A quien no viene en 2 meses, mándale un saludo." : "Ej.: Los reportes, en pesos y por semana."}
                      max={MAX_REGLAS}
                    />
                  </Fila>
                ) : null}
              </div>
            );
          })}
        </Grupo>
        <Grupo>
          <Fila titulo="Todo de tus agentes" texto="Qué hace cada uno y con qué apps trabaja.">
            <Enlace href={datos.hrefs.agentes} className={claseBoton("borde", true)}>
              Ir a Agentes
            </Enlace>
          </Fila>
        </Grupo>
      </>
    );
  } else if (seccion === "conexiones") {
    const apps: { app: string; titulo: string; texto: string }[] = [
      { app: "whatsapp_business", titulo: "WhatsApp", texto: "Lola lee tus mensajes y te propone respuestas." },
      { app: "gmail", titulo: "Correo · Gmail", texto: "Clara lo lee. Solo lectura: nunca envía ni borra nada." },
      { app: "outlook", titulo: "Correo · Outlook", texto: "Lo mismo, si usas Outlook." },
      { app: "google_calendar", titulo: "Calendario", texto: "Lola ve tu agenda: qué citas tienes y qué horas quedan libres." },
      { app: "instagram", titulo: "Redes · Instagram", texto: "Los mensajes directos de tu cuenta de negocio." },
      { app: "messenger", titulo: "Redes · Messenger", texto: "Los mensajes de tu página de Facebook." },
      { app: "google_business", titulo: "Google Business", texto: "Víctor lee tus reseñas de Google y te propone respuestas." },
    ];
    contenido = (
      <>
        <Grupo>
          {apps.map((a) => (
            <Fila key={a.app} titulo={a.titulo} texto={a.texto}>
              <Estado tono={conectada(a.app) ? "exito" : "neutro"}>{conectada(a.app) ? "Conectada" : "Sin conectar"}</Estado>
              <Enlace href={`${datos.hrefs.apps}&app=${a.app}`} className={claseBoton("borde", true)}>
                {conectada(a.app) ? "Ver" : "Conectar"}
              </Enlace>
            </Fila>
          ))}
        </Grupo>
        <Grupo>
          <Fila titulo="Todas las apps" texto="Pagos, tiendas, notas y más: cada una con tu propia cuenta y solo para leer.">
            <Enlace href={datos.hrefs.apps} className={claseBoton("borde", true)}>
              Ver apps
            </Enlace>
          </Fila>
        </Grupo>
      </>
    );
  } else if (seccion === "equipo") {
    contenido = (
      <>
        <Grupo>
          <Fila titulo="Invitar personas" texto="Por ahora cada cuenta es de una persona. Pronto podrás invitar a quien te ayuda en el negocio.">
            <Pronto />
            <button type="button" className={claseBoton("borde", true)} disabled>
              <Icono nombre="mas" tam={16} />
              Invitar
            </button>
          </Fila>
        </Grupo>
        <Grupo titulo="Personas" texto="Quién entra a este panel, qué puede hacer y con qué agenda trabaja.">
          <div className="pc-aj-tabla" role="table" aria-label="Personas">
            <div className="pc-aj-tabla__fila pc-aj-tabla__fila--cabeza" role="row">
              <span role="columnheader">Nombre</span>
              <span role="columnheader">Rol</span>
              <span role="columnheader">Agenda</span>
            </div>
            <div className="pc-aj-tabla__fila" role="row">
              <span role="cell" className="pc-aj-tabla__nombre">
                <span className="pc-aj-avatar pc-aj-avatar--chico" aria-hidden="true">
                  {(nombre.trim()[0] ?? "A").toUpperCase()}
                </span>
                {nombre || "Tú"} <span className="pc-aj-tabla__tu">(tú)</span>
              </span>
              <span role="cell">Dueño</span>
              <span role="cell">{conectada("google_calendar") ? "Google Calendar" : "Sin agenda conectada"}</span>
            </div>
          </div>
        </Grupo>
        <Grupo titulo="Roles y agendas">
          <Fila titulo="Roles" texto="Dar permisos distintos a cada persona (por ejemplo, que vea citas pero no números).">
            <Pronto />
          </Fila>
          <Fila titulo="Agenda por persona" texto="Que Lola sepa la agenda de cada quien al dar citas.">
            <Pronto />
          </Fila>
        </Grupo>
      </>
    );
  } else if (seccion === "notificaciones") {
    const av = ajustes.avisos;
    contenido = (
      <>
        <p className="pc-aj-nota">Hoy los avisos salen en el panel (el número junto a Pendientes). Por correo llegan pronto: lo que elijas aquí ya queda guardado.</p>
        <Grupo titulo="Qué te avisamos">
          <Fila titulo="Pendientes nuevos" texto="Cuando algo espera tu visto bueno.">
            <Interruptor etiqueta="Pendientes nuevos" activo={av.pendientes} alCambiar={(v) => cambiarAviso("pendientes", v)} />
          </Fila>
          <Fila titulo="Citas" texto="Citas nuevas, cambios y cancelaciones.">
            <Interruptor etiqueta="Citas" activo={av.citas} alCambiar={(v) => cambiarAviso("citas", v)} />
          </Fila>
          <Fila titulo="Correos urgentes" texto="Cuando Clara marca algo como urgente.">
            <Interruptor etiqueta="Correos urgentes" activo={av.urgentes} alCambiar={(v) => cambiarAviso("urgentes", v)} />
          </Fila>
          <Fila titulo="Resumen del día" texto="Lo importante del día, en un solo aviso.">
            <Interruptor etiqueta="Resumen del día" activo={av.resumen} alCambiar={(v) => cambiarAviso("resumen", v)} />
          </Fila>
        </Grupo>
        <Grupo titulo="Por dónde">
          <Fila titulo="En el panel" texto="Siempre activo.">
            <Interruptor etiqueta="En el panel" activo deshabilitado />
          </Fila>
          <Fila titulo="Por correo" texto={datos.correo ? `A ${datos.correo}.` : "A tu correo."}>
            <Pronto />
            <Interruptor etiqueta="Por correo" activo={av.correo} alCambiar={(v) => cambiarAviso("correo", v)} />
          </Fila>
          <Fila titulo="Por WhatsApp" texto="A tu número.">
            <Pronto />
            <Interruptor etiqueta="Por WhatsApp" activo={false} deshabilitado />
          </Fila>
        </Grupo>
        <Grupo titulo="Horas de silencio">
          <Fila titulo="No molestar en la noche" texto="Los avisos esperan a la mañana (lo urgente también).">
            <Interruptor etiqueta="No molestar en la noche" activo={av.silencio} alCambiar={(v) => cambiarAviso("silencio", v)} />
          </Fila>
          <Fila titulo="Horario" texto="En la zona horaria de tu cuenta." hija>
            <span className="pc-aj-horas">
              <Campo tipo="time" etiqueta="Desde" valor={av.desde} alCambiar={(v) => cambiarAviso("desde", v)} ancho="chico" deshabilitado={!av.silencio} />
              <span>a</span>
              <Campo tipo="time" etiqueta="Hasta" valor={av.hasta} alCambiar={(v) => cambiarAviso("hasta", v)} ancho="chico" deshabilitado={!av.silencio} />
            </span>
          </Fila>
        </Grupo>
      </>
    );
  } else if (seccion === "uso") {
    contenido = (
      <>
        <Grupo>
          <div className="pc-aj-uso">
            <div className="pc-aj-uso__fila">
              <p>
                <strong>{numero.format(datos.plan.usados)}</strong> de {numero.format(datos.plan.total)} mensajes este mes
              </p>
              <p className="pc-aj-uso__pct">{pct} %</p>
            </div>
            <div className="pc-barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Mensajes del mes usados">
              <span className="pc-barra__lleno" style={{ "--v": pct / 100 } as CSSProperties} />
            </div>
          </div>
          <Fila titulo="Te quedan" texto="Mensajes de este mes.">
            <Valor>{numero.format(Math.max(0, datos.plan.total - datos.plan.usados))}</Valor>
          </Fila>
          <Fila titulo="Se reinicia" texto="El primer día de cada mes.">
            <Valor>{reinicio}</Valor>
          </Fila>
        </Grupo>
        <Grupo titulo="Cómo se cuenta">
          <Fila titulo="Un mensaje" texto="Cada mensaje que le mandas a tu equipo y cada pregunta a la gráfica de tu resumen." />
          <Fila titulo="Si se acaban" texto="Tu equipo deja de contestar en el chat hasta el día 1. Lo que ya leyó y tus datos se quedan.">
            <button type="button" className={claseBoton("borde", true)} onClick={() => alElegir("plan")}>
              Ver mi plan
            </button>
          </Fila>
        </Grupo>
      </>
    );
  } else if (seccion === "plan") {
    const c = ajustes.cfdi;
    const rfcMal = c.rfc.length > 0 && !rfcValido(c.rfc);
    contenido = (
      <>
        <Grupo>
          <Fila titulo="Tu plan" texto="El plan no se cambia desde el panel: escríbenos y lo hacemos contigo.">
            <Valor>{datos.plan.nombre}</Valor>
            <Enlace href="/precios" className={claseBoton("borde", true)}>
              Ver los planes
            </Enlace>
          </Fila>
        </Grupo>
        <Grupo titulo="Pago">
          <Fila titulo="Forma de pago" texto="Todavía no se cobra desde el panel: Free no cuesta y One y Max abren por etapas.">
            <Pronto />
          </Fila>
          <Fila titulo="Facturas" texto="Aquí aparecerán tus facturas, con su PDF y su XML.">
            <Valor>Todavía no hay facturas</Valor>
          </Fila>
        </Grupo>
        <Grupo titulo="Datos para tu CFDI" texto="Tu factura saldrá con estos datos, tal como están en tu Constancia de Situación Fiscal.">
          <Fila titulo="RFC" texto={rfcMal ? "Revisa el RFC: 12 caracteres si es empresa, 13 si es persona." : "De 12 o 13 caracteres."}>
            <Campo etiqueta="RFC" valor={c.rfc} alCambiar={(v) => cambiarCfdi("rfc", v.toUpperCase().replace(/[^A-ZÑ&0-9]/g, ""))} ejemplo="XAXX010101000" max={13} invalido={rfcMal} />
          </Fila>
          <Fila titulo="Nombre o razón social" texto="Sin el régimen de capital (sin S.A. de C.V.).">
            <Campo etiqueta="Nombre o razón social" valor={c.razonSocial} alCambiar={(v) => cambiarCfdi("razonSocial", v)} max={254} />
          </Fila>
          <Fila titulo="Régimen fiscal">
            <Selector etiqueta="Régimen fiscal" valor={c.regimen} alCambiar={(v) => cambiarCfdi("regimen", v)} opciones={REGIMENES_FISCALES} vacio="Elige tu régimen" />
          </Fila>
          <Fila titulo="Código postal" texto="El de tu domicilio fiscal.">
            <Campo etiqueta="Código postal" valor={c.codigoPostal} alCambiar={(v) => cambiarCfdi("codigoPostal", v.replace(/\D/g, ""))} ejemplo="06000" max={5} ancho="chico" />
          </Fila>
          <Fila titulo="Uso del CFDI">
            <Selector etiqueta="Uso del CFDI" valor={c.uso} alCambiar={(v) => cambiarCfdi("uso", v)} opciones={USOS_CFDI} />
          </Fila>
          <Fila titulo="Correo para facturas" texto="A dónde mandamos el PDF y el XML.">
            <Campo tipo="email" etiqueta="Correo para facturas" valor={c.correo} alCambiar={(v) => cambiarCfdi("correo", v)} ejemplo={datos.correo} max={254} />
          </Fila>
        </Grupo>
      </>
    );
  } else if (seccion === "privacidad") {
    contenido = (
      <>
        <Grupo titulo="Tus datos">
          <Fila titulo="Aviso de privacidad" texto="Cómo cuidamos y usamos tus datos. Lo publicamos pronto; si tienes dudas, escríbenos.">
            <Enlace href="/contacto" className={claseBoton("borde", true)}>
              Escríbenos
            </Enlace>
          </Fila>
          <Fila titulo="Exportar tus datos" texto="Un archivo con tu perfil, ajustes, conversaciones y documentos.">
            {datos.demo ? (
              <button type="button" className={claseBoton("borde", true)} disabled>
                En tu cuenta
              </button>
            ) : (
              <a href="/api/cuenta/exportar" download className={claseBoton("borde", true)}>
                Exportar
              </a>
            )}
          </Fila>
          <Fila titulo="Borrar tu cuenta" texto="Escríbenos y la borramos con todo lo que tiene.">
            <Enlace href="/contacto" className={claseBoton("borde", true)}>
              Escríbenos
            </Enlace>
          </Fila>
        </Grupo>
        <Grupo titulo="Seguridad">
          <Fila titulo="Solo lectura" texto="Por ahora tu equipo solo lee lo que conectas: no envía, no borra ni paga nada por su cuenta.">
            <Estado tono="exito">Activo</Estado>
          </Fila>
          <Fila titulo="Contraseñas y llaves" texto="Atendel nunca te las pide en el chat. Si alguien lo hace a nombre de Atendel, no las des." />
          <Fila titulo="Cada cuenta ve solo lo suyo" texto="Nadie más puede leer tus conversaciones ni tus números." />
        </Grupo>
      </>
    );
  } else {
    contenido = (
      <>
        <Grupo titulo="Perfil">
          <Fila titulo="Foto de perfil" texto="Por ahora, la inicial de tu nombre.">
            <span className="pc-aj-avatar" aria-hidden="true">
              {(nombre.trim()[0] ?? "A").toUpperCase()}
            </span>
          </Fila>
          <Fila titulo="Nombre" texto="Como te saludan tus agentes.">
            <Campo etiqueta="Nombre" valor={nombre} alCambiar={setNombre} max={80} />
          </Fila>
          <Fila titulo="Correo" texto={datos.demo ? "Un correo de ejemplo: no es de nadie." : "Con el que entras a Atendel."}>
            <Valor>{datos.correo}</Valor>
          </Fila>
          <Fila titulo="Zona horaria" texto="Para tus citas y las horas que mencionan tus agentes.">
            <Selector etiqueta="Zona horaria" valor={ajustes.zonaHoraria} alCambiar={(v) => cambiar("zonaHoraria", v)} opciones={ZONAS_HORARIAS} />
          </Fila>
        </Grupo>
        <Grupo titulo="Sesión">
          <Fila titulo={datos.salir.etiqueta} texto={datos.salir.texto}>
            {datos.salir.href ? (
              <Enlace href={datos.salir.href} className={claseBoton("borde", true)}>
                <Icono nombre="cerrar-sesion" tam={16} />
                {datos.salir.etiqueta}
              </Enlace>
            ) : (
              <button
                type="button"
                className={claseBoton("borde", true)}
                disabled={saliendo}
                onClick={async () => {
                  setSaliendo(true);
                  await datos.salir.alSalir?.();
                }}
              >
                <Icono nombre="cerrar-sesion" tam={16} />
                {datos.salir.etiqueta}
              </button>
            )}
          </Fila>
          {datos.salirDeTodo ? (
            <Fila titulo="Cerrar sesión en todos lados" texto="En todas las computadoras y celulares donde entraste con esta cuenta.">
              <button
                type="button"
                className={claseBoton("borde", true)}
                disabled={saliendo}
                onClick={async () => {
                  setSaliendo(true);
                  await datos.salirDeTodo?.();
                }}
              >
                Cerrar en todos
              </button>
            </Fila>
          ) : null}
        </Grupo>
      </>
    );
  }

  const textoEstado = datos.demo ? "Ejemplo: no se guarda" : estado === "guardando" ? "Guardando…" : estado === "guardado" ? "Guardado" : typeof estado === "object" ? estado.error : "";
  return (
    <Modal
      abierto={abierta}
      alCerrar={alCerrar}
      titulo={
        <>
          Ajustes
          {textoEstado ? (
            <span className="pc-aj__estado" data-error={typeof estado === "object" ? "" : undefined} aria-live="polite">
              {textoEstado}
            </span>
          ) : null}
        </>
      }
      ancho="ancho"
      className="pc-ajustes"
    >
      <div className="pc-aj">
        <nav className="pc-aj__nav" aria-label="Partes de Ajustes">
          <label className="pc-aj__buscar">
            <Icono nombre="buscar" tam={16} />
            <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar" aria-label="Buscar en Ajustes" />
          </label>
          <ul className="pc-aj__lista">
            {partes.map((p, i) => (
              <li key={p.id} data-corte={i > 0 && partes[i - 1].grupo !== p.grupo ? "" : undefined}>
                <button type="button" className="pc-aj__parte" aria-current={p.id === seccion ? "page" : undefined} onClick={() => alElegir(p.id)}>
                  {p.icono === "marca" ? <Marca className="pc-aj__marca" /> : <Icono nombre={p.icono} tam={18} />}
                  {p.etiqueta}
                </button>
              </li>
            ))}
            {partes.length === 0 ? <li className="pc-aj__nada">Nada con “{busqueda.trim()}”.</li> : null}
          </ul>
        </nav>
        <div className="pc-aj__contenido" key={seccion} tabIndex={-1} {...AUTOFOCO}>
          <h2 className="pc-aj__titulo">{parte.etiqueta}</h2>
          <p className="pc-aj__sub">{parte.sub}</p>
          {datos.demo ? <p className="pc-aj__aviso">Datos de ejemplo de Estudio Luna: puedes mover todo, pero nada se guarda.</p> : null}
          {contenido}
        </div>
      </div>
    </Modal>
  );
}
