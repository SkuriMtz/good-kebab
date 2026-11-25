"use client";

import { useEffect, useState } from "react";
import { Giro, Icono } from "@/components/base/Iconos";
import { nombresDe } from "./Mensajes";
import { Enlace, Modal, claseBoton } from "./Piezas";
import { mensajeDe, useFuenteNegocio } from "./negocio/fuente";
import { APP_POR_ID, esIdApp } from "@/lib/conexiones/catalogo";
import { queHaceAlEscribir, tieneEscritura } from "@/lib/conexiones/permisos-google";
import { LOGO_APP } from "@/lib/conexiones/logos";
import { RUTAS, type EstadoAppPersona, type IdApp } from "@/lib/nucleo-tipos";

/** Lo que se abre "Conectar una app" desde el chat (el "+" o un enlace ?conectar=<app>). */
export const EVENTO_CONECTAR = "atendel:conectar";
export const abrirConectar = (app?: IdApp | null) => {
  // Sin esto, el foco pasa de la caja de texto a la ✕ de la ventana con el anillo de teclado
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  window.dispatchEvent(new CustomEvent(EVENTO_CONECTAR, { detail: { app: app ?? null } }));
};

/** Las que más se usan desde el chat; las demás están en Tu negocio → Apps. */
const DESTACADAS: IdApp[] = ["gmail", "google_calendar", "google_drive", "google_sheets", "whatsapp_business", "outlook", "excel", "stripe"];

/** Lo que hace cada app, corto (sin el "Solo lectura" del catálogo). */
const corto = (puede: string) => puede.replace(/\s*Solo lectura\.?$/, "").replace(/\.$/, "");

/**
 * "Conectar una app" sin salir del chat: las apps más usadas con su estado
 * y su botón. Conectar abre el permiso de Google, Microsoft o Meta y regresa
 * a este mismo chat (?volver=chat) con el aviso de que quedó conectada. Las
 * que piden una llave (Stripe) se conectan en Tu negocio → Apps. En
 * /pruebalo no se abre ninguna cuenta: se explica qué pasaría.
 */
