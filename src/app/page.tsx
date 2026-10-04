import type { CSSProperties } from "react";
import { BotonLink } from "@/components/Buttons";
import { ChatDemo } from "@/components/ChatDemo";
import { EncabezadoSeccion } from "@/components/Encabezado";
import { Sitio } from "@/components/Sitio";
import { MarcasAgentes } from "@/components/agentes/MarcasAgentes";
import { Personaje } from "@/components/agentes/Personaje";
import { TarjetasAgentes } from "@/components/agentes/TarjetasAgentes";
import { GARANTIAS, PASOS } from "@/lib/contenido";

/** Íconos de "Tus datos": candado, palomita en círculo y escudo. */
const ICONOS_GARANTIA = [
  <path key="candado" d="M7 10.5V8a5 5 0 0 1 10 0v2.5M6 10.5h12a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.5a1 1 0 0 1 1-1Z" />,
  <path key="permiso" d="M8.5 12.2 11 14.6l4.6-5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  <path key="cifrado" d="M12 3 5 6v5.5c0 4.4 3 7.9 7 9.5 4-1.6 7-5.1 7-9.5V6l-7-3Zm-2.4 9.3 1.8 1.8 3.4-3.6" />,
];

/*
 * Inicio, la historia en orden:
 * 1. Portada: qué es Atendel en una línea, los botones y el chat de muestra (la "captura" del producto).
 * 2. Qué es Atendel y cómo funciona.
 * 3. Los cuatro agentes (cada tarjeta abre su ficha).
 * 4. Tus datos (seguridad).
 * 5. El llamado final.
 */
export default function Inicio() {
  return (
    <Sitio>
      {/* ---------- Portada ---------- */}
      <section className="contenedor pt-12 text-center sm:pt-16 lg:pt-20">
        <MarcasAgentes />
        <p className="mt-6">
          <span className="pill">Para clínicas, consultorios y estéticas</span>
        </p>
        <h1 className="t-display mx-auto mt-5 max-w-[17ch]">
          Agentes de inteligencia artificial para negocios que <span className="pastilla">atienden</span> personas.
        </h1>
        <p className="t-editorial t-editorial--grande mx-auto mt-6 max-w-[640px]">
          Cuatro agentes de inteligencia artificial que atienden tu WhatsApp y tus citas, ordenan tu correo, traen de
          regreso a tus clientes y hacen el trabajo de oficina.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <BotonLink href="/pruebalo" tam="grande">
            Habla con los agentes
          </BotonLink>
          <BotonLink href="/agentes" variante="suave" tam="grande">
            Conoce a los agentes
          </BotonLink>
        </div>
      </section>

      {/* ---------- El chat: la "captura" del producto, y se puede usar ---------- */}
      <section id="chat" aria-labelledby="chat-titulo" className="contenedor pb-16 pt-10 lg:pb-20 lg:pt-14">
        <p className="t-chico mx-auto mb-4 max-w-[640px] text-center">
          Pruébalo aquí: escríbeles, usa @ para mencionar o / para una acción. Las respuestas son de ejemplo.
        </p>
        <ChatDemo />
        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-10">
          <div>
            <h2 id="chat-titulo" className="t-sub">
              Háblales como le hablas a tu equipo.
            </h2>
            <p className="t-cuerpo mt-2 max-w-[640px]">
              Escríbeles lo que necesitas, como en cualquier chat. Te contestan al momento, recuerdan la conversación y te
              dejan los mensajes listos para copiar.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <BotonLink href="/pruebalo" variante="suave">
              Abrir en pantalla completa
            </BotonLink>
            <BotonLink href="/entrar" variante="texto" flecha>
              Probar el chat de verdad
            </BotonLink>
          </div>
        </div>
      </section>

      {/* ---------- Qué es y cómo funciona ---------- */}
      <section id="que-es" className="seccion">
        <div className="contenedor grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <EncabezadoSeccion
              etiqueta="Qué es Atendel"
              titulo="Un equipo de cuatro agentes de inteligencia artificial que trabaja para tu clínica."
              texto="Cada uno lleva un área del negocio y hace varias cosas dentro de ella. Les hablas como a una persona y te entregan el trabajo hecho: mensajes, tablas, reportes, documentos."
            />
          </div>
          <div id="como-funciona" className="panel-color en-acento" style={{ "--acento": "var(--agente-iris)" } as CSSProperties}>
            <h3 className="t-sub">Cómo funciona</h3>
            <ol className="mt-4 flex flex-col gap-3">
              {PASOS.map(([titulo, texto], i) => (
                <li key={titulo} className="tarjeta mockup !p-4 sm:!p-5">
                  <span className="pill pill--azul">Paso {i + 1}</span>
                  <p className="mt-3 text-[1.0625rem] font-semibold tracking-[-0.01em]">{titulo}</p>
                  <p className="t-cuerpo mt-1">{texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- Los agentes ---------- */}
      <section id="agentes" className="seccion">
        <div className="contenedor">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <EncabezadoSeccion
              etiqueta="4 agentes"
              titulo="Atención, correo, clientes y oficina."
              texto="Toca a cada uno para ver todo lo que hace, una conversación de ejemplo y en qué plan está."
            />
            <div className="flex shrink-0 flex-wrap gap-3">
              <BotonLink href="/pruebalo">Habla con ellos</BotonLink>
              <BotonLink href="/agentes" variante="suave">
                Ver a los agentes
              </BotonLink>
            </div>
          </div>
          <div className="mt-10">
            <TarjetasAgentes />
          </div>
        </div>
      </section>

      {/* ---------- Tus datos ---------- */}
      <section id="seguridad" className="seccion">
        <div className="contenedor">
          <div className="isla-oscura px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <p className="t-etiqueta">Tus datos</p>
            <h2 className="t-seccion mt-3">Cada negocio ve solo lo suyo.</h2>
            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {GARANTIAS.map(([titulo, texto], i) => (
                <li key={titulo} className="tarjeta">
                  <svg
                    className="h-6 w-6 text-enlace"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {ICONOS_GARANTIA[i]}
                  </svg>
                  <p className="t-sub mt-4">{titulo}</p>
                  <p className="t-cuerpo mt-2">{texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Llamado final ---------- */}
      <section id="empezar" className="seccion">
        <div className="contenedor flex flex-col items-center text-center">
          <span className="marca-agente marca-agente--grande" style={{ "--agente": "var(--agente-clara)" } as CSSProperties}>
            <Personaje agente="clara" avatar />
          </span>
          <h2 className="t-seccion mt-6">Empieza gratis con Clara.</h2>
          <p className="t-editorial mt-4 max-w-[520px]">
            Entras en un minuto con tu correo. Cuando quieras a todo el equipo, pasas a Atendel Max.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <BotonLink href="/entrar" tam="grande">
              Empezar gratis
            </BotonLink>
            <BotonLink href="/precios" variante="suave" tam="grande">
              Ver precios
            </BotonLink>
          </div>
        </div>
      </section>
    </Sitio>
  );
}
