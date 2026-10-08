"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { Avatar } from "./Avatar";
import { claseBotonBase } from "./Boton";
import { Icono, type NombreIcono } from "./Iconos";
import { Insignia } from "./Insignia";
import { Kbd } from "./Kbd";
import { PuntoEstado, type TonoEstado } from "./PuntoEstado";

/**
 * Menú desplegable genérico (estilo en globals.css, ".menu"): el de perfil
 * del avatar, el de acciones rápidas del "+", el de "más opciones" (⋯).
 *
 * - Disparador: botón con aria-haspopup="menu" y aria-expanded. `aspecto`:
 *   "icono" (32px, para el "+" o ⋯), "avatar" (anillo al pasar y al abrir),
 *   "boton" (botón sutil compacto con chevron) o "libre" (lo vistes tú).
 * - Panel: radio 14px, borde 1px, sombra flotante suave y un velo de vidrio
 *   (sólido con prefers-reduced-transparency). Entra con opacidad + escala
 *   0.98→1 + 4px desde su disparador (0.2s) y sale más rápido (0.15s).
 *   Con movimiento reducido, solo opacidad.
 * - Se cierra con clic afuera, Esc (el foco vuelve al disparador), Tab (el
 *   foco sigue su camino) o al elegir algo.
 * - Teclado: ↓/↑ abren desde el disparador (primero/último); adentro ↓ ↑,
 *   Inicio, Fin y la primera letra para saltar. Enter y Espacio eligen.
 *   Abierto con teclado, el foco va al primer elemento; con el mouse, al panel.
 * - Elementos: ícono, texto, descripción, contador, atajo (<Kbd>), `href`
 *   (navega con next/link) o `alElegir`, `peligroso` (rojo: "Cerrar sesión"),
 *   `deshabilitado`, `pronto` (deshabilitado con insignia "Pronto": no se
 *   inventan funciones). También `{ tipo: "separador" }` y `{ tipo: "titulo" }`.
 * - Encabezado opcional: avatar, nombre, correo y estado (nombra al menú).
 *
 *   <Menu etiqueta="Tu cuenta" aspecto="avatar" alineacion="fin"
 *     disparador={<Avatar nombre="Ana López" tam={32} />}
 *     encabezado={{ nombre: "Ana López", correo: "ana@clinicaluna.mx", estado: { tono: "exito", etiqueta: "Disponible" } }}
 *     elementos={[{ id: "perfil", etiqueta: "Perfil", icono: "perfil", href: "/panel/perfil" }, { tipo: "separador" },
 *                 { id: "salir", etiqueta: "Cerrar sesión", icono: "cerrar-sesion", peligroso: true, alElegir: salir }]} />
 */

export type ElementoMenu =
  | {
      tipo?: "elemento";
      id: string;
      etiqueta: string;
      icono?: NombreIcono;
      descripcion?: string;
      href?: string;
      alElegir?: () => void;
      peligroso?: boolean;
      deshabilitado?: boolean;
      /** Todavía no existe: se muestra deshabilitado con la insignia "Pronto". */
      pronto?: boolean;
      /** Teclas del atajo, ej. ["N"] o ["Ctrl", "K"]. */
      atajo?: string[];
      contador?: number;
      /** Marca el elemento de la página en la que estás. */
      actual?: boolean;
    }
  | { tipo: "separador"; id?: string }
  | { tipo: "titulo"; id?: string; etiqueta: string };

export type EncabezadoMenu = {
  nombre: string;
  correo?: string;
  foto?: string | null;
  estado?: { tono: TonoEstado; etiqueta: string };
};

type Aspecto = "icono" | "avatar" | "boton" | "libre";

// Clases completas para que Tailwind no las descarte al compilar
const CLASE_DISPARADOR: Record<Aspecto, string> = {
  icono: "menu__disparador boton-icono boton-icono--capa boton-icono--compacto",
  avatar: "menu__disparador menu__disparador--avatar",
  boton: `menu__disparador ${claseBotonBase("sutil", "compacto")}`,
  libre: "menu__disparador",
};

const sinAcentos = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("es-MX")
    .trim();

