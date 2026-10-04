import Link from "next/link";
import { PillLink, Roll } from "@/components/Buttons";
import { ChatDemo } from "@/components/ChatDemo";
import { AgentesGaleria } from "@/components/agentes/AgentesGaleria";
import { HeroPersonajes } from "@/components/agentes/HeroPersonajes";
import { EquipoEnFoco } from "@/components/EquipoEnFoco";
import { Footer } from "@/components/Footer";
import { MenuLateral } from "@/components/MenuLateral";
import { Nav } from "@/components/Nav";
import { ParticleShape } from "@/components/particles/ParticleShape";
import { WordmarkHero } from "@/components/particles/WordmarkHero";
import { Planes } from "@/components/Planes";
import { Preguntas } from "@/components/Preguntas";
import { Reveal } from "@/components/Reveal";
import { AGENTES_INFO } from "@/lib/agentes";

const SECCIONES = [
  { href: "#que-es", label: "Qué es" },
  { href: "#agentes", label: "Agentes" },
  { href: "#chat", label: "Háblales" },
  { href: "#planes", label: "Planes" },
  { href: "#preguntas", label: "Preguntas" },
];

const REPARTO = AGENTES_INFO.map((a) => ({ nombre: a.nombre, papel: a.area, href: "#agentes" }));

const PASOS = [
  ["Entras con tu correo", "Sin contraseña y sin instalar nada. Desde el celular, la tablet o la computadora."],
  ["Armas tu equipo", "Eliges qué agentes trabajan contigo: atención, correo, clientes u oficina."],
  ["Les encargas trabajo", "Les escribes como a una persona. Ellos resuelven, y lo importante no sale sin tu visto bueno."],
];

const GARANTIAS = [
  ["Solo tu cuenta", "Tus clientes, tus citas y tus números solo los ve tu negocio. Lo controla la base de datos, no una promesa."],
  ["Con tu permiso", "Tú decides qué hace cada agente por su cuenta y qué te consulta primero. Clara contesta desde tu correo con las reglas que tú le pones."],
  ["Cifrado", "Todo viaja cifrado, de tu celular o computadora hasta nuestros servidores."],
];

const PREGUNTAS = [
  {
    p: "¿Necesito saber de tecnología?",
    r: "No. Entras con tu correo, sin contraseña, y lo usas desde el celular, la tablet o la computadora. No hay nada que instalar.",
  },
  {
    p: "¿Qué cambia entre Free, One y Max?",
    r: "Con Free trabajas con Clara, tu agente de correo, y tienes pocos mensajes al mes. One desbloquea a los cuatro agentes y eliges quién está en tu equipo. Max es todo lo de One, con muchos más mensajes y respuestas más elaboradas.",
  },
  {
    p: "¿Qué funciona hoy?",
    r: "Clara ya lee y resume tu correo, y puedes hablar por chat con todo el equipo. La conexión directa de Lola con tu WhatsApp y tu agenda llega por etapas.",
  },
  {
    p: "¿Mis clientes van a saber que les contesta una inteligencia artificial?",
    r: "Tú decides cómo se presenta. Te recomendamos decirlo con claridad, y cuando una conversación necesita a una persona, Lola te avisa y te la pasa.",
  },
  {
    p: "¿Y si se equivoca?",
    r: "Puede pasar, como con cualquier persona nueva en el equipo. Por eso lo importante no sale sin tu aprobación y todo queda guardado para que lo revises.",
  },
  {
    p: "¿Qué pasa con los datos de mis pacientes?",
    r: "Son tuyos. Cada negocio solo ve lo suyo, todo viaja cifrado y no vendemos tu información a nadie.",
  },
];

/**
 * Encabezado de sección: el número (01, 02…) en una pastilla, el nombre de
 * la sección y un dato extra, como la claqueta de una toma.
 */
function Claqueta({ n, izquierda, derecha }: { n: number; izquierda: string; derecha?: string }) {
  return (
    <p className="numero-seccion">
      <span className="numero-seccion__n">{String(n).padStart(2, "0")}</span>
      <span className="font-medium text-bone">{izquierda}</span>
      {derecha ? <span className="numero-seccion__extra">{derecha}</span> : null}
    </p>
  );
}

/*
 * Orden de la página (la historia que cuenta):
 * 1. Portada: qué es, en una línea, y quiénes son (los personajes).
 * 2. Qué es y cómo funciona.
 * 3. El equipo en foco (bloque oscuro) → 4. Conocer a cada agente.
 * 5. Verlos trabajar: el chat (bloque oscuro grande, la demostración principal).
 * 6. Planes → 7. Tus datos → 8. Preguntas: lo que hay que saber para decidir.
 * 9. Llamado final (bloque oscuro) y pie.
 */
