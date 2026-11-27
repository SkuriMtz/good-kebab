import type { Metadata } from "next";
import Link from "next/link";
import { Sitio } from "@/components/Sitio";
import { BotonLista } from "@/components/inicio-dala/BotonLista";
import { APPS_CONECTABLES, appsConLogo } from "@/components/inicio-dala/AppsMarquesina";
import { TextoDala } from "@/components/inicio-dala/TextoDala";
import { AppsBarra, Equipo, Etiqueta, Permisos, type AppBarra } from "@/components/inicio-mezcla/Piezas";
import { contenidoMezcla } from "@/components/inicio-mezcla/textos";
import { Planes } from "@/components/Planes";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { CENTRO_PRIVACIDAD } from "@/legal/politicas";
import "@/components/inicio-mezcla/mezcla.css";

export { viewport } from "../page";

export const metadata: Metadata = { title: "Vista previa: landing combinada", robots: { index: false, follow: false } };

/*
 * VISTA PREVIA de la landing combinada: la landing de siempre (src/app/page.tsx, que no
 * cambia) con solo esto nuevo:
 * - la portada, más chica y con el texto corto;
 * - el cerebro pasa de derecha a izquierda más parejo y suave (FondoInicio → motor.suave);
 * - «Tu equipo»: los cuatro agentes y sus casos del día a día en un mismo panel (en lugar del
 *   carrusel), con «Pruébalo» y «Ver su ficha»;
 * - las apps: una barra a la izquierda, de arriba abajo, que sube sola y no se detiene; la que
 *   toques dice qué hace Atendel en ella, quién la usa y un pedido de ejemplo (en lugar de la
 *   fila que se desliza);
 * - textos más cortos en decisiones, foco y equipo: cada idea en su sección, sin repetirse;
 * - «Cada negocio ve solo lo suyo»: garantías y permisos (antes de Planes).
 * Lo nuevo vive en src/components/inicio-mezcla. No aparece en buscadores.
 */
