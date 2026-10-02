/**
 * Nombre de la marca en texto. El símbolo/logo todavía no está decidido:
 * cuando exista, se agrega aquí y aparece en toda la app.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center text-[1.3125rem] font-semibold tracking-[-0.03em] text-bone ${className}`}>
      Atendel
    </span>
  );
}
