/**
 * Se vuelve a montar en cada cambio de página: da una transición suave
 * (aparece con un fundido) al navegar entre el inicio, entrar y el panel.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter overflow-x-clip">{children}</div>;
}
