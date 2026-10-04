import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sitio } from "@/components/Sitio";
import { PortadaA, PortadaB, PortadaC } from "@/components/portadas/Portadas";

export const metadata: Metadata = { title: "Opciones de portada", robots: { index: false } };

const OPCIONES = {
  a: { nombre: "Constelación", Portada: PortadaA },
  b: { nombre: "En vivo", Portada: PortadaB },
  c: { nombre: "El equipo", Portada: PortadaC },
} as const;
type Letra = keyof typeof OPCIONES;

export function generateStaticParams() {
  return Object.keys(OPCIONES).map((letra) => ({ letra }));
}

/** Una opción de portada a pantalla completa, con una barra abajo para cambiar entre las tres. */
export default function Opcion({ params }: { params: { letra: string } }) {
  if (!(params.letra in OPCIONES)) notFound();
  const actual = params.letra as Letra;
  const { Portada } = OPCIONES[actual];
  return (
    <Sitio>
      <Portada />
      <nav
        aria-label="Opciones de portada"
        className="fixed inset-x-0 bottom-[max(var(--spacing-18),env(safe-area-inset-bottom))] z-40 flex justify-center px-[var(--spacing-12)]"
      >
        <div className="flex items-center gap-1 rounded-full bg-[var(--color-bone-white)] p-1 text-[var(--color-void)] shadow-[0_0_0_1px_rgb(0_0_0/0.1)]">
          {(Object.keys(OPCIONES) as Letra[]).map((l) => (
            <Link
              key={l}
              href={`/opciones/${l}`}
              aria-current={l === actual ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.025em] sm:px-4 sm:text-[13px] ${
                l === actual ? "bg-[var(--color-void)] text-[var(--color-bone-white)]" : ""
              }`}
            >
              <span className="hidden sm:inline">{l.toUpperCase()} · </span>
              {OPCIONES[l].nombre}
            </Link>
          ))}
        </div>
      </nav>
    </Sitio>
  );
}
