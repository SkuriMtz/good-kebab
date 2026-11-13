"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { Marca } from "@/components/Logo";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import {
  ACENTOS,
  FUENTES,
  IDIOMAS,
  MAX_FIRMA,
  NOMBRE_FUENTE,
  NOMBRE_RESPUESTAS,
  RESPUESTAS,
  MAX_INSTRUCCIONES,
  MAX_REGLAS,
  REGIMENES_FISCALES,
  USOS_CFDI,
  ZONAS_HORARIAS,
  rfcValido,
  type Acento,
  type Fuente,
  type LetraRespuestas,
  type AjustesCuenta,
  aparienciaDe,
  type Apariencia,
  type Avisos,
  type DatosCfdi,
} from "@/lib/ajustes";
import { mostrarWhatsapp, normalizarWhatsapp, type ContactoEquipo } from "@/lib/equipo";
import { MAX_DOCUMENTOS_POR_PLAN, MAX_MB_DOCUMENTOS_POR_PLAN, espacioDe, formatoPeso, type CampoPerfil } from "@/lib/nucleo-tipos";
import { planMinimo } from "@/lib/planes";
import { EVENTO_TEMA, ponerTema, preferenciaActual, type PreferenciaTema } from "@/lib/tema";
import { AvatarAgente } from "./Mensajes";
import { Enlace, Modal, claseBoton } from "./Piezas";
import { useFuenteNegocio } from "./negocio/fuente";
import { cuandoReinicia, pctDe, type EstadoUso } from "@/lib/uso-estado";

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
  /** El plan y su uso (como Claude: sesión de 5 horas y semana, en porcentaje). */
  plan: { id: string; nombre: string; uso: EstadoUso; agentes: readonly IdAgente[] };
  activos: IdAgente[];
  /** Tu equipo del negocio (a quién se le pueden mandar cosas por WhatsApp). */
  contactos: ContactoEquipo[];
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
    contactos: { agregar: (c: Omit<ContactoEquipo, "id">) => Promise<ContactoEquipo | string>; quitar: (id: string) => Promise<string | null> };
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
  /** El acento, la letra, el ancho y lo demás de Apariencia se ven en todo el panel. */
  alCambiarApariencia: (a: Apariencia) => void;
};

type Parte = { id: IdAjuste; etiqueta: string; icono: NombreIcono | "marca"; claves: string; grupo: number; sub: string };

/**
 * Lo que hay dentro de cada parte, para el buscador: el renglón (su título,
 * tal cual sale) y otras palabras con que alguien lo buscaría. Al elegirlo se
 * abre esa parte y el renglón se marca un momento.
 */
