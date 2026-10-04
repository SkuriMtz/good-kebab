"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  BubbleChatIcon,
  HelpCircleIcon,
  Home01Icon,
  InformationCircleIcon,
  Login03Icon,
  Moon02Icon,
  Sun03Icon,
  Tag01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import Dock, { type DockItemData } from "./Dock";
import { EVENTO_TEMA, ponerTema, temaActual, temaGuardado, type Tema } from "@/lib/tema";

type Destino = { id: string; label: string; icon: IconSvgElement; enCelular: boolean };

/** Secciones de la página de inicio (el id de cada <section>). */
const DESTINOS: Destino[] = [
  { id: "inicio", label: "Inicio", icon: Home01Icon, enCelular: true },
  { id: "que-es", label: "Qué es", icon: InformationCircleIcon, enCelular: false },
  { id: "agentes", label: "Agentes", icon: UserGroupIcon, enCelular: true },
  { id: "chat", label: "Háblales", icon: BubbleChatIcon, enCelular: false },
  { id: "planes", label: "Planes", icon: Tag01Icon, enCelular: true },
  { id: "preguntas", label: "Preguntas", icon: HelpCircleIcon, enCelular: true },
];

const icono = (icon: IconSvgElement, tam: number) => <HugeiconsIcon icon={icon} size={tam} strokeWidth={1.6} />;

/**
 * La navegación del sitio: un dock fijo abajo al centro, a la vista en
 * cualquier pantalla. Lleva a cada sección, cambia el modo claro/oscuro y
 * lleva a "Entrar". Marca con un punto rojo la sección en la que estás.
 */
export function NavDock() {
  const router = useRouter();
  const pathname = usePathname();
  const enInicio = pathname === "/";
  const [seccion, setSeccion] = useState(enInicio ? "inicio" : "");
  const [celular, setCelular] = useState(false);
  const [tema, setTema] = useState<Tema>("oscuro");

  // Tamaño de pantalla
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const leer = () => setCelular(mq.matches);
    leer();
    mq.addEventListener("change", leer);
    return () => mq.removeEventListener("change", leer);
  }, []);

  // Modo claro/oscuro: el actual, y seguir al sistema si la persona no eligió uno
  useEffect(() => {
    setTema(temaActual());
    const alCambiar = (e: Event) => setTema((e as CustomEvent<Tema>).detail);
    const sistema = window.matchMedia("(prefers-color-scheme: light)");
    const alCambiarSistema = () => {
      if (!temaGuardado()) ponerTema(sistema.matches ? "claro" : "oscuro", false);
    };
    window.addEventListener(EVENTO_TEMA, alCambiar);
    sistema.addEventListener("change", alCambiarSistema);
    return () => {
      window.removeEventListener(EVENTO_TEMA, alCambiar);
      sistema.removeEventListener("change", alCambiarSistema);
    };
  }, []);

  // Qué sección está en pantalla
  useEffect(() => {
    if (!enInicio) return;
    const secciones = Array.from(document.querySelectorAll<HTMLElement>("[data-capitulo]"));
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) setSeccion((e.target as HTMLElement).id || "inicio");
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    secciones.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [enInicio]);

  const ir = (id: string) => {
    if (!enInicio) {
      router.push(id === "inicio" ? "/" : `/#${id}`);
      return;
    }
    const suave: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (id === "inicio") {
      window.scrollTo({ top: 0, behavior: suave });
      window.history.replaceState(null, "", "/");
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: suave, block: "start" });
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  const tam = celular ? 18 : 20;
  const items: DockItemData[] = [
    ...DESTINOS.filter((d) => !celular || d.enCelular).map((d) => ({
      label: d.label,
      icon: icono(d.icon, tam),
      onClick: () => ir(d.id),
      activo: seccion === d.id,
    })),
    {
      label: tema === "oscuro" ? "Modo claro" : "Modo oscuro",
      icon: icono(tema === "oscuro" ? Sun03Icon : Moon02Icon, tam),
      onClick: () => ponerTema(tema === "oscuro" ? "claro" : "oscuro"),
    },
    { label: "Entrar", icon: icono(Login03Icon, tam), onClick: () => router.push("/entrar"), activo: pathname === "/entrar" },
  ];

  return (
    <div className="nav-dock">
      <Dock
        items={items}
        ariaLabel="Navegación del sitio"
        fragmentos
        panelHeight={celular ? 58 : 64}
        baseItemSize={celular ? 42 : 46}
        magnification={celular ? 42 : 66}
        distance={140}
        dockHeight={celular ? 58 : 120}
      />
    </div>
  );
}
