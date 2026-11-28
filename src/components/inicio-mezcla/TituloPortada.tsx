/**
 * El título de la portada, en dos renglones con letras y tamaños distintos: el primero en Geist,
 * grande; el segundo en serif itálica, con una palabra chica y gris («se quede sin») y la última
 * muy grande, con el degradado ámbar → lavanda del río («respuesta.»). Entra subiendo, renglón
 * por renglón (solo con movimiento; ver mezcla.css).
 * `partes` sale de src/components/inicio-mezcla/textos.ts (cada idioma corta su frase).
 */
export function TituloPortada({ partes, separador }: { partes: readonly [string, string, string]; separador: string }) {
  const [a, b, c] = partes;
  return (
    <h1 id="portada-titulo" className="mz-hero">
      <span className="mz-hero__a">{a}</span>
      {separador}
      <span className="mz-hero__bc">
        <span className="mz-hero__b">{b}</span>
        {separador}
        <span className="mz-hero__c">{c}</span>
      </span>
    </h1>
  );
}
