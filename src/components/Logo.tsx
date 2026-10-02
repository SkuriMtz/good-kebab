/**
 * Marca de Atendel: una "A" triangular (eco de las partículas de la marca)
 * con el degradado violeta → verde. El degradado solo vive en el logo.
 */
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="atendel-mark" x1="10" y1="4" x2="24" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8052ff" />
          <stop offset="0.55" stopColor="#8052ff" />
          <stop offset="1" stopColor="#15846e" />
        </linearGradient>
      </defs>
      <path
        fillRule="evenodd"
        fill="url(#atendel-mark)"
        d="M16 3 29.5 28.5H21.2L16 18.8 10.8 28.5H2.5ZM16 9.6 13.1 15.2H18.9Z"
      />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-7 w-7" />
      <span className="text-[1.1875rem] font-semibold tracking-[-0.02em] text-bone">Atendel</span>
    </span>
  );
}