type Opcion = { parte: IdAjuste; titulo: string; claves?: string };
const OPCIONES: Opcion[] = [
  { parte: "atendel", titulo: "Tus instrucciones", claves: "como escriben trato tono estilo forma de hablar ia prompt clientes" },
  { parte: "atendel", titulo: "Firma", claves: "nombre mensajes despedida" },
  { parte: "atendel", titulo: "Perfil del negocio", claves: "datos negocio" },
  { parte: "atendel", titulo: "Documentos", claves: "archivos pdf docx subir" },
  { parte: "atendel", titulo: "Tu visto bueno antes de enviar", claves: "aprobar aprobacion enviar revisar" },
  { parte: "apariencia", titulo: "Tema", claves: "oscuro claro sistema modo noche dia" },
  { parte: "apariencia", titulo: "Color", claves: "acento azul morado rosa rojo ambar verde turquesa grafito gris botones" },
  { parte: "apariencia", titulo: "Letra de la interfaz", claves: `fuente tipografia tipo de letra panel ${FUENTES.map((f) => NOMBRE_FUENTE[f]).join(" ")}` },
  { parte: "apariencia", titulo: "Letra de las respuestas", claves: `fuente tipografia serif respuestas ${RESPUESTAS.map((f) => NOMBRE_RESPUESTAS[f]).join(" ")}` },
  { parte: "apariencia", titulo: "Tamaño del texto del chat", claves: "letra grande chica tamano texto" },
  { parte: "apariencia", titulo: "Espacio entre renglones", claves: "interlineado renglones lineas amplio compacto" },
  { parte: "apariencia", titulo: "Ancho de la conversación", claves: "angosto ancho columna chat" },
  { parte: "apariencia", titulo: "Densidad", claves: "compacta espaciosa espacio juntas separadas menu mensajes" },
  { parte: "apariencia", titulo: "Hora de cada mensaje", claves: "hora mensajes ocultar mostrar tiempo" },
  { parte: "apariencia", titulo: "Movimiento", claves: "animaciones reducir movimiento accesibilidad" },
  { parte: "apariencia", titulo: "Contraste alto", claves: "contraste leer vista accesibilidad bordes" },
  { parte: "apariencia", titulo: "Subrayar enlaces", claves: "enlaces links subrayado accesibilidad" },
  { parte: "apariencia", titulo: "Idioma", claves: `lenguaje traducir language ${IDIOMAS.map((i) => `${i.es} ${i.nombre}`).join(" ")}` },
  { parte: "apariencia", titulo: "Menú lateral", claves: "compacto barra iconos" },
  { parte: "apariencia", titulo: "Información a la derecha", claves: "panel resumen lateral" },
  { parte: "apariencia", titulo: "Animación de entrada", claves: "fragmentos logo inicio" },
  { parte: "negocio", titulo: "Nombre del negocio", claves: "nombre empresa" },
  { parte: "negocio", titulo: "A qué te dedicas", claves: "giro descripcion" },
  { parte: "negocio", titulo: "Servicios y precios", claves: "precios lista servicios costos" },
  { parte: "negocio", titulo: "Horario", claves: "horas dias abierto" },
  { parte: "negocio", titulo: "Ubicación", claves: "direccion como llegar mapa" },
  { parte: "negocio", titulo: "Formas de pago", claves: "efectivo tarjeta transferencia" },
  { parte: "agentes", titulo: "Lola", claves: "atencion whatsapp citas activar reglas" },
  { parte: "agentes", titulo: "Clara", claves: "correo gmail activar reglas" },
  { parte: "agentes", titulo: "Víctor", claves: "clientes seguimiento activar reglas" },
  { parte: "agentes", titulo: "Iris", claves: "oficina excel reportes activar reglas" },
  { parte: "conexiones", titulo: "WhatsApp", claves: "whatsapp business mensajes" },
  { parte: "conexiones", titulo: "Correo · Gmail", claves: "gmail google correo" },
  { parte: "conexiones", titulo: "Correo · Outlook", claves: "outlook hotmail microsoft correo" },
  { parte: "conexiones", titulo: "Calendario", claves: "google calendar agenda" },
  { parte: "conexiones", titulo: "Redes · Instagram", claves: "instagram redes" },
  { parte: "conexiones", titulo: "Redes · Messenger", claves: "facebook messenger redes" },
  { parte: "conexiones", titulo: "Google Business", claves: "resenas reseñas google maps perfil" },
  { parte: "conexiones", titulo: "Todas las apps", claves: "stripe drive excel apps conectar" },
  { parte: "equipo", titulo: "Invitar personas", claves: "invitar empleados acceso" },
  { parte: "equipo", titulo: "Roles", claves: "permisos" },
  { parte: "equipo", titulo: "Agenda por persona", claves: "agenda calendario empleados" },
  { parte: "notificaciones", titulo: "Pendientes nuevos", claves: "avisos aprobar" },
  { parte: "notificaciones", titulo: "Citas", claves: "avisos agenda" },
  { parte: "notificaciones", titulo: "Correos urgentes", claves: "avisos correo" },
  { parte: "notificaciones", titulo: "Resumen del día", claves: "avisos resumen diario" },
  { parte: "notificaciones", titulo: "Por correo", claves: "avisos email" },
  { parte: "notificaciones", titulo: "Por WhatsApp", claves: "avisos whatsapp" },
  { parte: "notificaciones", titulo: "No molestar en la noche", claves: "silencio noche horas" },
  { parte: "uso", titulo: "Sesión actual", claves: "sesion limite 5 horas reinicia porcentaje usado uso" },
  { parte: "uso", titulo: "Esta semana", claves: "semana semanal limite reinicia lunes porcentaje usado uso" },
  { parte: "uso", titulo: "Documentos", claves: "documentos archivos limite guardados" },
  { parte: "uso", titulo: "Espacio de tus documentos", claves: "espacio megas mb gb almacenamiento archivos peso" },
  { parte: "uso", titulo: "Si llegas al límite", claves: "limite se acaba mensajes reinicio" },
  { parte: "uso", titulo: "No contamos mensajes", claves: "como se mide uso mensajes tokens" },
  { parte: "uso", titulo: "Rápido o Avanzado", claves: "modelo rapido avanzado haiku opus gasta" },
  { parte: "plan", titulo: "Tu plan", claves: "plan max one free cambiar" },
  { parte: "plan", titulo: "Forma de pago", claves: "tarjeta pagar cobro" },
  { parte: "plan", titulo: "Facturas", claves: "facturas recibos" },
  { parte: "plan", titulo: "RFC", claves: "rfc sat cfdi" },
  { parte: "plan", titulo: "Nombre o razón social", claves: "razon social cfdi" },
  { parte: "plan", titulo: "Régimen fiscal", claves: "regimen sat cfdi" },
  { parte: "plan", titulo: "Código postal", claves: "cp cfdi" },
  { parte: "plan", titulo: "Uso del CFDI", claves: "uso cfdi g03" },
  { parte: "plan", titulo: "Correo para facturas", claves: "correo facturas cfdi" },
  { parte: "privacidad", titulo: "Aviso de privacidad", claves: "privacidad aviso" },
  { parte: "privacidad", titulo: "Exportar tus datos", claves: "descargar exportar copia datos" },
  { parte: "privacidad", titulo: "Borrar tu cuenta", claves: "eliminar borrar cuenta datos" },
  { parte: "privacidad", titulo: "Contraseñas y llaves", claves: "contrasena llaves seguridad tokens" },
  { parte: "cuenta", titulo: "Foto de perfil", claves: "foto avatar imagen" },
  { parte: "cuenta", titulo: "Nombre", claves: "nombre perfil" },
  { parte: "cuenta", titulo: "Correo", claves: "email correo electronico" },
  { parte: "cuenta", titulo: "Zona horaria", claves: "hora horario zona" },
  { parte: "cuenta", titulo: "Cerrar sesión en todos lados", claves: "salir sesion dispositivos" },
];
const PARTES: Parte[] = [
  { id: "atendel", etiqueta: "Atendel", icono: "marca", claves: "agentes instrucciones como escriben clientes trato tono estilo firma saben", grupo: 0, sub: "Cómo trabajan tus agentes y lo que saben de tu negocio." },
  { id: "apariencia", etiqueta: "Apariencia", icono: "sol", claves: "tema oscuro claro colores acento letra idioma menu", grupo: 0, sub: "Tema, colores, letra e idioma." },
  { id: "negocio", etiqueta: "Mi negocio", icono: "negocio", claves: "datos horario servicios precios ubicacion pago", grupo: 1, sub: "Datos, horario y servicios. Tus agentes lo leen antes de contestar." },
  { id: "agentes", etiqueta: "Agentes", icono: "agentes", claves: "lola clara victor iris activar desactivar reglas", grupo: 1, sub: "Activa o desactiva a cada uno y dale sus reglas." },
  { id: "conexiones", etiqueta: "Conexiones", icono: "enlace", claves: "whatsapp correo gmail outlook calendario redes instagram google business apps", grupo: 1, sub: "WhatsApp, correo, calendario, redes y Google Business." },
  { id: "equipo", etiqueta: "Equipo", icono: "usuarios", claves: "invitar personas roles agendas whatsapp contactos telefono", grupo: 1, sub: "Las personas de tu negocio y su WhatsApp; invitar, roles y agendas." },
  { id: "notificaciones", etiqueta: "Notificaciones", icono: "campana", claves: "avisos silencio correo noche", grupo: 2, sub: "Qué avisos llegan, por dónde y horas de silencio." },
  { id: "uso", etiqueta: "Uso", icono: "grafica", claves: "uso sesion semana reinicia limite", grupo: 2, sub: "Cuánto llevas de tu sesión y de la semana." },
  { id: "plan", etiqueta: "Plan y facturación", icono: "facturacion", claves: "plan pago facturas cfdi rfc sat", grupo: 2, sub: "Plan, pago, facturas y datos para CFDI." },
  { id: "privacidad", etiqueta: "Privacidad", icono: "escudo", claves: "aviso borrar exportar datos seguridad", grupo: 3, sub: "Aviso de privacidad, borrar o exportar tus datos y seguridad." },
  { id: "cuenta", etiqueta: "Cuenta", icono: "persona", claves: "perfil nombre correo zona horaria sesion salir", grupo: 3, sub: "Tus datos, zona horaria y sesión." },
];

