import type { Viewport } from "next";
import { Sitio } from "@/components/Sitio";
import { BotonLista } from "@/components/inicio-dala/BotonLista";
import { CarruselAgentes } from "@/components/inicio-dala/CarruselAgentes";
import { TextoDala } from "@/components/inicio-dala/TextoDala";
import { Planes } from "@/components/Planes";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";

/*
 * El inicio, igual a los videos de referencia (diseno/capturas/dala/MEDIDAS.md):
 * ocho escenas a pantalla completa sobre el fondo de figuras. Cada bloque
 * mide lo mismo que su escena en el video y dice qué escena es
 * (data-escena): el fondo de figuras la lee para saber qué figura toca y
 * FondoInicio, qué enlace de la barra se enciende (src/lib/inicio.ts).
 * 1. portada (cerebro) · 2. decisiones (cerebro a la izquierda) · 3. caos
 * (polvo) · 4. foco · 5. globo · 6. equipo · 7. planes (las tarjetas de
 * precios de siempre) · 8. cierre. Los textos salen de src/i18n (inglés o
 * español, según el botón EN / ES).
 * El chat de demostración vive en /pruebalo (enlazado desde la ficha de
 * cada agente, la hoja del celular y la lista de espera).
 */
/** La barra del navegador del celular, del color del fondo del inicio (negro puro u #fafafa). */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
};

export default function Inicio() {
  const idioma = idiomaServidor();
  const d = t(idioma).inicio;
  return (
    <Sitio fondo="inicio">
      {/* 1. Portada */}
      <section className="ini-bloque ini-portada" data-escena="portada" aria-labelledby="portada-titulo">
        <div className="ini-col ini-col--izq ini-portada__texto">
          <TextoDala como="h1" tipo="titulo" id="portada-titulo" className="ini-display">
            {d.portada.titulo}
          </TextoDala>
          <TextoDala className="ini-etiqueta" inicio="top 95%">
            {d.portada.etiqueta}
          </TextoDala>
          <TextoDala className="ini-cuerpo" inicio="top 95%" retraso={0.15}>
            {d.portada.texto}
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