export default async function VistaCombinada() {
  const idioma = await idiomaServidor();
  const textos = t(idioma);
  const d = textos.inicio;
  const m = contenidoMezcla(idioma);
  // La portada, más corta (el equipo ya se presenta en el carrusel)
  // Español e inglés: los textos cortos, cada idea en su sección y sin repetirse (los demás
  // idiomas, los de siempre hasta que se traduzcan)
  const corto = idioma === "es" || idioma === "en";
  const portadaTexto = corto ? m.portada : d.portada.texto;
  const decisionesTexto = corto ? m.decisionesTexto : d.decisiones.texto;
  const focoTextos = corto ? m.focoTextos : d.foco.textos;
  const equipoSub = corto ? m.equipoSub : d.equipo.sub;
  // Las apps de la barra, con sus textos: en español, lo que hace Atendel en cada una (catálogo);
  // en otros idiomas, lo que hace en esa categoría de apps
  const pa = textos.paginaApps;
  // Ordenadas por tipo (como en la página de apps), para agruparlas en la barra
  const TIPOS = Object.keys(pa.categorias) as (keyof typeof pa.categorias)[];
  const apps: AppBarra[] = [...appsConLogo()]
    .sort((x, y) => TIPOS.indexOf(x.categoria) - TIPOS.indexOf(y.categoria))
    .map((a) => ({
    id: a.id,
    nombre: pa.nombres[a.id] ?? a.nombre,
    categoria: pa.categorias[a.categoria].nombre,
    puede: idioma === "es" ? a.puede : pa.categorias[a.categoria].texto,
    agentes: a.agentes,
    pide: m.apps.ejemplos[a.categoria],
  }));
  return (
    <Sitio fondo="inicio">
      {/* 1. Portada */}
      <section className="ini-bloque ini-portada mz-portada" data-escena="portada" aria-labelledby="portada-titulo">
        <div className="ini-col ini-col--izq ini-portada__texto">
          <TextoDala como="h1" tipo="titulo" id="portada-titulo" className="ini-display">
            {d.portada.titulo}
          </TextoDala>
          <TextoDala className="ini-etiqueta" inicio="top 95%">
            {corto ? m.portadaEtiqueta : d.portada.etiqueta}
          </TextoDala>
          <TextoDala className="ini-cuerpo" inicio="top 95%" retraso={0.15}>
            {portadaTexto}
          </TextoDala>
          <BotonLista className="ini-portada__boton" />
        </div>
      </section>

      {/* 2. Decisiones: atender sin perder un mensaje */}
      <section className="ini-bloque ini-decisiones" data-escena="decisiones" aria-labelledby="decisiones-titulo">
        <div className="ini-col ini-col--der ini-escena__texto">
          <TextoDala como="h2" tipo="titulo" id="decisiones-titulo" className="ini-titulo">
            {d.decisiones.titulo}
          </TextoDala>
          <TextoDala className="ini-cuerpo" retraso={0.35}>
            {decisionesTexto}
          </TextoDala>
        </div>
      </section>

      {/* 3. El caos: así es tu día hoy */}
      <section className="ini-bloque ini-caos" data-escena="caos" aria-label={d.caos.aria}>
        {d.caos.textos.map((texto) => (
          <div key={texto} className="ini-caos__grupo">
            <TextoDala className="ini-caos__texto">{texto}</TextoDala>
          </div>
        ))}
      </section>

      {/* 4. Foco: tu equipo, listo a cualquier hora */}
      <section className="ini-bloque ini-foco" data-escena="foco" aria-labelledby="foco-titulo">
        <div className="ini-col ini-col--der ini-escena__texto">
          <TextoDala como="h2" tipo="titulo" id="foco-titulo" className="ini-titulo">
            {d.foco.titulo}
          </TextoDala>
          {focoTextos.map((texto, i) => (
            <TextoDala key={texto} className="ini-cuerpo" retraso={0.35 + i * 0.1}>
              {texto}
            </TextoDala>
          ))}
        </div>
      </section>

      {/* 5. Globo: que tu negocio crezca */}
      <section className="ini-bloque ini-globo" data-escena="globo" aria-labelledby="globo-titulo">
        <div className="ini-col ini-col--izq ini-escena__texto">
          <TextoDala como="h2" tipo="titulo" id="globo-titulo" className="ini-titulo">
            {d.globo.titulo}
          </TextoDala>
          {/* La frase de relleno («Queremos que…») solo en los idiomas sin texto corto */}
          {corto ? null : (
            <TextoDala className="ini-cuerpo" retraso={0.35}>
              {d.globo.texto1}
            </TextoDala>
          )}
          <TextoDala className="ini-cuerpo" retraso={0.45}>
            {d.globo.texto2a}
            <em className="ini-resalta">{d.globo.texto2b}</em>
            {d.globo.texto2c}
          </TextoDala>
          <TextoDala className="ini-cuerpo" retraso={0.55}>
            {corto ? m.globoTexto : d.globo.texto3}
          </TextoDala>
        </div>
      </section>

      {/* 6. Tu equipo y lo que resuelve, en un mismo lugar (en lugar del carrusel y de los casos) */}
      <section id="agentes" className="mz-bloque mz-equipo" data-escena="equipo" aria-labelledby="equipo-titulo">
        <div className="mz-cabeza">
          <Etiqueta>{d.equipo.titulo}</Etiqueta>
          <h2 id="equipo-titulo" className="ini-titulo">
            {equipoSub}
          </h2>
        </div>
        <Equipo idioma={idioma} cargos={textos.carrusel.cargo} verFicha={textos.carrusel.verFicha} />
      </section>

      {/* 6b. Las apps: una barra a la izquierda que sube sola; la que toques dice qué hace Atendel ahí */}
      <section className="mz-bloque mz-apps-bloque" aria-labelledby="apps-titulo">
        <AppsBarra
          apps={apps}
          etiqueta={m.apps.etiqueta}
          titulo={corto ? m.apps.titulo : d.apps.titulo}
          texto={corto ? m.apps.texto(APPS_CONECTABLES) : d.apps.nota(APPS_CONECTABLES)}
          que={m.apps.que}
          usa={m.apps.usa}
          pide={m.apps.pide}
        />
      </section>

      {/* Cada negocio ve solo lo suyo */}
      <section className="mz-bloque mz-privacidad" aria-labelledby="datos-titulo">
        <div>
          <div className="mz-cabeza">
            <Etiqueta>{textos.preguntas.seguridadEtiqueta}</Etiqueta>
            <h2 id="datos-titulo" className="ini-titulo">
              {textos.preguntas.seguridadTitulo}
            </h2>
          </div>
          <ul className="mz-garantias">
            {textos.preguntas.garantias.map((g) => (
              <li key={g.titulo} className="mz-garantia">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12.5 10 17l9-10" />
                </svg>
                <span>
                  <b>{g.titulo}</b>
                  <span>{g.texto}</span>
                </span>
              </li>
            ))}
          </ul>
          <Link href={CENTRO_PRIVACIDAD} className="mz-boton mz-boton--contorno">
            {m.privacidad.mas}
          </Link>
        </div>
        <Permisos idioma={idioma} />
      </section>

      {/* 7. Planes: las tarjetas de siempre (Free, One y Max) y cuándo sale */}
      <section id="precios" className="ini-bloque ini-planes ini-planes--tarjetas mz-planes" data-escena="planes" aria-labelledby="planes-titulo">
        <span id="cuando-sale" className="ini-ancla" aria-hidden="true" />
        <div className="ini-planes__cabeza">
          <TextoDala como="h2" tipo="titulo" id="planes-titulo" className="ini-grande">
            {d.planes.titulo}
          </TextoDala>
          <TextoDala className="ini-cuerpo" retraso={0.25}>
            {corto ? m.planesTexto : d.planes.texto}
          </TextoDala>
        </div>
        <Planes idioma={idioma} variante="inicio" nivelTitulo={3} />
        <p className="ini-cuando">
          <span className="ini-cuando__titulo">{d.planes.cuandoTitulo}</span>
          <span>{d.planes.cuandoTexto}</span>
        </p>
      </section>

      {/* 8. Cierre */}
      <section id="unete" className="ini-bloque ini-cierre" data-escena="cierre" aria-labelledby="cierre-titulo">
        <div className="ini-cierre__centro">
          <TextoDala como="h2" tipo="titulo" id="cierre-titulo" className="ini-cierre__texto">
            {d.cierre.linea1}
            <br />
            {d.cierre.linea2}
          </TextoDala>
          <BotonLista />
        </div>
      </section>
    </Sitio>
  );
}
