"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { Giro, Icono, type NombreIcono } from "@/components/base/Iconos";
import { APP_POR_ID, CATALOGO } from "@/lib/conexiones/catalogo";
import { RUTAS, type AppConectable, type CategoriaApp, type EstadoAppPersona, type IdApp, type Proveedor } from "@/lib/nucleo-tipos";
import { AvatarAgente, nombresDe } from "../Mensajes";
import { Enlace, Modal, Pildoras, Subtitulo, Vacio, claseBoton, retrasoEscalon } from "../Piezas";
import { mensajeDe, useFuenteNegocio } from "./fuente";
import { CATEGORIAS_APP } from "./textos";

const NOMBRE_PROVEEDOR: Record<Proveedor, string> = {
  google: "Google",
  microsoft: "Microsoft",
  notion: "Notion",
  meta: "Meta",
  telegram: "Telegram",
  calendly: "Calendly",
  zoom: "Zoom",
  dropbox: "Dropbox",
  slack: "Slack",
  trello: "Trello",
  airtable: "Airtable",
  hubspot: "HubSpot",
  stripe: "Stripe",
  mercadopago: "Mercado Pago",
  mercadolibre: "Mercado Libre",
  shopify: "Shopify",
  tiendanube: "Tiendanube",
  facturapi: "Facturapi",
  acuity: "Acuity Scheduling",
  simplybook: "SimplyBook.me",
  setmore: "Setmore",
  agendapro: "AgendaPro",
  paypal: "PayPal",
  conekta: "Conekta",
  openpay: "Openpay",
  square: "Square",
  facturama: "Facturama",
  alegra: "Alegra",
  holded: "Holded",
  zoho: "Zoho",
  quickbooks: "QuickBooks",
  pipedrive: "Pipedrive",
  kommo: "Kommo",
  typeform: "Typeform",
  mailchimp: "Mailchimp",
};

/** Lo que se ve en la insignia de cada estado. */
const INSIGNIA: Record<EstadoAppPersona["estado"], { texto: string; tono: string }> = {
  conectada: { texto: "Conectada", tono: "exito" },
  desconectada: { texto: "Sin conectar", tono: "neutro" },
  sin_configurar: { texto: "Falta configurar", tono: "atencion" },
  en_camino: { texto: "En camino", tono: "azul" },
  error: { texto: "Dejó de funcionar", tono: "error" },
};

/** Para quien administra Atendel: lo que hay que hacer en el portal de cada proveedor (la guía completa: docs/configurar-apps.md). */
const PASOS_CONFIGURAR: Partial<Record<Proveedor, string[]>> = {
  google: [
    "En Google Cloud, crea un proyecto y activa las APIs de las apps que vas a usar (Gmail, Calendar, Drive, Sheets, Picker…).",
    "En la pantalla de permisos (OAuth), agrega los permisos de solo lectura que pide la guía.",
    "Crea un «ID de cliente de OAuth» de tipo aplicación web y pega la dirección de regreso de abajo.",
  ],
  microsoft: [
    "En Azure, en «Registros de aplicaciones», registra una app para cuentas de cualquier organización y personales.",
    "Pega la dirección de regreso de abajo como «Web», agrega los permisos de solo lectura de la guía y crea un secreto de cliente.",
  ],
  notion: ["En Notion, en «Mis integraciones», crea una integración pública con permiso de solo leer contenido.", "Pega la dirección de regreso de abajo."],
  meta: ["En Meta for Developers, crea una app de negocio y agrega los productos que vas a usar.", "Pega la dirección de regreso de abajo. Para usarla con cualquier cuenta, Meta revisa la app."],
};
const PASOS_CONFIGURAR_OTRO = (p: Proveedor) => [`En el portal para desarrolladores de ${NOMBRE_PROVEEDOR[p]}, registra una app de Atendel con permisos de solo lectura.`, "Pega la dirección de regreso de abajo."];

/** Para la persona: cómo sacar SU llave en las apps que se conectan por llave. */
const PASOS_LLAVE: Partial<Record<Proveedor, string[]>> = {
  telegram: ["En Telegram, abre @BotFather y escribe /newbot (o /mybots si ya tienes el bot de tu negocio).", "Copia el token que te da y pégalo aquí."],
  stripe: ["En Stripe, entra a Desarrolladores → Claves de API.", "Crea una clave restringida con permisos de solo lectura, cópiala y pégala aquí."],
  airtable: ["En Airtable, entra a Developer hub → Personal access tokens.", "Crea un token con permisos de solo lectura, elige tus bases, cópialo y pégalo aquí."],
  trello: ["En Trello, entra a la administración de Power-Ups y genera tu llave de API y tu token.", "Copia lo que te pida la guía y pégalo aquí."],
  facturapi: ["En Facturapi, entra a tu panel → Llaves de API.", "Copia tu llave secreta y pégala aquí."],
};

