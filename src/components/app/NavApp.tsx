"use client";

import { useRouter } from "next/navigation";
import { claseBoton } from "../Buttons";
import { Nav } from "../Nav";
import { AGENTES_INFO } from "@/lib/agentes";
import { createClient } from "@/lib/supabase/client";

/** Secciones de la app (después de entrar). */
export const NAV_APP = [
  { href: "/panel/chat", label: "Hablar con mi equipo" },
  { href: "/panel/agentes", label: "Mis agentes" },
  { href: "/panel", label: "Correo con Clara" },
];

const REPARTO = AGENTES_INFO.map((a) => ({
  id: a.id,
  nombre: a.nombre,
  papel: `${a.area} · ${a.abarca}`,
  href: `/panel/chat?agente=${a.id}`,
}));

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
          <span className="max-w-[200px] truncate text-[0.8125rem] text-tenue" title={email}>
            {email}
          </span>
          <button type="button" className={claseBoton("texto")} onClick={salir}>
            Salir
          </button>
        </>
      }
      mobileBottom={
        <>
          <p className="truncate text-[0.875rem] text-tenue">{email}</p>
          <button type="button" className={`${claseBoton("texto", "grande")} w-full !justify-start !px-0`} onClick={salir}>
            Cerrar sesión
          </button>
        </>
      }
    />
  );
}
