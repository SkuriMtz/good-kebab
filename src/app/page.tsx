import Link from "next/link";
import { Arrow, PillLink, Roll } from "@/components/Buttons";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { BrainConstellation } from "@/components/particles/BrainConstellation";
import { ParticleShape } from "@/components/particles/ParticleShape";
import type { ShapeName } from "@/components/particles/shapes";
import { Reveal, SplitText } from "@/components/Reveal";
import { Demo } from "@/components/Demo";
import { MobileCta } from "@/components/MobileCta";
import { Steps } from "@/components/Steps";

const SECCIONES = [
  { href: "#demo", label: "Ejemplo" },
  { href: "#agentes", label: "Agentes" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#seguridad", label: "Seguridad" },
];

type Agente = {
  figura: ShapeName;
  colores: string[];
  nombre: string;
  disponible: boolean;
  titulo: string;
  texto: string;
};

const AGENTES: Agente[] = [
  {
    figura: "mail",
    colores: ["#8052ff", "#8052ff", "#a98bff", "#4d7cff", "#f29d0a"],
    nombre: "Agente de correo",
    disponible: true,
    titulo: "Tu bandeja, en una línea.",
    texto:
      "Lee tus correos sin leer y te dice de qué trata cada uno y qué conviene hacer: agendar, cotizar, reprogramar o archivar. Atendel nunca envía ni borra nada.",
  },
  {
    figura: "chat",
    colores: ["#1fc7a4", "#1fc7a4", "#15846e", "#8052ff", "#a98bff"],
    nombre: "Agente de WhatsApp",
    disponible: false,
    titulo: "Respuestas a cualquier hora.",
    texto:
      "Contesta horarios, precios y dudas frecuentes en segundos, y te pasa solo las conversaciones que de verdad necesitan a una persona.",
  },
  {
    figura: "chart",
    colores: ["#f29d0a", "#f29d0a", "#ff8a3d", "#8052ff", "#ff5fd2"],
    nombre: "Agente de Excel",
    disponible: false,
    titulo: "Tus números, explicados.",
    texto:
      "Sube tu Excel de citas o ventas y pregúntale lo que quieras: qué tratamiento deja más, qué días faltan pacientes, a quién conviene volver a llamar.",
  },
  {
    figura: "search",
    colores: ["#4d7cff", "#4d7cff", "#a98bff", "#ff5fd2", "#1fc7a4"],
    nombre: "Agente de investigación",
    disponible: false,
    titulo: "Investiga mientras atiendes.",
    texto:
      "Compara proveedores, revisa precios de la competencia o resume un tema en minutos, con las fuentes para que tú verifiques.",
  },
];

const PASOS = [
  {
    titulo: "Entra con tu correo.",
    texto: "Sin contraseñas ni instalaciones. Funciona en tu computadora, tablet y celular.",
  },
  {
    titulo: "Atendel lee por ti.",
    texto: "Tus agentes revisan lo nuevo y lo resumen en segundos, en español claro.",
  },
  {
    titulo: "Tú decides.",
    texto: "Ves qué pide cada cliente y qué conviene hacer. Nada se envía sin ti.",
  },
];

const PROBLEMAS = [
  "Correos que se quedan sin contestar.",
  "Las mismas preguntas, todos los días.",
  "Una recepción apagando fuegos.",
];

const GARANTIAS = [
  "Cada negocio, aislado del resto.",
  "Permiso de solo lectura en tu correo.",
  "Conexión cifrada, siempre.",
];

function Estado({ disponible }: { disponible: boolean }) {
  if (disponible) {
    return (
      <span className="inline-flex items-center gap-2 text-mint">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
        </span>
        Disponible
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-ash">
      <span className="h-2 w-2 rounded-full border border-ash" />
      Próximamente
    </span>
  );
}

function FilaAgente({ agente, invertida }: { agente: Agente; invertida: boolean }) {
  return (
    <article className="grid grid-cols-1 items-center gap-6 py-[44px] lg:grid-cols-2 lg:gap-20 lg:py-[72px]">
      <div
        className={`relative mx-auto aspect-square w-full max-w-[380px] lg:max-w-[540px] ${invertida ? "lg:order-2" : ""}`}
      >
        <ParticleShape shape={agente.figura} colors={agente.colores} className="absolute inset-0 h-full w-full" />
      </div>
      <div className={invertida ? "lg:order-1" : ""}>
        <Reveal as="p" className="eyebrow flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-saffron">{agente.nombre}</span>
          <Estado disponible={agente.disponible} />
        </Reveal>
        <SplitText as="h3" className="mt-5 text-heading-lg" text={agente.titulo} />
        <Reveal as="p" delay={180} className="mt-6 max-w-[480px] text-body text-silver">
          {agente.texto}
        </Reveal>
        {agente.disponible ? (
          <Reveal delay={260} className="mt-6">
            <Link href="/entrar" className="btn-ghost">
              <Roll>Probarlo ahora</Roll>
              <Arrow />
            </Link>
          </Reveal>
        ) : null}
      </div>
    </article>
  );
}

export default function Inicio() {
  return (
    <>
      <Nav
        items={SECCIONES}
        desktopRight={
          <PillLink href="/entrar" arrow={false}>
            Entrar
          </PillLink>
        }
        mobileBottom={
          <div className="flex flex-col items-start gap-4">
            <PillLink href="/entrar">Probar Atendel</PillLink>
            <p className="text-caption text-ash">Entras con tu correo, sin contraseña.</p>
          </div>
        }
      />

      <main>
        {/* ---------- Portada ---------- */}
        <section className="relative overflow-hidden">
          <div className="relative z-10 mx-auto flex max-w-page flex-col px-6 pt-[132px] lg:min-h-[100svh] lg:justify-center lg:px-10 lg:pb-16 lg:pt-[72px]">
            <div className="lg:max-w-[min(60%,760px)]">
              <Reveal as="p" className="eyebrow text-saffron">
                Agentes de IA para clínicas y estéticas
              </Reveal>
              <SplitText as="h1" delay={120} className="mt-6 text-display" text="Ningún cliente sin respuesta." />
              <Reveal as="p" delay={480} className="mt-8 max-w-[480px] text-body text-bone/90">
                Atendel es tu equipo de agentes de inteligencia artificial: leen tus correos, entienden qué
                necesita cada persona y te dicen qué hacer. Para negocios que quieren atender mejor sin contratar
                más.
              </Reveal>
              <Reveal delay={620} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
                <PillLink href="/entrar">Probar Atendel</PillLink>
                <a href="#demo" className="btn-ghost">
                  <Roll>Ver ejemplo</Roll>
                </a>
              </Reveal>
            </div>
          </div>

          <div className="relative h-[min(112vw,600px)] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[64%]">
            <BrainConstellation className="absolute inset-0 h-full w-full" />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-10 z-10 hidden lg:block" aria-hidden="true">
            <div className="mx-auto flex max-w-page items-center gap-4 px-10">
              <span className="scroll-cue__line" />
              <span className="text-caption font-semibold uppercase tracking-[0.12em] text-ash">Desliza</span>
            </div>
          </div>
        </section>

        {/* ---------- El problema ---------- */}
        <section className="mx-auto max-w-page px-6 pt-[96px] lg:px-10 lg:pt-[160px]">
          <Reveal as="p" className="eyebrow text-saffron">
            ¿Te suena?
          </Reveal>
          <ul className="mt-8 space-y-4 lg:space-y-6">
            {PROBLEMAS.map((p, i) => (
              <li key={p}>
                <SplitText as="p" delay={i * 120} className="text-heading-lg text-ash" text={p} />
              </li>
            ))}
          </ul>
          <Reveal as="p" delay={200} className="mt-10 max-w-[560px] text-heading-2xs text-bone">
            Atendel se encarga de lo repetitivo para que tu equipo atienda a las personas.
          </Reveal>
        </section>

        {/* ---------- Demo de ejemplo ---------- */}
        <section id="demo" className="mx-auto max-w-page px-6 pt-[96px] lg:px-10 lg:pt-[160px]">
          <Reveal as="p" className="eyebrow text-saffron">
            Míralo en acción
          </Reveal>
          <SplitText as="h2" className="mt-5 max-w-[900px] text-heading-lg" text="Un correo entra. Tú sabes qué hacer." />
          <Reveal delay={150} className="mt-12">
            <Demo />
          </Reveal>
        </section>

        {/* ---------- Agentes ---------- */}
        <section id="agentes" className="mx-auto max-w-page px-6 pt-[72px] lg:px-10 lg:pt-[140px]">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-20">
            <div>
              <Reveal as="p" className="eyebrow text-saffron">
                Tus agentes
              </Reveal>
              <SplitText as="h2" className="mt-5 text-heading-lg" text="Un equipo que nunca se va a casa." />
            </div>
            <Reveal as="p" delay={150} className="max-w-[480px] self-end text-body text-silver">
              Cada agente se encarga de una parte del día a día de tu negocio. Empiezas con uno y sumas los demás
              cuando quieras.
            </Reveal>
          </div>
          <div className="mt-[40px] lg:mt-[72px]">
            {AGENTES.map((agente, i) => (
              <FilaAgente key={agente.figura} agente={agente} invertida={i % 2 === 1} />
            ))}
          </div>
        </section>

        {/* ---------- Cómo funciona ---------- */}
        <section
          id="como-funciona"
          className="mx-auto grid max-w-page grid-cols-1 gap-14 px-6 pt-[96px] lg:grid-cols-2 lg:gap-20 lg:px-10 lg:pt-[160px]"
        >
          <div className="self-start lg:sticky lg:top-[150px]">
            <Reveal as="p" className="eyebrow text-saffron">
              Cómo funciona
            </Reveal>
            <SplitText as="h2" className="mt-5 text-heading-lg" text="Tres pasos. Cero complicaciones." />
          </div>
          <Steps pasos={PASOS} />
        </section>

        {/* ---------- Seguridad ---------- */}
        <section
          id="seguridad"
          className="mx-auto grid max-w-page grid-cols-1 items-center gap-8 px-6 pt-[96px] lg:grid-cols-2 lg:gap-20 lg:px-10 lg:pt-[160px]"
        >
          <div className="relative mx-auto aspect-square w-full max-w-[360px] lg:order-2 lg:max-w-[500px]">
            <ParticleShape
              shape="lock"
              colors={["#8052ff", "#a98bff", "#1fc7a4", "#4d7cff"]}
              className="absolute inset-0 h-full w-full"
            />
          </div>
          <div className="lg:order-1">
            <Reveal as="p" className="eyebrow text-saffron">
              Seguridad
            </Reveal>
            <SplitText as="h2" className="mt-5 text-heading-lg" text="Tus datos, bajo llave." />
            <Reveal as="p" delay={180} className="mt-6 max-w-[480px] text-body text-silver">
              Cada negocio solo puede ver su propia información, y eso lo garantiza la base de datos, no solo la
              app. Atendel lee tu correo, pero nunca envía, borra ni comparte nada.
            </Reveal>
            <ul className="mt-10 space-y-5">
              {GARANTIAS.map((g, i) => (
                <Reveal as="li" key={g} delay={240 + i * 90} className="flex items-center gap-4 text-heading-2xs">
                  <svg className="h-3.5 w-3.5 shrink-0 text-iris" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 2 20.66 17H3.34Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
                  </svg>
                  {g}
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Cierre ---------- */}
        <section
          id="empezar"
          className="mx-auto grid max-w-page grid-cols-1 items-center gap-10 px-6 pt-[96px] lg:grid-cols-2 lg:gap-20 lg:px-10 lg:pt-[180px]"
        >
          <div>
            <Reveal as="p" className="eyebrow text-saffron">
              Empieza hoy
            </Reveal>
            <SplitText as="h2" className="mt-5 text-display" text="Atiende mejor desde hoy." />
            <Reveal as="p" delay={200} className="mt-8 max-w-[440px] text-body text-silver">
              Pruébalo con tus propios correos. Entras con tu email en menos de un minuto.
            </Reveal>
            <Reveal delay={320} className="mt-10">
              <PillLink href="/entrar">Probar Atendel</PillLink>
            </Reveal>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[340px] lg:max-w-[480px]">
            <ParticleShape
              shape="check"
              colors={["#8052ff", "#8052ff", "#a98bff", "#4d7cff", "#1fc7a4", "#f29d0a"]}
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </section>
      </main>

      <Footer />
      <MobileCta />
    </>
  );
}