export default function Inicio() {
  return (
    <>
      <Nav
        items={SECCIONES}
        reparto={REPARTO}
        menuLateral
        desktopRight={
          <>
            <Link href="/entrar" className="btn-ghost !text-bone">
              <Roll>Entrar</Roll>
            </Link>
            <PillLink href="/entrar" className="btn-pill--chica" arrow={false}>
              Empezar gratis
            </PillLink>
          </>
        }
        mobileBottom={
          <div className="flex flex-col items-start gap-3">
            <PillLink href="/entrar">Empezar gratis</PillLink>
            <p className="text-[0.875rem] text-ash">Entras con tu correo, sin contraseña.</p>
          </div>
        }
      />

      <main>
        {/* ---------- Portada: título y personajes; abajo, la palabra hecha de fragmentos ---------- */}
        <section data-capitulo="Atendel" className="relative overflow-hidden">
          <WordmarkHero
            texto="atendel"
            antes={
              <div className="relative z-10 mx-auto grid w-full max-w-[calc(var(--ancho)+3rem)] items-center gap-14 px-6 pt-[124px] sm:max-w-[calc(var(--ancho)+5rem)] sm:px-10 sm:pt-[150px] lg:max-w-[calc(var(--ancho)+8rem)] lg:grid-cols-12 lg:gap-12 lg:px-16 lg:pt-[176px]">
                <div className="lg:col-span-6">
                  <Reveal as="p" className="hero-etiqueta">
                    Para clínicas, consultorios y estéticas
                  </Reveal>
                  <Reveal as="h2" delay={80} className="titulo titulo--xl mt-6">
                    Agentes de inteligencia artificial <em>para negocios que atienden personas.</em>
                  </Reveal>
                  <Reveal as="p" delay={160} className="texto-suave mt-6 max-w-[460px]">
                    Cuatro agentes de inteligencia artificial que atienden tu WhatsApp y tus citas, ordenan tu correo, traen
                    de regreso a tus clientes y hacen el trabajo de oficina.
                  </Reveal>
                  <Reveal delay={240} className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <PillLink href="/entrar">Empezar gratis</PillLink>
                    <a href="#que-es" className="btn-ghost">
                      <Roll>Qué es</Roll>
                    </a>
                  </Reveal>
                </div>
                <Reveal delay={200} className="lg:col-span-6">
                  <HeroPersonajes />
                </Reveal>
              </div>
            }
          />
        </section>

        {/* ---------- 01 · Qué es Atendel: texto a un lado, cómo funciona al otro ---------- */}
        <section id="que-es" data-capitulo="Qué es" className="seccion seccion--primera">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <Claqueta n={1} izquierda="Qué es Atendel" derecha="En 30 segundos" />
              <Reveal as="h2" className="titulo mt-6">
                Un equipo de cuatro agentes de inteligencia artificial <em>que trabaja para tu clínica.</em>
              </Reveal>
              <Reveal as="p" delay={120} className="texto-suave mt-6 max-w-[440px]">
                Cada uno lleva un área del negocio y hace varias cosas dentro de ella. Les hablas como a una persona y te
                entregan el trabajo hecho: mensajes, tablas, reportes, documentos.
              </Reveal>
            </div>
            <div className="lg:col-span-7 lg:pt-1">
              <p className="text-[0.8125rem] font-medium text-ash">Cómo funciona</p>
              <ol className="mt-4 flex flex-col gap-3">
                {PASOS.map(([titulo, texto], i) => (
                  <Reveal
                    as="li"
                    key={titulo}
                    delay={i * 80}
                    className="tarjeta grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-1.5 p-6 sm:p-8"
                  >
                    <span className="numero-seccion__n row-span-2 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                    <span className="titulo titulo--sm">{titulo}</span>
                    <span className="texto-suave">{texto}</span>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ---------- El equipo en foco: los nombres que se enfocan uno por uno (bloque oscuro) ---------- */}
        <div className="pt-[120px] lg:pt-[176px]">
          <Reveal className="bloque-oscuro mx-auto max-w-[96rem] px-6 py-20 sm:px-10 sm:py-24 lg:py-32">
            <EquipoEnFoco />
          </Reveal>
        </div>

        {/* ---------- 02 · Los agentes: acordeón con sus personajes ---------- */}
        <section id="agentes" data-capitulo="Agentes" className="seccion">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-12">
            <div className="lg:col-span-7">
              <Claqueta n={2} izquierda="4 agentes" derecha="Conócelos" />
              <Reveal as="h2" className="titulo titulo--xl mt-6">
                ¿Qué le encargas <em>hoy?</em>
              </Reveal>
            </div>
            <Reveal as="p" delay={120} className="texto-suave max-w-[400px] lg:col-span-5 lg:pb-2">
              Pasa el cursor por cada uno para conocerlo. Haz clic para ver todo lo que hace, una conversación de ejemplo
              y en qué plan está.
            </Reveal>
          </div>
          <div className="relative mt-16 lg:mt-20">
            <p className="firma pointer-events-none absolute -top-12 right-[8%] hidden rotate-3 lg:block" aria-hidden="true">
              haz clic
              <svg className="ml-1 inline-block h-8 w-9 align-top" viewBox="0 0 36 32" fill="none">
                <path
                  d="M2 6c9-4 19-2 24 6 2.5 4 3 9 2.2 15M24 22.5l4.4 5.5 4.6-5.2"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </p>
            <AgentesGaleria />
          </div>
        </section>

        {/* ---------- 03 · Háblales: el chat, la demostración principal (bloque oscuro grande) ---------- */}
        <div className="pt-[120px] lg:pt-[176px]">
          <section id="chat" data-capitulo="Háblales" className="bloque-oscuro mx-auto max-w-[96rem]">
            <div className="mx-auto max-w-[calc(var(--ancho)+3rem)] px-5 py-16 sm:max-w-[calc(var(--ancho)+5rem)] sm:px-10 sm:py-24 lg:max-w-[calc(var(--ancho)+8rem)] lg:px-16 lg:py-28">
              <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-12">
                <div className="lg:col-span-7">
                  <Claqueta n={3} izquierda="El chat" derecha="Dentro de tu panel" />
                  <Reveal as="h2" className="titulo titulo--xl mt-6">
                    Háblales como le hablas <em>a tu equipo.</em>
                  </Reveal>
                </div>
                <Reveal delay={120} className="flex flex-col items-start gap-6 lg:col-span-5 lg:pb-2">
                  <p className="texto-suave max-w-[440px]">
                    Escríbeles lo que necesitas, como en cualquier chat. Te contestan al momento, recuerdan la conversación
                    y te dejan los mensajes listos para copiar.
                  </p>
                  <PillLink href="/entrar">Probar el chat</PillLink>
                </Reveal>
              </div>
              {/* El chat conserva el modo de la página (en modo claro se ve claro sobre el bloque) */}
              <Reveal delay={150} className="tema-claro-local mt-14 lg:mt-20">
                <ChatDemo />
              </Reveal>
            </div>
          </section>
        </div>

        {/* ---------- 04 · Planes ---------- */}
        <section id="planes" data-capitulo="Planes" className="seccion">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-12">
            <div className="lg:col-span-7">
              <Claqueta n={4} izquierda="Planes" derecha="Free → One → Max" />
              <Reveal as="h2" className="titulo mt-6">
                Empieza gratis. <em>Crece cuando quieras.</em>
              </Reveal>
            </div>
            <Reveal as="p" delay={120} className="texto-suave max-w-[420px] lg:col-span-5 lg:pb-2">
              Free para conocer a Clara. One para tener a todo el equipo. Max para el negocio que no para.
            </Reveal>
          </div>
          <div className="mt-14 lg:mt-20">
            <Planes />
          </div>
        </section>

        {/* ---------- 05 · Tus datos: el candado a un lado, las garantías al otro ---------- */}
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
              <Claqueta n={5} izquierda="Tus datos" />
              <Reveal as="h2" className="titulo mt-6">
                Cada negocio <em>ve solo lo suyo.</em>
              </Reveal>
              <ul className="mt-10 flex flex-col gap-3">
                {GARANTIAS.map(([titulo, texto], i) => (
                  <Reveal as="li" key={titulo} delay={i * 80} className="tarjeta p-6 sm:p-7">
                    <span className="block text-[1.0625rem] font-semibold tracking-[-0.02em]">{titulo}</span>
                    <span className="texto-suave mt-1.5 block">{texto}</span>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ---------- 06 · Preguntas ---------- */}
        <section id="preguntas" data-capitulo="Preguntas" className="seccion grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[120px]">
              <Claqueta n={6} izquierda="Preguntas" />
              <Reveal as="h2" className="titulo mt-6">
                Lo que <em>nos preguntan.</em>
              </Reveal>
            </div>
          </div>
          <div className="lg:col-span-7">
            <Preguntas preguntas={PREGUNTAS} />
          </div>
        </section>

        {/* ---------- Cierre: bloque oscuro con el llamado a la acción ---------- */}
        <div className="pt-[120px] lg:pt-[176px]">
          <section id="empezar" data-capitulo="Empieza" className="bloque-oscuro mx-auto max-w-[96rem]">
            <div className="mx-auto flex max-w-[760px] flex-col items-center px-6 py-20 text-center sm:py-28 lg:py-32">
              <Reveal as="h2" className="titulo titulo--xl">
                Empieza gratis <em>con Clara.</em>
              </Reveal>
              <Reveal as="p" delay={120} className="texto-suave mt-6 max-w-[380px]">
                Entras en un minuto con tu correo. Cuando quieras a todo el equipo, pasas a Atendel One.
              </Reveal>
              <Reveal delay={200} className="mt-10 flex w-full justify-center">
                <PillLink href="/entrar" className="btn-pill--ancha">
                  Empezar gratis
                </PillLink>
              </Reveal>
            </div>
          </section>
        </div>
      </main>

      <Footer />
      <MenuLateral />
    </>
  );
}