export function Menu({
  etiqueta,
  disparador,
  etiquetaDisparador,
  aspecto = "libre",
  claseDisparador = "",
  elementos,
  encabezado,
  alineacion = "inicio",
  lado = "abajo",
  abiertoInicial = false,
  alCambiar,
  className = "",
}: {
  /** Nombre del menú para lectores de pantalla (ej. "Tu cuenta", "Crear"). */
  etiqueta: string;
  /** Lo que se ve en el disparador (ícono, avatar, texto). */
  disparador: ReactNode;
  /** Cómo se lee el disparador si no tiene texto (por defecto, `etiqueta`). */
  etiquetaDisparador?: string;
  aspecto?: Aspecto;
  claseDisparador?: string;
  elementos: ElementoMenu[];
  encabezado?: EncabezadoMenu;
  /** "inicio": el panel crece hacia la derecha; "fin": hacia la izquierda (para la orilla derecha). */
  alineacion?: "inicio" | "fin";
  /** "arriba" para menús al pie de la pantalla. */
  lado?: "abajo" | "arriba";
  /** Abierto desde el principio (solo para el muestrario o pruebas). */
  abiertoInicial?: boolean;
  alCambiar?: (abierto: boolean) => void;
  className?: string;
}) {
  const base = useId().replace(/:/g, "");
  const idPanel = `${base}-menu`;
  const idDisparador = `${base}-disparador`;
  const idNombre = `${base}-nombre`;
  const idCorreo = `${base}-correo`;
  const [abierto, setAbierto] = useState(abiertoInicial);
  const raiz = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const enfocarAlAbrir = useRef<"primero" | "ultimo" | "panel" | null>(null);
  const busqueda = useRef({ texto: "", hasta: 0 });

  const cambiar = useCallback(
    (v: boolean) => {
      setAbierto(v);
      alCambiar?.(v);
    },
    [alCambiar],
  );

  const cerrar = useCallback(
    (devolverFoco: boolean) => {
      cambiar(false);
      if (devolverFoco) boton.current?.focus();
    },
    [cambiar],
  );

  const elementosVivos = useCallback(
    () => Array.from(panel.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []),
    [],
  );

  // Al abrir: el foco va al primer/último elemento (teclado) o al panel (mouse)
  useEffect(() => {
    if (!abierto) return;
    const modo = enfocarAlAbrir.current;
    enfocarAlAbrir.current = null;
    if (!modo) return;
    const lista = elementosVivos();
    if (modo === "primero" && lista[0]) lista[0].focus();
    else if (modo === "ultimo" && lista.length) lista[lista.length - 1].focus();
    else panel.current?.focus();
  }, [abierto, elementosVivos]);

  // Abierto: clic afuera y Esc lo cierran
  useEffect(() => {
    if (!abierto) return;
    const alTocar = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) cerrar(false);
    };
    const alTeclear = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      cerrar(Boolean(raiz.current?.contains(document.activeElement)));
    };
    document.addEventListener("pointerdown", alTocar);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("pointerdown", alTocar);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto, cerrar]);

  const alPulsarDisparador = (e: MouseEvent<HTMLButtonElement>) => {
    if (abierto) {
      cerrar(false);
      return;
    }
    // detail === 0: lo activó el teclado (Enter o Espacio)
    enfocarAlAbrir.current = e.detail === 0 ? "primero" : "panel";
    cambiar(true);
  };

  const alTeclearDisparador = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    enfocarAlAbrir.current = e.key === "ArrowDown" ? "primero" : "ultimo";
    if (abierto) {
      const lista = elementosVivos();
      (e.key === "ArrowDown" ? lista[0] : lista[lista.length - 1])?.focus();
    } else cambiar(true);
  };

  const alTeclearPanel = (e: KeyboardEvent<HTMLDivElement>) => {
    const lista = elementosVivos();
    if (!lista.length) return;
    const i = lista.indexOf(document.activeElement as HTMLElement);
    const ir = (n: number) => {
      e.preventDefault();
      lista[(n + lista.length) % lista.length]?.focus();
    };
    switch (e.key) {
      case "ArrowDown":
        return ir(i < 0 ? 0 : i + 1);
      case "ArrowUp":
        return ir(i < 0 ? lista.length - 1 : i - 1);
      case "Home":
        return ir(0);
      case "End":
        return ir(lista.length - 1);
      case "Tab":
        cerrar(false);
        return;
      case " ":
        // Espacio no activa los enlaces por sí solo
        if (i >= 0 && lista[i].tagName === "A") {
          e.preventDefault();
          lista[i].click();
        }
        return;
    }
    // Primera letra: salta al siguiente elemento que empieza así
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && /\S/.test(e.key)) {
      const ahora = Date.now();
      const b = busqueda.current;
      b.texto = (ahora > b.hasta ? "" : b.texto) + sinAcentos(e.key);
      b.hasta = ahora + 500;
      const orden = [...lista.slice(i + 1), ...lista.slice(0, i + 1)];
      const hallado = orden.find((el) => sinAcentos(el.textContent ?? "").startsWith(b.texto));
      if (hallado) {
        e.preventDefault();
        hallado.focus();
      }
    }
  };

  const elegir = (el: Extract<ElementoMenu, { id: string; etiqueta: string; tipo?: "elemento" }>) => {
    if (el.deshabilitado || el.pronto) return;
    el.alElegir?.();
    // Si navega, la página cambia; si no, el foco vuelve al disparador
    cerrar(!el.href);
  };

  const clasesRaiz = ["menu", alineacion === "fin" ? "menu--fin" : "", lado === "arriba" ? "menu--arriba" : "", className].filter(Boolean).join(" ");

  return (
    <div
      ref={raiz}
      className={clasesRaiz}
      onBlur={(e) => {
        // El foco salió del menú (Tab, clic en otra parte): se cierra sin robarlo
        if (abierto && e.relatedTarget && !raiz.current?.contains(e.relatedTarget as Node)) cerrar(false);
      }}
    >
      <button
        ref={boton}
        id={idDisparador}
        type="button"
        className={`${CLASE_DISPARADOR[aspecto]} ${claseDisparador}`}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={idPanel}
        aria-label={etiquetaDisparador ?? (aspecto === "boton" ? undefined : etiqueta)}
        title={aspecto === "icono" ? (etiquetaDisparador ?? etiqueta) : undefined}
        onClick={alPulsarDisparador}
        onKeyDown={alTeclearDisparador}
      >
        {aspecto === "boton" ? (
          <>
            <span>{disparador}</span>
            <Icono nombre="chevron" tam={16} />
          </>
        ) : (
          disparador
        )}
      </button>

      <div
        ref={panel}
        id={idPanel}
        role="menu"
        tabIndex={-1}
        aria-label={encabezado ? undefined : etiqueta}
        aria-labelledby={encabezado ? idNombre : undefined}
        aria-describedby={encabezado?.correo ? idCorreo : undefined}
        aria-orientation="vertical"
        className="menu__panel"
        data-abierto={abierto ? "true" : undefined}
        onKeyDown={alTeclearPanel}
      >
        {encabezado ? (
          <>
            <div className="menu__cabeza" role="none">
              <Avatar nombre={encabezado.nombre} src={encabezado.foto} tam={40} estado={encabezado.estado?.tono} anillo="var(--c-superficie)" />
              <span id={idNombre} className="menu__nombre">
                {encabezado.nombre}
              </span>
              {encabezado.correo ? (
                <span id={idCorreo} className="menu__correo">
                  {encabezado.correo}
                </span>
              ) : null}
              {encabezado.estado ? <PuntoEstado tono={encabezado.estado.tono} etiqueta={encabezado.estado.etiqueta} mostrarEtiqueta /> : null}
            </div>
            <div role="separator" className="menu__separador" />
          </>
        ) : null}

        {elementos.map((el, i) => {
          if (el.tipo === "separador") return <div key={el.id ?? `sep-${i}`} role="separator" className="menu__separador" />;
          if (el.tipo === "titulo")
            return (
              <div key={el.id ?? `tit-${i}`} role="none" className="menu__titulo">
                {el.etiqueta}
              </div>
            );
          const inactivo = Boolean(el.deshabilitado || el.pronto);
          const clases = `menu__elemento${el.peligroso ? " menu__elemento--peligro" : ""}`;
          const contenido = (
            <>
              {el.icono ? <Icono nombre={el.icono} /> : null}
              <span className="menu__texto">
                <span>{el.etiqueta}</span>
                {el.descripcion ? <span className="menu__descripcion">{el.descripcion}</span> : null}
              </span>
              {el.pronto || el.contador || el.atajo?.length ? (
                <span className="menu__extra">
                  {el.pronto ? <Insignia tono="pronto">Pronto</Insignia> : null}
                  {el.contador ? <Insignia contador={el.contador} /> : null}
                  {el.atajo?.length ? <Kbd teclas={el.atajo} /> : null}
                </span>
              ) : null}
            </>
          );
          return (
            <Fragment key={el.id}>
              {el.href && !inactivo ? (
                <Link
                  href={el.href}
                  role="menuitem"
                  tabIndex={-1}
                  className={clases}
                  aria-current={el.actual ? "page" : undefined}
                  onClick={() => elegir(el)}
                >
                  {contenido}
                </Link>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  className={clases}
                  aria-disabled={inactivo || undefined}
                  aria-current={el.actual ? "page" : undefined}
                  onClick={() => elegir(el)}
                >
                  {contenido}
                </button>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
