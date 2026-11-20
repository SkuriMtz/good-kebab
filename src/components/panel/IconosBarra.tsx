/**
 * Los íconos de la barra de abajo del celular (Armazon.tsx): trazo como
 * dibujado a mano (líneas un poco irregulares, puntas redondas). Dibujos
 * propios de Atendel. La pestaña elegida lleva el trazo un poco más grueso.
 */
export type IconoBarraNombre = "inicio" | "chat" | "dia" | "negocio" | "ajustes";

const TRAZOS: Record<IconoBarraNombre, React.ReactNode> = {
  // Una casita
  inicio: (
    <>
      <path d="M4.1 10.7c2.6-2.2 5.3-4.4 8-6.6 2.6 2.1 5.2 4.2 7.8 6.4" />
      <path d="M6 9.4c-.1 3.4 0 6.8.2 10.2 3.9.2 7.8.1 11.7-.1.2-3.4.1-6.8 0-10.2" />
      <path d="M10.2 19.5c-.1-1.6 0-3.3.1-4.9 1.2-.2 2.4-.1 3.5.1.1 1.6.1 3.2 0 4.8" />
    </>
  ),
  // Un globo de plática
  chat: (
    <>
      <path d="M5.1 15.8c-1.5-1.9-1.6-4.9-.5-7 1.5-2.9 4.8-4.2 8-4 4 .3 7.3 3 7.4 6.8.1 4-3.6 7-7.7 6.9-1.3 0-2.5-.3-3.6-.8-1.1.9-2.6 1.7-4.3 1.9.7-1.1 1-2.4.7-3.8Z" />
      <path d="M9 11.8h.1M12.2 11.7h.1M15.4 11.8h.1" strokeWidth="2.4" />
    </>
  ),
  // Un sol (tu día)
  dia: (
    <>
      <path d="M12 8.1c2.3-.1 4 1.7 3.9 4-.1 2.2-1.8 3.8-4 3.8-2.2-.1-3.9-1.8-3.8-4 .1-2.1 1.7-3.7 3.9-3.8Z" />
      <path d="M12 3.2l.1 1.9M11.9 18.9l.1 1.9M3.3 12l1.9-.1M18.8 12.1l1.9-.1M5.9 5.8l1.3 1.4M16.9 16.8l1.3 1.3M18.1 5.9l-1.3 1.2M7.1 16.9l-1.3 1.3" />
    </>
  ),
  // Una tiendita con su toldo (tu negocio)
  negocio: (
    <>
      <path d="M4.3 9.2l1.3-4.6c4.3-.2 8.6-.2 12.9 0l1.3 4.5" />
      <path d="M4.3 9.2c.3 1.4 3.1 1.5 3.5.1.4 1.4 3.3 1.5 3.8 0 .5 1.4 3.4 1.5 4 0 .5 1.4 3.8 1.3 4.2-.2" />
      <path d="M5.6 10.9c-.1 3 0 6 .1 8.7 4.2.2 8.5.2 12.7 0 .1-2.8.1-5.8 0-8.7" />
      <path d="M10 19.6l.1-4.6c1.3-.2 2.6-.1 3.8.1v4.5" />
    </>
  ),
  // Tres perillas (ajustes)
  ajustes: (
    <>
      <path d="M4 7.1c3-.1 6.1-.1 9.1 0M16.9 7.1c1 0 2.1 0 3.1.1" />
      <path d="M15 5.2c1.1 0 1.9.8 1.9 1.9 0 1.1-.9 1.9-1.9 1.9-1.1 0-1.9-.9-1.9-1.9 0-1.1.8-1.9 1.9-1.9Z" />
      <path d="M4 12.1c.9-.1 2.1 0 3.1 0M10.9 12c3-.1 6.1 0 9.1.1" />
      <path d="M9 10.1c1.1 0 1.9.8 1.9 1.9 0 1.1-.9 1.9-1.9 1.9-1.1 0-1.9-.9-1.9-1.9 0-1.1.8-1.9 1.9-1.9Z" />
      <path d="M4 17c2.7-.1 5.5 0 8.1 0M15.9 17.1c1.4-.1 2.8 0 4.1 0" />
      <path d="M14 15.1c1.1 0 1.9.8 1.9 1.9 0 1.1-.9 1.9-1.9 1.9-1.1 0-1.9-.9-1.9-1.9 0-1.1.8-1.9 1.9-1.9Z" />
    </>
  ),
};

export function IconoBarra({ nombre }: { nombre: IconoBarraNombre }) {
  return (
    <svg className="pc-abajo__svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {TRAZOS[nombre]}
    </svg>
  );
}
