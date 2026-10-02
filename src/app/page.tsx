import { Agentes } from "@/components/Agentes";
import { PillLink, Roll } from "@/components/Buttons";
import { Demo } from "@/components/Demo";
import { Footer } from "@/components/Footer";
import { MobileCta } from "@/components/MobileCta";
import { Nav } from "@/components/Nav";
import { ParticleShape } from "@/components/particles/ParticleShape";
import { WordmarkHero } from "@/components/particles/WordmarkHero";
import { Reveal, SplitText } from "@/components/Reveal";
import { Steps } from "@/components/Steps";

const SECCIONES = [
  { href: "#demo", label: "Ejemplo" },
  { href: "#agentes", label: "Agentes" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#seguridad", label: "Seguridad" },
];

const AGENTES = [
  {
    figura: "mail" as const,
    nombre: "Correo",
    disponible: true,
    titulo: "Tu bandeja, en una línea.",
    texto:
      "Lee tus correos sin leer y te dice de qué trata cada uno y qué conviene hacer: agendar, cotizar, reprogramar o archivar. Nunca envía ni borra nada.",
  },
  {
    figura: "chat" as const,
    nombre: "WhatsApp",
    disponible: false,
    titulo: "Respuestas a cualquier hora.",
    texto:
      "Contesta horarios, precios y dudas frecuentes en segundos, y te pasa solo las conversaciones que de verdad necesitan a una persona.",
  },
  {
    figura: "chart" as const,
    nombre: "Excel",
    disponible: false,
    titulo: "Tus números, explicados.",
    texto:
      "Sube tu Excel de citas o ventas y pregúntale lo que quieras: qué tratamiento deja más, qué días faltan pacientes, a quién volver a llamar.",
  },
  {
    figura: "search" as const,
    nombre: "Investigación",
    disponible: false,
    titulo: "Investiga mientras atiendes.",
    texto:
      "Compara proveedores, revisa precios de la competencia o resume un tema en minutos, con las fuentes para que tú verifiques.",
  },
];

const REEL = AGENTES.map((a, i) => ({
  n: String(i + 1).padStart(2, "0"),
  nombre: `Agente de ${a.nombre}`,
  estado: a.disponible ? "Disponible" : "Próximamente",
  vivo: a.disponible,
}));

const PROBLEMAS = [
  "Correos que se quedan sin contestar.",
  "Las mismas preguntas, todos los días.",
  "Una recepción apagando fuegos.",
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

const GARANTIAS = [
  ["Aislado", "Cada negocio solo ve lo suyo. Lo garantiza la base de datos."],
  ["Solo lectura", "Atendel lee tu correo, pero nunca envía ni borra nada."],
  ["Cifrado", "Toda la conexión viaja cifrada, siempre."],
];

function Cinta() {
  // Se repite dos veces para que el desplazamiento sea continuo
  const items = [...REEL, ...REEL, ...REEL, ...REEL];
  return (
    <div className="relative z-10 border-t hairline">
      <div className="overflow-hidden py-5" aria-label="Agentes de Atendel">
        <ul className="reel">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-4 pr-14" aria-hidden={i >= REEL.length}>
              <span className="font-cond text-[1.75rem] leading-[0.86] text-ash">{it.n}</span>
              <span>
                <span className="block text-[0.875rem] font-medium uppercase leading-none tracking-[0.04em]">
                  {it.nombre}
                </span>
                <span className="mt-1.5 flex items-center gap-1.5 text-[0.75rem] uppercase leading-[0.88] tracking-[0.06em] text-ash">
                  {it.vivo ? <span className="h-1.5 w-1.5 rounded-full bg-signal" /> : null}
                  {it.estado}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Inicio() {
  return (
    <>
      <Nav
        items={SECCIONES}
        mobileBottom={
          <div className="flex flex-col items-start gap-4">
            <PillLink href="/entrar">Probar Atendel</PillLink>
            <p className="firma">[ entras con tu correo, sin contraseña ]</p>
          </div>
        }
      />

      <main>
        {/* ---------- Portada: título de cine ---------- */}
        <section data-capitulo="Atendel" className="relative flex min-h-[100svh] flex-col overflow-hidden pt-[72px]">
          <WordmarkHero texto="atendel">
            <div className="relative z-10 mt-6 flex flex-col items-center px-6 text-center lg:mt-4">
              <p className="tras-titulo max-w-[560px] text-body text-silver">
                Agentes de inteligencia artificial para clínicas, consultorios y estéticas. Leen tus correos,
                entienden qué necesita cada persona y te dicen qué hacer.
              </p>
              <p className="tras-titulo firma mt-4" style={{ "--d": "150ms" } as React.CSSProperties}>
                [ ningún cliente sin respuesta ]
              </p>
              <div
                className="tras-titulo mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
                style={{ "--d": "300ms" } as React.CSSProperties}
              >
                <PillLink href="/entrar">Probar Atendel</PillLink>
                <a href="#demo" className="btn-ghost">
                  <Roll>Ver ejemplo</Roll>
                </a>
              </div>
            </div>
          </WordmarkHero>
          <Cinta />
        </section>

        {/* ---------- El problema ---------- */}
        <section data-capitulo="El problema" className="mx-auto max-w-page px-6 pt-[96px] lg:px-10 lg:pt-[160px]">
          <Reveal as="p" className="eyebrow">
            ¿Te suena?
          </Reveal>
          <ol className="mt-10 border-b hairline">
            {PROBLEMAS.map((p, i) => (
              <li key={p} className="flex items-baseline gap-5 border-t hairline py-6 lg:gap-10 lg:py-9">
                <span className="font-cond text-lg tracking-[0.03em] text-ash">{String(i + 1).padStart(2, "0")}</span>
                <SplitText as="p" delay={i * 90} className="editorial text-heading-lg" text={p} />
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <Reveal as="p" className="max-w-[520px] text-heading-2xs text-bone">
              Atendel se encarga de lo repetitivo para que tu equipo atienda a las personas.
            </Reveal>
            <Reveal as="p" delay={150} className="firma">
              [ y tú duermes tranquilo ]
            </Reveal>
          </div>
        </section>

        {/* ---------- Demo de ejemplo ---------- */}
        <section
          id="demo"
          data-capitulo="Ejemplo"
          className="mx-auto max-w-page px-6 pt-[96px] lg:px-10 lg:pt-[160px]"
        >
          <Reveal as="p" className="eyebrow">
            Míralo en acción
          </Reveal>
          <SplitText as="h2" className="editorial mt-6 max-w-[1100px] text-display" text="Un correo entra. Tú sabes qué hacer." />
          <Reveal delay={150} className="mt-12 lg:mt-16">
            <Demo />
          </Reveal>
        </section>

        {/* ---------- Agentes ---------- */}
        <section
          id="agentes"
          data-capitulo="Agentes"
          className="mx-auto max-w-page px-6 pt-[96px] lg:px-10 lg:pt-[160px]"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Reveal as="p" className="eyebrow">
                Tus agentes
              </Reveal>
              <SplitText as="h2" className="editorial mt-6 text-display" text="Un equipo que no se va a casa." />
            </div>
            <Reveal as="p" delay={150} className="firma lg:pb-4">
              [ empiezas con uno, sumas los demás ]
            </Reveal>
          </div>
          <div className="mt-12 lg:mt-16">
            <Agentes agentes={AGENTES} />
          </div>
        </section>

        {/* ---------- Cómo funciona ---------- */}
        <section
          id="como-funciona"
          data-capitulo="Cómo funciona"
          className="mx-auto grid max-w-page grid-cols-1 gap-12 px-6 pt-[96px] lg:grid-cols-2 lg:gap-20 lg:px-10 lg:pt-[160px]"
        >
          <div className="self-start lg:sticky lg:top-[150px]">
            <Reveal as="p" className="eyebrow">
              Cómo funciona
            </Reveal>
            <SplitText as="h2" className="editorial mt-6 text-heading-lg" text="Tres pasos. Nada más." />
          </div>
          <Steps pasos={PASOS} />
        </section>

        {/* ---------- Seguridad ---------- */}
        <section
          id="seguridad"
          data-capitulo="Seguridad"
          className="mx-auto grid max-w-page grid-cols-1 items-center gap-10 px-6 pt-[96px] lg:grid-cols-2 lg:gap-20 lg:px-10 lg:pt-[160px]"
        >
          <div className="relative mx-auto aspect-square w-full max-w-[300px] lg:order-2 lg:max-w-[480px]">
            <ParticleShape
              shape="lock"
              colors={["#ffffff", "#ffffff", "#ffffff", "#d9d9d9", "#ffffff", "#ffffff", "#ffffff", "#ff2936"]}
              className="absolute inset-0 h-full w-full"
            />
          </div>
          <div className="lg:order-1">
            <Reveal as="p" className="eyebrow">
              Seguridad
            </Reveal>
            <SplitText as="h2" className="editorial mt-6 text-display" text="Tus datos, bajo llave." />
            <ul className="mt-10 border-b hairline">
              {GARANTIAS.map(([titulo, texto], i) => (
                <Reveal
                  as="li"
                  key={titulo}
                  delay={i * 90}
                  className="grid grid-cols-[110px_1fr] gap-4 border-t hairline py-5 lg:grid-cols-[150px_1fr]"
                >
                  <span className="font-cond text-[1.375rem] leading-[0.95] tracking-[0.02em]">{titulo}</span>
                  <span className="text-body text-silver">{texto}</span>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Cierre ---------- */}
        <section
          id="empezar"
          data-capitulo="Empieza"
          className="mx-auto flex max-w-page flex-col items-center px-6 pt-[120px] text-center lg:px-10 lg:pt-[200px]"
        >
          <Reveal as="p" className="eyebrow">
            Empieza hoy
          </Reveal>
          <SplitText as="h2" className="editorial mt-6 text-display" text="Atiende mejor desde hoy." />
          <Reveal as="p" delay={180} className="firma mt-6">
            [ en menos de un minuto, con tu correo ]
          </Reveal>
          <Reveal delay={300} className="mt-10">
            <PillLink href="/entrar">Probar Atendel</PillLink>
          </Reveal>
        </section>
      </main>

      <Footer />
      <MobileCta />
    </>
  );
}
