import Link from "next/link";
import type { CSSProperties } from "react";
import { PillLink, Roll } from "@/components/Buttons";
import { ChatDemo } from "@/components/ChatDemo";
import { Claqueta } from "@/components/Encabezado";
import { HeroPersonajes } from "@/components/agentes/HeroPersonajes";
import { ParticleShape } from "@/components/particles/ParticleShape";
import { WordmarkHero } from "@/components/particles/WordmarkHero";
import { Reveal } from "@/components/Reveal";
import { Sitio } from "@/components/Sitio";
import { GARANTIAS, PASOS } from "@/lib/contenido";

const COLORES_MARCA = ["#ff8a6b", "#7fb2ff", "#5fd09f", "#f6c64a"];

/** El símbolo del logo (los cuatro agentes); cada círculo aparece por turno. */
function MarcaPortada({
  className = "marca-portada relative z-10",
}: {
  className?: string;
}) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {[
        [28, 28],
        [72, 28],
        [28, 72],
        [72, 72],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="19"
          fill={COLORES_MARCA[i]}
          style={{ "--i": i } as CSSProperties}
        />
      ))}
    </svg>
  );
}

/** La segunda puerta al chat: una miniatura de la conversación de ejemplo. */
function MiniaturaChat() {
  return (
    <Link
      href="/pruebalo"
      className="tarjeta-flotante miniatura-chat"
      aria-label="Pruébalo: habla con los agentes"
    >
      <span className="flex items-center justify-between gap-4">
        <span className="etiqueta">Recepción · Lola y Víctor</span>
        <span className="etiqueta etiqueta--brasa">Demostración</span>
      </span>
      <span className="raya my-3 block" aria-hidden="true" />
      <span className="flex flex-col gap-2" aria-hidden="true">
        <span className="miniatura-chat__burbuja miniatura-chat__burbuja--tu">
          Perfecto. @Víctor que el mensaje sea corto
        </span>
        <span className="miniatura-chat__burbuja">
          Va, este le mandaría: “Hola, Sofía. ¿Cómo sentiste tu piel…”
        </span>
      </span>
      <span className="mt-4 flex items-center justify-between gap-4">
        <span className="etiqueta">Pruébalo</span>
        <span className="miniatura-chat__play">
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M5 3.5v9l7-4.5z" />
          </svg>
        </span>
      </span>
    </Link>
  );
}

/*
 * Inicio: la historia en salas, cada una una afirmación de borde a borde.
 * 1. Portada: ATENDEL hecho de partículas, el botón al chat y su miniatura.
 * 2. 01 Qué es (vitrina: texto / logo / texto) y cómo funciona.
 * 3. 02 El equipo: los cuatro personajes como piezas de museo.
 * 4. 03 El chat, la demostración principal.
 * 5. 04 Tus datos (vitrina con el candado de partículas).
 * 6. El llamado final.
 */
