import { BotonLink } from "@/components/Buttons";
import { ChatDemo } from "@/components/ChatDemo";
import { Sitio } from "@/components/Sitio";
import { CarruselEquipo } from "@/components/agentes/CarruselEquipo";
import { Tetra } from "@/components/escena/Tetra";
import { GARANTIAS, PASOS } from "@/lib/contenido";

const COLORES_PASOS = ["#ffb829", "#2fd6a8", "#8052ff"];

/*
 * Inicio, en salas a pantalla completa. Detrás, la escena de triangulitos
 * cambia de figura en cada sala (data-forma):
 * 1. Portada: qué es Atendel en una línea, con la burbuja de chat.
 * 2. Qué es y cómo funciona, con el globo.
 * 3. Tu equipo: los cuatro agentes en carrusel (cada uno abre su ficha).
 * 4. El chat: verlos trabajar.
 * 5. Tus datos (seguridad), con el candado.
 * 6. El llamado final, con el logo.
 */
export default function Inicio() {
  return (
    <Sitio>
      {/* ---------- Portada ---------- */}
      <section className="sala contenedor" data-forma="burbuja" data-lado="derecha">
        <div className="sala__texto sala__texto--izquierda !max-w-[560px]">
          <p className="t-etiqueta">Para clínicas, consultorios y estéticas</p>
          <h1 className="t-portada mt-[var(--spacing-18)]">Agentes de inteligencia artificial para negocios que atienden personas.</h1>
          <p className="t-cuerpo mt-[var(--spacing-24)] max-w-[440px]">
            Cuatro agentes que atienden tu WhatsApp y tus citas, ordenan tu correo, traen de regreso a tus clientes y hacen el
            trabajo de oficina.
          </p>
          <div className="mt-[var(--spacing-36)] flex flex-wrap items-center gap-[var(--spacing-12)]">
            <BotonLink href="/pruebalo">Habla con los agentes</BotonLink>
            <BotonLink href="/agentes" variante="suave" flecha>
              Conoce a los agentes
            </BotonLink>
          </div>
        </div>
      </section>

      {/* ---------- Qué es y cómo funciona ---------- */}
      <section id="que-es" className="sala contenedor" data-forma="esfera" data-lado="izquierda">
        <div className="sala__texto sala__texto--derecha">
          <h2 className="t-seccion">Un equipo que trabaja para tu clínica</h2>
          <div className="sala__parrafos t-cuerpo mt-[var(--spacing-24)]">
            <p>Atendel son cuatro agentes de inteligencia artificial. Cada uno lleva un área del negocio y hace varias cosas dentro de ella.</p>
            <p>
              Les hablas como a una persona y te entregan el trabajo hecho: <em className="text-[var(--c-acento)]">mensajes, tablas, reportes, documentos.</em>
            </p>
          </div>
          <h3 id="como-funciona" className="t-etiqueta mt-[var(--spacing-60)]">
            Cómo funciona
          </h3>
          <ol className="pasos-tetra mt-[var(--spacing-24)]">
            {PASOS.map(([titulo, texto], i) => (
              <li key={titulo}>
                <Tetra color={COLORES_PASOS[i]} className="h-[52px] w-[52px]" giro={i * 40 - 20} />
                <span>
                  <span className="t-sub block">{titulo}</span>
                  <span className="t-chico mt-1 block">{texto}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Tu equipo ---------- */}
      <section id="agentes" className="sala contenedor" data-forma="polvo">
        <div className="grid items-center gap-[var(--spacing-60)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)]">
          <div>
            <h2 className="t-display t-display--enorme">Tu equipo</h2>
            <p className="t-sub mt-[var(--spacing-24)]">Atención, correo, clientes y oficina.</p>
            <p className="t-cuerpo mt-[var(--spacing-18)] max-w-[360px]">
              Toca a cada uno para ver todo lo que hace, una conversación de ejemplo y en qué plan está.
            </p>
            <BotonLink href="/agentes" variante="suave" flecha className="mt-[var(--spacing-18)] !px-0">
              Ver a los agentes
            </BotonLink>
          </div>
          <CarruselEquipo />
        </div>
      </section>

      {/* ---------- El chat: verlos trabajar ---------- */}
      <section id="chat" className="sala contenedor" data-forma="polvo">
        <div className="flex flex-col gap-[var(--spacing-24)] lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="t-seccion max-w-[16ch]">Háblales como le hablas a tu equipo</h2>
            <p className="t-cuerpo mt-[var(--spacing-18)] max-w-[520px]">
              Escríbeles lo que necesitas, como en cualquier chat. Te contestan al momento, recuerdan la conversación y te dejan los
              mensajes listos para copiar.
            </p>
          </div>
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
      </section>

      {/* ---------- Tus datos ---------- */}
      <section id="seguridad" className="sala contenedor" data-forma="candado" data-lado="derecha">
        <div className="sala__texto sala__texto--izquierda">
          <h2 className="t-seccion">Cada negocio ve solo lo suyo</h2>
          <ul className="mt-[var(--spacing-36)] flex flex-col gap-[var(--spacing-30)]">
            {GARANTIAS.map(([titulo, texto], i) => (
              <li key={titulo} className="grid grid-cols-[40px_minmax(0,1fr)] gap-[var(--spacing-18)]">
                <Tetra color={COLORES_PASOS[(i + 1) % 3]} className="h-10 w-10" giro={i * 50} />
                <span>
                  <span className="t-sub block">{titulo}</span>
                  <span className="t-chico mt-1 block">{texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Llamado final ---------- */}
      <section id="empezar" className="sala contenedor items-center text-center" data-forma="marca" data-lado="centro">
        <h2 className="t-seccion mx-auto max-w-[22ch]">
          Tus clientes ya te escriben.
          <br />
          Deja que Atendel te ayude a atenderlos.
        </h2>
        <p className="t-cuerpo mx-auto mt-[var(--spacing-18)] max-w-[420px]">
          Empieza gratis con Clara. Entras en un minuto con tu correo; cuando quieras a todo el equipo, pasas a Atendel Max.
        </p>
        <div className="mt-[var(--spacing-36)] flex flex-wrap items-center justify-center gap-[var(--spacing-12)]">
          <BotonLink href="/entrar">Empezar gratis</BotonLink>
          <BotonLink href="/precios" variante="suave" flecha>
            Ver precios
          </BotonLink>
        </div>
      </section>
    </Sitio>
  );
}
