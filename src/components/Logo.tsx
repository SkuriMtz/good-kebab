/**
 * Los colores de Lola, Clara, Víctor e Iris (los mismos de sus personajes),
 * tomados de los tokens de la base (--agente-*). Mismos valores de siempre.
 */
const COLORES = ["var(--agente-lola)", "var(--agente-clara)", "var(--agente-victor)", "var(--agente-iris)"];
const POS = [
  [28, 28],
  [72, 28],
  [28, 72],
  [72, 72],
];

/** La marca: los cuatro agentes como cuatro círculos, uno por color. */
export function Marca({ className = "h-[22px] w-[22px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      {POS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="19" style={{ fill: COLORES[i] }} />
      ))}
    </svg>
  );
}

/**
 * Logo: la marca y el nombre juntos, como el título junto al logo en la
 * barra de GitHub. Lo usan la barra y el pie (`.logo` en estructura.css).
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`logo ${className}`}>
      <Marca className="logo__marca" />
      <span className="logo__nombre">Atendel</span>
    </span>
  );
}
