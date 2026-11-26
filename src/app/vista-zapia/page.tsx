import type { Metadata } from "next";
import Link from "next/link";
import { Sitio } from "@/components/Sitio";
import { BotonLista } from "@/components/inicio-dala/BotonLista";
import { CarruselAgentes } from "@/components/inicio-dala/CarruselAgentes";
import { TextoDala } from "@/components/inicio-dala/TextoDala";
import { Dibujo, PersonajeEchado } from "@/components/inicio-zapia/Dibujos";
import { Avisos, CajaEscribe, CasosDeUso, Conecta, Etiqueta, GlobosHabilidades, Ideas, Permisos, Preguntas, Revela } from "@/components/inicio-zapia/Piezas";
import { textosZapia } from "@/components/inicio-zapia/textos";
import { Planes } from "@/components/Planes";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import "@/components/inicio-zapia/inicio-zapia.css";

export { viewport } from "../page";

export const metadata: Metadata = { title: "Vista previa: landing nueva", robots: { index: false, follow: false } };

const pedir = (texto: string) => `/pruebalo?pide=${encodeURIComponent(texto)}`;

/**
 * PRUEBA, hecha desde cero: el cuerpo de la landing de Zapia (sus secciones, su orden y cómo
 * se mueve cada parte) con la cabeza de Atendel (su barra, su letra, los colores y personajes
 * de su equipo y sus fragmentos de fondo). Donde Zapia pone una foto a pantalla completa, aquí
 * se ven los fragmentos: cada «ventana» lleva su escena (data-escena) y las «hojas» suben
 * encima con las esquinas redondas. La landing de siempre («/») no cambia. Si gusta, pasa a
 * «/»; si no, se borran esta carpeta y src/components/inicio-zapia. No aparece en buscadores.
 */
