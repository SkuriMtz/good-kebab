"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { Boton } from "./base/Boton";
import { CampoCorreo } from "./base/Campo";
import { Icono } from "./base/Iconos";
import { enviarSolicitud, revisarSolicitud } from "@/lib/lista";
import { PRUEBALO } from "@/lib/contenido";

type Estado = "editando" | "enviando" | "enviado" | "error";

/**
 * Formulario en línea de la lista de espera (portada y CTA final):
 * campo de correo + botón principal "Únete a la lista" + botón sutil
 * "Prueba los agentes" (a /pruebalo). En celular se apila.
 *
 * Estados: vacío, escribiendo, enviando (giro y botón ocupado), enviado
 * ("Listo. Te escribimos a <correo>…", anunciado a lectores de pantalla) y
 * error (mensaje junto al campo; el foco regresa al campo).
 * Guarda en /api/lista. Si la tabla aún no existe, el servidor contesta con
 * un mensaje amable y aquí se muestra tal cual.
 */
export function FormularioLista({
  centrado = false,
  etiquetaBoton = "Únete a la lista",
  conSecundario = true,
  className = "",
}: {
  centrado?: boolean;
  etiquetaBoton?: string;
  /** Muestra el botón sutil "Prueba los agentes". */
  conSecundario?: boolean;
  className?: string;
}) {
  const [correo, setCorreo] = useState("");
  const [trampa, setTrampa] = useState("");
  const [estado, setEstado] = useState<Estado>("editando");
  const [error, setError] = useState<string | null>(null);
  const [enviadoA, setEnviadoA] = useState("");
  const campo = useRef<HTMLInputElement>(null);
  const idTrampa = useId();

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (estado === "enviando") return;
    const problema = revisarSolicitud({ tipo: "lista", correo });
    if (problema) {
      setError(problema);
      setEstado("error");
      campo.current?.focus();
      return;
    }
    setError(null);
    setEstado("enviando");
    const r = await enviarSolicitud({ tipo: "lista", correo }, trampa);
    if (r.ok) {
      setEnviadoA(correo.trim());
      setEstado("enviado");
    } else {
      setError(r.error);
      setEstado("error");
      campo.current?.focus();
    }
  };

  return (
    <div className={`formulario-lista${centrado ? " formulario-lista--centro" : ""} ${className}`}>
      <div aria-live="polite">
        {estado === "enviado" ? (
          <p className="formulario-lista__listo">
            <Icono nombre="check-circulo" />
            <span>
              Listo. Te escribimos a <strong className="break-all">{enviadoA}</strong> en cuanto abramos tu lugar.
            </span>
          </p>
        ) : null}
      </div>

      {estado !== "enviado" ? (
        <form noValidate onSubmit={enviar} aria-label="Lista de espera de Atendel">
          <div className="formulario-lista__fila">
            <CampoCorreo
              ref={campo}
              name="correo"
              className="formulario-lista__campo"
              value={correo}
              alCambiar={(v) => {
                setCorreo(v);
                if (estado === "error") {
                  setEstado("editando");
                  setError(null);
                }
              }}
              error={error}
              disabled={estado === "enviando"}
              required
            />
            <Boton type="submit" tam="grande" cargando={estado === "enviando"} className="max-sm:w-full">
              {estado === "enviando" ? "Anotando…" : etiquetaBoton}
            </Boton>
            {conSecundario ? (
              <Boton href={PRUEBALO.href} variante="sutil" tam="grande" className="max-sm:w-full">
                Prueba los agentes
              </Boton>
            ) : null}
          </div>
          {/* Campo trampa contra bots: invisible para las personas y fuera del orden de tabulación */}
          <div className="formulario-lista__trampa" aria-hidden="true">
            <label htmlFor={idTrampa}>No llenes este campo</label>
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
    </div>
  );
}
