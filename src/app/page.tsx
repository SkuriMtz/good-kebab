import { BotonLink } from "@/components/Buttons";
import { ChatDemo } from "@/components/ChatDemo";
import { EncabezadoSeccion } from "@/components/Encabezado";
import { Sitio } from "@/components/Sitio";
import { MarcasAgentes } from "@/components/agentes/MarcasAgentes";
import { TarjetasAgentes } from "@/components/agentes/TarjetasAgentes";
import { GARANTIAS, PASOS } from "@/lib/contenido";

/*
 * Inicio, la historia en orden y en dos columnas que alternan de lado:
 * 1. Portada: qué es Atendel en una línea, el botón al chat y los cuatro agentes.
 * 2. Qué es Atendel y cómo funciona.
 * 3. Los cuatro agentes (cada uno abre su ficha).
 * 4. El chat: verlos trabajar.
 * 5. Tus datos (seguridad).
 * 6. El llamado final.
 */
export default function Inicio() {
  return (
    <Sitio>
      {/* ---------- Portada ---------- */}
      <section className="contenedor pb-[var(--spacing-60)] pt-[var(--spacing-36)] lg:pb-[var(--spacing-120)] lg:pt-[var(--spacing-96)]">
        <div className="dos-columnas">
          <div>
            <p className="t-etiqueta">Para clínicas, consultorios y estéticas</p>
            <h1 className="t-display mt-[var(--spacing-18)]">
              Agentes de inteligencia artificial para negocios que <span className="resalta">atienden</span> personas.
            </h1>
            <p className="t-editorial mt-[var(--spacing-24)] max-w-[480px]">
              Cuatro agentes de inteligencia artificial que atienden tu WhatsApp y tus citas, ordenan tu correo, traen de
              regreso a tus clientes y hacen el trabajo de oficina.
            </p>
            <div className="mt-[var(--spacing-36)] flex flex-wrap items-center gap-[var(--spacing-12)]">
              <BotonLink href="/pruebalo">Habla con los agentes</BotonLink>
              <BotonLink href="/agentes" variante="suave" flecha>
                Conoce a los agentes
              </BotonLink>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[460px] lg:mr-0">
            <MarcasAgentes />
          </div>
        </div>
      </section>

      {/* ---------- Qué es y cómo funciona ---------- */}
      <section id="que-es" className="seccion">
        <div className="contenedor dos-columnas !items-start">
          <EncabezadoSeccion
            etiqueta="Qué es Atendel"
            titulo="Un equipo de cuatro agentes de inteligencia artificial que trabaja para tu clínica."
          />
          <div id="como-funciona" className="lg:pt-[var(--spacing-36)]">
            <p className="t-editorial max-w-[520px]">
              Cada uno lleva un área del negocio y hace varias cosas dentro de ella. Les hablas como a una persona y te
              entregan el trabajo hecho: mensajes, tablas, reportes, documentos.
            </p>
            <h3 className="t-etiqueta mt-[var(--spacing-60)]">Cómo funciona</h3>
            <ol className="mt-[var(--spacing-24)] flex flex-col gap-[var(--spacing-30)]">
              {PASOS.map(([titulo, texto], i) => (
                <li key={titulo} className="grid grid-cols-[48px_minmax(0,1fr)] gap-[var(--spacing-12)]">
                  <span className="t-sub tabular-nums !text-[var(--c-tenue)]">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="t-sub block">{titulo}</span>
                    <span className="t-cuerpo mt-1 block">{texto}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- Los agentes ---------- */}
      <section id="agentes" className="seccion">
        <div className="contenedor">
          <div className="flex flex-col gap-[var(--spacing-24)] lg:flex-row lg:items-end lg:justify-between">
            <EncabezadoSeccion
              etiqueta="4 agentes"
              titulo="Atención, correo, clientes y oficina."
              texto="Toca a cada uno para ver todo lo que hace, una conversación de ejemplo y en qué plan está."
            />
            <BotonLink href="/agentes" variante="suave" flecha>
              Ver a los agentes
            </BotonLink>
          </div>
          <div className="mt-[var(--spacing-60)]">
            <TarjetasAgentes />
          </div>
        </div>
      </section>

      {/* ---------- El chat: verlos trabajar ---------- */}
      <section id="chat" className="seccion">
        <div className="contenedor">
          <div className="flex flex-col gap-[var(--spacing-24)] lg:flex-row lg:items-end lg:justify-between">
            <EncabezadoSeccion
              etiqueta="El chat"
              titulo="Háblales como le hablas a tu equipo."
              texto="Escríbeles lo que necesitas, como en cualquier chat. Te contestan al momento, recuerdan la conversación y te dejan los mensajes listos para copiar."
            />
            <div className="flex flex-wrap items-center gap-[var(--spacing-12)]">
              <BotonLink href="/pruebalo">Abrir en pantalla completa</BotonLink>
              <BotonLink href="/entrar" variante="suave" flecha>
                Probar el chat de verdad
              </BotonLink>
            </div>
          </div>
          <p className="t-chico mt-[var(--spacing-36)]">
            Pruébalo aquí: escríbeles, usa @ para mencionar o / para una acción. Las respuestas son de ejemplo.
          </p>
          <div className="mt-[var(--spacing-18)]">
            <ChatDemo />
          </div>
        </div>
      </section>

      {/* ---------- Tus datos ---------- */}
      <section id="seguridad" className="seccion">
        <div className="contenedor dos-columnas !items-start">
          <EncabezadoSeccion etiqueta="Tus datos" titulo="Cada negocio ve solo lo suyo." />
          <ul className="flex flex-col gap-[var(--spacing-36)] lg:pt-[var(--spacing-36)]">
            {GARANTIAS.map(([titulo, texto]) => (
              <li key={titulo}>
                <p className="t-sub">{titulo}</p>
                <p className="t-cuerpo mt-[var(--spacing-6)] max-w-[520px]">{texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Llamado final ---------- */}
      <section id="empezar" className="seccion">
        <div className="contenedor">
          <p className="t-etiqueta">Empieza hoy</p>
          <h2 className="t-display t-display--enorme mt-[var(--spacing-18)] max-w-[12ch]">
            Empieza gratis <span className="resalta">con Clara.</span>
          </h2>
          <div className="mt-[var(--spacing-36)] flex flex-col gap-[var(--spacing-24)] lg:flex-row lg:items-end lg:justify-between">
            <p className="t-editorial max-w-[480px]">
              Entras en un minuto con tu correo. Cuando quieras a todo el equipo, pasas a Atendel Max.
            </p>
            <div className="flex flex-wrap items-center gap-[var(--spacing-12)]">
              <BotonLink href="/entrar">Empezar gratis</BotonLink>
              <BotonLink href="/precios" variante="suave" flecha>
                Ver precios
              </BotonLink>
            </div>
          </div>
        </div>
      </section>
    </Sitio>
  );
}
