import Link from "next/link";
import type { CSSProperties } from "react";
import { Arrow, PillLink, Roll } from "@/components/Buttons";
import { ChatDemo } from "@/components/ChatDemo";
import FlowField from "@/components/FlowField";
import { Claqueta } from "@/components/Encabezado";
import { HeroPersonajes } from "@/components/agentes/HeroPersonajes";
import { ParticleShape } from "@/components/particles/ParticleShape";
import { WordmarkHero } from "@/components/particles/WordmarkHero";
import { Reveal } from "@/components/Reveal";
import { Sitio } from "@/components/Sitio";
import { GARANTIAS, PASOS } from "@/lib/contenido";

const COLORES_MARCA = ["#ff8a6b", "#7fb2ff", "#5fd09f", "#f6c64a"];

/** El símbolo del logo (los cuatro agentes) junto a la palabra de fragmentos; cada círculo aparece por turno. */
function MarcaPortada() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="marca-portada relative z-10"
      aria-hidden="true"
    >
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

/*
 * Inicio: la portada y el resumen del producto.
 * 1. Portada: el logo hecho de fragmentos y el botón al chat.
 * 2. Qué es y cómo funciona.
 * 3. El equipo (los personajes; cada uno abre su ficha).
 * 4. El chat (bloque oscuro), con acceso a la página completa.
 * 5. Tus datos.  6. Llamado final.
 */
