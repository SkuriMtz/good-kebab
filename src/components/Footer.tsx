import Link from "next/link";

const PRODUCTO = [
  { href: "/#que-es", label: "Qué es" },
  { href: "/#agentes", label: "Agentes" },
  { href: "/#planes", label: "Planes" },
  { href: "/#preguntas", label: "Preguntas" },
];
const CUENTA = [
  { href: "/entrar", label: "Entrar" },
  { href: "/panel/chat", label: "Mi panel" },
];

/** Pie como créditos finales: línea fina, columnas y el nombre gigante al final. */
export function Footer() {
  return (
    <footer className="mt-[160px] overflow-hidden lg:mt-[260px]">
      <div className="mx-auto max-w-page px-6 sm:px-10 lg:px-16">
        <div className="border-t hairline pt-14">
          <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr]">
            <p className="max-w-[340px] text-body text-silver">
              Agentes de inteligencia artificial para negocios que atienden personas: clínicas, consultorios y
              estéticas.
            </p>
            {[
              { titulo: "Producto", links: PRODUCTO },
              { titulo: "Cuenta", links: CUENTA },
            ].map((grupo) => (
              <nav key={grupo.titulo} aria-label={grupo.titulo}>
                <p className="eyebrow-plain">{grupo.titulo}</p>
                <ul className="mt-2">
                  {grupo.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="btn-ghost">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
          <div className="mt-16 flex items-center justify-between font-cond text-base tracking-[0.03em] text-ash">
            <span>© {new Date().getFullYear()} Atendel</span>
            <span>Agentes de IA</span>
          </div>
        </div>
      </div>
      <p
        className="editorial pointer-events-none mt-10 select-none text-center text-[27vw] leading-[0.78] tracking-[-0.03em] text-bone"
        aria-hidden="true"
      >
        atendel
      </p>
    </footer>
  );
}