/** Con qué letra se ve cada opción en su desplegable (las variables las pone el armazón del panel). */
const LETRA_FUENTE: Record<Fuente, string> = {
  geist: "var(--font-geist-sans), sans-serif",
  inter: "var(--font-inter), sans-serif",
  "dm-sans": "var(--font-dm-sans), sans-serif",
  manrope: "var(--font-manrope), sans-serif",
  plex: "var(--font-plex), sans-serif",
  nunito: "var(--font-nunito), sans-serif",
  grotesk: "var(--font-grotesk), sans-serif",
  atkinson: "var(--font-atkinson), sans-serif",
  sistema: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};
const LETRA_RESPUESTAS: Record<LetraRespuestas, string> = {
  sans: "var(--pc-sans)",
  "source-serif": "var(--pc-serif)",
  newsreader: "var(--font-newsreader), serif",
  lora: "var(--font-lora), serif",
  literata: "var(--font-literata), serif",
  merriweather: "var(--font-merriweather), serif",
  fraunces: "var(--font-fraunces), serif",
  atkinson: "var(--font-atkinson), sans-serif",
};

const COLOR_ACENTO: Record<Acento, { nombre: string; color: string }> = {
  azul: { nombre: "Azul", color: "#3d7bff" },
  morado: { nombre: "Morado", color: "#8052ff" },
  rosa: { nombre: "Rosa", color: "#e0408f" },
  rojo: { nombre: "Rojo", color: "#e5484d" },
  ambar: { nombre: "Ámbar", color: "#e09a12" },
  verde: { nombre: "Verde", color: "#1fa77e" },
  turquesa: { nombre: "Turquesa", color: "#14a5b8" },
  grafito: { nombre: "Grafito", color: "#8b8d98" },
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
function Fila({ titulo, texto, children, hija = false, apilada = false, ancla }: { titulo: ReactNode; texto?: ReactNode; children?: ReactNode; hija?: boolean; apilada?: boolean; /** Con qué la encuentra el buscador (si el título no es solo texto). */ ancla?: string }) {
  return (
    <div className="pc-aj-fila" data-hija={hija ? "" : undefined} data-apilada={apilada ? "" : undefined} data-fila={ancla ?? (typeof titulo === "string" ? titulo : undefined)}>
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

function Area({ valor, alCambiar, etiqueta, ejemplo, max, filas = 3 }: { valor: string; alCambiar: (v: string) => void; etiqueta: string; ejemplo?: string; max: number; filas?: number }) {
  return <textarea className="pc-aj-area" aria-label={etiqueta} value={valor} placeholder={ejemplo} maxLength={max} rows={filas} onChange={(e) => alCambiar(e.target.value)} />;
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

/** Un desplegable sencillo, como los de Claude: el valor y una flechita, sin caja. `letra`: el valor se ve en esa letra (como "Anthropic Serif" en Claude). */
function Desplegable<T extends string>({ valor, alCambiar, etiqueta, opciones, letra }: { valor: T; alCambiar: (v: T) => void; etiqueta: string; opciones: readonly { id: T; nombre: string; letra?: string }[]; letra?: string }) {
  return (
    <span className="pc-aj-desp" style={letra ? ({ "--pc-desp-letra": letra } as CSSProperties) : undefined}>
      <select aria-label={etiqueta} value={valor} onChange={(e) => alCambiar(e.target.value as T)}>
        {opciones.map((o) => (
          <option key={o.id} value={o.id} style={o.letra ? { fontFamily: o.letra } : undefined}>
            {o.nombre}
          </option>
        ))}
      </select>
      <Icono nombre="chevron" tam={16} />
    </span>
  );
}

/** Qué tan cerca está del límite: el color de la barra se va poniendo más fuerte. */
type NivelUso = "azul" | "ambar" | "naranja" | "rojo" | "lleno";
const nivelDe = (pct: number): NivelUso => (pct >= 100 ? "lleno" : pct >= 90 ? "rojo" : pct >= 80 ? "naranja" : pct >= 60 ? "ambar" : "azul");
/** El porcentaje usado, sin decir 100 si todavía queda algo ni 0 si ya se usó algo. */
const porcentaje = (usados: number, total: number) => {
  if (total <= 0) return 0;
  const p = Math.round((usados / total) * 100);
  if (usados >= total) return 100;
  return Math.min(99, Math.max(usados > 0 ? 1 : 0, p));
};

/** Un renglón de límite como en Claude: el nombre y cuándo se reinicia, la barra larga y "% usado". */
function BarraLimite({ titulo, detalle, usados, total, aviso }: { titulo: string; detalle: string; usados: number; total: number; aviso?: string | null }) {
  const pct = porcentaje(usados, total);
  const nivel = nivelDe(pct);
  return (
    <div className="pc-aj-limite" data-nivel={nivel} data-fila={titulo}>
      <div className="pc-aj-limite__textos">
        <span className="pc-aj-limite__titulo">{titulo}</span>
        <span className="pc-aj-limite__detalle">{detalle}</span>
      </div>
      <div className="pc-aj-limite__barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={titulo} aria-valuetext={`${pct} % usado`}>
        <span className="pc-aj-limite__lleno" style={{ "--v": pct / 100 } as CSSProperties} />
      </div>
      <span className="pc-aj-limite__pct">{pct} % usado</span>
      {aviso ? (
        <p className="pc-aj-limite__aviso" role={nivel === "lleno" || nivel === "rojo" ? "alert" : undefined}>
          {aviso}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Ajustes > Uso, como el de Claude: "Límites de tu plan" con una barra por
 * límite (la sesión de 5 horas, la semana y los documentos). Solo números
 * de verdad: los del plan y los de la cuenta. La barra pasa de azul a ámbar
 * (60 %), naranja (80 %) y rojo (90 %); al llenarse brilla y avisa qué pasa.
 * En tu cuenta, "Actualizar" vuelve a leer lo usado sin recargar la página.
 */
function LimitesUso({ datos }: { datos: DatosAjustes }) {
  const fuente = useFuenteNegocio();
  const router = useRouter();
  const [documentos, setDocumentos] = useState<number | null>(null);
  const [espacio, setEspacio] = useState(0);
  const [actualizando, iniciar] = useTransition();
  const [leido, setLeido] = useState<Date | null>(null);
  const pedido = useRef(false);
  const [vuelta, setVuelta] = useState(0);
  // Las horas de reinicio se escriben ya en el navegador (con su reloj), sin diferencias con el servidor
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  useEffect(() => {
    let vivo = true;
    fuente
      .listarDocumentos()
      .then((l) => {
        if (!vivo) return;
        setDocumentos(l.length);
        setEspacio(l.reduce((t, d) => t + espacioDe(d), 0));
      })
      .catch(() => vivo && setDocumentos(null));
    return () => {
      vivo = false;
    };
  }, [fuente, vuelta]);
  useEffect(() => {
    if (actualizando || !pedido.current) return;
    pedido.current = false;
    setLeido(new Date());
  }, [actualizando]);

  const plan = datos.plan;
  const { sesion, semana, zona } = plan.uso;
  const pctSesion = pctDe(sesion);
  const pctSemana = pctDe(semana);
  const detalleSesion = !montado ? "" : sesion.reinicia ? `Se reinicia ${cuandoReinicia(sesion.reinicia, zona)}` : "Empieza con tu siguiente mensaje";
  const detalleSemana = !montado || !semana.reinicia ? "" : `Se reinicia ${cuandoReinicia(semana.reinicia, zona)}`;
  const avisoDe = (pct: number, cual: "sesion" | "semana", reinicia: string | null) =>
    !montado || pct < 80
      ? null
      : pct >= 100
        ? `Llegaste al límite ${cual === "sesion" ? "de esta sesión" : "de esta semana"}. Tu equipo vuelve a contestar ${reinicia ? cuandoReinicia(reinicia, zona) : "pronto"}.`
        : `Ya usaste el ${pct} % ${cual === "sesion" ? "de esta sesión" : "de esta semana"}.`;
  const maxDocumentos = MAX_DOCUMENTOS_POR_PLAN[plan.id as keyof typeof MAX_DOCUMENTOS_POR_PLAN] ?? null;
  const maxEspacio = (MAX_MB_DOCUMENTOS_POR_PLAN[plan.id as keyof typeof MAX_MB_DOCUMENTOS_POR_PLAN] ?? 0) * 1024 * 1024;
  const pctEspacio = porcentaje(espacio, maxEspacio);
  const avisoEspacio = pctEspacio >= 100 ? "Ya no hay espacio: borra algún documento para subir otro." : pctEspacio >= 80 ? `Te quedan ${formatoPeso(Math.max(0, maxEspacio - espacio))}.` : null;
  const n = (v: number) => v.toLocaleString("es-MX");
  const pctDocumentos = documentos !== null && maxDocumentos ? porcentaje(documentos, maxDocumentos) : 0;
  const quedanDocumentos = documentos !== null && maxDocumentos ? Math.max(0, maxDocumentos - documentos) : 0;
  const avisoDocumentos =
    pctDocumentos >= 100 ? "Llegaste al límite: borra alguno para subir otro." : pctDocumentos >= 80 ? `${quedanDocumentos === 1 ? "Te queda 1 documento" : `Te quedan ${n(quedanDocumentos)} documentos`}.` : null;

  return (
    <section className="pc-aj-grupo pc-aj-limites">
      <h3 className="pc-aj-limites__titulo">
        Límites de tu plan <span>{plan.nombre.replace(/^Atendel\s+/, "")}</span>
      </h3>
      <BarraLimite titulo="Sesión actual" detalle={detalleSesion} usados={sesion.usado} total={sesion.limite} aviso={avisoDe(pctSesion, "sesion", sesion.reinicia)} />
      <h4 className="pc-aj-limites__sub">Límite semanal</h4>
      <BarraLimite titulo="Esta semana" detalle={detalleSemana} usados={semana.usado} total={semana.limite} aviso={avisoDe(pctSemana, "semana", semana.reinicia)} />
      {documentos !== null && maxDocumentos ? <h4 className="pc-aj-limites__sub">Lo que guardas</h4> : null}
      {documentos !== null && maxDocumentos ? (
        <BarraLimite titulo="Documentos" detalle={`${n(documentos)} de ${n(maxDocumentos)} que puedes guardar`} usados={documentos} total={maxDocumentos} aviso={avisoDocumentos} />
      ) : null}
      {documentos !== null && maxEspacio ? (
        <BarraLimite titulo="Espacio de tus documentos" detalle={`${formatoPeso(espacio)} de ${formatoPeso(maxEspacio)}`} usados={espacio} total={maxEspacio} aviso={avisoEspacio} />
      ) : null}
      {datos.demo ? null : (
        <div className="pc-aj-limites__pie">
          <span>{leido ? `Actualizado a las ${leido.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" })}` : "Lo que llevas hasta ahora"}</span>
          <button
            type="button"
            className="pc-aj-limites__recargar"
            aria-label="Actualizar lo usado"
            title="Actualizar"
            disabled={actualizando}
            data-girando={actualizando ? "" : undefined}
            onClick={() => {
              pedido.current = true;
              setVuelta((v) => v + 1);
              iniciar(() => router.refresh());
            }}
          >
            <Icono nombre="recargar" tam={16} />
          </button>
        </div>
      )}
    </section>
  );
}

/** El tema con tres íconos, como en Claude: como el sistema, claro u oscuro. */
function TemaIconos() {
  const [actual, setActual] = useState<PreferenciaTema>("oscuro");
  useEffect(() => {
    const leer = () => setActual(preferenciaActual());
    leer();
    window.addEventListener(EVENTO_TEMA, leer);
    return () => window.removeEventListener(EVENTO_TEMA, leer);
  }, []);
  const opciones: { id: PreferenciaTema; nombre: string; icono: NombreIcono }[] = [
    { id: "sistema", nombre: "Como el sistema", icono: "monitor" },
    { id: "claro", nombre: "Claro", icono: "sol" },
    { id: "oscuro", nombre: "Oscuro", icono: "luna" },
  ];
  return (
    <div className="pc-aj-tema" role="radiogroup" aria-label="Tema">
      {opciones.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={actual === o.id}
          aria-label={o.nombre}
          title={o.nombre}
          className="pc-aj-tema__op"
          onClick={() => {
            setActual(o.id);
            ponerTema(o.id);
          }}
        >
          <Icono nombre={o.icono} tam={18} />
        </button>
      ))}
    </div>
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
  /** El renglón que se eligió en el buscador: se busca, se centra y se marca un momento. */
  const [resaltar, setResaltar] = useState<{ titulo: string; n: number } | null>(null);
  const [saliendo, setSaliendo] = useState(false);
  const [estado, setEstado] = useState<EstadoGuardado>("listo");
  const [ajustes, setAjustes] = useState<AjustesCuenta>(datos.ajustes);
  const [nombre, setNombre] = useState(datos.nombre);
  const [activos, setActivos] = useState<IdAgente[]>(datos.activos);
  const [avisoEquipo, setAvisoEquipo] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Partial<Record<CampoPerfil, string>> | null>(datos.perfil ?? null);
  const [cambiosPerfil, setCambiosPerfil] = useState<Partial<Record<CampoPerfil, string>>>({});
  const guardar = datos.guardar;
  const [contactos, setContactos] = useState<ContactoEquipo[]>(datos.contactos);
  const [nuevo, setNuevo] = useState({ nombre: "", rol: "", whatsapp: "" });
  const [avisoContacto, setAvisoContacto] = useState<string | null>(null);

  async function agregarContacto() {
    const whatsapp = normalizarWhatsapp(nuevo.whatsapp);
    if (!nuevo.nombre.trim()) return setAvisoContacto("Escribe el nombre.");
    if (!whatsapp) return setAvisoContacto("Revisa el WhatsApp: 10 dígitos si es de México, o con + y la lada del país.");
    if (contactos.some((c) => c.whatsapp === whatsapp)) return setAvisoContacto("Ese número ya está en tu equipo.");
    setAvisoContacto(null);
    const c = { nombre: nuevo.nombre.trim().slice(0, 80), rol: nuevo.rol.trim().slice(0, 60), whatsapp };
    if (!guardar) {
      setContactos((l) => [...l, { ...c, id: `demo-${Date.now()}` }]);
      setNuevo({ nombre: "", rol: "", whatsapp: "" });
      return;
    }
    setEstado("guardando");
    const r = await guardar.contactos.agregar(c);
    if (typeof r === "string") {
      setEstado({ error: r });
      return;
    }
    setContactos((l) => [...l, r]);
    setNuevo({ nombre: "", rol: "", whatsapp: "" });
    setEstado("guardado");
  }
  async function quitarContacto(id: string) {
    const antes = contactos;
    setContactos((l) => l.filter((c) => c.id !== id));
    if (!guardar) return;
    setEstado("guardando");
    const e = await guardar.contactos.quitar(id);
    if (e) {
      setContactos(antes);
      setEstado({ error: e });
    } else setEstado("guardado");
  }

  useEffect(() => {
    if (!abierta) setBusqueda("");
  }, [abierta]);

  // Lo que se guarda solo: ajustes, nombre y perfil (el equipo se guarda al momento)
  useGuardadoDiferido(ajustes, guardar?.ajustes, setEstado);
  useGuardadoDiferido(nombre.trim(), guardar ? (n) => (n ? guardar.nombre(n) : Promise.resolve("Escribe tu nombre.")) : undefined, setEstado, 900);
  useGuardadoDiferido(cambiosPerfil, guardar ? (c) => (Object.keys(c).length ? guardar.perfil(c) : Promise.resolve(null)) : undefined, setEstado, 900);

  // Lo de Apariencia se ve en todo el panel en cuanto cambia
  const { alCambiarApariencia } = preferencias;
  useEffect(() => {
    alCambiarApariencia(aparienciaDe(ajustes));
  }, [ajustes, alCambiarApariencia]);

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
  // Lo de adentro de cada parte: primero lo que empieza con lo que se escribió
  const opciones = useMemo(() => {
    const q = sinAcentos(busqueda.trim());
    if (q.length < 2) return [];
    const palabras = q.split(/\s+/).filter(Boolean);
    return OPCIONES.map((o) => {
      const t = sinAcentos(o.titulo);
      const todo = `${t} ${sinAcentos(o.claves ?? "")}`;
      // Primero lo que empieza igual, luego lo que lo contiene, luego si están todas las palabras
      const peso = t.startsWith(q) ? 0 : t.includes(q) ? 1 : palabras.every((w) => todo.includes(w)) ? 2 : 3;
      return { o, peso };
    })
      .filter((x) => x.peso < 3)
      .sort((a, b) => a.peso - b.peso)
      .slice(0, 12)
      .map((x) => x.o);
  }, [busqueda]);
  useEffect(() => {
    if (!resaltar) return;
    // Cuando ya se pintó la parte: el renglón al centro y marcado un momento
    const t = window.setTimeout(() => {
      const fila = [...document.querySelectorAll<HTMLElement>(".pc-aj__contenido [data-fila]")].find((f) => f.dataset.fila === resaltar.titulo);
      if (!fila) return;
      fila.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      fila.removeAttribute("data-resaltada");
      void fila.offsetWidth;
      fila.setAttribute("data-resaltada", "");
      fila.querySelector<HTMLElement>("input, textarea, select, button")?.focus({ preventScroll: true });
    }, 60);
    return () => window.clearTimeout(t);
  }, [resaltar, seccion]);
  const parte = PARTES.find((p) => p.id === seccion) ?? PARTES[0];
  const libre = datos.plan.id !== "free";
  const conectada = (app: string) => (app === "gmail" && datos.gmail) || datos.conectadas.includes(app);

  let contenido: ReactNode;
  if (seccion === "atendel") {
    contenido = (
      <>
        <Grupo titulo="Cómo le escriben a tus clientes">
          <Fila titulo="Tus instrucciones" texto="Escríbelo con tus palabras, como se lo explicarías a alguien nuevo. Tus agentes lo siguen en cada mensaje que te proponen." apilada>
            <Area
              etiqueta="Cómo quieres que le escriban a tus clientes"
              valor={ajustes.instrucciones}
              alCambiar={(v) => cambiar("instrucciones", v)}
              ejemplo={"Ej.: Háblales de tú y con calidez. Mensajes cortos, sin emojis. Si preguntan precio, dáselo y ofrece agendar. Despídete con «Gracias por escribirnos»."}
              max={MAX_INSTRUCCIONES}
              filas={5}
            />
            <span className="pc-aj-cuenta">
              {ajustes.instrucciones.length.toLocaleString("es-MX")} / {MAX_INSTRUCCIONES.toLocaleString("es-MX")}
            </span>
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
    // Como la de Claude: renglones con su raya, el nombre a la izquierda y el control a la derecha
    contenido = (
      <>
        <Grupo titulo="General">
          <Fila titulo="Tema">
            <TemaIconos />
          </Fila>
          <Fila titulo="Color">
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
          <Fila titulo="Idioma" texto="En el que te contestan tus agentes y escriben a tus clientes. El panel, por ahora, en español.">
            <Desplegable etiqueta="Idioma" valor={ajustes.idioma} alCambiar={(v) => cambiar("idioma", v)} opciones={IDIOMAS} />
          </Fila>
        </Grupo>
        <Grupo titulo="Letra">
          <Fila titulo="Letra de la interfaz">
            <Desplegable
              etiqueta="Letra de la interfaz"
              valor={ajustes.fuente}
              alCambiar={(v) => cambiar("fuente", v)}
              letra="var(--pc-sans)"
              opciones={FUENTES.map((f) => ({ id: f, nombre: NOMBRE_FUENTE[f], letra: LETRA_FUENTE[f] }))}
            />
          </Fila>
          <Fila titulo="Letra de las respuestas">
            <Desplegable
              etiqueta="Letra de las respuestas"
              valor={ajustes.respuestas}
              alCambiar={(v) => cambiar("respuestas", v)}
              letra="var(--pc-respuestas, var(--pc-sans))"
              opciones={RESPUESTAS.map((f) => ({ id: f, nombre: NOMBRE_RESPUESTAS[f], letra: LETRA_RESPUESTAS[f] }))}
            />
          </Fila>
          <Fila titulo="Tamaño del texto del chat">
            <Desplegable
              etiqueta="Tamaño del texto del chat"
              valor={ajustes.letra}
              alCambiar={(v) => cambiar("letra", v)}
              opciones={[
                { id: "chica", nombre: "Chico" },
                { id: "normal", nombre: "Mediano" },
                { id: "grande", nombre: "Grande" },
              ]}
            />
          </Fila>
          <Fila titulo="Espacio entre renglones">
            <Desplegable
              etiqueta="Espacio entre renglones"
              valor={ajustes.interlineado}
              alCambiar={(v) => cambiar("interlineado", v)}
              opciones={[
                { id: "compacto", nombre: "Compacto" },
                { id: "normal", nombre: "Normal" },
                { id: "amplio", nombre: "Amplio" },
              ]}
            />
          </Fila>
          <div className="pc-aj-muestra" aria-hidden="true">
            <span className="pc-aj-muestra__quien">Así se ven las respuestas</span>
            <p className="pc-msj__texto">Listo: confirmé las 6 citas de mañana. Dos pidieron cambiar de hora; te dejé las opciones para que elijas.</p>
          </div>
        </Grupo>
        <Grupo titulo="Conversación">
          <Fila titulo="Ancho de la conversación">
            <Desplegable
              etiqueta="Ancho de la conversación"
              valor={ajustes.ancho}
              alCambiar={(v) => cambiar("ancho", v)}
              opciones={[
                { id: "angosto", nombre: "Angosto" },
                { id: "normal", nombre: "Normal" },
                { id: "ancho", nombre: "Ancho" },
              ]}
            />
          </Fila>
          <Fila titulo="Densidad" texto="Qué tan juntos van los renglones del menú y los mensajes.">
            <Desplegable
              etiqueta="Densidad"
              valor={ajustes.densidad}
              alCambiar={(v) => cambiar("densidad", v)}
              opciones={[
                { id: "compacta", nombre: "Compacta" },
                { id: "normal", nombre: "Normal" },
                { id: "espaciosa", nombre: "Espaciosa" },
              ]}
            />
          </Fila>
          <Fila titulo="Hora de cada mensaje">
            <Interruptor etiqueta="Hora de cada mensaje" activo={ajustes.horas === "mostrar"} alCambiar={(v) => cambiar("horas", v ? "mostrar" : "ocultar")} />
          </Fila>
        </Grupo>
        <Grupo titulo="Accesibilidad">
          <Fila titulo="Movimiento" texto="Reducido quita las animaciones del panel.">
            <Desplegable
              etiqueta="Movimiento"
              valor={ajustes.movimiento}
              alCambiar={(v) => cambiar("movimiento", v)}
              opciones={[
                { id: "sistema", nombre: "Sistema" },
                { id: "reducido", nombre: "Reducido" },
              ]}
            />
          </Fila>
          <Fila titulo="Contraste alto" texto="Textos y bordes más marcados.">
            <Interruptor etiqueta="Contraste alto" activo={ajustes.contraste === "alto"} alCambiar={(v) => cambiar("contraste", v ? "alto" : "normal")} />
          </Fila>
          <Fila titulo="Subrayar enlaces" texto="Para distinguirlos sin depender del color.">
            <Interruptor etiqueta="Subrayar enlaces" activo={ajustes.enlaces === "subrayados"} alCambiar={(v) => cambiar("enlaces", v ? "subrayados" : "normal")} />
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
        {!libre ? <p className="pc-aj-nota">Con Atendel Free trabajas con Clara. Con One o Max tienes a todo el equipo; Max trae 5 veces el uso de One.</p> : null}
        {avisoEquipo ? <p className="pc-aj-nota pc-aj-nota--error">{avisoEquipo}</p> : null}
        <Grupo>
          {AGENTES_INFO.map((a) => {
            const enPlan = datos.plan.agentes.includes(a.id);
            const activo = activos.includes(a.id) && enPlan;
            return (
              <div key={a.id} className="pc-aj-bloque">
                <Fila
                  ancla={a.nombre}
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
        <Grupo titulo="Tu equipo" texto="Las personas de tu negocio. Tus agentes les pueden mandar cosas por WhatsApp (una presentación, un aviso), siempre con tu visto bueno. No entran al panel.">
          <div className="pc-aj-tabla" role="table" aria-label="Tu equipo">
            <div className="pc-aj-tabla__fila pc-aj-tabla__fila--equipo pc-aj-tabla__fila--cabeza" role="row">
              <span role="columnheader">Nombre</span>
              <span role="columnheader">Puesto</span>
              <span role="columnheader">WhatsApp</span>
              <span role="columnheader" className="pc-aj-sr">Quitar</span>
            </div>
            <div className="pc-aj-tabla__fila pc-aj-tabla__fila--equipo" role="row">
              <span role="cell" className="pc-aj-tabla__nombre">
                <span className="pc-aj-avatar pc-aj-avatar--chico" aria-hidden="true">
                  {(nombre.trim()[0] ?? "A").toUpperCase()}
                </span>
                {nombre || "Tú"} <span className="pc-aj-tabla__tu">(tú)</span>
              </span>
              <span role="cell">Dueño</span>
              <span role="cell" className="pc-aj-tabla__tu">—</span>
              <span role="cell" />
            </div>
            {contactos.map((c) => (
              <div key={c.id} className="pc-aj-tabla__fila pc-aj-tabla__fila--equipo" role="row">
                <span role="cell" className="pc-aj-tabla__nombre">
                  <span className="pc-aj-avatar pc-aj-avatar--chico pc-aj-avatar--gris" aria-hidden="true">
                    {(c.nombre.trim()[0] ?? "?").toUpperCase()}
                  </span>
                  {c.nombre}
                </span>
                <span role="cell">{c.rol || "—"}</span>
                <span role="cell" className="cifras">
                  {mostrarWhatsapp(c.whatsapp)}
                </span>
                <span role="cell">
                  <button type="button" className="pc-icono" aria-label={`Quitar a ${c.nombre}`} title="Quitar" onClick={() => quitarContacto(c.id)}>
                    <Icono nombre="basura" tam={16} />
                  </button>
                </span>
              </div>
            ))}
          </div>
          <form
            className="pc-aj-nuevo"
            onSubmit={(e) => {
              e.preventDefault();
              agregarContacto();
            }}
          >
            <Campo etiqueta="Nombre" valor={nuevo.nombre} alCambiar={(v) => setNuevo((n) => ({ ...n, nombre: v }))} ejemplo="Nombre" max={80} />
            <Campo etiqueta="Puesto" valor={nuevo.rol} alCambiar={(v) => setNuevo((n) => ({ ...n, rol: v }))} ejemplo="Puesto (opcional)" max={60} ancho="chico" />
            <Campo tipo="tel" etiqueta="WhatsApp" valor={nuevo.whatsapp} alCambiar={(v) => setNuevo((n) => ({ ...n, whatsapp: v }))} ejemplo="55 1234 5678" max={20} />
            <button type="submit" className={claseBoton("borde", true)} disabled={!nuevo.nombre.trim() || !nuevo.whatsapp.trim()}>
              <Icono nombre="mas" tam={16} />
              Agregar
            </button>
          </form>
          {avisoContacto ? <p className="pc-aj-nota pc-aj-nota--error">{avisoContacto}</p> : null}
        </Grupo>
        <Grupo titulo="Entrar al panel">
          <Fila titulo="Invitar personas" texto="Que alguien de tu equipo entre a este panel con su propia cuenta.">
            <Pronto />
          </Fila>
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
        <LimitesUso datos={datos} />
        <Grupo titulo="Cómo se mide">
          <Fila
            titulo="No contamos mensajes"
            texto="Medimos cuánto trabaja tu equipo en cada respuesta, como Claude. Un mensaje corto gasta poco; uno largo, una conversación larga, muchos documentos o las apps que consulta gastan más."
          />
          <Fila titulo="Rápido o Avanzado" texto="En el chat eliges el modelo. Rápido es para el día a día y gasta muy poco; Avanzado es para lo pesado (Excel, análisis) y gasta unas 40 veces más por mensaje." />
          <Fila titulo="Sesión de 5 horas" texto="Empieza con tu primer mensaje y se reinicia 5 horas después. Además hay un límite por semana, que se reinicia el lunes." />
          <Fila titulo="Si llegas al límite" texto="Tu equipo deja de contestar en el chat hasta que se reinicie. Lo que ya leyó y tus datos se quedan.">
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
            {opciones.length ? (
              <>
                <li className="pc-aj__seccion-buscar" data-corte={partes.length ? "" : undefined}>
                  Dentro de Ajustes
                </li>
                {opciones.map((o) => (
                  <li key={`${o.parte}-${o.titulo}`}>
                    <button
                      type="button"
                      className="pc-aj__parte pc-aj__opcion"
                      onClick={() => {
                        alElegir(o.parte);
                        setResaltar({ titulo: o.titulo, n: Date.now() });
                      }}
                    >
                      <span className="pc-aj__opcion-textos">
                        <span className="pc-aj__opcion-titulo">{o.titulo}</span>
                        <span className="pc-aj__opcion-donde">{PARTES.find((p) => p.id === o.parte)?.etiqueta}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </>
            ) : null}
            {partes.length === 0 && opciones.length === 0 ? <li className="pc-aj__nada">Nada con “{busqueda.trim()}”.</li> : null}
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
