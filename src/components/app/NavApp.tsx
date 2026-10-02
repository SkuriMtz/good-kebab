"use client";

import { useRouter } from "next/navigation";
import { Roll } from "../Buttons";
import { Nav } from "../Nav";
import { AGENTES_INFO } from "@/lib/agentes";
import { createClient } from "@/lib/supabase/client";

/** Secciones de la app (después de entrar). */
export const NAV_APP = [
  { href: "/panel/chat", label: "Hablar con mi equipo" },
  { href: "/panel/agentes", label: "Mis agentes" },
  { href: "/panel", label: "Correo con Clara" },
];

const REPARTO = AGENTES_INFO.map((a) => ({ nombre: a.nombre, papel: a.area, href: `/panel/chat?agente=${a.id}` }));

/** Barra de la app: tu correo y "Salir" a la derecha; lo mismo dentro del menú en celular. */
export function NavApp({ email }: { email: string }) {
  const router = useRouter();

  async function salir() {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <Nav
      items={NAV_APP}
      homeHref="/panel/chat"
      reparto={REPARTO}
      desktopRight={
        <>
          <span className="max-w-[220px] truncate text-caption text-ash" title={email}>
            {email}
          </span>
          <button type="button" className="btn-ghost" onClick={salir}>
            <Roll>Salir</Roll>
          </button>
        </>
      }
      mobileBottom={
        <div className="flex flex-col items-start gap-2">
          <p className="max-w-full truncate text-caption text-ash">{email}</p>
          <button type="button" className="btn-ghost" onClick={salir}>
            <Roll>Cerrar sesión</Roll>
          </button>
        </div>
      }
    />
  );
}
