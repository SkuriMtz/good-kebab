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
import { DETALLE } from "@/components/agentes/detalle";
import { PlanesDelAgente } from "@/components/agentes/piezas";
import { AGENTE_POR_ID, AGENTES_INFO, IDS_AGENTES, esIdAgente, type IdAgente } from "@/lib/agentes";
import { PLANES, planMinimo } from "@/lib/planes";
import { metadatos } from "@/lib/seo";

/** Las cuatro páginas se generan al construir el sitio; otra dirección da 404. */
export const dynamicParams = false;
export function generateStaticParams() {
  return IDS_AGENTES.map((agente) => ({ agente }));
}

export function generateMetadata({ params }: { params: { agente: string } }): Metadata {
  if (!esIdAgente(params.agente)) return {};
  const a = AGENTE_POR_ID[params.agente];
  return metadatos(`${a.nombre} · ${a.area}`, `${a.nombre}, agente de ${a.area.toLowerCase()} de Atendel. ${a.lema}`);
}

/** Título de la conversación de ejemplo, según lo que pasa en ella (detalle.ts). */
const TITULO_CONVERSACION: Record<IdAgente, string> = {
  lola: "Así contesta Lola un WhatsApp",
  clara: "Así contesta Clara un correo",
  victor: "Así le da Víctor seguimiento a quien no agendó",
  iris: "Así le encargas trabajo a Iris",
};

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
  const a = AGENTE_POR_ID[id];
  const detalle = DETALLE[id];
  const minimo = planMinimo(id);
  const enFree = minimo.id === "free";
  const otros = AGENTES_INFO.filter((o) => o.id !== id);

  return (
    <Sitio>
      {/* Encabezado: el personaje es el protagonista */}
      <section className="seccion con-halo agente-heroe" aria-labelledby="agente-titulo">
        <div className="contenedor">
          <nav aria-label="Ruta" className="ruta">
            <ol>
              <li>
                <Link href="/agentes" className="ruta__enlace">
                  Agentes
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
              <PlanesDelAgente agente={id} />
              <div className="agente-heroe__acciones">
                <Boton href={`/pruebalo?con=${id}`}>Háblale a {a.nombre}</Boton>
                <BotonFicha agente={id} className={claseBotonBase("sutil")}>
                  Ver su ficha
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
          etiqueta={`Conversación de ejemplo · ${detalle.canal}`}
          titulo={TITULO_CONVERSACION[id]}
        />
        <MarcoNavegador
          className="agente-conversacion"
          titulo={`Conversación de ejemplo con ${a.nombre}`}
          pestanas={[{ etiqueta: `${a.nombre} · ${detalle.canal}`, adorno: <Personaje agente={id} avatar />, activa: true }]}
        >
          <ConversacionEjemplo agente={id} />
        </MarcoNavegador>
      </Seccion>

      {/* Todo lo que hace */}
      <Seccion etiquetadaPor="agente-funciones">
        <div className="columnas-asimetricas">
          <EncabezadoSeccion
            id="agente-funciones"
            alineacion="izquierda"
            etiqueta="Qué hace"
            titulo={`Todo lo que hace ${a.nombre}`}
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
            etiqueta="Para empezar"
            titulo={`Pídele algo a ${a.nombre}`}
            texto="Ideas de lo que le puedes pedir. Escríbeselas en el chat de prueba, como en cualquier chat."
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
          etiqueta="Planes"
          titulo={`En qué plan viene ${a.nombre}`}
          texto={
            enFree
              ? `${a.nombre} viene en los tres planes, también en el gratis: puedes empezar hoy.`
              : `${a.nombre} llega con ${minimo.nombre}. Mientras, puedes empezar gratis con Clara.`
          }
        />
        <TarjetaVidrio relleno="ninguno" className="planes-fila">
          <ul className="planes-fila__lista">
            {PLANES.map((p) => {
              const incluido = p.agentes.includes(id);
              return (
                <li key={p.id} className="planes-fila__plan" data-incluido={incluido ? "true" : "false"}>
                  <div className="planes-fila__cabeza">
                    <p className="t-titulo">{p.nombre}</p>
                    {p.id === minimo.id ? <Etiqueta tono="cielo">Desde aquí</Etiqueta> : null}
                  </div>
                  <p className="t-chico">{p.resumen}</p>
                  <p className="planes-fila__estado">
                    <Icono nombre={incluido ? "check-circulo" : "cerrar"} tam={16} />
                    {incluido ? `Incluye a ${a.nombre}` : "No viene en este plan"}
                  </p>
                </li>
              );
            })}
          </ul>
        </TarjetaVidrio>
        <div className="agentes-portada__acciones">
          <Boton href="/precios" variante="fantasma" flecha>
            Ver precios y lo que trae cada plan
          </Boton>
        </div>
      </Seccion>

      {/* El resto del equipo */}
      <Seccion etiquetadaPor="agente-equipo" className="agente-equipo">
        <EncabezadoSeccion id="agente-equipo" etiqueta="Tu equipo" titulo="Los otros tres agentes" />
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
