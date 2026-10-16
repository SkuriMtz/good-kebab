"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { mandarSolicitud, type MotivoFalla } from "@/components/FormularioLista";
import { Boton } from "@/components/base/Boton";
import { Campo, CampoCorreo } from "@/components/base/Campo";
import { Icono } from "@/components/base/Iconos";
import { LIMITES, correoValido, normalizarCorreo } from "@/lib/lista";

type Estado = "editando" | "enviando" | "enviado" | "aviso";
type Errores = Partial<Record<"nombre" | "correo" | "mensaje", string>>;

/** Mensaje amable cuando el servidor todavía no puede guardar (falta la tabla en Supabase). */
const PAUSA = "Este formulario todavía no recibe mensajes: lo estamos terminando de abrir. Tu texto sigue aquí; intenta de nuevo en unos días.";

/**
 * Formulario de contacto: nombre, correo, negocio (opcional) y mensaje.
 * Manda a /api/lista con tipo "contacto" (src/lib/lista.ts, sin cambiarlo).
 *
 * Estados:
 * - editando: etiquetas flotantes, contador del mensaje;
 * - errores por campo: mensaje junto a cada campo, el foco va al primero;
 * - enviando: giro en el botón, campos de solo lectura (no se pierde nada);
 * - enviado: la tarjeta cambia a "Recibimos tu mensaje" con el correo, y el
 *   foco pasa a ese título; "Escribir otro mensaje" vuelve al formulario;
 * - aviso: si el servidor no puede guardar, un aviso amable (sin rojo si es
 *   porque la tabla aún no existe), con el texto intacto para reintentar.
 */
export function FormularioContacto() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [negocio, setNegocio] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [trampa, setTrampa] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [estado, setEstado] = useState<Estado>("editando");
  const [aviso, setAviso] = useState<{ motivo: MotivoFalla; texto: string } | null>(null);
  const [enviadoA, setEnviadoA] = useState("");
  const refs = {
    nombre: useRef<HTMLInputElement>(null),
    correo: useRef<HTMLInputElement>(null),
    mensaje: useRef<HTMLTextAreaElement>(null),
  };
  const titulo = useRef<HTMLHeadingElement>(null);
  const idTrampa = useId();
  const idAviso = useId();
  const enviando = estado === "enviando";

  const revisar = (): Errores => {
    const e: Errores = {};
    if (!nombre.trim()) e.nombre = "Escribe tu nombre.";
    if (!correo.trim()) e.correo = "Escribe tu correo para poder contestarte.";
    else if (!correoValido(correo)) e.correo = "Revisa tu correo: parece que le falta algo (por ejemplo, nombre@negocio.com).";
    if (!mensaje.trim()) e.mensaje = "Escribe tu mensaje.";
    else if (mensaje.length > LIMITES.mensaje) e.mensaje = `El mensaje puede tener hasta ${LIMITES.mensaje.toLocaleString("es-MX")} caracteres.`;
    return e;
  };

  const enviar = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (enviando) return;
    const e = revisar();
    setErrores(e);
    const primero = (["nombre", "correo", "mensaje"] as const).find((k) => e[k]);
    if (primero) {
      setAviso(null);
      refs[primero].current?.focus();
      return;
    }
    setEstado("enviando");
    setAviso(null);
    const r = await mandarSolicitud(
      { tipo: "contacto", correo, nombre: nombre.trim(), negocio: negocio.trim() || undefined, mensaje: mensaje.trim() },
      trampa,
    );
    if (r.ok) {
      setEnviadoA(normalizarCorreo(correo));
      setEstado("enviado");
      requestAnimationFrame(() => titulo.current?.focus());
      return;
    }
    setEstado("aviso");
    setAviso({ motivo: r.motivo, texto: r.motivo === "pausa" ? PAUSA : r.error });
  };

  const otro = () => {
    setMensaje("");
    setErrores({});
    setAviso(null);
    setEstado("editando");
    requestAnimationFrame(() => refs.mensaje.current?.focus());
  };

  /** Al escribir en un campo con error, el error se va. */
  const limpiar = (k: keyof Errores) => {
    if (errores[k]) setErrores((e) => ({ ...e, [k]: undefined }));
  };

  if (estado === "enviado") {
    return (
      <div className="contacto-listo" aria-live="polite">
        <Icono nombre="check-circulo" tam={24} tono="cielo" />
        <h2 ref={titulo} tabIndex={-1} className="t-titulo">
          Recibimos tu mensaje
        </h2>
        <p className="t-cuerpo">
          Te contestamos a <strong className="break-all font-medium text-[var(--c-texto)]">{enviadoA}</strong>.
          Mientras, puedes platicar con los agentes en{" "}
          <Link href="/pruebalo" className="enlace">
            Pruébalo
          </Link>
          .
        </p>
        <Boton variante="fantasma" onClick={otro}>
          Escribir otro mensaje
        </Boton>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={enviar}
      aria-label="Formulario de contacto"
      aria-describedby={aviso ? idAviso : undefined}
      className="contacto-form"
    >
      <div className="contacto-form__par">
        <Campo
          ref={refs.nombre}
          etiqueta="Tu nombre"
          name="nombre"
          autoComplete="name"
          enterKeyHint="next"
          maxLength={LIMITES.nombre}
          value={nombre}
          alCambiar={(v) => {
            setNombre(v);
            limpiar("nombre");
          }}
          error={errores.nombre}
          readOnly={enviando}
          required
        />
        <Campo
          etiqueta="Tu negocio (opcional)"
          name="negocio"
          autoComplete="organization"
          enterKeyHint="next"
          maxLength={LIMITES.negocio}
          value={negocio}
          alCambiar={setNegocio}
          ayuda="Por ejemplo: Clínica dental en Puebla."
          readOnly={enviando}
        />
      </div>
      <CampoCorreo
        ref={refs.correo}
        name="correo"
        enterKeyHint="next"
        value={correo}
        alCambiar={(v) => {
          setCorreo(v);
          limpiar("correo");
        }}
        error={errores.correo}
        ayuda={errores.correo ? undefined : "Ahí te contestamos."}
        readOnly={enviando}
        required
      />
      <Campo
        ref={refs.mensaje}
        multilinea
        etiqueta="Tu mensaje"
        name="mensaje"
        maxLength={LIMITES.mensaje}
        value={mensaje}
        alCambiar={(v) => {
          setMensaje(v);
          limpiar("mensaje");
        }}
        error={errores.mensaje}
        readOnly={enviando}
        required
      />

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

      <div aria-live="polite">
        {aviso ? (
          <div
            id={idAviso}
            className={`formulario-lista__aviso${aviso.motivo === "pausa" ? "" : " formulario-lista__aviso--falla"}`}
            role="status"
          >
            <Icono nombre={aviso.motivo === "pausa" ? "reloj" : "alerta"} tam={20} />
            <p>{aviso.texto}</p>
          </div>
        ) : null}
      </div>

      <div className="contacto-form__pie">
        <p className="t-caption">Todos los campos son necesarios, menos el negocio.</p>
        <Boton type="submit" tam="grande" cargando={enviando} className="max-sm:w-full">
          {enviando ? "Enviando…" : aviso && aviso.motivo !== "pausa" ? "Intentar de nuevo" : "Enviar mensaje"}
        </Boton>
      </div>
    </form>
  );
}
