"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { Icono } from "@/components/base/Iconos";
import { FormularioLista } from "@/components/FormularioLista";
import { Escena3D } from "@/components/escena3d/Escena3D";
import { PLANES } from "@/lib/planes";

/** Los planes que traen a Lola, sacados de los datos (hoy: Atendel One y Max). */
const PLANES_CON_LOLA = PLANES.filter((p) => p.agentes.includes("lola")).map((p) => p.nombre);

/**
 * 1. Portada del inicio (Grupo 1 · propuesta G1-T3: "La recepción a las 23:14").
 *
 * Un solo protagonista: el título con el halo morado. Detrás, fija, la
 * escena 3D mínima (pocos tetraedros lejos del texto; solo el halo con
 * movimiento reducido o sin WebGL). Debajo del formulario, una muestra
 * pequeña y real del producto: un WhatsApp que llega a las 23:14, cuando
 * la recepción ya cerró, y cómo lo contesta Lola. Es la bisagra con la
 * sección siguiente (el chat en vivo), a la que lleva su enlace.
 *
 * El recorte (clip-path) hace que el canvas fijo solo se vea dentro de la portada:
 * el fondo se queda quieto y solo sube el contenido.
 */
export function Portada() {
  return (
    <section aria-labelledby="portada-titulo" className="portada seccion--portada con-halo">
      <Escena3D tenue />
      <div className="contenedor portada__cuerpo">
        <div className="portada__titulares">
          <Halo ancho="min(1040px, 150vw)" proporcion="16 / 9" />
          <Etiqueta tono="cielo">Para clínicas, consultorios y estéticas</Etiqueta>
          <h1 id="portada-titulo" className="t-display portada__titulo">
            Tu recepción contesta aunque ya hayas cerrado
          </h1>
          <p className="t-intro portada__intro">
            Lola contesta tu WhatsApp y aparta citas, Clara ordena tu correo, Víctor trae de regreso a tus clientes e Iris hace el
            trabajo de oficina. Lo importante no sale sin tu visto bueno.
          </p>
        </div>
        <FormularioLista centrado className="portada__formulario" />
        <Etiqueta tono="tenue" className="portada__condiciones">
          Plan Free · Gratis · <span className="portada__sin-corte">Entras con tu correo, sin contraseña</span>
        </Etiqueta>
        <MuestraLola />
      </div>
    </section>
  );
}

/**
 * Un WhatsApp de las 23:14 contestado por Lola. Se cuenta solo una vez,
 * cuando la muestra entra en pantalla: llega el mensaje, Lola escribe,
 * aparece su respuesta y, al final, la cita apartada. Sin JavaScript o con
 * movimiento reducido se ve completa desde el inicio (portada.css).
 * Los textos salen de la conversación de ejemplo de Lola (agentes/detalle.ts).
 */
function MuestraLola() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const figura = ref.current;
    if (!figura) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        figura.dataset.visto = "true";
        io.disconnect();
      },
      { threshold: 0.2 },
    );
    io.observe(figura);
    return () => io.disconnect();
  }, []);

  return (
    <figure ref={ref} className="muestra" aria-labelledby="muestra-pie">
      <div className="vidrio vidrio--relleno muestra__tarjeta">
        <div className="muestra__cabeza">
          <span className="marca-agente marca-agente--mini" style={{ "--agente": "var(--agente-lola)" } as CSSProperties}>
            <Personaje agente="lola" avatar />
          </span>
          <p className="muestra__quien">
            <span className="muestra__nombre">WhatsApp de la recepción</span>
          </p>
          <time className="etiqueta etiqueta--tenue" dateTime="23:14">
            23:14
          </time>
        </div>

        <ol className="muestra__hilo">
          <li className="muestra__cliente">
            <span className="etiqueta etiqueta--tenue">Mariana</span>
            <p>Hola! cuánto cuesta la limpieza facial? tienen lugar el jueves?</p>
          </li>
          <li className="muestra__lola">
            <span className="etiqueta etiqueta--cielo">Lola</span>
            <div className="muestra__turno">
              <span className="muestra__escribe" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <p className="muestra__respuesta">
                ¡Hola, Mariana! La limpieza facial profunda cuesta $850 y dura una hora. El jueves tengo 11:00 o 16:30, ¿cuál te
                acomoda?
              </p>
            </div>
          </li>
        </ol>

        <div className="muestra__pie">
          <Icono nombre="check-circulo" tono="cielo" tam={16} />
          <span className="etiqueta etiqueta--texto">Cita apartada · jueves 16:30</span>
          <time className="etiqueta etiqueta--tenue" dateTime="23:16">
            23:16
          </time>
        </div>
      </div>

      <figcaption id="muestra-pie" className="muestra__leyenda">
        <span>Ejemplo de una noche con Lola. Viene en {PLANES_CON_LOLA.join(" y ")}.</span>
        <a href="#en-vivo" className="muestra__enlace">
          Escríbele tú
          <Icono nombre="chevron" tam={16} />
        </a>
      </figcaption>
    </figure>
  );
}