export default function Inicio() {
  return (
    <Sitio>
      {/* ---------- Portada: el logo de fragmentos y el botón para hablar con los agentes ---------- */}
      <section data-capitulo="Atendel" className="relative overflow-hidden">
        {/* Fondo: corrientes de partículas con los colores de los agentes */}
        <FlowField
          theme="atendel"
          density="sparse"
          className="!block !min-h-[100svh]"
        >
          <WordmarkHero
            texto="atendel"
            italica={false}
            peso={700}
            claseTitulo="wordmark-logo"
            marca={<MarcaPortada />}
          >
            <div className="relative z-10 mx-auto flex w-full max-w-[860px] flex-col items-center px-6 pb-16 pt-6 text-center sm:pb-20 hero-texto">
              <Reveal as="p" className="hero-etiqueta">
                Para clínicas, consultorios y estéticas
              </Reveal>
              <Reveal
                as="h2"
                delay={80}
                className="titulo mt-6 !text-[clamp(1.75rem,3.4vw,2.875rem)]"
              >
                Agentes de inteligencia artificial{" "}
                <em>para negocios que atienden personas.</em>
              </Reveal>
              <Reveal
                as="p"
                delay={160}
                className="texto-suave mt-5 max-w-[520px]"
              >
                Cuatro agentes de inteligencia artificial que atienden tu
                WhatsApp y tus citas, ordenan tu correo, traen de regreso a tus
                clientes y hacen el trabajo de oficina.
              </Reveal>
              <Reveal
                delay={240}
                className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
              >
                <PillLink href="/pruebalo" className="btn-pill--grande">
                  Habla con los agentes
                </PillLink>
                <Link href="/agentes" className="btn-ghost">
                  <Roll>Conoce a los agentes</Roll>
                </Link>
              </Reveal>
            </div>
          </WordmarkHero>
        </FlowField>
      </section>

      {/* ---------- 01 · Qué es Atendel: texto a un lado, cómo funciona al otro ---------- */}
      <section
        id="que-es"
        data-capitulo="Qué es"
        className="seccion seccion--primera"
      >
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <Claqueta
              n={1}
              izquierda="Qué es Atendel"
              derecha="En 30 segundos"
            />
            <Reveal as="h2" className="titulo mt-6">
              Un equipo de cuatro agentes de inteligencia artificial{" "}
              <em>que trabaja para tu clínica.</em>
            </Reveal>
            <Reveal
              as="p"
              delay={120}
              className="texto-suave mt-6 max-w-[440px]"
            >
              Cada uno lleva un área del negocio y hace varias cosas dentro de
              ella. Les hablas como a una persona y te entregan el trabajo
              hecho: mensajes, tablas, reportes, documentos.
            </Reveal>
          </div>
          <div className="lg:col-span-7 lg:pt-1">
            <p className="text-[0.8125rem] font-medium text-ash">
              Cómo funciona
            </p>
            <ol className="mt-4 flex flex-col gap-3">
              {PASOS.map(([titulo, texto], i) => (
                <Reveal
                  as="li"
                  key={titulo}
                  delay={i * 80}
                  className="tarjeta grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-1.5 p-6 sm:p-8"
                >
                  <span className="numero-seccion__n row-span-2 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="titulo titulo--sm">{titulo}</span>
                  <span className="texto-suave">{texto}</span>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- 02 · El equipo: los personajes (bloque pastel); cada uno abre su ficha ---------- */}
      <div className="pt-[120px] lg:pt-[176px]">
        <section
          data-capitulo="El equipo"
          className="bloque-pastel mx-auto max-w-[96rem]"
        >
          <div className="mx-auto grid max-w-[calc(var(--ancho)+3rem)] items-center gap-14 px-6 py-16 sm:max-w-[calc(var(--ancho)+5rem)] sm:px-10 sm:py-24 lg:max-w-[calc(var(--ancho)+8rem)] lg:grid-cols-12 lg:gap-12 lg:px-16 lg:py-28">
            <div className="lg:col-span-5">
              <Claqueta n={2} izquierda="4 agentes" derecha="Conócelos" />
              <Reveal as="h2" className="titulo mt-6">
                Atención, correo, clientes <em>y oficina.</em>
              </Reveal>
              <Reveal
                as="p"
                delay={120}
                className="texto-suave mt-6 max-w-[420px]"
              >
                Toca a cada uno para ver todo lo que hace, una conversación de
                ejemplo y en qué plan está.
              </Reveal>
              <Reveal
                delay={200}
                className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3"
              >
                <PillLink href="/pruebalo">Habla con ellos</PillLink>
                <Link href="/agentes" className="btn-ghost">
                  Ver a los agentes
                  <Arrow />
                </Link>
              </Reveal>
            </div>
            <Reveal delay={150} className="lg:col-span-7">
              <HeroPersonajes />
            </Reveal>
          </div>
        </section>
      </div>

      {/* ---------- 03 · Háblales: el chat, la demostración principal (bloque oscuro grande) ---------- */}
      <div className="pt-[120px] lg:pt-[176px]">
        <section
          id="chat"
          data-capitulo="Háblales"
          className="bloque-oscuro mx-auto max-w-[96rem]"
        >
          <div className="mx-auto max-w-[calc(var(--ancho)+3rem)] px-5 py-16 sm:max-w-[calc(var(--ancho)+5rem)] sm:px-10 sm:py-24 lg:max-w-[calc(var(--ancho)+8rem)] lg:px-16 lg:py-28">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-12">
              <div className="lg:col-span-7">
                <Claqueta
                  n={3}
                  izquierda="El chat"
                  derecha="Dentro de tu panel"
                />
                <Reveal as="h2" className="titulo titulo--xl mt-6">
                  Háblales como le hablas <em>a tu equipo.</em>
                </Reveal>
              </div>
              <Reveal
                delay={120}
                className="flex flex-col items-start gap-6 lg:col-span-5 lg:pb-2"
              >
                <p className="texto-suave max-w-[440px]">
                  Escríbeles lo que necesitas, como en cualquier chat. Te
                  contestan al momento, recuerdan la conversación y te dejan los
                  mensajes listos para copiar.
                </p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <PillLink href="/pruebalo">
                    Abrir en pantalla completa
                  </PillLink>
                  <Link href="/entrar" className="btn-ghost">
                    Probar el chat de verdad
                    <Arrow />
                  </Link>
                </div>
              </Reveal>
            </div>
            {/* El chat conserva el modo de la página (en modo claro se ve claro sobre el bloque) */}
            <Reveal delay={150} className="tema-claro-local mt-14 lg:mt-20">
              <ChatDemo />
            </Reveal>
          </div>
        </section>
      </div>

      {/* ---------- 04 · Tus datos: el candado a un lado, las garantías al otro ---------- */}
      <section id="seguridad" data-capitulo="Tus datos" className="seccion">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="tarjeta relative mx-auto aspect-square w-full max-w-[420px] lg:max-w-none">
            <ParticleShape
              shape="lock"
              colors={[
                "var(--color-bone-white)",
                "var(--color-bone-white)",
                "var(--color-bone-white)",
                "var(--color-silver-mist)",
                "var(--color-bone-white)",
                "var(--color-bone-white)",
                "var(--color-bone-white)",
                "var(--color-acento)",
              ]}
              className="absolute inset-[8%] h-[84%] w-[84%]"
            />
          </div>
          <div>
            <Claqueta n={4} izquierda="Tus datos" />
            <Reveal as="h2" className="titulo mt-6">
              Cada negocio <em>ve solo lo suyo.</em>
            </Reveal>
            <ul className="mt-10 flex flex-col gap-3">
              {GARANTIAS.map(([titulo, texto], i) => (
                <Reveal
                  as="li"
                  key={titulo}
                  delay={i * 80}
                  className="tarjeta p-6 sm:p-7"
                >
                  <span className="block text-[1.0625rem] font-semibold tracking-[-0.02em]">
                    {titulo}
                  </span>
                  <span className="texto-suave mt-1.5 block">{texto}</span>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Cierre: bloque oscuro con el llamado a la acción ---------- */}
      <div className="pt-[120px] lg:pt-[176px]">
        <section
          id="empezar"
          data-capitulo="Empieza"
          className="bloque-oscuro mx-auto max-w-[96rem]"
        >
          <div className="mx-auto flex max-w-[760px] flex-col items-center px-6 py-20 text-center sm:py-28 lg:py-32">
            <Reveal as="h2" className="titulo titulo--xl">
              Empieza gratis <em>con Clara.</em>
            </Reveal>
            <Reveal
              as="p"
              delay={120}
              className="texto-suave mt-6 max-w-[380px]"
            >
              Entras en un minuto con tu correo. Cuando quieras a todo el
              equipo, pasas a Atendel Max.
            </Reveal>
            <Reveal
              delay={200}
              className="mt-10 flex w-full flex-col items-center gap-4"
            >
              <PillLink href="/entrar" className="btn-pill--ancha">
                Empezar gratis
              </PillLink>
              <Link href="/precios" className="btn-ghost">
                Ver precios
                <Arrow />
              </Link>
            </Reveal>
          </div>
        </section>
      </div>
    </Sitio>
  );
}