export default async function VistaZapia() {
  const idioma = await idiomaServidor();
  const textos = t(idioma);
  const d = textos.inicio;
  const z = textosZapia(idioma);
  const preguntas = [...textos.preguntas.grupos.empezar.preguntas, ...textos.preguntas.grupos.planes.preguntas.slice(0, 2)];

  return (
    <Sitio fondo="inicio">
      <div className="z">
        {/* 1. Portada, igual a la de Zapia (sin la foto y sin el cerebro): el título, la caja que
            escribe sola, dos botones y, a la derecha, los globos de pedidos que van subiendo */}
        <section className="z-portada" aria-labelledby="portada-titulo">
          <Revela className="z-portada__texto">
            <h1 id="portada-titulo" className="z-display">
              {z.hero.titulo}
            </h1>
            <p className="z-portada__cuerpo">{z.hero.texto}</p>
            <CajaEscribe idioma={idioma} />
            <div className="z-botones">
              <Link href="/pruebalo" className="z-boton z-boton--claro">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="12.5" rx="2" />
                  <path d="M9 20.5h6M12 16.5v4" />
                </svg>
                {z.hero.web}
              </Link>
              <BotonLista className="z-boton z-boton--oscuro">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
                  <path d="M11 18.5h2" />
                </svg>
                {z.hero.lista}
              </BotonLista>
            </div>
          </Revela>
          <GlobosHabilidades idioma={idioma} />
        </section>

        {/* 2. Hoja: tres formas de empezar + tu equipo en acción */}
        <div className="z-hoja">
          <section className="z-hoja__parte z-cont" aria-labelledby="formas-titulo">
            <Revela className="z-cabeza">
              <Etiqueta color="coral">{z.formas.etiqueta}</Etiqueta>
              <h2 id="formas-titulo" className="z-titulo">
                {z.formas.titulo}
              </h2>
              <p className="z-sub">{z.formas.texto}</p>
            </Revela>
            <Revela className="z-formas">
              {z.formas.tarjetas.map((f) => (
                <article key={f.titulo} className="z-forma" data-color={f.color}>
                  <span className="z-forma__arriba">{f.arriba}</span>
                  <Dibujo nombre={f.dibujo} className="z-forma__dibujo" />
                  <h3 className="z-forma__titulo">{f.titulo}</h3>
                  <p className="z-forma__texto">{f.texto}</p>
                  <Link href={f.href} className="z-boton z-boton--negro">
                    {f.boton}
                  </Link>
                </article>
              ))}
            </Revela>
          </section>

          <section className="z-hoja__parte z-cont" aria-labelledby="casos-titulo">
            <Revela className="z-cabeza">
              <Etiqueta color="azul">{z.casos.etiqueta}</Etiqueta>
              <h2 id="casos-titulo" className="z-titulo">
                {z.casos.titulo}
              </h2>
              <p className="z-sub">{z.casos.texto}</p>
            </Revela>
            <CasosDeUso idioma={idioma} />
          </section>
        </div>

        {/* 3. Ventana: así es tu día hoy (el polvo) */}
        <section className="z-caos" data-escena="caos" aria-label={d.caos.aria}>
          {d.caos.textos.map((texto) => (
            <div key={texto} className="z-caos__grupo">
              <TextoDala className="ini-caos__texto">{texto}</TextoDala>
            </div>
          ))}
        </section>

        {/* 5. Ventana: te avisa primero (el foco, a la izquierda) */}
        <section className="z-ventana z-ventana--der z-ventana--foco" data-escena="foco" aria-labelledby="avisos-titulo">
          <div className="z-ventana__texto">
            <Etiqueta color="amarillo">{z.avisos.etiqueta}</Etiqueta>
            <TextoDala como="h2" tipo="titulo" id="avisos-titulo" className="z-titulo">
              {z.avisos.titulo}
            </TextoDala>
            <TextoDala className="ini-cuerpo" retraso={0.3}>
              {z.avisos.texto}
            </TextoDala>
            <Avisos idioma={idioma} />
          </div>
        </section>

        {/* 6. Hoja: cómo funciona + privacidad */}
        <div className="z-hoja">
          <section className="z-hoja__parte z-cont" aria-labelledby="conecta-titulo">
            <Revela className="z-cabeza">
              <Etiqueta color="verde">{z.conecta.etiqueta}</Etiqueta>
              <h2 id="conecta-titulo" className="z-titulo">
                {z.conecta.titulo}
              </h2>
            </Revela>
            <Conecta idioma={idioma} />
          </section>

          <section className="z-hoja__parte z-cont z-privacidad" aria-labelledby="privacidad-titulo">
            <Revela>
              <div className="z-cabeza">
                <Etiqueta color="azul">{z.privacidad.etiqueta}</Etiqueta>
                <h2 id="privacidad-titulo" className="z-titulo">
                  {z.privacidad.titulo}
                </h2>
                <p className="z-sub">{z.privacidad.texto}</p>
              </div>
              <ul className="z-puntos">
                {z.privacidad.puntos.map((p, k) => (
                  <li key={p.titulo} className="z-punto" data-color={(["coral", "azul", "verde", "amarillo"] as const)[k % 4]}>
                    <span className="z-punto__icono" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.5 10 17l9-10" />
                      </svg>
                    </span>
                    <span>
                      <b>{p.titulo}</b>
                      <span>{p.texto}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Revela>
            <Permisos idioma={idioma} />
          </section>
        </div>

        {/* 7. Ventana: que tu negocio crezca (el globo) */}
        <section className="z-ventana" data-escena="globo" aria-labelledby="globo-titulo">
          <div className="z-ventana__texto">
            <TextoDala como="h2" tipo="titulo" id="globo-titulo" className="z-titulo">
              {d.globo.titulo}
            </TextoDala>
            <TextoDala className="ini-cuerpo" retraso={0.3}>
              {d.globo.texto1}
            </TextoDala>
            <TextoDala className="ini-cuerpo" retraso={0.4}>
              {d.globo.texto2a}
              <em className="ini-resalta">{d.globo.texto2b}</em>
              {d.globo.texto2c}
            </TextoDala>
            <TextoDala className="ini-cuerpo" retraso={0.5}>
              {d.globo.texto3}
            </TextoDala>
          </div>
        </section>

        {/* 8. Ventana: tu equipo (el carrusel de siempre) */}
        <section id="agentes" className="z-equipo" data-escena="equipo" aria-labelledby="equipo-titulo">
          <Revela className="z-cabeza">
            <Etiqueta color="coral">{z.equipo}</Etiqueta>
            <h2 id="equipo-titulo" className="z-titulo">
              {d.equipo.sub}
            </h2>
            <p className="ini-cuerpo">{d.equipo.texto}</p>
          </Revela>
          <CarruselAgentes />
        </section>

        {/* 9. Hoja: ideas + preguntas + va más allá */}
        <div className="z-hoja">
          <section className="z-hoja__parte z-cont" aria-labelledby="ideas-titulo">
            <div className="z-cabeza z-cabeza--centro">
              <Etiqueta color="amarillo">{z.ideas.etiqueta}</Etiqueta>
            </div>
            <Ideas idioma={idioma} />
          </section>

          <section className="z-hoja__parte z-cont z-preguntas-bloque" aria-labelledby="preguntas-titulo">
            <Revela className="z-cabeza">
              <Etiqueta color="verde">{z.preguntas.etiqueta}</Etiqueta>
              <h2 id="preguntas-titulo" className="z-titulo">
                {z.preguntas.titulo}
              </h2>
              <Link href="/preguntas" className="z-boton z-boton--gris">
                {textos.preguntas.titulo}
              </Link>
            </Revela>
            <Preguntas items={preguntas} />
          </section>

          <section className="z-hoja__parte z-cont" aria-labelledby="mas-titulo">
            <Revela className="z-cabeza">
              <h2 id="mas-titulo" className="z-titulo">
                {z.mas.titulo}
              </h2>
              <p className="z-sub">{z.mas.texto}</p>
            </Revela>
            <div className="z-mas">
              {z.mas.tarjetas.map((m, k) => (
                <article key={m.titulo} className="z-mas__tarjeta" data-color={m.color}>
                  {k === 0 ? <PersonajeEchado className="z-mas__personaje" /> : null}
                  <Dibujo nombre={m.dibujo} className="z-mas__dibujo" />
                  <h3 className="z-mas__titulo">{m.titulo}</h3>
                  <p>{m.texto}</p>
                  <Link href={pedir(m.pide)} className="z-boton z-boton--negro">
                    {m.boton}
                  </Link>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* 10. Ventana: planes (las tarjetas de siempre) */}
        <section id="precios" className="ini-bloque ini-planes ini-planes--tarjetas" data-escena="planes" aria-labelledby="planes-titulo">
          <span id="cuando-sale" className="ini-ancla" aria-hidden="true" />
          <Revela className="z-cabeza">
            <h2 id="planes-titulo" className="z-titulo">
              {d.planes.titulo}
            </h2>
            <p className="z-sub">{d.planes.texto}</p>
          </Revela>
          <Planes idioma={idioma} variante="inicio" nivelTitulo={3} />
          <p className="ini-cuando">
            <span className="ini-cuando__titulo">{d.planes.cuandoTitulo}</span>
            <span>{d.planes.cuandoTexto}</span>
          </p>
        </section>

        {/* 11. Cierre: la marca de Atendel y «Let Atendel handle it» */}
        <section id="unete" className="z-cierre" data-escena="cierre" aria-labelledby="cierre-titulo">
          <Revela className="z-cierre__centro">
            <h2 id="cierre-titulo" className="z-titulo z-titulo--centro">
              {z.cierre.titulo}
            </h2>
            <p className="z-sub z-sub--centro">{z.cierre.texto}</p>
            <CajaEscribe idioma={idioma} />
            <div className="z-botones">
              <BotonLista />
              <Link href="/pruebalo" className="z-boton z-boton--gris">
                {z.cierre.probar}
              </Link>
            </div>
          </Revela>
        </section>
      </div>
    </Sitio>
  );
}