export function ConectarApps({ abierta, enfocar, escribir = false, alCerrar }: { abierta: boolean; enfocar: IdApp | null; /** Se abrió para dar el permiso de hacer cosas en `enfocar` (?permiso=escribir). */ escribir?: boolean; alCerrar: () => void }) {
  const fuente = useFuenteNegocio();
  const [estados, setEstados] = useState<EstadoAppPersona[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ejemplo, setEjemplo] = useState<IdApp | null>(null);

  useEffect(() => {
    if (!abierta) return;
    setEjemplo(null);
    setError(null);
    let vivo = true;
    fuente
      .listarApps()
      .then((l) => vivo && setEstados(l))
      .catch((e) => vivo && setError(mensajeDe(e, "No se pudo leer el estado de tus apps.")));
    return () => {
      vivo = false;
    };
  }, [abierta, fuente]);

  const ids = (enfocar && !DESTACADAS.includes(enfocar) ? [enfocar, ...DESTACADAS] : DESTACADAS).filter((id) => esIdApp(id) && APP_POR_ID[id].fase === 1);
  const estadoDe = (id: IdApp) => estados?.find((e) => e.id === id)?.estado ?? (estados ? "desconectada" : null);
  const hrefApps = `${fuente.base}?vista=negocio&tab=apps`;
  // Al regresar del permiso se vuelve a esta conversación (si había una abierta)
  const volver = () => {
    const c = new URLSearchParams(window.location.search).get("c");
    return `&volver=chat${c && /^[\w-]{1,100}$/.test(c) ? `&c=${encodeURIComponent(c)}` : ""}`;
  };
  const appEjemplo = ejemplo ? APP_POR_ID[ejemplo] : null;
  // «Dar permiso»: la app ya está conectada para leer; falta el permiso de hacer cosas (se pide una vez)
  const permisoDe = escribir && enfocar && tieneEscritura(enfocar) ? enfocar : null;
  const queHace = permisoDe ? queHaceAlEscribir(permisoDe) : null;

  return (
    <Modal
      abierto={abierta}
      alCerrar={alCerrar}
      titulo="Conectar una app"
      descripcion={
        permisoDe
          ? `Para ${queHace}, Atendel necesita tu permiso en Google. Se da una sola vez y lo puedes quitar cuando quieras.`
          : "Al conectar una app, Atendel solo la lee. Si un día necesita hacer algo, como mandar un correo o agendar, te pide permiso en ese momento."
      }
      className="pc-conectar"
      pie={
        <Enlace href={hrefApps} className={claseBoton("fantasma")} onClick={alCerrar}>
          Ver todas las apps
        </Enlace>
      }
    >
      {error ? (
        <p className="pc-conectar__error" role="alert">
          {error}
        </p>
      ) : null}
      {permisoDe && APP_POR_ID[permisoDe].proveedor ? (
        <div className="pc-conectar__permiso">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo chico y fijo */}
          <img src={LOGO_APP[permisoDe]} alt="" width={24} height={24} className="pc-conectar__logo" />
          <span className="pc-conectar__textos">
            <span className="pc-conectar__nombre">{APP_POR_ID[permisoDe].nombre}</span>
            <span className="pc-conectar__detalle">Permiso para {queHace}</span>
          </span>
          {fuente.demo ? (
            <button type="button" className={claseBoton("principal", true)} onClick={() => setEjemplo(permisoDe)}>
              Dar permiso
            </button>
          ) : (
            <a href={`${RUTAS.conectar(APP_POR_ID[permisoDe].proveedor!, permisoDe)}&permiso=escribir${volver()}`} className={claseBoton("principal", true)}>
              Dar permiso
            </a>
          )}
        </div>
      ) : null}
      <ul className="pc-conectar__lista">
        {(permisoDe ? ids.filter((id) => id !== permisoDe) : ids).map((id) => {
          const app = APP_POR_ID[id];
          const estado = estadoDe(id);
          let accion;
          if (estado === null) accion = <Giro />;
          else if (estado === "conectada")
            accion = (
              <span className="pc-conectar__lista-ok">
                <Icono nombre="check" tam={16} trazo={2} />
                Conectada
              </span>
            );
          else if (estado === "sin_configurar" || estado === "en_camino" || !app.proveedor) accion = <span className="pc-conectar__pronto">Pronto</span>;
          else if (fuente.demo)
            accion = (
              <button type="button" className={claseBoton("borde", true)} onClick={() => setEjemplo(id)} aria-expanded={ejemplo === id}>
                Conectar
              </button>
            );
          else if (app.autenticacion === "llave")
            accion = (
              <Enlace href={hrefApps} className={claseBoton("borde", true)} onClick={alCerrar}>
                Conectar
              </Enlace>
            );
          else
            accion = (
              // El permiso es una ruta de la API que redirige: navegación completa
              <a href={`${RUTAS.conectar(app.proveedor, id)}${volver()}`} className={claseBoton("principal", true)}>
                {estado === "error" ? "Volver a conectar" : "Conectar"}
              </a>
            );
          return (
            <li key={id} className="pc-conectar__fila" data-enfocada={enfocar === id ? "" : undefined}>
              {/* eslint-disable-next-line @next/next/no-img-element -- logo chico y fijo */}
              <img src={LOGO_APP[id]} alt="" width={24} height={24} className="pc-conectar__logo" />
              <span className="pc-conectar__textos">
                <span className="pc-conectar__nombre">{app.nombre}</span>
                <span className="pc-conectar__detalle">
                  {nombresDe(app.agentes)} · {corto(app.puede)}
                </span>
              </span>
              {accion}
            </li>
          );
        })}
      </ul>
      {appEjemplo ? (
        <p className="pc-conectar__ejemplo" role="status">
          Es un ejemplo: en tu cuenta, aquí se abre {appEjemplo.proveedor === "microsoft" ? "Microsoft" : appEjemplo.proveedor === "meta" ? "Meta" : appEjemplo.proveedor === "stripe" ? "Stripe" : "Google"} para dar
          permiso y regresas a este chat con {appEjemplo.nombre} conectada.{" "}
          <Enlace href="/entrar" className="pc-enlace">
            Crear mi cuenta
          </Enlace>
        </p>
      ) : null}
    </Modal>
  );
}
