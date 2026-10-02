/**
 * Nombre de la marca: "atendel" en itálica ultraligera (estilo título de cine).
 * El símbolo/logo todavía no está decidido: cuando exista, se agrega aquí.
 */
export function Logo({ className = "" }: { className?: string }) {
  return <span className={`editorial inline-flex items-center text-[1.75rem] leading-none ${className}`}>atendel</span>;
}
