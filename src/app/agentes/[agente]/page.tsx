import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sitio } from "@/components/Sitio";
import { Boton, claseBotonBase } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { Icono } from "@/components/base/Iconos";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { TarjetaVidrio } from "@/components/base/TarjetaVidrio";
import { BotonFicha } from "@/components/agentes/BotonFicha";
import { ConversacionEjemplo } from "@/components/agentes/ConversacionEjemplo";
import { Personaje } from "@/components/agentes/Personaje";
import { PlanesDelAgente } from "@/components/agentes/piezas";
import { IDS_AGENTES, esIdAgente } from "@/lib/agentes";
import { agenteDe, agentesDe, planesDe, planMinimoDe, t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { metadatosDe } from "@/lib/seo";

/** Las cuatro páginas se generan al construir el sitio; otra dirección da 404. */
export const dynamicParams = false;
export function generateStaticParams() {
  return IDS_AGENTES.map((agente) => ({ agente }));
}

export function generateMetadata({ params }: { params: { agente: string } }): Metadata {
  if (!esIdAgente(params.agente)) return {};
  const idioma = idiomaServidor();
  const a = agenteDe(idioma, params.agente);
  return metadatosDe(idioma, t(idioma).meta.agente(a.nombre, a.area, a.lema));
}

/*
 * /agentes/[agente] (G3-T1): la página propia de cada agente, como una página
 * de producto de GitHub. Arriba, su personaje grande sobre el halo (sus ojos
 * siguen al cursor) con su nombre, lo que hace en una línea, en qué plan
 * viene y los botones para hablarle o ver su ficha. Después: su conversación
 * de ejemplo completa en la ventana del producto, todo lo que hace, ideas
 * para pedirle algo, los planes y el resto del equipo.
 */
export default function PaginaAgente({ params }: { params: { agente: string } }) {
  if (!esIdAgente(params.agente)) notFound();
  const id = params.agente;
  const idioma = idiomaServidor();
  const d = t(idioma);
  const P = d.paginaAgente;
  const a = agenteDe(idioma, id);
  const detalle = d.detalle[id];
  const minimo = planMinimoDe(idioma, id);
  const enFree = minimo.id === "free";
  const otros = agentesDe(idioma).filter((o) => o.id !== id);

  return (
    <Sitio>
      {/* Encabezado: el personaje es el protagonista */}
      <section className="seccion con-halo agente-heroe" aria-labelledby="agente-titulo">
        <div className="contenedor">
          <nav aria-label={P.ruta} className="ruta">
            <ol>
              <li>
                <Link href="/agentes" className="ruta__enlace">
                  {P.agentes}
                </Link>
              </li>
              <li aria-current="page">{a.nombre}</li>
            </ol>
          </nav>

          <div className="agente-heroe__fila">
            <div className="agente-heroe__texto">
              <Etiqueta tono="cielo">
                {a.area} · {a.abarca}
              </Etiqueta>
              <h1 id="agente-titulo" className="t-display">
                {a.nombre}
              </h1>
              <p className="t-intro">{a.lema}</p>
              <PlanesDelAgente agente={id} idioma={idioma} />
              <div className="agente-heroe__acciones">
                <Boton href={`/pruebalo?con=${id}`}>{P.hablale(a.nombre)}</Boton>
                <BotonFicha agente={id} className={claseBotonBase("sutil")}>
                  {P.verFicha}
                </BotonFicha>
              </div>
            </div>
            <div className="agente-heroe__escena">
              <Halo ancho="130%" proporcion="1 / 1" />
              <Personaje agente={id} className="agente-heroe__personaje" />
            </div>
          </div>
        </div>
      </section>

      {/* Su conversación de ejemplo completa */}
      <Seccion etiquetadaPor="agente-conversacion" espacio="normal">
        <EncabezadoSeccion
          id="agente-conversacion"
          etiqueta={P.conversacionEtiqueta(detalle.canal)}
          titulo={P.tituloConversacion[id]}
        />
        <MarcoNavegador
          className="agente-conversacion"
          titulo={d.paginaAgentes.conversacionCon(a.nombre)}
          pestanas={[{ etiqueta: `${a.nombre} · ${detalle.canal}`, adorno: <Personaje agente={id} avatar />, activa: true }]}
        >
          <ConversacionEjemplo agente={id} idioma={idioma} />
        </MarcoNavegador>
      </Seccion>

      {/* Todo lo que hace */}
      <Seccion etiquetadaPor="agente-funciones">
        <div className="columnas-asimetricas">
          <EncabezadoSeccion
            id="agente-funciones"
            alineacion="izquierda"
            etiqueta={P.queHace}
            titulo={P.todoLoQueHace(a.nombre)}
            texto={detalle.descripcion}
            className="agente-funciones__encabezado"
          />
          <ol className="funciones funciones--numeradas">
            {detalle.funciones.map((f, i) => (
              <li key={f.titulo} className="funciones__fila">
                <span className="funciones__numero" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="funciones__titulo">{f.titulo}</p>
                  <p className="t-cuerpo">{f.detalle}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Seccion>

      {/* Ideas para empezar (las mismas del chat) */}
      <Seccion etiquetadaPor="agente-ideas" fondo="fondo-2">
        <div className="agente-ideas">
          <EncabezadoSeccion
            id="agente-ideas"
            alineacion="izquierda"
            etiqueta={P.paraEmpezar}
            titulo={P.pidele(a.nombre)}
            texto={P.ideas}
            className="agente-ideas__encabezado"
          />
          <ul className="ideas">
            {a.sugerencias.map((s) => (
              <li key={s}>
                <Link href={`/pruebalo?con=${id}`} className="idea">
                  <Icono nombre="mensaje" tam={20} tono="cielo" />
                  <span className="idea__texto">{s}</span>
                  <Icono nombre="flecha" tam={16} className="idea__flecha" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Seccion>

      {/* En qué plan viene */}
      <Seccion etiquetadaPor="agente-planes">
        <EncabezadoSeccion
          id="agente-planes"
          etiqueta={P.planes}
          titulo={P.enQuePlan(a.nombre)}
          texto={enFree ? P.enLosTres(a.nombre) : P.llegaCon(a.nombre, minimo.nombre)}
        />
        <TarjetaVidrio relleno="ninguno" className="planes-fila">
          <ul className="planes-fila__lista">
            {planesDe(idioma).map((p) => {
              const incluido = p.agentes.includes(id);
              return (
                <li key={p.id} className="planes-fila__plan" data-incluido={incluido ? "true" : "false"}>
                  <div className="planes-fila__cabeza">
                    <p className="t-titulo">{p.nombre}</p>
                    {p.id === minimo.id ? <Etiqueta tono="cielo">{P.desdeAqui}</Etiqueta> : null}
                  </div>
                  <p className="t-chico">{p.resumen}</p>
                  <p className="planes-fila__estado">
                    <Icono nombre={incluido ? "check-circulo" : "cerrar"} tam={16} />
                    {incluido ? P.incluye(a.nombre) : P.noViene}
                  </p>
                </li>
              );
            })}
          </ul>
        </TarjetaVidrio>
        <div className="agentes-portada__acciones">
          <Boton href="/precios" variante="fantasma" flecha>
            {P.verPreciosPlanes}
          </Boton>
        </div>
      </Seccion>

      {/* El resto del equipo */}
      <Seccion etiquetadaPor="agente-equipo" className="agente-equipo">
        <EncabezadoSeccion id="agente-equipo" etiqueta={P.tuEquipo} titulo={P.otrosTres} />
        <ul className="equipo-enlaces">
          {otros.map((o) => (
            <li key={o.id}>
              <Link href={`/agentes/${o.id}`} className="equipo-enlace">
                <Personaje agente={o.id} className="equipo-enlace__personaje" />
                <span className="equipo-enlace__texto">
                  <span className="t-titulo">{o.nombre}</span>
                  <span className="etiqueta etiqueta--cielo">
                    {o.area} · {o.abarca}
                  </span>
                </span>
                <Icono nombre="flecha" tam={20} className="equipo-enlace__flecha" />
              </Link>
            </li>
          ))}
        </ul>
      </Seccion>
    </Sitio>
  );
}
