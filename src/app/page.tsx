import Link from "next/link";
import { PillLink, Roll } from "@/components/Buttons";
import { ChatDemo } from "@/components/ChatDemo";
import { Encargos } from "@/components/encargos/Encargos";
import { EquipoEnFoco } from "@/components/EquipoEnFoco";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { NavDock } from "@/components/NavDock";
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
  ["Con tu permiso", "Los agentes proponen y tú apruebas lo importante. Clara solo lee tu correo: no envía ni borra nada."],
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

/** Encabezado de sección: una línea fina con dos datos, como la claqueta de una toma. */
function Claqueta({ izquierda, derecha }: { izquierda: string; derecha: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t hairline pt-3 font-cond text-base uppercase leading-none tracking-[0.03em] text-ash">
      <span>{izquierda}</span>
      <span className="text-right">{derecha}</span>
    </div>
  );
}

export default function Inicio() {
  return (
    <>
      <Nav
        items={SECCIONES}
        reparto={REPARTO}
        sinMenu
        desktopRight={
          <Link href="/entrar" className="btn-ghost !text-bone">
            <Roll>Entrar</Roll>
          </Link>
        }
        mobileBottom={
          <div className="flex flex-col items-start gap-3">
            <PillLink href="/entrar">Empezar gratis</PillLink>
            <p className="text-[0.875rem] text-ash">Entras con tu correo, sin contraseña.</p>
          </div>
        }
      />

      <main>
        {/* ---------- Portada: la palabra hecha de fragmentos ---------- */}
        <section data-capitulo="Atendel" className="relative overflow-hidden">
          <WordmarkHero texto="atendel">
            <div className="tras-titulo relative z-10 mx-auto w-full max-w-page px-6 pb-[104px] sm:px-10 lg:px-16 lg:pb-[120px]">
              <div className="grid gap-7 border-t hairline pt-7 md:grid-cols-12 md:items-end md:gap-10">
                <p className="font-cond text-base uppercase leading-[0.95] tracking-[0.03em] text-ash md:col-span-3">
                  Para clínicas, consultorios
                  <br />y estéticas
                </p>
                <p className="max-w-[480px] text-body text-silver md:col-span-5">
                  Cuatro agentes de inteligencia artificial que atienden tu WhatsApp y tus citas, ordenan tu correo, traen
                  de regreso a tus clientes y hacen el trabajo de oficina.
                </p>
                <div className="flex flex-wrap items-center gap-x-7 gap-y-2 md:col-span-4 md:justify-end">
                  <PillLink href="/entrar">Empezar gratis</PillLink>
                  <a href="#que-es" className="btn-ghost">
                    <Roll>Qué es</Roll>
                  </a>
                </div>
              </div>
            </div>
          </WordmarkHero>
        </section>

        {/* ---------- Qué es Atendel ---------- */}
        <section
          id="que-es"
          data-capitulo="Qué es"
          className="seccion seccion--primera"
        >
          <Claqueta izquierda="Qué es Atendel" derecha="En 30 segundos" />
          <div className="mt-12 grid gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-10">
            <Reveal as="h2" className="editorial text-heading lg:col-span-8">
              Un equipo de cuatro agentes de inteligencia artificial que trabaja para tu clínica.
            </Reveal>
            <Reveal as="p" delay={120} className="max-w-[420px] text-body text-silver lg:col-span-4 lg:pt-3">
              Cada uno lleva un área del negocio y hace varias cosas dentro de ella. Les hablas como a una persona y te
              entregan el trabajo hecho: mensajes, tablas, reportes, documentos.
            </Reveal>
          </div>

          <div className="mt-20 grid gap-8 lg:mt-32 lg:grid-cols-12 lg:gap-10">
            <p className="font-cond text-base uppercase tracking-[0.03em] text-ash lg:col-span-3">Cómo funciona</p>
            <ol className="border-b hairline lg:col-span-9">
              {PASOS.map(([titulo, texto], i) => (
                <Reveal
                  as="li"
                  key={titulo}
                  delay={i * 80}
                  className="grid grid-cols-[36px_minmax(0,1fr)] gap-x-4 gap-y-2 border-t hairline py-7 md:grid-cols-[48px_minmax(0,5fr)_minmax(0,6fr)] md:items-baseline md:gap-x-8"
                >
                  <span className="font-cond text-base text-ash">{String(i + 1).padStart(2, "0")}</span>
                  <span className="editorial text-[clamp(1.625rem,2.6vw,2.375rem)] leading-[1.05]">{titulo}</span>
                  <span className="col-start-2 text-body text-silver md:col-start-3">{texto}</span>
                </Reveal>
              ))}
            </ol>
          </div>

          <div className="mt-32 lg:mt-48">
            <EquipoEnFoco />
          </div>
        </section>

        {/* ---------- Los 4 agentes, trabajando ---------- */}
        <section
          id="agentes"
          data-capitulo="Agentes"
          className="seccion"
        >
          <Claqueta izquierda="4 agentes" derecha="Ejemplos con datos ficticios" />
          <div className="mt-12 grid gap-8 lg:mt-20 lg:grid-cols-12 lg:items-end">
            <Reveal as="h2" className="editorial text-display lg:col-span-8">
              ¿Qué le encargas hoy?
            </Reveal>
            <Reveal as="p" delay={120} className="max-w-[400px] text-body text-silver lg:col-span-4 lg:pb-3">
              Elige un agente y mira cómo resuelve sus tareas de todos los días.
            </Reveal>
          </div>
          <div className="relative mt-16 lg:mt-24">
            <p className="firma pointer-events-none absolute -top-11 left-[min(30%,240px)] hidden -rotate-3 lg:block" aria-hidden="true">
              toca uno
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
            <Encargos />
          </div>
        </section>

        {/* ---------- Háblales ---------- */}
        <section id="chat" data-capitulo="Háblales" className="seccion">
          <Claqueta izquierda="El chat" derecha="Dentro de tu panel" />
          <div className="mt-12 grid gap-8 lg:mt-20 lg:grid-cols-12 lg:items-end">
            <Reveal as="h2" className="editorial text-heading lg:col-span-7">
              Háblales como le hablas a tu equipo.
            </Reveal>
            <Reveal delay={120} className="flex flex-col items-start gap-5 lg:col-span-5 lg:pb-2">
              <p className="max-w-[440px] text-body text-silver">
                Escríbeles lo que necesitas, como en cualquier chat. Te contestan al momento, recuerdan la conversación y
                te dejan los mensajes listos para copiar.
              </p>
              <PillLink href="/entrar">Probar el chat</PillLink>
            </Reveal>
          </div>
          <Reveal delay={150} className="mt-16 lg:mt-24">
            <ChatDemo />
          </Reveal>
        </section>

        {/* ---------- Planes ---------- */}
        <section id="planes" data-capitulo="Planes" className="seccion">
          <Claqueta izquierda="Planes" derecha="Free → One → Max" />
          <div className="mt-12 grid gap-8 lg:mt-20 lg:grid-cols-12 lg:items-end">
            <Reveal as="h2" className="editorial text-heading lg:col-span-7">
              Empieza gratis. Crece cuando quieras.
            </Reveal>
            <Reveal as="p" delay={120} className="max-w-[420px] text-body text-silver lg:col-span-5 lg:pb-2">
              Free para conocer a Clara. One para tener a todo el equipo. Max para el negocio que no para.
            </Reveal>
          </div>
          <div className="mt-16 lg:mt-24">
            <Planes />
          </div>
        </section>

        {/* ---------- Tus datos ---------- */}
        <section
          id="seguridad"
          data-capitulo="Tus datos"
          className="seccion"
        >
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-24">
            <div className="relative mx-auto aspect-square w-full max-w-[280px] lg:order-2 lg:max-w-[460px]">
              <ParticleShape
                shape="lock"
                colors={["var(--color-bone-white)", "var(--color-bone-white)", "var(--color-bone-white)", "var(--color-silver-mist)", "var(--color-bone-white)", "var(--color-bone-white)", "var(--color-bone-white)", "var(--color-signal)"]}
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <div className="lg:order-1">
              <Reveal as="h2" className="editorial text-heading-lg">
                Cada negocio ve solo lo suyo.
              </Reveal>
              <ul className="mt-12 border-b hairline lg:mt-16">
                {GARANTIAS.map(([titulo, texto], i) => (
                  <Reveal
                    as="li"
                    key={titulo}
                    delay={i * 80}
                    className="grid grid-cols-1 gap-2 border-t hairline py-7 sm:grid-cols-[160px_1fr] sm:gap-8"
                  >
                    <span className="font-cond text-[1.375rem] leading-[1.05] tracking-[0.02em]">{titulo}</span>
                    <span className="text-body text-silver">{texto}</span>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ---------- Preguntas ---------- */}
        <section
          id="preguntas"
          data-capitulo="Preguntas"
          className="seccion grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10"
        >
          <div className="lg:col-span-4">
            <Reveal as="h2" className="editorial text-heading-lg lg:sticky lg:top-[110px]">
              Lo que nos preguntan
            </Reveal>
          </div>
          <div className="lg:col-span-8">
            <Preguntas preguntas={PREGUNTAS} />
          </div>
        </section>

        {/* ---------- Cierre ---------- */}
        <section
          id="empezar"
          data-capitulo="Empieza"
          className="seccion"
        >
          <div className="grid gap-10 border-t hairline pt-10 lg:grid-cols-12 lg:items-end">
            <Reveal as="h2" className="editorial text-display lg:col-span-8">
              Empieza gratis con Clara.
            </Reveal>
            <Reveal delay={150} className="flex flex-col items-start gap-4 lg:col-span-4 lg:items-end lg:pb-4">
              <p className="max-w-[340px] text-body text-silver lg:text-right">
                Entras en un minuto con tu correo. Cuando quieras a todo el equipo, pasas a Atendel One.
              </p>
              <PillLink href="/entrar">Empezar gratis</PillLink>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
      <NavDock />
    </>
  );
}