const ICONO_CATEGORIA = Object.fromEntries(CATEGORIAS_APP.map((c) => [c.id, c.icono])) as Record<CategoriaApp, NombreIcono>;

const sinAcentos = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Lo que regresa el permiso cuando algo falla (&error=… del callback de D), en español sencillo. */
const ERRORES_CONEXION: Record<string, string> = {
  cancelado: "Cancelaste el permiso. Cuando quieras, vuelve a intentarlo.",
  estado: "El permiso tardó mucho o no coincide. Vuelve a conectar.",
  configuracion: "Falta configurar esta app en Vercel. Revisa «Cómo configurarlo» en su tarjeta.",
  intercambio: "La app no confirmó el permiso. Vuelve a intentarlo en un momento.",
  permiso: "Faltaron permisos de lectura. Vuelve a conectar y acepta todos los que pide.",
  guardar: "Se dio el permiso, pero no se pudo guardar la conexión. Vuelve a intentarlo.",
};

type TipoCuadro = "desconectar" | "configurar" | "demo" | "llave" | "dato";
type Cuadro = { tipo: TipoCuadro; app: AppConectable } | null;

/**
 * Las apps OAuth que necesitan un dato antes de ir al permiso (Shopify: el
 * dominio de la tienda). Se manda a RUTAS.conectar como &<param>=<valor>.
 */
const DATO_CONECTAR: Partial<Record<Proveedor, { param: string; etiqueta: string; ayuda: string; ejemplo: string; normalizar: (t: string) => string | null }>> = {
  shopify: {
    param: "shop",
    etiqueta: "El dominio de tu tienda",
    ayuda: "Lo ves en Shopify, en Configuración → Dominios. Termina en .myshopify.com.",
    ejemplo: "mitienda.myshopify.com",
    normalizar: (t) => {
      const v = t.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      const d = v.includes(".") ? v : `${v}.myshopify.com`;
      return /^[a-z0-9][a-z0-9-]{0,60}\.myshopify\.com$/.test(d) ? d : null;
    },
  },
  kommo: {
    param: "subdomain",
    etiqueta: "La dirección de tu cuenta de Kommo",
    ayuda: "Es la que ves en el navegador al entrar a Kommo. Termina en .kommo.com.",
    ejemplo: "miempresa.kommo.com",
    normalizar: (t) => {
      const v = t.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.kommo\.com$/, "");
      return /^[a-z0-9][a-z0-9-]{0,62}$/.test(v) ? v : null;
    },
  },
};

/** En "Todas" (sin buscar), cuántas apps se ven por categoría antes de "Ver las N". */
const POR_CATEGORIA = 4;
/** Primero lo que ya usas, luego lo que puedes conectar, al final lo que está en camino. */
const ORDEN_ESTADO: Record<EstadoAppPersona["estado"], number> = { conectada: 0, error: 1, desconectada: 2, sin_configurar: 3, en_camino: 4 };

/**
 * Apps conectadas: el catálogo de D (src/lib/conexiones/catalogo.ts) por
 * categorías, con un buscador y un filtro arriba, y el estado de cada app
 * (GET /api/apps). Cada tarjeta dice quién la usa, qué puede hacer la IA y
 * su botón según el estado: conectada (Desconectar, con confirmación),
 * desconectada (Conectar → OAuth, o el campo para pegar TU llave), sin
 * configurar (qué falta en Vercel y cómo), en camino (Avísame, que se
 * guarda) o con error (Vuelve a conectar). En /pruebalo no hay OAuth ni se
 * guardan llaves: el modal explica qué pasaría en tu cuenta real.
 */
