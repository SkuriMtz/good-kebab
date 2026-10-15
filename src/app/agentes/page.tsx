import type { Metadata } from "next";
import Link from "next/link";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { Icono } from "@/components/base/Iconos";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { BotonFicha } from "@/components/agentes/BotonFicha";
import { ComparativaAgentes } from "@/components/agentes/ComparativaAgentes";
import { ConversacionEjemplo } from "@/components/agentes/ConversacionEjemplo";
import { IndiceLateral } from "@/components/agentes/IndiceLateral";
import { Personaje } from "@/components/agentes/Personaje";
import { TarjetasAgentes } from "@/components/agentes/TarjetasAgentes";
import { DETALLE } from "@/components/agentes/detalle";
import { AGENTES_INFO } from "@/lib/agentes";
import { planMinimo } from "@/lib/planes";

export const metadata: Metadata = {
  title: "Agentes",
  description: "Lola, Clara, Víctor e Iris: qué hace cada agente de Atendel, cómo habla y en qué plan está.",
};

/*
 * Agentes, como una página de documentación: arriba el equipo (cada
 * personaje abre su ficha); abajo, el índice fijo a la izquierda con la
 * sección activa resaltada y el contenido largo y ordenado a la derecha:
 * la tabla de quién hace qué, una sección por agente (#lola, #clara,
 * #victor, #iris) y el acceso al chat. "?ficha=lola" abre la ficha (lo
 * resuelve FichasAgentes, en el marco de cada página).
 */
export default function Agentes() {
  const indice = [
    { href: "#quien-hace-que", etiqueta: "Quién hace qué" },
    ...AGENTES_INFO.map((a) => ({ href: `#${a.id}`, etiqueta: a.nombre, detalle: a.area, adorno: <Personaje agente={a.id} avatar /> })),
    { href: "#chat", etiqueta: "Pruébalos en el chat" },
  ];

  return (
    <Sitio>
      <header className="ag-cabeza con-halo">
        <Halo x="78%" y="58%" ancho="min(720px, 120vw)" suave />
        <div className="contenedor ag-cabeza__fila">
          <div className="ag-cabeza__texto">
            <nav aria-label="Ruta" className="ruta-ag">
              <Link href="/">Inicio</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Agentes</span>
            </nav>
            <Etiqueta className="mt-[var(--spacing-24)]">Atención, Correo, Clientes y Oficina</Etiqueta>
            <h1 className="t-grande mt-[var(--spacing-12)]">¿Qué le encargas hoy?</h1>
            <p className="t-intro mt-[var(--spacing-16)]">
              Cuatro agentes, cada uno con un área de tu negocio. Aquí está todo lo que hace cada uno, una conversación de ejemplo y en
              qué plan está.
            </p>
            <div className="ag-cabeza__acciones">
              <Boton href="/pruebalo">Habla con los agentes</Boton>
              <Boton href="/precios" variante="fantasma" className="boton--solo-texto" flecha>
                Ver precios
              </Boton>
            </div>
          </div>
          <div className="ag-cabeza__equipo">
            <TarjetasAgentes />
            <p className="t-chico ag-cabeza__pista">Toca a cualquiera para abrir su ficha.</p>
          </div>
        </div>
      </header>

      <div className="docs-banda">
      <div className="contenedor docs">
        <aside className="docs__lateral">
          <IndiceLateral titulo="En esta página" elementos={indice} />
        </aside>

        <div className="docs__contenido">
          <section id="quien-hace-que" aria-labelledby="quien-hace-que-titulo" className="docs__seccion">
            <h2 id="quien-hace-que-titulo" className="t-seccion docs__h2">
              Quién hace qué
            </h2>
            <p className="t-cuerpo docs__parrafo">
              Cada agente se encarga de un área y trabaja con los demás. Esta tabla dice qué hace cada uno y con qué plan lo tienes.
            </p>
            <ComparativaAgentes />
            <aside className="nota-ag" aria-label="Nota">
              <p className="nota-ag__titulo">
                <Icono nombre="alerta" tam={16} />
                Para empezar
              </p>
              <p className="t-cuerpo">
                Con Atendel Free empiezas gratis con Clara. Lola llega con Atendel One; Víctor e Iris, con Atendel Max.
              </p>
            </aside>
          </section>

          {AGENTES_INFO.map((a) => {
            const detalle = DETALLE[a.id];
            const plan = planMinimo(a.id);
            return (
              <section key={a.id} id={a.id} aria-labelledby={`${a.id}-titulo`} className="docs__seccion">
                <header className="sec-ag__cabeza">
                  <Personaje agente={a.id} className="sec-ag__personaje" />
                  <div className="min-w-0">
                    <Etiqueta tono="cielo">
                      {a.area} · {a.abarca}
                    </Etiqueta>
                    <h2 id={`${a.id}-titulo`} className="t-seccion sec-ag__titulo">
                      {a.nombre}
                      <a href={`#${a.id}`} className="docs__ancla" aria-label={`Enlace directo a ${a.nombre}`}>
                        #
                      </a>
                    </h2>
                  </div>
                  <span className="pildora sec-ag__plan">{plan.id === "free" ? "Incluida en Free" : `Desde ${plan.nombre}`}</span>
                </header>

                <p className="t-intro docs__parrafo">{a.lema}</p>
                <p className="t-cuerpo docs__parrafo">{detalle.descripcion}</p>

                <h3 className="docs__h3">Lo que hace</h3>
                <ul className="ag-funciones">
                  {detalle.funciones.map((f) => (
                    <li key={f.titulo} className="ag-funcion">
                      <Icono nombre="check" tam={20} className="ag-funcion__icono" />
                      <div>
                        <p className="ag-funcion__titulo">{f.titulo}</p>
                        <p className="t-cuerpo">{f.detalle}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <h3 className="docs__h3">Conversación de ejemplo</h3>
                <MarcoNavegador
                  titulo={`Conversación de ejemplo con ${a.nombre}`}
                  pestanas={[{ etiqueta: `${a.nombre} · ${detalle.canal}`, adorno: <Personaje agente={a.id} avatar />, activa: true }]}
                  relleno
                >
                  <ConversacionEjemplo agente={a.id} encabezado={false} />
                </MarcoNavegador>

                <div className="sec-ag__acciones">
                  <Boton href={`/agentes/${a.id}`} variante="sutil" flecha>
                    Todo sobre {a.nombre}
                  </Boton>
                  <BotonFicha agente={a.id} className="boton boton--fantasma">
                    Ver su ficha
                  </BotonFicha>
                  <Boton href={`/pruebalo?con=${a.id}`} variante="fantasma" className="boton--solo-texto" flecha>
                    Háblale a {a.nombre}
                  </Boton>
                </div>
              </section>
            );
          })}

          <section id="chat" aria-labelledby="chat-titulo" className="docs__seccion cta-ag vidrio vidrio--relleno vidrio--relleno-amplio">
            <Etiqueta>El chat</Etiqueta>
            <h2 id="chat-titulo" className="t-seccion mt-[var(--spacing-12)]">
              Pruébalos en el chat.
            </h2>
            <p className="t-cuerpo docs__parrafo">
              Escríbeles lo que necesitas, como en cualquier chat, o arma un grupo con los que quieras.
            </p>
            <div className="sec-ag__acciones">
              <Boton href="/pruebalo">Habla con los agentes</Boton>
              <Boton href="/precios" variante="sutil" flecha>
                Ver precios
              </Boton>
            </div>
          </section>
        </div>
      </div>
      </div>
    </Sitio>
  );
}
