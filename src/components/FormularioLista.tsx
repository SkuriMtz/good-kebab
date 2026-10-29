"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { Boton } from "./base/Boton";
import { CampoCorreo } from "./base/Campo";
import { Icono } from "./base/Iconos";
import { normalizarCorreo, revisarSolicitud, type Solicitud } from "@/lib/lista";
import { PRUEBALO } from "@/lib/contenido";
import { useIdioma } from "@/i18n/Idioma";

/* ---------------------------------------------------------------------
   Envío a /api/lista (lista de espera y contacto).
   Igual que enviarSolicitud() de src/lib/lista.ts, pero además dice POR QUÉ
   falló, para que cada formulario lo muestre con el tono correcto:
   - "datos":    el servidor rechazó un valor (400): error junto al campo.
   - "pausa":    la tabla todavía no existe (503, falta correr la migración):
                 aviso amable, no un error rojo.
   - "falla":    el servidor no pudo guardar (500 u otro): aviso con reintento.
   - "conexion": sin internet: aviso con reintento.
   --------------------------------------------------------------------- */
export type MotivoFalla = "datos" | "pausa" | "falla" | "conexion";
export type ResultadoEnvio = { ok: true } | { ok: false; motivo: MotivoFalla; error: string };

export async function mandarSolicitud(s: Solicitud, trampa = ""): Promise<ResultadoEnvio> {
  const problema = revisarSolicitud(s);
  if (problema) return { ok: false, motivo: "datos", error: problema };
  try {
    const res = await fetch("/api/lista", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...s, correo: normalizarCorreo(s.correo), sitio_web: trampa }),
    });
    const datos = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (res.ok && datos?.ok) return { ok: true };
    const error = datos?.error || "No pudimos guardar tus datos. Intenta de nuevo en un momento.";
    const motivo: MotivoFalla = res.status === 503 ? "pausa" : res.status === 400 ? "datos" : "falla";
    return { ok: false, motivo, error };
  } catch {
    return { ok: false, motivo: "conexion", error: "No hay conexión. Revisa tu internet e intenta de nuevo." };
  }
}

type Estado = "editando" | "enviando" | "enviado" | "error" | "aviso";

/**
 * Formulario en línea de la lista de espera (portada, CTA final y /lista):
 * campo de correo + botón principal "Únete a la lista" + botón sutil
 * "Prueba los agentes" (a /pruebalo). En celular se apila.
 *
 * Estados:
 * - vacío / escribiendo;
 * - enviando: giro en el botón, campo bloqueado;
 * - enviado: "Listo. Te escribimos a <correo>…" (anunciado), con opción de
 *   corregir el correo;
 * - error del correo: mensaje junto al campo, el campo se sacude apenas
 *   (solo transform) y el foco regresa a él;
 * - aviso: si el servidor todavía no puede guardar (la tabla de Supabase no
 *   existe) o falla, un aviso amable bajo el formulario —sin rojo— con el
 *   camino a Pruébalo; el correo se queda escrito para reintentar.
 */
export function FormularioLista({
  centrado = false,
  etiquetaBoton,
  conSecundario = true,
  className = "",
}: {
  centrado?: boolean;
  etiquetaBoton?: string;
  /** Muestra el botón sutil "Prueba los agentes". */
  conSecundario?: boolean;
  className?: string;
}) {
  const { d } = useIdioma();
  const L = d.listaEspera;
  const [correo, setCorreo] = useState("");
  const [trampa, setTrampa] = useState("");
  const [estado, setEstado] = useState<Estado>("editando");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ motivo: MotivoFalla; texto: string } | null>(null);
  const [sacudidas, setSacudidas] = useState(0);
  const [enviadoA, setEnviadoA] = useState("");
  const campo = useRef<HTMLInputElement>(null);
  const idTrampa = useId();
  const idAviso = useId();

  const marcarError = (texto: string) => {
    setError(texto);
    setAviso(null);
    setEstado("error");
    setSacudidas((n) => n + 1);
    campo.current?.focus();
  };

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (estado === "enviando") return;
    // Se revisa aquí, en el idioma de la página
    if (!correo.trim()) return marcarError(L.errores.vacio);
    if (revisarSolicitud({ tipo: "lista", correo })) return marcarError(L.errores.invalido);
    setError(null);
    setEstado("enviando");
    const r = await mandarSolicitud({ tipo: "lista", correo }, trampa);
    if (r.ok) {
      setEnviadoA(normalizarCorreo(correo));
      setAviso(null);
      setEstado("enviado");
    } else if (r.motivo === "datos") {
      marcarError(L.errores.datos);
    } else {
      setAviso({ motivo: r.motivo, texto: L.errores[r.motivo] });
      setEstado("aviso");
    }
  };

  const corregir = () => {
    setEstado("editando");
    requestAnimationFrame(() => campo.current?.focus());
  };

  const reintento = estado === "aviso" && aviso?.motivo !== "pausa";

  return (
    <div className={`formulario-lista${centrado ? " formulario-lista--centro" : ""} ${className}`}>
      <div aria-live="polite">
        {estado === "enviado" ? (
          <div className="formulario-lista__listo">
            <Icono nombre="check-circulo" />
            <p>
              <span className="block">
                {L.listoA}
                <strong className="break-all font-medium">{enviadoA}</strong>
                {L.listoB}
              </span>
              <button type="button" className="formulario-lista__corregir" onClick={corregir}>
                {L.corregir}
              </button>
            </p>
          </div>
        ) : null}
      </div>

      {estado !== "enviado" ? (
        <form noValidate onSubmit={enviar} aria-label={L.formulario} aria-describedby={aviso ? idAviso : undefined}>
          <div className="formulario-lista__fila">
            <CampoCorreo
              ref={campo}
              etiqueta={L.correo}
              name="correo"
              className={`formulario-lista__campo${sacudidas ? (sacudidas % 2 ? " sacude-a" : " sacude-b") : ""}`}
              value={correo}
              alCambiar={(v) => {
                setCorreo(v);
                if (estado === "error") {
                  setEstado("editando");
                  setError(null);
                }
              }}
              error={error}
              readOnly={estado === "enviando"}
              aria-busy={estado === "enviando" || undefined}
              required
            />
            <Boton type="submit" tam="grande" cargando={estado === "enviando"} className="max-sm:w-full">
              {estado === "enviando" ? L.anotando : reintento ? L.reintentar : etiquetaBoton ?? L.boton}
            </Boton>
            {conSecundario ? (
              <Boton href={PRUEBALO.href} variante="sutil" tam="grande" className="max-sm:w-full">
                {L.pruebaAgentes}
              </Boton>
            ) : null}
          </div>
          {/* Campo trampa contra bots: invisible para las personas y fuera del orden de tabulación */}
          <div className="formulario-lista__trampa" aria-hidden="true">
            <label htmlFor={idTrampa}>{L.trampa}</label>
            <input
              id={idTrampa}
              type="text"
              name="sitio_web"
              tabIndex={-1}
              autoComplete="off"
              value={trampa}
              onChange={(e) => setTrampa(e.target.value)}
            />
          </div>
        </form>
      ) : null}

      <div aria-live="polite">
        {estado === "aviso" && aviso ? (
          <div id={idAviso} className="formulario-lista__aviso" role="status">
            <Icono nombre={aviso.motivo === "pausa" ? "reloj" : "alerta"} tam={20} />
            <p>
              {aviso.texto}{" "}
              {aviso.motivo === "pausa" ? (
                <Link href={PRUEBALO.href} className="enlace">
                  {L.irPruebalo}
                </Link>
              ) : null}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
