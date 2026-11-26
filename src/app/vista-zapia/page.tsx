import type { Metadata } from "next";
import Link from "next/link";
import { Sitio } from "@/components/Sitio";
import { BotonLista } from "@/components/inicio-dala/BotonLista";
import { APPS_CONECTABLES, appsConLogo } from "@/components/inicio-dala/AppsMarquesina";
import { CarruselAgentes } from "@/components/inicio-dala/CarruselAgentes";
import { TextoDala } from "@/components/inicio-dala/TextoDala";
import { AppsBarra, Casos, Etiqueta, Permisos, type AppBarra } from "@/components/inicio-mezcla/Piezas";
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
 * - «En el día a día»: casos que avanzan solos (entre el foco y el globo);
 * - las apps: una barra a la izquierda, de arriba abajo, que sube sola; la que toques dice a la
 *   derecha qué hace Atendel en ella (en lugar de la fila que se desliza);
 * - «Cada negocio ve solo lo suyo»: garantías y permisos (antes de Planes).
 * Lo nuevo vive en src/components/inicio-mezcla. No aparece en buscadores.
 */
export default async function VistaCombinada() {
  const idioma = await idiomaServidor();
  const textos = t(idioma);
  const d = textos.inicio;
  const m = contenidoMezcla(idioma);
  // La portada, más corta (el equipo ya se presenta en el carrusel)
  const portadaTexto = idioma === "es" || idioma === "en" ? m.portada : d.portada.texto;
  // Las apps de la barra, con sus textos: en español, lo que hace Atendel en cada una (catálogo);
  // en otros idiomas, lo que hace en esa categoría de apps
  const pa = textos.paginaApps;
  const apps: AppBarra[] = appsConLogo().map((a) => ({
    id: a.id,
    nombre: pa.nombres[a.id] ?? a.nombre,
    categoria: pa.categorias[a.categoria].nombre,
    puede: idioma === "es" ? a.puede : pa.categorias[a.categoria].texto,
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
            {d.portada.etiqueta}
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
            {d.decisiones.texto}
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
          {d.foco.textos.map((texto, i) => (
            <TextoDala key={texto} className="ini-cuerpo" retraso={0.35 + i * 0.1}>
              {texto}
            </TextoDala>
          ))}
        </div>
      </section>

      {/* En el día a día: casos que avanzan solos */}
      <section className="mz-bloque" aria-labelledby="casos-titulo">
        <div className="mz-cabeza">
          <Etiqueta>{m.casos.etiqueta}</Etiqueta>
          <h2 id="casos-titulo" className="ini-titulo">
            {m.casos.titulo}
          </h2>
        </div>
        <Casos idioma={idioma} />
      </section>

      {/* 5. Globo: que tu negocio crezca */}
      <section className="ini-bloque ini-globo" data-escena="globo" aria-labelledby="globo-titulo">
        <div className="ini-col ini-col--izq ini-escena__texto">
          <TextoDala como="h2" tipo="titulo" id="globo-titulo" className="ini-titulo">
            {d.globo.titulo}
          </TextoDala>
          <TextoDala className="ini-cuerpo" retraso={0.35}>
            {d.globo.texto1}
          </TextoDala>
          <TextoDala className="ini-cuerpo" retraso={0.45}>
            {d.globo.texto2a}
            <em className="ini-resalta">{d.globo.texto2b}</em>
            {d.globo.texto2c}
          </TextoDala>
          <TextoDala className="ini-cuerpo" retraso={0.55}>
            {d.globo.texto3}
          </TextoDala>
        </div>
      </section>

      {/* 6. Tu equipo (carrusel de los agentes) */}
      <section id="agentes" className="ini-bloque ini-equipo" data-escena="equipo" aria-labelledby="equipo-titulo">
        <div className="ini-col ini-col--izq ini-equipo__texto">
          <TextoDala como="h2" tipo="titulo" id="equipo-titulo" className="ini-grande">
            {d.equipo.titulo}
          </TextoDala>
          <TextoDala className="ini-sub" retraso={0.2}>
            {d.equipo.sub}
          </TextoDala>
          <TextoDala className="ini-cuerpo ini-cuerpo--chico" retraso={0.35}>
            {d.equipo.texto}
          </TextoDala>
        </div>
        <div className="ini-equipo__carrusel">
          <CarruselAgentes />
        </div>
      </section>

      {/* 6b. Las apps: una barra a la izquierda que sube sola; la que toques dice qué hace Atendel ahí */}
      <section className="mz-bloque mz-apps-bloque" aria-labelledby="apps-titulo">
        <AppsBarra apps={apps} titulo={d.apps.titulo} nota={d.apps.nota(APPS_CONECTABLES)} />
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
      <section id="precios" className="ini-bloque ini-planes ini-planes--tarjetas" data-escena="planes" aria-labelledby="planes-titulo">
        <span id="cuando-sale" className="ini-ancla" aria-hidden="true" />
        <div className="ini-planes__cabeza">
          <TextoDala como="h2" tipo="titulo" id="planes-titulo" className="ini-grande">
            {d.planes.titulo}
          </TextoDala>
          <TextoDala className="ini-cuerpo" retraso={0.25}>
            {d.planes.texto}
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
