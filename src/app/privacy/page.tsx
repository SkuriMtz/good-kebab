import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Marca } from "@/components/Logo";
import { Icono } from "@/components/base/Iconos";
import { SelectorIdioma } from "@/components/legal/BarraSecciones";
import { BuscadorPrivacidad } from "@/components/legal/BuscadorPrivacidad";
import { serifPanel } from "@/components/panel/fuente";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { TEXTOS_LEGALES, buscar, cuenta } from "@/legal/documentos";
import { CENTRO_PRIVACIDAD, POLITICAS, type Politica } from "@/legal/politicas";
import { legalesCompletos } from "@/lib/legal";
import { metadatosDe } from "@/lib/seo";
import { CORREO_CONTACTO } from "@/lib/sitio";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  const E = t(idioma).legal.etiquetas;
  return metadatosDe(idioma, [E.centro, E.centroDescripcion]);
}

const POR_ID = Object.fromEntries(POLITICAS.map((p) => [p.id, p])) as Record<Politica, (typeof POLITICAS)[number]>;

/**
 * /privacy: el Centro de privacidad. Todos los documentos legales en
 * tarjetas (cada una lleva a su página) y un buscador que encuentra
 * cualquier sección. Claro, con el título en serif, como las páginas
 * legales. 404 mientras falten los datos del responsable.
 */
export default async function CentroPrivacidad({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  if (!legalesCompletos()) notFound();
  const idioma = await idiomaServidor();
  const L = t(idioma).legal;
  const E = L.etiquetas;
  const { q } = await searchParams;
  const consulta = (Array.isArray(q) ? q[0] : q ?? "").slice(0, 100).trim();
  const resultados = consulta ? buscar(consulta, (id) => TEXTOS_LEGALES[id][idioma], POLITICAS.map((p) => p.id)) : [];

  return (
    <div className={`legal centro ${serifPanel.variable}`} lang={idioma}>
      <a href="#centro-contenido" className="legal__saltar">
        {E.saltar}
      </a>
      <div className="centro__arriba">
        <header className="centro__barra">
          <Link href="/" className="centro__logo" aria-label="Atendel, inicio">
            <Marca className="centro__marca" />
            <span aria-hidden="true">Atendel</span>
          </Link>
          <nav className="centro__nav" aria-label="Atendel">
            <Link href="/">{E.inicio}</Link>
            <Link href="/contacto">{E.contacto}</Link>
            <SelectorIdioma idioma={idioma} etiqueta={E.idioma} />
          </nav>
        </header>
        <div className="centro__heroe">
          <h1 className="centro__titulo">{E.centroTitulo}</h1>
          <BuscadorPrivacidad inicial={consulta} placeholder={E.buscar} etiqueta={E.buscarAria} />
        </div>
      </div>

      <main id="centro-contenido" tabIndex={-1} className="centro__cuerpo">
        {consulta ? (
          <section aria-live="polite">
            <p className="centro__conteo">
              {resultados.length} {E.resultados}
            </p>
            {resultados.length ? (
              <ol className="centro__resultados">
                {resultados.map((r) => {
                  const p = POR_ID[r.id];
                  return (
                    <li key={`${r.id}-${r.seccion}`}>
                      <Link href={`${p.href}${r.seccion ? `#${r.seccion}` : ""}`}>
                        <span className="centro__res-doc">{L.docs[r.id].nombre}</span>
                        <span className="centro__res-titulo">{r.titulo || L.docs[r.id].nombre}</span>
                        <span className="centro__res-texto">
                          {r.antes}
                          {r.marca ? <mark>{r.marca}</mark> : null}
                          {r.despues}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="centro__vacio">
                {E.sinResultados} <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a>
              </p>
            )}
            <p className="centro__volver">
              <Link href={CENTRO_PRIVACIDAD}>{E.verTodo}</Link>
            </p>
          </section>
        ) : (
          <>
            {/* Lo primero: en corto, que Atendel entra a tus cosas pero lo que ve se queda contigo */}
            <section className="centro__datos" aria-labelledby="centro-datos-titulo">
              <div className="centro__datos-cabeza">
                <h2 id="centro-datos-titulo" className="centro__datos-titulo">
                  {L.datos.titulo}
                </h2>
                <p className="centro__datos-texto">{L.datos.texto}</p>
              </div>
              <ul className="centro__datos-lista">
                {L.datos.puntos.map(([titulo, texto]) => (
                  <li key={titulo} className="centro__datos-punto">
                    <h3>{titulo}</h3>
                    <p>{texto}</p>
                  </li>
                ))}
              </ul>
              <p className="centro__datos-enlace">
                <Link href={POR_ID.privacidad.href}>{L.datos.enlace} →</Link>
              </p>
            </section>
            <ul className="centro__rejilla">
              {POLITICAS.map((p) => {
                const c = cuenta(TEXTOS_LEGALES[p.id].es);
                return (
                  <li key={p.id}>
                    <Link href={p.href} className="centro__tarjeta">
                      <span className="centro__icono" aria-hidden="true">
                        <Icono nombre={p.icono} tam={22} />
                      </span>
                      <h2>{L.docs[p.id].nombre}</h2>
                      <p>{L.docs[p.id].resumen}</p>
                      <p className="centro__cuenta">
                        {c.n} {E[c.que]}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>

      <footer className="centro__pie">
        <div className="centro__pie-dentro">
          <Link href="/" className="centro__logo centro__logo--pie" aria-label="Atendel, inicio">
            <Marca className="centro__marca" />
            <span aria-hidden="true">Atendel</span>
          </Link>
          <nav className="centro__pie-columnas" aria-label={E.pieAria}>
            <ul>
              <li>
                <Link href="/">{E.inicio}</Link>
              </li>
              <li>
                <Link href="/agentes">{E.agentes}</Link>
              </li>
              <li>
                <Link href="/precios">{E.precios}</Link>
              </li>
              <li>
                <Link href="/contacto">{E.contacto}</Link>
              </li>
            </ul>
            <ul>
              {POLITICAS.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <Link href={p.href}>{L.docs[p.id].nombre}</Link>
                </li>
              ))}
              <li>
                <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