export default function Inicio() {
  return (
    <Sitio>
      {/* ---------- Portada ---------- */}
      <section data-capitulo="Atendel" className="relative overflow-hidden">
        <WordmarkHero
          texto="ATENDEL"
          italica={false}
          peso={500}
          claseTitulo="wordmark-oscuro"
          marca={<MarcaPortada />}
          claseFila="justify-start px-[var(--orilla)] pb-6 pt-4"
          antes={
            <div className="relative z-10 flex flex-wrap items-end justify-between gap-4 px-[var(--orilla)] pt-[92px] lg:pt-[96px]">
              <p className="entra-carga hero-etiqueta">
                Para clínicas, consultorios y estéticas
              </p>
              <p
                className="entra-carga etiqueta etiqueta--suave hidden sm:block"
                style={{ "--d": "80ms" } as CSSProperties}
              >
                Atención · Correo · Clientes · Oficina
              </p>
            </div>
          }
        >
          <div className="relative z-10 grid gap-10 border-t border-dashed hairline px-[var(--orilla)] pb-10 pt-8 lg:grid-cols-12 lg:items-end lg:gap-[18px] lg:pb-12">
            <div className="lg:col-span-6">
              <h2
                className="entra-carga titulo titulo--sm"
                style={{ "--d": "0ms" } as CSSProperties}
              >
                Agentes de inteligencia artificial{" "}
                <em>para negocios que atienden personas.</em>
              </h2>
              <p
                className="entra-carga cuerpo mt-5 max-w-[620px]"
                style={{ "--d": "120ms" } as CSSProperties}
              >
                Cuatro agentes de inteligencia artificial que atienden tu
                WhatsApp y tus citas, ordenan tu correo, traen de regreso a tus
                clientes y hacen el trabajo de oficina.
              </p>
              <div
                className="entra-carga mt-8 flex flex-wrap items-center gap-x-6 gap-y-4"
                style={{ "--d": "200ms" } as CSSProperties}
              >
                <PillLink href="/pruebalo" className="btn-pill--grande">
                  Habla con los agentes
                </PillLink>
                <Link href="/agentes" className="btn-ghost">
                  <Roll>Conoce a los agentes</Roll>
                </Link>
              </div>
            </div>
            <div
              className="entra-carga lg:col-span-4 lg:col-start-9"
              style={{ "--d": "260ms" } as CSSProperties}
            >
              <MiniaturaChat />
            </div>
          </div>
        </WordmarkHero>
      </section>

      {/* ---------- 01 · Qué es: vitrina (texto / logo / texto) ---------- */}
      <section
        id="que-es"
        data-capitulo="Qué es"
        className="sala sala--completa"
      >
        <div className="vitrina">
          <div>
            <Claqueta
              n={1}
              izquierda="Qué es Atendel"
              derecha="En 30 segundos"
            />
            <Reveal as="h2" className="titulo mt-6">
              Un equipo de cuatro agentes de inteligencia artificial{" "}
              <em>que trabaja para tu clínica.</em>
            </Reveal>
          </div>
          <div className="vitrina__objeto py-6">
            <MarcaPortada className="flota h-auto w-[52%] max-w-[300px]" />
          </div>
          <Reveal as="p" delay={120} className="cuerpo">
            Cada uno lleva un área del negocio y hace varias cosas dentro de
            ella. Les hablas como a una persona y te entregan el trabajo hecho:
            mensajes, tablas, reportes, documentos.
          </Reveal>
        </div>

        <div className="mt-20 lg:mt-28">
          <p className="etiqueta etiqueta--brasa">Cómo funciona</p>
          <ol className="mt-5 grid border-t border-dashed hairline md:grid-cols-3">
            {PASOS.map(([titulo, texto], i) => (
              <Reveal
                as="li"
                key={titulo}
                delay={i * 80}
                className={`flex flex-col gap-3 border-dashed hairline py-7 md:px-[18px] md:py-9 ${i ? "border-t md:border-l md:border-t-0" : "md:pl-0"}`}
              >
                <span className="etiqueta etiqueta--brasa">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="titulo titulo--sm">{titulo}</span>
                <span className="texto-suave max-w-[380px]">{texto}</span>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- 02 · El equipo: cuatro piezas de museo; cada una abre su ficha ---------- */}
      <section data-capitulo="El equipo" className="sala">
        <div className="encabezado">
          <div>
            <Claqueta n={2} izquierda="4 agentes" derecha="Conócelos" />
            <Reveal as="h2" className="display mt-6">
              Atención, correo, clientes <em>y oficina.</em>
            </Reveal>
          </div>
          <Reveal
            delay={120}
            className="flex flex-col items-start gap-7 lg:pb-2"
          >
            <p className="cuerpo max-w-[520px]">
              Toca a cada uno para ver todo lo que hace, una conversación de
              ejemplo y en qué plan está.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <PillLink href="/pruebalo">Habla con ellos</PillLink>
              <Link href="/agentes" className="btn-ghost">
                Ver a los agentes
              </Link>
            </div>
          </Reveal>
        </div>
        <Reveal delay={150} className="mt-14 lg:mt-20">
          <HeroPersonajes />
        </Reveal>
      </section>

      {/* ---------- 03 · Háblales: el chat, la demostración principal ---------- */}
      <section id="chat" data-capitulo="Háblales" className="sala">
        <div className="encabezado">
          <div>
            <Claqueta n={3} izquierda="El chat" derecha="Dentro de tu panel" />
            <Reveal as="h2" className="display mt-6">
              Háblales como le hablas <em>a tu equipo.</em>
            </Reveal>
          </div>
          <Reveal
            delay={120}
            className="flex flex-col items-start gap-7 lg:pb-2"
          >
            <p className="cuerpo max-w-[560px]">
              Escríbeles lo que necesitas, como en cualquier chat. Te contestan
              al momento, recuerdan la conversación y te dejan los mensajes
              listos para copiar.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <PillLink href="/pruebalo">Abrir en pantalla completa</PillLink>
              <Link href="/entrar" className="btn-ghost">
                Probar el chat de verdad
              </Link>
            </div>
          </Reveal>
        </div>
        <Reveal delay={150} className="mt-14 lg:mt-20">
          <ChatDemo />
        </Reveal>
      </section>

      {/* ---------- 04 · Tus datos: vitrina con el candado de partículas al centro ---------- */}
      <section
        id="seguridad"
        data-capitulo="Tus datos"
        className="sala sala--completa"
      >
        <div className="vitrina">
          <div>
            <Claqueta n={4} izquierda="Tus datos" />
            <Reveal as="h2" className="titulo mt-6">
              Cada negocio <em>ve solo lo suyo.</em>
            </Reveal>
          </div>
          <div className="vitrina__objeto">
            <div className="relative aspect-square w-full max-w-[420px]">
              <ParticleShape
                shape="lock"
                colors={[
                  "var(--color-bone-white)",
                  "var(--color-bone-white)",
                  "var(--color-bone-white)",
                  "var(--color-ash-gray)",
                  "var(--color-bone-white)",
                  "var(--color-bone-white)",
                  "var(--color-bone-white)",
                  "var(--color-acento)",
                ]}
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
          <ul className="border-t border-dashed hairline">
            {GARANTIAS.map(([titulo, texto], i) => (
              <Reveal
                as="li"
                key={titulo}
                delay={i * 80}
                className="border-b border-dashed hairline py-6"
              >
                <span className="etiqueta">{titulo}</span>
                <span className="texto-suave mt-2 block">{texto}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Cierre: el llamado a la acción ---------- */}
      <section
        id="empezar"
        data-capitulo="Empieza"
        className="sala sala--completa"
      >
        <Reveal as="p" className="etiqueta etiqueta--brasa">
          Empieza hoy
        </Reveal>
        <Reveal
          as="h2"
          delay={60}
          className="display mt-6 max-w-[14ch] !text-[clamp(3.25rem,10vw,11rem)]"
        >
          Empieza gratis <em>con Clara.</em>
        </Reveal>
        <div className="mt-12 grid gap-8 border-t border-dashed hairline pt-8 lg:grid-cols-12 lg:gap-[18px]">
          <Reveal as="p" delay={120} className="cuerpo lg:col-span-5">
            Entras en un minuto con tu correo. Cuando quieras a todo el equipo,
            pasas a Atendel Max.
          </Reveal>
          <Reveal
            delay={200}
            className="flex flex-col items-start gap-4 lg:col-span-5 lg:col-start-8"
          >
            <PillLink href="/entrar" className="btn-pill--ancha">
              Empezar gratis
            </PillLink>
            <Link href="/precios" className="btn-ghost">
              Ver precios
            </Link>
          </Reveal>
        </div>
      </section>
    </Sitio>
  );
}
