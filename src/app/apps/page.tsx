import type { Metadata } from "next";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Seccion } from "@/components/base/Seccion";
import { idiomaServidor } from "@/i18n/servidor";
import { CATALOGO } from "@/lib/conexiones/catalogo";
import { LOGO_APP } from "@/lib/conexiones/logos";
import { CATEGORIAS_APPS, NOMBRE_APP_EN, TEXTOS_APPS } from "@/lib/paginas-menu";
import { metadatosDe } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  return metadatosDe(idioma, TEXTOS_APPS[idioma].meta);
}

/**
 * /apps: las apps que se conectan con Atendel, por tipo (correo, mensajes,
 * agenda…), cada tipo con una línea de qué hace el equipo con ellas. Las que
 * todavía no tienen conexión pública dicen «En camino».
 */
export default async function Apps() {
  const idioma = await idiomaServidor();
  const T = TEXTOS_APPS[idioma];
  const conectables = CATALOGO.filter((a) => a.fase === 1).length;
  return (
    <Sitio>
      <header className="pagina-cabeza contenedor">
        <div className="pagina-cabeza__texto">
          <Etiqueta tono="cielo">{T.etiqueta}</Etiqueta>
          <h1 className="t-display">{T.titulo}</h1>
          <p className="t-intro">{T.intro(conectables)}</p>
        </div>
      </header>

      <div className="contenedor apps-pagina">
        {CATEGORIAS_APPS.map((c) => {
          const apps = CATALOGO.filter((a) => a.categoria === c.id).sort((a, b) => a.fase - b.fase);
          if (!apps.length) return null;
          return (
            <section key={c.id} className="apps-cat" aria-labelledby={`apps-${c.id}`}>
              <div className="apps-cat__texto">
                <h2 id={`apps-${c.id}`}>{c.nombre[idioma]}</h2>
                <p>{c.texto[idioma]}</p>
              </div>
              <ul className="apps-cat__lista">
                {apps.map((a) => (
                  <li key={a.id} className="apps-chip" data-pronto={a.fase !== 1 ? "" : undefined}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- logo chico y fijo */}
                    <img src={LOGO_APP[a.id]} alt="" width={24} height={24} loading="lazy" decoding="async" />
                    <span>{idioma === "en" ? (NOMBRE_APP_EN[a.id] ?? a.nombre) : a.nombre}</span>
                    {a.fase !== 1 ? <span className="apps-chip__pronto">{T.pronto}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        <p className="apps-pagina__nota">{T.marcas}</p>
      </div>

      <Seccion etiquetadaPor="apps-cierre-titulo" ancho="angosto">
        <div className="cierre">
          <h2 id="apps-cierre-titulo" className="t-seccion">
            {T.cierreTitulo}
          </h2>
          <p className="t-intro">{T.cierreTexto}</p>
          <div className="cierre__acciones">
            <Boton href="/crear-cuenta" tam="grande" flecha>
              {T.crear}
            </Boton>
          </div>
        </div>
      </Seccion>
    </Sitio>
  );
}
