import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { Icono } from "@/components/base/Iconos";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { BotonFicha } from "@/components/agentes/BotonFicha";
import { ConversacionEjemplo } from "@/components/agentes/ConversacionEjemplo";
import { IndiceLateral } from "@/components/agentes/IndiceLateral";
import { Personaje } from "@/components/agentes/Personaje";
import { DETALLE } from "@/components/agentes/detalle";
import { AGENTES_INFO, AGENTE_POR_ID, IDS_AGENTES, esIdAgente } from "@/lib/agentes";
import { PLANES, planMinimo } from "@/lib/planes";

type Props = { params: { agente: string } };

const cifra = new Intl.NumberFormat("es-MX");
/** Cómo se dice en una frase dónde pasa la conversación. */
const CANAL: Record<string, string> = { WhatsApp: "por WhatsApp", Correo: "por correo", "Chat con Iris": "en el chat" };

/** Las cuatro páginas se generan al compilar; cualquier otra dirección da 404. */
export const dynamicParams = false;
export function generateStaticParams() {
  return IDS_AGENTES.map((agente) => ({ agente }));
}

export function generateMetadata({ params }: Props): Metadata {
  if (!esIdAgente(params.agente)) return {};
  const a = AGENTE_POR_ID[params.agente];
  return { title: `${a.nombre} · ${a.area}`, description: `${a.nombre}, el agente de ${a.area.toLowerCase()} de Atendel: ${a.lema}` };
}

/*
 * La página de un agente, como un artículo de documentación: a la izquierda
 * los cuatro agentes (el actual abierto con sus secciones, resaltando la que
 * lees); a la derecha su personaje grande, qué es, todo lo que hace, la
 * conversación de ejemplo completa, en qué plan está, ideas para pedirle
 * algo y, al final, el anterior y el siguiente.
 */
