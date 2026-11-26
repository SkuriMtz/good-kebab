/**
 * DIBUJOS A MANO (mezcla con el estilo de Zapia, /vista-zapia): íconos de
 * línea negra gruesa, un poco irregulares, con alguna parte rellena, para
 * las tarjetas de colores. Y el personaje de Atendel: un cuadrito con ojos de
 * punto y los cuatro puntos de la marca, echado de panza arriba, que se
 * asoma en la orilla de una sección (parpadea solo). Dibujos propios.
 */

export type NombreDibujo =
  | "calendario"
  | "campana"
  | "globo"
  | "reloj"
  | "sobre"
  | "avion"
  | "recibo"
  | "pila"
  | "estrella"
  | "puntos"
  | "iman"
  | "regalo"
  | "grafica"
  | "lupa"
  | "pizarron"
  | "lista";

const TRAZOS: Record<NombreDibujo, React.ReactNode> = {
  calendario: (
    <>
      <path d="M8.6 12.4c10.4-.6 20.6-.5 30.9.2.6 8.7.5 17.6-.3 26.3-10.2.7-20.4.6-30.6-.1-.6-8.8-.6-17.6 0-26.4Z" />
      <path d="M8.8 19.6c10.2-.4 20.4-.3 30.6.2" />
      <path d="M16.2 8.2l.2 7.4M31.7 8.1l-.1 7.5" strokeWidth="3.2" />
      <path d="M18.3 29.2l4.1 4.3 8.2-8.9" strokeWidth="3" />
    </>
  ),
  campana: (
    <>
      <path d="M13.2 33.6c2.2-3.4 2.1-8.2 2.3-12.1.3-5.6 3.7-9.6 8.6-9.7 5.1-.1 8.5 3.9 8.8 9.4.2 4 .1 8.9 2.5 12.3-7.5.8-14.9.8-22.2.1Z" />
      <path d="M24.1 8.2v3.4" />
      <path d="M20.4 36.8c.5 2.8 2.1 4.3 3.9 4.2 1.8 0 3.3-1.5 3.8-4.3" fill="currentColor" />
      <path d="M38.6 14.6c2 2.1 3 4.6 3 7.4M9.6 14.4c-2.1 2.2-3 4.7-3 7.6" />
    </>
  ),
  globo: (
    <>
      <path d="M9.2 13.1c9.9-1.2 19.9-1.1 29.8.2.9 5.6.8 11.1-.2 16.6-5.1.6-10.3.8-15.5.6l-7.4 6.3.6-6.6c-2.4-.1-4.8-.2-7.1-.5-.9-5.5-1-11.1-.2-16.6Z" />
      <circle cx="17.2" cy="21.6" r="2" fill="currentColor" stroke="none" />
      <circle cx="24.2" cy="21.7" r="2" fill="currentColor" stroke="none" />
      <circle cx="31.2" cy="21.5" r="2" fill="currentColor" stroke="none" />
    </>
  ),
  reloj: (
    <>
      <path d="M24.3 12.6c7.6-.2 13 5.4 12.9 12.6-.1 7.1-5.6 12.6-12.8 12.6-7.2-.1-12.6-5.6-12.6-12.7.1-7.1 5.3-12.4 12.5-12.5Z" />
      <path d="M24.2 18.4l.1 7.2 4.7 3" strokeWidth="2.8" />
      <path d="M10.2 13.4c1.4-3 3.6-4.7 6.6-5.1-1.9 2.4-4.1 4.1-6.6 5.1ZM38.3 13.2c-1.4-2.9-3.6-4.6-6.5-5 1.9 2.3 4 4 6.5 5Z" fill="currentColor" />
      <path d="M16.1 37.2l-2.6 3.6M32.4 37.1l2.7 3.7" />
    </>
  ),
  sobre: (
    <>
      <path d="M7.9 14.2c10.8-.7 21.6-.6 32.4.1.6 6.6.5 13.4-.1 20-10.8.7-21.6.6-32.3-.1-.6-6.7-.6-13.3 0-20Z" />
      <path d="M8.4 15.2c5.1 4.3 10.2 8.3 15.6 11.8 5.4-3.4 10.7-7.6 15.7-12" />
      <path d="M8.6 33.4l11.1-9.6M39.4 33.5l-11.2-9.8" />
    </>
  ),
  avion: (
    <>
      <path d="M7.4 23.4c10.9-4.6 21.7-9.2 33.3-13.3-3.4 9.8-7 19.6-11.4 29.1-2.2-3.8-4.4-7.6-6.8-11.2-5-1.3-10-2.8-15.1-4.6Z" />
      <path d="M22.5 28c5.6-5.6 11.5-11.1 18.2-17.9" />
      <path d="M22.6 28.1l-.6 8.3 4.3-4.9" fill="currentColor" />
    </>
  ),
  recibo: (
    <>
      <path d="M12.3 7.9c8-.4 15.9-.3 23.9.1.6 10.6.5 21.3-.1 31.9l-3-2.1-3 2.2-2.9-2.1-3 2.2-3-2.1-3 2.1-2.9-2.1-3 2.1c-.6-10.7-.6-21.4 0-32.2Z" />
      <path d="M17.6 16.2c4.6-.2 9.1-.2 13.6.1M17.5 22.4c4.6-.2 9.1-.2 13.7.1" />
      <path d="M17.4 29c2.8-.2 5.6-.2 8.4 0" strokeWidth="3.4" />
    </>
  ),
  pila: (
    <>
      <path d="M11.4 17.8c8.7-.6 17.4-.5 26 .2.6 6.7.5 13.5-.1 20.2-8.7.6-17.3.5-26-.2-.5-6.7-.5-13.4.1-20.2Z" fill="currentColor" fillOpacity=".12" />
      <path d="M13.6 13.2c7.4-.4 14.8-.3 22.1.1M16.4 8.8c5.4-.3 10.8-.2 16.2.1" />
      <path d="M17.2 25c4.7-.2 9.4-.2 14.1.1M17 31.2c3.4-.2 6.8-.2 10.2 0" />
    </>
  ),
  estrella: (
    <>
      <path d="M24.2 7.6c1.9 4.2 3.7 8.4 5.5 12.6 4.4.4 8.9.8 13.3 1.4-3.3 3.1-6.7 6.1-10.2 9 1 4.4 2 8.9 2.8 13.4-3.9-2.4-7.7-4.7-11.6-7-3.9 2.3-7.8 4.6-11.8 6.8 1-4.4 2.1-8.8 3.2-13.2-3.3-3-6.6-6.1-9.8-9.3 4.5-.4 9-.8 13.4-1.1 1.7-4.2 3.4-8.4 5.2-12.6Z" />
      <path d="M24.2 18.5c.8 2 1.6 3.9 2.4 5.8 2.1.2 4.1.4 6.2.6-1.6 1.4-3.2 2.8-4.8 4.1.5 2 .9 4.1 1.3 6.2-1.8-1.1-3.6-2.2-5.4-3.2-1.8 1-3.6 2.1-5.4 3.1.5-2 .9-4.1 1.5-6.1-1.6-1.4-3.1-2.8-4.6-4.3 2.1-.2 4.2-.4 6.2-.5.6-2 1.4-3.9 2.6-5.7Z" fill="currentColor" stroke="none" />
    </>
  ),
  puntos: (
    <>
      <path d="M38.8 11.2c-9.6-1.3-19.3-1.2-29 .1-1 5.9-.9 11.8.2 17.6 2.6.3 5.2.5 7.8.6l-.9 7.4 7.9-7.2c4.6.1 9.2-.1 13.7-.6 1-5.9 1.1-11.9.3-17.9Z" fill="currentColor" />
      <circle cx="17" cy="20.4" r="2.2" fill="#fff" stroke="none" />
      <circle cx="24.2" cy="20.4" r="2.2" fill="#fff" stroke="none" />
      <circle cx="31.3" cy="20.3" r="2.2" fill="#fff" stroke="none" />
    </>
  ),
  iman: (
    <>
      <path d="M12.6 10.4c2.6-.1 5.2-.1 7.8 0 .2 5 .1 10.1.1 15.1 0 2.3 1.6 4 3.7 4 2.2 0 3.7-1.7 3.7-4 0-5 0-10.1.2-15.1 2.6-.1 5.2-.1 7.8.1.3 5.3.3 10.6.1 15.9-.3 6.7-5.3 11.7-11.8 11.6-6.5 0-11.4-5-11.6-11.6-.2-5.3-.2-10.7 0-16Z" />
      <path d="M12.6 10.4c2.6-.1 5.2-.1 7.8 0 .1 1.9.1 3.8.1 5.7-2.6.1-5.2.1-7.9 0-.1-1.9-.1-3.8 0-5.7ZM27.9 10.5c2.6-.1 5.2-.1 7.8.1.1 1.9.1 3.8 0 5.7-2.6.1-5.2.1-7.9 0 0-1.9 0-3.9.1-5.8Z" fill="currentColor" />
      <path d="M5.6 8.4l3.3 2.4M7.2 4.6l1.8 3.6M41.6 8.6l-3.2 2.3" />
    </>
  ),
  regalo: (
    <>
      <path d="M10.4 19.6c9.2-.5 18.4-.4 27.6.1.5 6.6.4 13.2-.2 19.8-9 .5-18 .4-27-.1-.6-6.6-.7-13.2-.4-19.8Z" />
      <path d="M8.4 14.2c10.5-.5 21-.4 31.4.2.3 1.9.3 3.8 0 5.7-10.5.4-21 .3-31.4-.2-.3-1.9-.3-3.8 0-5.7Z" fill="currentColor" />
      <path d="M24.1 14.4l.1 25" strokeWidth="3.2" />
      <path d="M24 14c-2.4-4.2-6.6-6.3-8.8-4.4-2 1.8.6 4.6 8.8 4.4ZM24.3 14c2.3-4.2 6.6-6.3 8.8-4.4 2 1.8-.6 4.6-8.8 4.4Z" />
    </>
  ),
  grafica: (
    <>
      <path d="M9.2 8.6c10-.5 20-.4 29.9.2.6 10.2.5 20.5-.2 30.7-9.9.6-19.8.5-29.7-.1-.6-10.3-.6-20.5 0-30.8Z" />
      <path d="M15.6 33.4V26M22.4 33.5V20.2M29.3 33.4V15.4" strokeWidth="4" />
      <path d="M14.8 19.2c3.6-2.1 7-4.6 10.4-7.4l3.4 2.6" />
    </>
  ),
  lupa: (
    <>
      <path d="M20.6 9.6c6.4-.2 11 4.6 10.9 10.6-.1 6-4.8 10.5-10.8 10.5-6.1-.1-10.6-4.7-10.6-10.6.1-6 4.5-10.4 10.5-10.5Z" />
      <path d="M28.7 28.4c3.4 3.3 6.8 6.7 10.1 10.1" strokeWidth="5" />
      <path d="M15.5 17.9c.9-2.7 3-4.2 5.6-4.4" />
    </>
  ),
  pizarron: (
    <>
      <path d="M7.6 9.8c11-.5 22-.4 33 .2.5 6.9.4 13.8-.2 20.7-10.9.6-21.8.5-32.7-.2-.5-6.9-.6-13.8-.1-20.7Z" />
      <path d="M13.8 24.8c3.1-2.8 5.6-5.8 8.4-8.6l4.2 4.3 7.2-7" strokeWidth="2.8" />
      <path d="M24.2 30.8l-6.4 9.4M24.3 30.8l6.5 9.3M24.2 30.8v6.4" />
    </>
  ),
  lista: (
    <>
      <path d="M10.6 8.2c9-.5 18-.4 27 .2.6 10.4.5 20.9-.2 31.3-8.9.6-17.8.5-26.7-.1-.6-10.5-.6-20.9-.1-31.4Z" />
      <path d="M15.6 16.4l2.2 2.4 4-4.3M15.6 25.6l2.2 2.3 4-4.2" strokeWidth="2.6" />
      <path d="M25.6 16.4c2.5-.1 5-.1 7.4 0M25.6 25.5c2.5-.1 5-.1 7.4 0" />
      <path d="M15.6 32.6c1.4-.1 2.9-.1 4.4 0M25.6 32.7c2.5-.1 5-.1 7.4 0" />
    </>
  ),
};