export function AppsNegocio({
  conectada,
  error: errorConexion,
  app: appError,
}: {
  /** ?conectada=<app>: se acaba de regresar del permiso. */
  conectada?: string | null;
  /** ?error=<código>&app=<app>: el permiso no salió. */
  error?: string | null;
  app?: string | null;
}) {
  const fuente = useFuenteNegocio();
  const id = useId();
  const [estados, setEstados] = useState<EstadoAppPersona[] | null>(null);
  const [cargaError, setCargaError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [cuadro, setCuadro] = useState<Cuadro>(null);
  const [ocupada, setOcupada] = useState<IdApp | null>(null);
  const [aviso, setAviso] = useState<{ tono: "ok" | "error"; texto: string } | null>(null);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<"todas" | "conectadas" | CategoriaApp>("todas");

  const cargar = useCallback(async () => {
    try {
      setEstados(await fuente.listarApps());
      setCargaError(null);
    } catch (e) {
      setCargaError(mensajeDe(e, "No se pudo leer el estado de tus apps."));
    }
  }, [fuente]);

  useEffect(() => {
    void cargar();
  }, [cargar, intento]);

  // Al regresar del permiso (?conectada=gmail): el aviso, y se quita de la dirección (al recargar ya no sale)
  useEffect(() => {
    const app = conectada ? APP_POR_ID[conectada as IdApp] : undefined;
    const fallo = appError ? APP_POR_ID[appError as IdApp] : undefined;
    if (app) setAviso({ tono: "ok", texto: `Listo: ${app.nombre} quedó conectada. ${nombresDe(app.agentes)} ya la puede${app.agentes.length > 1 ? "n" : ""} usar.` });
    else if (errorConexion) setAviso({ tono: "error", texto: `${fallo ? `${fallo.nombre}: ` : ""}${ERRORES_CONEXION[errorConexion] ?? "No se pudo conectar. Vuelve a intentarlo."}` });
    else return;
    const url = new URL(window.location.href);
    for (const k of ["conectada", "error", "app"]) url.searchParams.delete(k);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [conectada, errorConexion, appError]);

  useEffect(() => {
    if (aviso?.tono !== "ok") return;
    const t = window.setTimeout(() => setAviso(null), 6000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  const estadoDe = useCallback((app: IdApp): EstadoAppPersona => estados?.find((e) => e.id === app) ?? { id: app, estado: "desconectada" }, [estados]);

  const avisame = async (app: AppConectable, quiere: boolean) => {
    setOcupada(app.id);
    try {
      await fuente.avisame(app.id, quiere);
      setEstados((l) => (l ?? []).map((e) => (e.id === app.id ? { ...e, avisame: quiere } : e)));
      setAviso({ tono: "ok", texto: quiere ? `Te avisaremos cuando ${app.nombre} esté lista.` : `Ya no te avisaremos de ${app.nombre}.` });
    } catch (e) {
      setAviso({ tono: "error", texto: mensajeDe(e, "No se pudo guardar. Intenta de nuevo.") });
    } finally {
      setOcupada(null);
    }
  };

  const desconectar = async (app: AppConectable) => {
    if (!app.proveedor) return;
    setOcupada(app.id);
    try {
      const r = await fuente.desconectar(app.proveedor, app.id);
      const proveedor = NOMBRE_PROVEEDOR[app.proveedor];
      const siguen = r.quedan.map((id) => APP_POR_ID[id]?.nombre).filter(Boolean);
      setCuadro(null);
      setAviso({
        tono: "ok",
        texto: siguen.length
          ? `Se desconectó ${app.nombre}. Con tu cuenta de ${proveedor} siguen conectadas: ${siguen.join(", ")}.`
          : r.revocada
            ? `Se desconectó ${app.nombre} y se quitó el permiso en tu cuenta de ${proveedor}.`
            : `Se desconectó ${app.nombre}.${app.proveedor === "microsoft" ? " Quita también el permiso en tu cuenta de Microsoft (la guía dice dónde)." : ""}`,
      });
      await cargar();
    } catch (e) {
      setCuadro(null);
      setAviso({ tono: "error", texto: mensajeDe(e, "No se pudo desconectar. Intenta de nuevo.") });
    } finally {
      setOcupada(null);
    }
  };

  const conectadas = useMemo(() => CATALOGO.filter((a) => estadoDe(a.id).estado === "conectada"), [estadoDe]);
  const visibles = useMemo(() => {
    const t = sinAcentos(q.trim());
    return CATALOGO.filter((a) => {
      if (filtro === "conectadas" ? estadoDe(a.id).estado !== "conectada" : filtro !== "todas" && a.categoria !== filtro) return false;
      if (!t) return true;
      return sinAcentos(`${a.nombre} ${a.puede} ${a.proveedor ? NOMBRE_PROVEEDOR[a.proveedor] : ""} ${nombresDe(a.agentes)}`).includes(t);
    });
  }, [q, filtro, estadoDe]);

  if (cargaError) {
    return (
      <Vacio
        icono="alerta"
        titulo="No se pudo leer el estado de tus apps"
        texto={cargaError}
        accion={
          <button type="button" className={claseBoton("borde", true)} onClick={() => setIntento((n) => n + 1)}>
            <Icono nombre="repetir" tam={16} />
            Intentar de nuevo
          </button>
        }
      />
    );
  }
  if (!estados) {
    return (
      <p className="pc-cargando" role="status">
        <Giro /> Revisando tus apps…
      </p>
    );
  }

  let n = 0;
  // Desconectar quita la cuenta del proveedor: se dice qué otras apps se van con ella
  const cuadroApp = cuadro?.app;
  const otrasMismaCuenta = cuadroApp?.proveedor ? conectadas.filter((a) => a.proveedor === cuadroApp.proveedor && a.id !== cuadroApp.id) : [];
  const cuentaCuadro = cuadroApp ? estadoDe(cuadroApp.id).cuenta : undefined;
  const faltaCuadro = cuadroApp ? (estadoDe(cuadroApp.id).falta ?? []) : [];
  const categorias = CATEGORIAS_APP.filter((c) => CATALOGO.some((a) => a.categoria === c.id));

  return (
    <>
      <p className="pc-apps__resumen">
        {conectadas.length
          ? `Tu equipo entra a ${conectadas.length === 1 ? "1 app" : `${conectadas.length} apps`}: ${conectadas.map((a) => a.nombre).join(", ")}. Solo lee; nunca manda ni borra nada sin tu visto bueno.`
          : "Conecta tus apps para que tu equipo conteste con tus correos, tu agenda, tus cobros y tus archivos. Solo lee; nunca manda ni borra nada sin tu visto bueno."}
      </p>

      <div className="pc-apps__barra">
        <span className="pc-apps__buscar">
          <Icono nombre="buscar" tam={16} />
          <input
            className="pc-campo__entrada"
            type="search"
            aria-label="Buscar una app"
            placeholder="Buscar una app: Gmail, Stripe, WhatsApp…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={60}
          />
        </span>
      </div>
      <Pildoras
        className="pc-apps__filtro"
        etiqueta="Filtrar apps"
        activa={filtro}
        alElegir={(v) => setFiltro(v as typeof filtro)}
        opciones={[
          { id: "todas", etiqueta: "Todas", cuenta: CATALOGO.length },
          { id: "conectadas", etiqueta: "Conectadas", cuenta: conectadas.length },
          ...categorias.map((c) => ({ id: c.id, etiqueta: c.etiqueta })),
        ]}
      />

      <p className="pc-oculto" role="status" aria-live="polite">
        {aviso?.tono === "ok" ? aviso.texto : ""}
      </p>
      {aviso ? (
        <p className={`pc-docs__aviso${aviso.tono === "error" ? " pc-docs__aviso--error" : ""}`} role={aviso.tono === "error" ? "alert" : undefined} aria-hidden={aviso.tono === "ok" ? true : undefined}>
          <Icono nombre={aviso.tono === "ok" ? "check-circulo" : "alerta"} tam={16} />
          {aviso.texto}
        </p>
      ) : null}

      {visibles.length === 0 ? (
        <Vacio
          icono="buscar"
          titulo={q.trim() ? `Ninguna app coincide con «${q.trim()}»` : "Todavía no hay apps conectadas"}
          texto={q.trim() ? "Prueba con otro nombre o quita el filtro." : "Elige una en «Todas» y conéctala con tu cuenta."}
          accion={
            <button
              type="button"
              className={claseBoton("borde", true)}
              onClick={() => {
                setQ("");
                setFiltro("todas");
              }}
            >
              Ver todas
            </button>
          }
        />
      ) : (
        <div key={`${filtro}|${q.trim() ? "q" : ""}`}>
          {categorias.map((cat) => {
            const apps = visibles.filter((a) => a.categoria === cat.id).sort((a, b) => ORDEN_ESTADO[estadoDe(a.id).estado] - ORDEN_ESTADO[estadoDe(b.id).estado]);
            if (!apps.length) return null;
            const resumir = filtro === "todas" && !q.trim() && apps.length > POR_CATEGORIA + 1;
            const mostradas = resumir ? apps.slice(0, POR_CATEGORIA) : apps;
            return (
              <section key={cat.id} aria-labelledby={`${id}-${cat.id}`} className="pc-apps__grupo">
                <Subtitulo
                  id={`${id}-${cat.id}`}
                  extra={
                    resumir ? (
                      <button type="button" className="pc-apps__ver" onClick={() => setFiltro(cat.id)}>
                        Ver las {apps.length}
                        <Icono nombre="chevron-derecha" tam={14} trazo={2} />
                      </button>
                    ) : (
                      <span className="cifras">{apps.length}</span>
                    )
                  }
                >
                  {cat.etiqueta}
                </Subtitulo>
                <ul className="pc-apps">
                  {mostradas.map((app) => (
                    <TarjetaApp key={app.id} app={app} estado={estadoDe(app.id)} indice={n++} ocupada={ocupada === app.id} demo={fuente.demo} alAvisame={(qq) => avisame(app, qq)} alAbrir={(tipo) => setCuadro({ tipo, app })} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {/* Desconectar: pide confirmación */}
      <Modal
        abierto={cuadro?.tipo === "desconectar"}
        alCerrar={() => ocupada === null && setCuadro(null)}
        titulo={cuadroApp ? `¿Desconectar ${cuadroApp.nombre}?` : "¿Desconectar?"}
        descripcion={cuadroApp ? `${nombresDe(cuadroApp.agentes)} ya no podrá${cuadroApp.agentes.length > 1 ? "n" : ""} entrar a ${cuadroApp.nombre}${cuentaCuadro ? ` (${cuentaCuadro})` : ""}.` : undefined}
        pie={
          <>
            <button type="button" className={claseBoton("fantasma")} onClick={() => setCuadro(null)} disabled={ocupada !== null}>
              Cancelar
            </button>
            <button type="button" className={claseBoton("principal")} onClick={() => cuadroApp && desconectar(cuadroApp)} disabled={ocupada !== null} aria-busy={ocupada !== null || undefined}>
              {ocupada ? <Giro /> : null}
              {ocupada ? "Desconectando…" : "Desconectar"}
            </button>
          </>
        }
      >
        <p className="pc-modal__nota">
          {cuadroApp?.proveedor
            ? otrasMismaCuenta.length
              ? `Tu cuenta de ${NOMBRE_PROVEEDOR[cuadroApp.proveedor]} sigue conectada para ${otrasMismaCuenta.map((a) => a.nombre).join(", ")}.`
              : cuadroApp.proveedor === "microsoft"
                ? "Es la última app de tu cuenta de Microsoft: Atendel borra la conexión, y el permiso se quita en tu cuenta de Microsoft (la guía docs/configurar-apps.md dice dónde)."
                : `Es la última app de tu cuenta de ${NOMBRE_PROVEEDOR[cuadroApp.proveedor]}: Atendel borra la conexión y quita el permiso.`
            : null}{" "}
          {fuente.demo ? "Es un ejemplo: aquí no se revoca nada." : "Puedes volver a conectarla cuando quieras."}
        </p>
      </Modal>

      {/* Falta configurar: qué poner en Vercel, en corto */}
      <Modal
        abierto={cuadro?.tipo === "configurar"}
        alCerrar={() => setCuadro(null)}
        ancho="ancho"
        titulo={cuadroApp?.proveedor ? `Configurar ${NOMBRE_PROVEEDOR[cuadroApp.proveedor]} en Vercel` : "Configurar en Vercel"}
        descripcion="Esto lo hace quien administra Atendel, una sola vez. Nunca pegues claves en el chat."
        pie={
          <button type="button" className={claseBoton("principal")} onClick={() => setCuadro(null)}>
            Entendido
          </button>
        }
      >
        {cuadroApp?.proveedor ? (
          <div className="pc-guia">
            <ol className="pc-guia__pasos">
              {(PASOS_CONFIGURAR[cuadroApp.proveedor] ?? PASOS_CONFIGURAR_OTRO(cuadroApp.proveedor)).map((p) => (
                <li key={p}>{p}</li>
              ))}
              <li>
                En Vercel, en Settings → Environment Variables, agrega{" "}
                {faltaCuadro.length
                  ? faltaCuadro.map((v, i) => (
                      <span key={v}>
                        <code className="pc-codigo">{v}</code>
                        {i < faltaCuadro.length - 2 ? ", " : i === faltaCuadro.length - 2 ? " y " : ""}
                      </span>
                    ))
                  : "las variables de la guía"}{" "}
                y vuelve a publicar.
              </li>
            </ol>
            <p className="pc-guia__regreso">
              Dirección de regreso:
              <code className="pc-codigo pc-codigo--bloque">{`${window.location.origin}${RUTAS.callback(cuadroApp.proveedor)}`}</code>
            </p>
            <p className="pc-modal__nota">
              La guía completa, paso por paso, está en <code className="pc-codigo">docs/configurar-apps.md</code> del proyecto.
            </p>
          </div>
        ) : null}
      </Modal>

      {/* Shopify (y las que pidan un dato antes del permiso) */}
      <ModalDato app={cuadro?.tipo === "dato" ? cuadroApp : undefined} alCerrar={() => setCuadro(null)} />

      {/* Las apps por llave: el campo para pegar TU llave (se guarda cifrada y no se vuelve a mostrar) */}
      <ModalLlave
        app={cuadro?.tipo === "llave" ? cuadroApp : undefined}
        alCerrar={() => setCuadro(null)}
        alGuardar={async (llave) => {
          const app = cuadroApp;
          if (!app?.proveedor) return;
          const estado = await fuente.guardarLlave(app.proveedor, app.id, llave);
          setEstados((l) => (l ?? []).map((e) => (e.id === app.id ? { ...estado, id: app.id } : e)));
          setCuadro(null);
          setAviso({ tono: "ok", texto: `Listo: ${app.nombre} quedó conectada${estado.cuenta ? ` como ${estado.cuenta}` : ""}. ${nombresDe(app.agentes)} ya la puede${app.agentes.length > 1 ? "n" : ""} usar.` });
        }}
      />

      {/* /pruebalo: no hay permiso de verdad */}
      <Modal
        abierto={cuadro?.tipo === "demo"}
        alCerrar={() => setCuadro(null)}
        titulo={cuadroApp ? `Conectar ${cuadroApp.nombre}` : "Conectar"}
        descripcion={cuadroApp?.proveedor ? `En tu cuenta real esto abre ${NOMBRE_PROVEEDOR[cuadroApp.proveedor]} para dar permiso.` : undefined}
        pie={
          <>
            <button type="button" className={claseBoton("fantasma")} onClick={() => setCuadro(null)}>
              Entendido
            </button>
            <Enlace href="/entrar" className={claseBoton("principal")}>
              Crear mi cuenta
            </Enlace>
          </>
        }
      >
        {cuadroApp ? (
          <div className="pc-guia">
            <p>
              Eliges tu cuenta, ves los permisos (solo lectura) y regresas aquí con la app conectada. Después, {nombresDe(cuadroApp.agentes)} {cuadroApp.agentes.length > 1 ? "pueden" : "puede"}{" "}
              {cuadroApp.puede.replace(/\. Solo lectura\.?$/, "").replace(/\.$/, "").replace(/^./, (c) => c.toLocaleLowerCase("es-MX"))}.
            </p>
            <p className="pc-modal__nota">Esto es un ejemplo: aquí no se abre ninguna cuenta.</p>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

/** Un dato antes del permiso (Shopify: el dominio de la tienda), revisado aquí; luego, al OAuth con &<param>=. */
function ModalDato({ app, alCerrar }: { app?: AppConectable; alCerrar: () => void }) {
  const id = useId();
  const [valor, setValor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [yendo, setYendo] = useState(false);
  const campo = useRef<HTMLInputElement>(null);
  const dato = app?.proveedor ? DATO_CONECTAR[app.proveedor] : undefined;

  useEffect(() => {
    if (app) window.setTimeout(() => campo.current?.focus(), 0);
    else {
      setValor("");
      setError(null);
      setYendo(false);
    }
  }, [app]);

  const seguir = (e: FormEvent) => {
    e.preventDefault();
    if (!app?.proveedor || !dato) return;
    const v = dato.normalizar(valor);
    if (!v) {
      setError(`Escríbelo como ${dato.ejemplo}.`);
      campo.current?.focus();
      return;
    }
    setYendo(true);
    window.location.assign(`${RUTAS.conectar(app.proveedor, app.id)}&${dato.param}=${encodeURIComponent(v)}`);
  };

  return (
    <Modal
      abierto={Boolean(app && dato)}
      alCerrar={alCerrar}
      titulo={app ? `Conectar ${app.nombre}` : "Conectar"}
      descripcion={app?.proveedor ? `Después se abre ${NOMBRE_PROVEEDOR[app.proveedor]} para dar permiso (solo lectura).` : undefined}
      pie={
        <>
          <button type="button" className={claseBoton("fantasma")} onClick={alCerrar}>
            Cancelar
          </button>
          <button type="submit" form={`${id}-form`} className={claseBoton("principal")} disabled={yendo} aria-busy={yendo || undefined}>
            {yendo ? <Giro /> : null}
            Seguir
          </button>
        </>
      }
    >
      {dato ? (
        <form id={`${id}-form`} className="pc-campo" onSubmit={seguir} noValidate>
          <label htmlFor={`${id}-dato`} className="pc-campo__etiqueta">
            {dato.etiqueta}
          </label>
          <input
            ref={campo}
            id={`${id}-dato`}
            className="pc-campo__entrada"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={dato.ejemplo}
            maxLength={120}
            value={valor}
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-ayuda${error ? ` ${id}-error` : ""}`}
            onChange={(e) => {
              setValor(e.target.value);
              if (error) setError(null);
            }}
          />
          {error ? (
            <p id={`${id}-error`} className="pc-error pc-link__error" role="alert">
              <Icono nombre="alerta" tam={14} />
              {error}
            </p>
          ) : null}
          <p id={`${id}-ayuda`} className="pc-modal__nota">
            {dato.ayuda}
          </p>
        </form>
      ) : null}
    </Modal>
  );
}

/** Pegar TU llave: campo de contraseña que se muestra u oculta, los pasos para sacarla y Guardar. */
function ModalLlave({ app, alCerrar, alGuardar }: { app?: AppConectable; alCerrar: () => void; alGuardar: (llave: string) => Promise<void> }) {
  const fuente = useFuenteNegocio();
  const id = useId();
  const [llave, setLlave] = useState("");
  const [ver, setVer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [ejemplo, setEjemplo] = useState(false);
  const campo = useRef<HTMLInputElement>(null);
  const abierto = Boolean(app);

  // Al cerrar, la llave se olvida
  useEffect(() => {
    if (abierto) {
      window.setTimeout(() => campo.current?.focus(), 0);
      return;
    }
    setLlave("");
    setVer(false);
    setError(null);
    setEjemplo(false);
  }, [abierto]);

  const guardar = async (e?: FormEvent) => {
    e?.preventDefault();
    if (guardando) return;
    const t = llave.trim();
    if (!t) {
      setError("Pega tu llave para conectarla.");
      campo.current?.focus();
      return;
    }
    if (fuente.demo) {
      setEjemplo(true);
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await alGuardar(t);
      setLlave("");
    } catch (err) {
      setError(mensajeDe(err, "No se pudo guardar la llave. Revísala e intenta de nuevo."));
      campo.current?.focus();
    } finally {
      setGuardando(false);
    }
  };

  const proveedor = app?.proveedor ? NOMBRE_PROVEEDOR[app.proveedor] : "";
  const pasos = app?.proveedor ? (PASOS_LLAVE[app.proveedor] ?? [`Copia tu llave de ${proveedor} y pégala aquí.`]) : [];

  return (
    <Modal
      abierto={abierto}
      alCerrar={() => !guardando && alCerrar()}
      titulo={app ? `Conectar ${app.nombre}` : "Conectar"}
      descripcion={app ? `${app.nombre} se conecta con una llave tuya. Se guarda cifrada y nunca se vuelve a mostrar.` : undefined}
      pie={
        <>
          <button type="button" className={claseBoton("fantasma")} onClick={alCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" form={`${id}-form`} className={claseBoton("principal")} disabled={guardando} aria-busy={guardando || undefined}>
            {guardando ? <Giro /> : null}
            {guardando ? "Revisando la llave…" : "Guardar llave"}
          </button>
        </>
      }
    >
      {app ? (
        <form id={`${id}-form`} className="pc-guia" onSubmit={guardar} noValidate>
          <ol className="pc-guia__pasos">
            {pasos.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
          <div className="pc-campo">
            <label htmlFor={`${id}-llave`} className="pc-campo__etiqueta">
              Tu llave de {proveedor}
            </label>
            <div className="pc-llave__fila">
              <input
                ref={campo}
                id={`${id}-llave`}
                className="pc-campo__entrada"
                type={ver ? "text" : "password"}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                maxLength={500}
                value={llave}
                aria-invalid={error ? true : undefined}
                aria-describedby={`${id}-nota${error ? ` ${id}-error` : ""}`}
                onChange={(e) => {
                  setLlave(e.target.value);
                  if (error) setError(null);
                  if (ejemplo) setEjemplo(false);
                }}
              />
              <button type="button" className={claseBoton("borde")} onClick={() => setVer((v) => !v)} aria-pressed={ver} aria-controls={`${id}-llave`}>
                {ver ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {error ? (
              <p id={`${id}-error`} className="pc-error pc-link__error" role="alert">
                <Icono nombre="alerta" tam={14} />
                {error}
              </p>
            ) : null}
            <p id={`${id}-nota`} className="pc-modal__nota">
              Atendel solo la usa para leer. Puedes quitarla cuando quieras con «Desconectar».
            </p>
          </div>
          {ejemplo ? (
            <p className="pc-docs__aviso" role="status">
              <Icono nombre="check-circulo" tam={16} />
              Es un ejemplo: en tu cuenta real la llave se revisa con {proveedor}, se guarda cifrada y {app.nombre} queda conectada.
            </p>
          ) : null}
        </form>
      ) : null}
    </Modal>
  );
}

function TarjetaApp({
  app,
  estado,
  indice,
  ocupada,
  demo,
  alAvisame,
  alAbrir,
}: {
  app: AppConectable;
  estado: EstadoAppPersona;
  indice: number;
  ocupada: boolean;
  demo: boolean;
  alAvisame: (quiere: boolean) => void;
  alAbrir: (tipo: TipoCuadro) => void;
}) {
  const insignia = INSIGNIA[estado.estado];
  const id = useId();
  const conectar = (texto: string) =>
    !app.proveedor ? null : app.autenticacion === "llave" ? (
      <button type="button" className={claseBoton("principal", true)} onClick={() => alAbrir("llave")} aria-describedby={`${id}-nombre`}>
        <Icono nombre="candado" tam={16} />
        {texto}
      </button>
    ) : demo || DATO_CONECTAR[app.proveedor] ? (
      <button type="button" className={claseBoton("principal", true)} onClick={() => alAbrir(demo ? "demo" : "dato")} aria-describedby={`${id}-nombre`}>
        {texto}
      </button>
    ) : (
      // El OAuth es una ruta de la API que redirige: navegación completa, fuera del panel
      <a href={RUTAS.conectar(app.proveedor, app.id)} className={claseBoton("principal", true)} aria-describedby={`${id}-nombre`}>
        {texto}
      </a>
    );

  let pie: ReactNode;
  switch (estado.estado) {
    case "conectada":
      pie = (
        <>
          <span className="pc-app__cuenta" title={estado.cuenta}>
            {estado.cuenta ? `Conectado como ${estado.cuenta}` : "Conectada"}
            {demo ? " (ejemplo)" : ""}
          </span>
          <button type="button" className={claseBoton("borde", true)} onClick={() => alAbrir("desconectar")} aria-describedby={`${id}-nombre`}>
            Desconectar
          </button>
        </>
      );
      break;
    case "sin_configurar":
      pie = (
        <>
          <span className="pc-app__falta">Falta configurar en Vercel{estado.falta?.length ? `: ${estado.falta.join(", ")}` : ""}</span>
          <button type="button" className={claseBoton("borde", true)} onClick={() => alAbrir("configurar")} aria-describedby={`${id}-nombre`}>
            Cómo configurarlo
          </button>
        </>
      );
      break;
    case "en_camino":
      pie = (
        <>
          <span className="pc-app__fase">Todavía no tiene cómo conectarse</span>
          <button
            type="button"
            className={claseBoton(estado.avisame ? "suave" : "borde", true)}
            aria-pressed={Boolean(estado.avisame)}
            aria-describedby={`${id}-nombre`}
            disabled={ocupada}
            onClick={() => alAvisame(!estado.avisame)}
            title={estado.avisame ? "Toca para dejar de avisarte" : undefined}
          >
            {ocupada ? <Giro /> : <Icono nombre={estado.avisame ? "check" : "campana"} tam={16} trazo={estado.avisame ? 2 : undefined} />}
            {estado.avisame ? "Te avisaremos" : "Avísame"}
          </button>
        </>
      );
      break;
    case "error":
      pie = (
        <>
          <span className="pc-app__error">{estado.error || "La conexión dejó de funcionar."}</span>
          {conectar("Vuelve a conectar")}
        </>
      );
      break;
    default:
      pie = (
        <>
          <span className="pc-app__fase">{app.autenticacion === "llave" ? "Con una llave tuya" : app.proveedor ? `Con tu cuenta de ${NOMBRE_PROVEEDOR[app.proveedor]}` : ""}</span>
          {conectar("Conectar")}
        </>
      );
  }

  return (
    <li className="pc-tarjeta pc-app pc-entra" data-estado={estado.estado} style={{ "--d": `${retrasoEscalon(indice)}ms` } as CSSProperties}>
      <div className="pc-app__cabeza">
        <span className="pc-app__icono" aria-hidden="true">
          <Icono nombre={ICONO_CATEGORIA[app.categoria] ?? "documento"} tam={18} />
        </span>
        <h3 id={`${id}-nombre`} className="pc-app__nombre">
          {app.nombre}
        </h3>
        <span className={`pc-estado pc-estado--${insignia.tono}`}>{insignia.texto}</span>
      </div>
      <p className="pc-app__quien">
        {app.agentes.map((a) => (
          <AvatarAgente key={a} agente={a} tam={18} />
        ))}
        <span>La usa {nombresDe(app.agentes)}</span>
      </p>
      <p className="pc-app__puede">{app.puede}</p>
      {app.requiereAprobacion ? (
        <p className="pc-app__aprobacion">
          <Icono nombre="alerta" tam={14} />
          {app.requiereAprobacion}
        </p>
      ) : null}
      <div className="pc-app__pie">{pie}</div>
    </li>
  );
}
