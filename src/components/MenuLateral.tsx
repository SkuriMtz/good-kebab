"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Briefcase01Icon,
  BubbleChatIcon,
  HelpCircleIcon,
  Home01Icon,
  InformationCircleIcon,
  Mail01Icon,
  SquareLock02Icon,
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

const ITEMS: BranchedMenuItem[] = [
  {
    label: "Atendel",
    children: [
      { value: "inicio", label: "Inicio", icon: Home01Icon },
      { value: "que-es", label: "Qué es", icon: InformationCircleIcon },
      { value: "agentes", label: "Agentes", icon: UserMultipleIcon },
      { value: "chat", label: "Háblales", icon: BubbleChatIcon },
      { value: "planes", label: "Planes", icon: Tag01Icon },
      { value: "seguridad", label: "Tus datos", icon: SquareLock02Icon },
      { value: "preguntas", label: "Preguntas", icon: HelpCircleIcon },
    ],
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
 * pestaña, se desliza el menú. Marca la sección que estás viendo.
 */
export function MenuLateral() {
  const [abierto, setAbierto] = useState(false);
  const [seccion, setSeccion] = useState("inicio");
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

  // Qué sección está en pantalla
  useEffect(() => {
    const secciones = Array.from(document.querySelectorAll<HTMLElement>("[data-capitulo]"));
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          const id = (e.target as HTMLElement).id || "inicio";
          if (id !== "empezar") setSeccion(id);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    secciones.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

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

  const activo = seccion;

  const ir = (value: string) => {
    if (value === "entrar") {
      router.push("/entrar");
      return;
    }
    const suave = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (esIdAgente(value)) {
      window.dispatchEvent(new CustomEvent(EVENTO_ELEGIR_AGENTE, { detail: value }));
    } else if (value === "inicio") {
      window.scrollTo({ top: 0, behavior: suave });
    } else {
      document.getElementById(value)?.scrollIntoView({ behavior: suave, block: "start" });
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
            accentColor="var(--color-signal)"
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
