/** Los colores de Lola, Clara, Víctor e Iris (los mismos de sus personajes). */
const COLORES = ["#ff8a6b", "#7fb2ff", "#5fd09f", "#f6c64a"];
const POS = [
  [28, 28],
  [72, 28],
  [28, 72],
  [72, 72],
];

/** La marca: los cuatro agentes como cuatro círculos, uno por color. */
export function Marca({ className = "h-[22px] w-[22px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {POS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="19" fill={COLORES[i]} />
      ))}
    </svg>
  );
}

/** Logo: la marca de los cuatro círculos y el nombre. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Marca />
      <span className="logo-palabra leading-none">Atendel</span>
    </span>
  );
}
