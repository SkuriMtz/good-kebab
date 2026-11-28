import type { Viewport } from "next";
import Link from "next/link";
import { Sitio } from "@/components/Sitio";
import { BotonLista } from "@/components/inicio-dala/BotonLista";
import { APPS_CONECTABLES, appsConLogo } from "@/components/inicio-dala/AppsMarquesina";
import { TextoDala } from "@/components/inicio-dala/TextoDala";
import { AppsBarra, Etiqueta, Permisos, type AppBarra } from "@/components/inicio-mezcla/Piezas";
import { contenidoMezcla } from "@/components/inicio-mezcla/textos";
import { Planes } from "@/components/Planes";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { CENTRO_PRIVACIDAD } from "@/legal/politicas";
import "@/components/inicio-mezcla/mezcla.css";

/*
 * El inicio: escenas a pantalla completa sobre el fondo de figuras (cada bloque dice qué escena
 * es con data-escena: el fondo la lee para saber qué figura toca y FondoInicio, qué enlace de la
 * barra se enciende; src/lib/inicio.ts). De la portada a decisiones corre el río de información.
 * 1. portada (solo el título, grande) · 2. decisiones · 3. caos · 4. foco · 5. globo · 6. las apps (una barra que sube
 * sola; la que toques dice qué hace Atendel ahí; lleva la escena «equipo» del fondo) · cada
 * negocio ve solo lo suyo (garantías y permisos) · 7. planes · 8. cierre. Qué son los agentes y
 * cómo funcionan se explica en /preguntas y en /agentes.
 * Los textos cortos salen de src/components/inicio-mezcla/textos.ts (los 7 idiomas); los
 * títulos, de src/i18n. El chat de demostración vive en /pruebalo.
 */
/** La barra del navegador del celular, del color del fondo del inicio (negro puro u #fafafa). */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
};

export default async function Inicio() {
  const idioma = await idiomaServidor();
  const textos = t(idioma);
  const d = textos.inicio;
  const m = contenidoMezcla(idioma);
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
        </div>
      </section>

      {/* 2. Decisiones: atender sin perder un mensaje */}
      <section className="ini-bloque ini-decisiones" data-escena="decisiones" aria-labelledby="decisiones-titulo">
        <div className="ini-col ini-col--der ini-escena__texto">
          <TextoDala como="h2" tipo="titulo" id="decisiones-titulo" className="ini-titulo">
            {d.decisiones.titulo}
          </TextoDala>
          <TextoDala className="ini-cuerpo" retraso={0.35}>
            {m.decisionesTexto}
          </TextoDala>
        </div>
      </section>

      {/* 3. El caos: así es tu día hoy */}
      <section className="ini-bloque ini-caos" data-escena="caos" aria-label={d.caos.aria}>
        {m.caosTextos.map((texto) => (
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
          {m.focoTextos.map((texto, i) => (
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
          <TextoDala className="ini-cuerpo" retraso={0.45}>
            {d.globo.texto2a}
            <em className="ini-resalta">{d.globo.texto2b}</em>
            {d.globo.texto2c}
          </TextoDala>
          <TextoDala className="ini-cuerpo" retraso={0.55}>
            {m.globoTexto}
          </TextoDala>
        </div>
      </section>

      {/* 6. Las apps: una barra a la izquierda que sube sola; la que toques dice qué hace Atendel ahí */}
      <section className="mz-bloque mz-apps-bloque" data-escena="equipo" aria-labelledby="apps-titulo">
        <AppsBarra
          apps={apps}
          etiqueta={m.apps.etiqueta}
          titulo={m.apps.titulo}
          texto={m.apps.texto(APPS_CONECTABLES)}
          que={m.apps.que}
          usa={m.apps.usa}
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
            {m.garantias.map((g) => (
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
            {m.planesTexto}
          </TextoDala>
        </div>
        <Planes idioma={idioma} variante="inicio" nivelTitulo={3} />
        <p className="ini-cuando">
          <span className="ini-cuando__titulo">{d.planes.cuandoTitulo}</span>
          <span>{m.cuandoTexto}</span>
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