export function Dibujo({ nombre, className = "" }: { nombre: NombreDibujo; className?: string }) {
  return (
    <svg className={`zp-dibujo ${className}`} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {TRAZOS[nombre]}
    </svg>
  );
}

/**
 * El personaje de Atendel sentado en la orilla de una sección, con las
 * piernas colgando y saludando con una mano (la mano se mueve y los ojos
 * parpadean solos). La orilla queda a la altura de la panza (y = 104).
 */
export function PersonajeEchado({ className = "" }: { className?: string }) {
  return (
    <svg className={`zp-echado ${className}`} viewBox="0 0 170 160" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <g stroke="#0b0b0c" strokeWidth="4.4">
        {/* las piernas colgando (por encima de la orilla) */}
        <path d="M68 100c-1 12 0 24 2 36M98 100c2 12 4 22 8 32" />
        <path d="M60 138c4-3 11-4 16 0-4 4-11 5-16 0Z" fill="#0b0b0c" />
        <path d="M100 135c5-4 12-3 16 1-5 4-12 4-16-1Z" fill="#0b0b0c" />
        {/* el cuerpo: el cuadrito redondo de Atendel */}
        <path d="M42 26c22-6 56-6 78 0 8 2 12 8 12 18 1 18 1 36-1 52-1 8-6 12-14 13-22 3-48 3-70-1-8-1-12-6-13-14-1-16-1-32 0-48 0-12 2-18 8-20Z" fill="#fff" />
        {/* la mano que saluda */}
        <g className="zp-echado__mano">
          <path d="M131 52c8-8 14-18 16-30" />
          <path d="M141 14c4-2 9 0 10 4 1 5-2 9-7 9" fill="#fff" />
        </g>
        {/* la otra mano, apoyada */}
        <path d="M38 64c-8 8-12 18-12 30" />
        {/* la sonrisa */}
        <path d="M74 60c4 4 10 4 14 0" strokeWidth="3.4" />
      </g>
      {/* los ojos (parpadean) */}
      <g className="zp-echado__ojos" fill="#0b0b0c">
        <ellipse cx="70" cy="46" rx="4.4" ry="5.6" />
        <ellipse cx="94" cy="46" rx="4.4" ry="5.6" />
      </g>
      {/* los cuatro puntos de la marca */}
      <circle cx="75" cy="76" r="5" fill="#ff7a59" />
      <circle cx="88" cy="76" r="5" fill="#6ea8ff" />
      <circle cx="75" cy="89" r="5" fill="#3ccf91" />
      <circle cx="88" cy="89" r="5" fill="#ffc83d" />
    </svg>
  );
}