export default function PaginaAgente({ params }: Props) {
  if (!esIdAgente(params.agente)) notFound();
  const id = params.agente;
  const a = AGENTE_POR_ID[id];
  const detalle = DETALLE[id];
  const minimo = planMinimo(id);
  const i = AGENTES_INFO.findIndex((x) => x.id === id);
  const anterior = AGENTES_INFO[(i - 1 + AGENTES_INFO.length) % AGENTES_INFO.length];
  const siguiente = AGENTES_INFO[(i + 1) % AGENTES_INFO.length];

  const indice = [
    { href: "/agentes", etiqueta: "Todos los agentes" },
    ...AGENTES_INFO.map((x) => ({
      href: `/agentes/${x.id}`,
      etiqueta: x.nombre,
      detalle: x.area,
      adorno: <Personaje agente={x.id} avatar />,
      actual: x.id === id,
      hijos:
        x.id === id
          ? [
              { href: "#que-hace", etiqueta: "Todo lo que hace" },
              { href: "#conversacion", etiqueta: "Conversación de ejemplo" },
              { href: "#plan", etiqueta: "En qué plan está" },
              { href: "#ideas", etiqueta: "Pídele algo así" },
            ]
          : undefined,
    })),
  ];

  return (
    <Sitio>
      <header className="perfil-ag con-halo">
        <div className="contenedor">
          <nav aria-label="Ruta" className="ruta-ag perfil-ag__ruta">
            <Link href="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <Link href="/agentes">Agentes</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{a.nombre}</span>
          </nav>
        </div>
        <div className="contenedor perfil-ag__fila">
            <Halo x="80%" y="45%" ancho="min(560px, 110vw)" suave />
            <div className="perfil-ag__texto">
              <Etiqueta tono="cielo">
                {a.area} · {a.abarca}
              </Etiqueta>
              <h1 id="agente-titulo" className="t-display mt-[var(--spacing-8)]">
                {a.nombre}
              </h1>
              <p className="t-intro mt-[var(--spacing-16)]">{a.lema}</p>
              <div className="perfil-ag__datos">
                <span className="pildora">{minimo.id === "free" ? "Incluida en Atendel Free" : `Viene con ${minimo.nombre}`}</span>
                {a.conectado ? <PuntoEstado tono="exito" etiqueta="Ya se conecta a tu correo" mostrarEtiqueta /> : null}
              </div>
              <div className="perfil-ag__acciones">
                <Boton href={`/pruebalo?con=${id}`}>Háblale a {a.nombre}</Boton>
                <BotonFicha agente={id} className="boton boton--sutil">
                  Ver su ficha
                </BotonFicha>
              </div>
            </div>
            <Personaje agente={id} className="perfil-ag__personaje" />
        </div>
      </header>
      <div className="docs-banda">
        <div className="contenedor docs docs--articulo">
          <aside className="docs__lateral">
            <IndiceLateral titulo="Agentes" elementos={indice} />
          </aside>

          <article className="docs__contenido" aria-labelledby="agente-titulo">
          <section aria-labelledby="que-es-titulo" className="docs__seccion">
            <h2 id="que-es-titulo" className="sr-only">
              Qué es {a.nombre}
            </h2>
            <p className="t-editorial perfil-ag__descripcion">{detalle.descripcion}</p>
          </section>

          <section id="que-hace" aria-labelledby="que-hace-titulo" className="docs__seccion">
            <h2 id="que-hace-titulo" className="t-seccion docs__h2">
              Todo lo que hace
            </h2>
            <dl className="ref-ag">
              {detalle.funciones.map((f) => (
                <div key={f.titulo} className="ref-ag__fila">
                  <dt>{f.titulo}</dt>
                  <dd>{f.detalle}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="conversacion" aria-labelledby="conversacion-titulo" className="docs__seccion">
            <h2 id="conversacion-titulo" className="t-seccion docs__h2">
              Conversación de ejemplo
            </h2>
            <p className="t-cuerpo docs__parrafo">
              Así se ve un ejemplo completo {CANAL[detalle.canal] ?? `por ${detalle.canal}`}, de principio a fin.
            </p>
            <MarcoNavegador
              titulo={`Conversación de ejemplo con ${a.nombre}`}
              pestanas={[{ etiqueta: `${a.nombre} · ${detalle.canal}`, adorno: <Personaje agente={id} avatar />, activa: true }]}
              relleno
            >
              <ConversacionEjemplo agente={id} />
            </MarcoNavegador>
          </section>

          <section id="plan" aria-labelledby="plan-titulo" className="docs__seccion">
            <h2 id="plan-titulo" className="t-seccion docs__h2">
              En qué plan está
            </h2>
            <p className="t-cuerpo docs__parrafo">
              {minimo.id === "free"
                ? `${a.nombre} viene en todos los planes, también en el gratis.`
                : `${a.nombre} llega con ${minimo.nombre}. Mientras, puedes empezar gratis con Clara.`}
            </p>
            <ul className="planes-ag">
              {PLANES.map((p) => {
                const incluido = p.agentes.includes(id);
                return (
                  <li key={p.id} className={`vidrio vidrio--relleno planes-ag__plan${p.id === minimo.id ? " vidrio--destacada" : ""}`} data-incluido={incluido ? "true" : "false"} data-desde={p.id === minimo.id ? "true" : undefined}>
                    <p className="planes-ag__cabeza">
                      <span className="t-caption">Atendel</span>
                      <span className="planes-ag__nombre">{p.nombre.replace("Atendel ", "")}</span>
                    </p>
                    <p className="planes-ag__estado">
                      {incluido ? <Icono nombre="check-circulo" tam={20} /> : <span aria-hidden="true">—</span>}
                      {incluido ? `Incluye a ${a.nombre}` : `Sin ${a.nombre}`}
                    </p>
                    <p className="t-chico">{p.resumen}</p>
                    <p className="planes-ag__mensajes cifras">{cifra.format(p.mensajesMes)} mensajes al mes en el chat</p>
                  </li>
                );
              })}
            </ul>
            <Boton href="/precios" variante="fantasma" className="boton--solo-texto planes-ag__enlace" flecha>
              Ver precios y planes
            </Boton>
          </section>

          <section id="ideas" aria-labelledby="ideas-titulo" className="docs__seccion">
            <h2 id="ideas-titulo" className="t-seccion docs__h2">
              Pídele algo así
            </h2>
            <p className="t-cuerpo docs__parrafo">Para empezar a hablar con {a.nombre} en el chat:</p>
            <ul className="ideas-ag">
              {a.sugerencias.map((s) => (
                <li key={s}>
                  <Link href={`/pruebalo?con=${id}`} className="ideas-ag__idea">
                    <Icono nombre="mensaje" tam={20} className="ideas-ag__icono" />
                    <span>{s}</span>
                    <Icono nombre="flecha" tam={16} className="flecha ideas-ag__flecha" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <nav aria-label="Otros agentes" className="pager-ag">
            <Link href={`/agentes/${anterior.id}`} className="pager-ag__enlace" rel="prev">
              <span className="etiqueta etiqueta--tenue">Anterior</span>
              <span className="pager-ag__nombre">
                <Icono nombre="flecha-izquierda" tam={16} className="flecha" />
                {anterior.nombre} · {anterior.area}
              </span>
            </Link>
            <Link href={`/agentes/${siguiente.id}`} className="pager-ag__enlace pager-ag__enlace--siguiente" rel="next">
              <span className="etiqueta etiqueta--tenue">Siguiente</span>
              <span className="pager-ag__nombre">
                {siguiente.nombre} · {siguiente.area}
                <Icono nombre="flecha" tam={16} className="flecha" />
              </span>
            </Link>
          </nav>
          </article>
        </div>
      </div>
    </Sitio>
  );
}
