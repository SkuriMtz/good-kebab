import Link from "next/link";
import { PillLink, Roll } from "@/components/Buttons";
import { Encargos } from "@/components/encargos/Encargos";
import { Footer } from "@/components/Footer";
import { MobileCta } from "@/components/MobileCta";
import { Nav } from "@/components/Nav";
import { ParticleShape } from "@/components/particles/ParticleShape";
import { WordmarkHero } from "@/components/particles/WordmarkHero";
import { Preguntas } from "@/components/Preguntas";
import { Reveal } from "@/components/Reveal";

const SECCIONES = [
  { href: "#agentes", label: "Agentes" },
  { href: "#seguridad", label: "Tus datos" },
  { href: "#preguntas", label: "Preguntas" },
];

const GARANTIAS = [
  ["Solo tu cuenta", "Tus clientes, tus citas y tus números solo los ve tu negocio. Lo controla la base de datos, no una promesa."],
  ["Con tu permiso", "Los agentes proponen y tú apruebas lo importante. El de Correo solo lee: no envía ni borra nada."],
  ["Cifrado", "Todo viaja cifrado, de tu celular o computadora hasta nuestros servidores."],
];

const PREGUNTAS = [
  {
    p: "¿Necesito saber de tecnología?",
    r: "No. Entras con tu correo, sin contraseña, y lo usas desde el celular, la tablet o la computadora. No hay nada que instalar.",
  },
  {
    p: "¿Tengo que contratar los 15 agentes?",
    r: "No. Es una mensualidad: empiezas con los agentes que necesitas y sumas otros cuando quieras.",
  },
  {
    p: "¿Qué agentes funcionan hoy?",
    r: "Hoy funciona el de Correo. Los demás van llegando por etapas y aparecen en tu panel conforme están listos.",
  },
  {
    p: "¿Mis clientes van a saber que les contesta una inteligencia artificial?",
    r: "Tú decides cómo se presenta. Te recomendamos decirlo con claridad, y cuando una conversación necesita a una persona, el agente te la pasa.",
  },
  {
    p: "¿Y si se equivoca?",
    r: "Puede pasar, como con cualquier persona nueva en el equipo. Por eso lo importante no sale sin tu aprobación y todo queda registrado para que lo revises.",
  },
  {
    p: "¿Qué pasa con los datos de mis pacientes?",
    r: "Son tuyos. Cada negocio solo ve lo suyo, todo viaja cifrado y no vendemos tu información a nadie.",
  },
];

export default function Inicio() {
  return (
    <>
      <Nav
        items={SECCIONES}
        desktopRight={
          <Link href="/entrar" className="btn-ghost !text-bone">
            <Roll>Entrar</Roll>
          </Link>
        }
        mobileBottom={
          <div className="flex flex-col items-start gap-4">
            <PillLink href="/entrar">Probar Atendel</PillLink>
            <p className="text-[0.875rem] text-ash">Entras con tu correo, sin contraseña.</p>
          </div>
        }
      />

      <main>
        {/* ---------- Portada: la palabra hecha de fragmentos ---------- */}
        <section data-capitulo="Atendel" className="relative overflow-hidden">
          <WordmarkHero texto="atendel">
            <div className="tras-titulo relative z-10 mx-auto w-full max-w-page px-6 pb-7 lg:px-10 lg:pb-10">
              <div className="grid gap-5 border-t hairline pt-5 md:grid-cols-12 md:items-end md:gap-8">
                <p className="font-cond text-base uppercase leading-[0.95] tracking-[0.03em] text-ash md:col-span-3">
                  Para clínicas, consultorios
                  <br />y estéticas
                </p>
                <p className="max-w-[470px] text-body text-silver md:col-span-5">
                  Agentes de inteligencia artificial que contestan WhatsApp, acomodan tu agenda, te dicen quién te
                  debe y te avisan cuando algo se está acabando.
                </p>
                <div className="flex flex-wrap items-center gap-x-7 gap-y-2 md:col-span-4 md:justify-end">
                  <PillLink href="/entrar">Probar Atendel</PillLink>
                  <a href="#agentes" className="btn-ghost">
                    <Roll>Ver qué hacen</Roll>
                  </a>
                </div>
              </div>
            </div>
          </WordmarkHero>
        </section>

        {/* ---------- Los 15 agentes, trabajando ---------- */}
        <section
          id="agentes"
          data-capitulo="Agentes"
          className="mx-auto max-w-page px-6 pt-[88px] lg:px-10 lg:pt-[140px]"
        >
          <div className="flex items-baseline justify-between gap-4 border-t hairline pt-3 font-cond text-base uppercase leading-none tracking-[0.03em] text-ash">
            <span>15 agentes</span>
            <span>Ejemplos con datos ficticios</span>
          </div>
          <div className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-12 lg:items-end">
            <Reveal as="h2" className="editorial text-display lg:col-span-8">
              ¿Qué le encargas hoy?
            </Reveal>
            <Reveal as="p" delay={120} className="max-w-[400px] text-body text-silver lg:col-span-4 lg:pb-3">
              Cada agente se encarga de una parte del trabajo de tu clínica. Elige uno y mira cómo resolvería un pedido
              de todos los días.
            </Reveal>
          </div>
          <div className="relative mt-12 lg:mt-20">
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

        {/* ---------- Tus datos ---------- */}
        <section
          id="seguridad"
          data-capitulo="Tus datos"
          className="mx-auto max-w-page px-6 pt-[112px] lg:px-10 lg:pt-[180px]"
        >
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <div className="relative mx-auto aspect-square w-full max-w-[280px] lg:order-2 lg:max-w-[460px]">
              <ParticleShape
                shape="lock"
                colors={["#ffffff", "#ffffff", "#ffffff", "#d9d9d9", "#ffffff", "#ffffff", "#ffffff", "#ff2936"]}
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <div className="lg:order-1">
              <Reveal as="h2" className="editorial text-heading-lg">
                Cada negocio ve solo lo suyo.
              </Reveal>
              <ul className="mt-10 border-b hairline">
                {GARANTIAS.map(([titulo, texto], i) => (
                  <Reveal
                    as="li"
                    key={titulo}
                    delay={i * 80}
                    className="grid grid-cols-1 gap-1 border-t hairline py-5 sm:grid-cols-[160px_1fr] sm:gap-6"
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
          className="mx-auto grid max-w-page grid-cols-1 gap-10 px-6 pt-[112px] lg:grid-cols-12 lg:gap-8 lg:px-10 lg:pt-[180px]"
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
          className="mx-auto max-w-page px-6 pt-[120px] lg:px-10 lg:pt-[200px]"
        >
          <div className="grid gap-8 border-t hairline pt-8 lg:grid-cols-12 lg:items-end">
            <Reveal as="h2" className="editorial text-display lg:col-span-8">
              Empieza por tu correo.
            </Reveal>
            <Reveal delay={150} className="flex flex-col items-start gap-4 lg:col-span-4 lg:items-end lg:pb-4">
              <p className="max-w-[340px] text-body text-silver lg:text-right">
                Es el agente que ya funciona. Entras en un minuto, sin contraseña, y los demás se suman a tu panel
                cuando estén listos.
              </p>
              <PillLink href="/entrar">Probar Atendel</PillLink>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
      <MobileCta ocultarEn={["agentes", "empezar"]} />
    </>
  );
}
