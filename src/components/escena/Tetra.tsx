/** Un tetraedro de alambre (la figura de los triangulitos, en grande), en el color que se le pase. */
export function Tetra({ color, className = "h-12 w-12", giro = 0 }: { color: string; className?: string; giro?: number }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" style={{ transform: `rotate(${giro}deg)` }}>
      <g fill="none" stroke={color} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M50 8 L12 80 L88 72 Z" />
        <path d="M50 8 L58 54 M12 80 L58 54 M88 72 L58 54" />
      </g>
    </svg>
  );
}
