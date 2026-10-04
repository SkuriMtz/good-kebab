"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Briefcase01Icon,
  BubbleChatIcon,
  HelpCircleIcon,
  Home01Icon,
  Mail01Icon,
  Store01Icon,
  Tag01Icon,
  UserGroupIcon,
  UserMultipleIcon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";
import BranchedMenu, { type BranchedMenuItem } from "./BranchedMenu";
import { BotonTema } from "./BotonTema";
import { PillLink } from "./Buttons";
import { Logo } from "./Logo";
import { AGENTES_INFO, esIdAgente, type IdAgente } from "@/lib/agentes";
import { EVENTO_ELEGIR_AGENTE } from "@/lib/eventos";

const ICONO_AGENTE: Record<IdAgente, typeof WhatsappIcon> = {
  lola: WhatsappIcon,
  clara: Mail01Icon,
  victor: UserGroupIcon,
  iris: Briefcase01Icon,
};

/** Cada página del sitio: su valor en el menú y su dirección. */
const PAGINAS: { value: string; label: string; href: string; icon: typeof WhatsappIcon }[] = [
  { value: "inicio", label: "Inicio", href: "/", icon: Home01Icon },
  { value: "pruebalo", label: "Pruébalo · el chat", href: "/pruebalo", icon: BubbleChatIcon },
  { value: "agentes", label: "Agentes", href: "/agentes", icon: UserMultipleIcon },
  { value: "precios", label: "Precios", href: "/precios", icon: Tag01Icon },
  { value: "para-quien-es", label: "Para quién es", href: "/para-quien-es", icon: Store01Icon },
  { value: "preguntas", label: "Preguntas", href: "/preguntas", icon: HelpCircleIcon },
];

const ITEMS: BranchedMenuItem[] = [
  {
    label: "Atendel",
    children: PAGINAS.map(({ value, label, icon }) => ({ value, label, icon })),
  },
  {
    label: "El equipo",
    // Cada agente abre su ficha
    children: AGENTES_INFO.map((a) => ({ value: a.id, label: `${a.nombre} · ${a.area}`, icon: ICONO_AGENTE[a.id] })),
  },
  { label: "Entrar", value: "entrar" },
];

/**
 * Menú lateral (solo computadora y tablet grande): una pestaña en el borde
 * izquierdo avisa que está ahí. Al acercar el cursor al borde, o al tocar la
 * pestaña, se desliza el menú. Marca la página en la que estás.
 */
export function MenuLateral() {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLElement>(null);
  const pestanaRef = useRef<HTMLButtonElement>(null);
  const cierre = useRef(0);
  const router = useRouter();

  const abrir = () => {
    window.clearTimeout(cierre.current);
    setAbierto(true);
  };
  const cerrarPronto = () => {
    window.clearTimeout(cierre.current);
    cierre.current = window.setTimeout(() => setAbierto(false), 280);
  };

  // Abierto: Escape o tocar fuera lo cierra
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAbierto(false);
      pestanaRef.current?.focus();
    };
    const alTocar = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !pestanaRef.current?.contains(t)) setAbierto(false);
    };
    window.addEventListener("keydown", alTeclear);
    document.addEventListener("pointerdown", alTocar);
    return () => {
      window.removeEventListener("keydown", alTeclear);
      document.removeEventListener("pointerdown", alTocar);
    };
  }, [abierto]);

  useEffect(() => () => window.clearTimeout(cierre.current), []);

  // Cerrado, no se puede enfocar ni leer
  useEffect(() => {
    panelRef.current?.toggleAttribute("inert", !abierto);
  }, [abierto]);

  const activo = PAGINAS.find((p) => p.href === pathname)?.value ?? "";

  const ir = (value: string) => {
    if (value === "entrar") {
      router.push("/entrar");
      return;
    }
    if (esIdAgente(value)) {
      // Cada página puede abrir la ficha; si no, se abre en la de agentes
      if (document.documentElement.hasAttribute("data-fichas")) {
        window.dispatchEvent(new CustomEvent(EVENTO_ELEGIR_AGENTE, { detail: value }));
      } else {
        router.push(`/agentes?ficha=${value}`);
      }
    } else {
      const pagina = PAGINAS.find((p) => p.value === value);
      if (pagina && pagina.href !== pathname) router.push(pagina.href);
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setAbierto(false);
  };

  return (
    <div className="hidden lg:block">
      {/* El borde que despierta el menú, y la pestaña que avisa que ahí está */}
      <div className="menu-lateral__borde" aria-hidden="true" onMouseEnter={abrir} onMouseLeave={cerrarPronto} />
      <button
        ref={pestanaRef}
        type="button"
        className="menu-lateral__pestana"
        data-oculta={abierto ? "" : undefined}
        aria-expanded={abierto}
        aria-controls="menu-lateral"
        onMouseEnter={abrir}
        onMouseLeave={cerrarPronto}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
      >
        <span className="menu-lateral__texto">Menú</span>
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M4.5 2.5 8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>

      <aside
        id="menu-lateral"
        ref={panelRef}
        className="menu-lateral__panel"
        data-open={abierto ? "" : undefined}
        aria-label="Menú"
        aria-hidden={!abierto}
        onMouseEnter={abrir}
        onMouseLeave={cerrarPronto}
        onFocus={abrir}
      >
        <div className="flex items-center justify-between gap-4">
          <a href="#" onClick={(e) => (e.preventDefault(), ir("inicio"))} className="block w-fit" aria-label="Atendel, ir al inicio">
            <Logo />
          </a>
          <BotonTema />
        </div>
        <div className="mt-10 border-t hairline pt-6">
          <BranchedMenu
            items={ITEMS}
            defaultOpen={[0, 1]}
            active={activo}
            onSelect={(value) => ir(value)}
            color="var(--color-bone-white)"
            accentColor="var(--color-acento)"
            lineColor="color-mix(in srgb, var(--color-bone-white) 18%, var(--color-void))"
            width={232}
            rowHeight={36}
            fontSize={14}
          />
        </div>
        <div className="mt-auto border-t hairline pt-6">
          <PillLink href="/entrar">Empezar gratis</PillLink>
          <p className="mt-3 text-[0.8125rem] text-ash">Entras con tu correo, sin contraseña.</p>
        </div>
      </aside>
    </div>
  );
}
