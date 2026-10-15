import type { Metadata } from "next";
import Link from "next/link";
import { Sitio } from "@/components/Sitio";
import { Boton, claseBotonBase } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { Icono } from "@/components/base/Iconos";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { BotonFicha } from "@/components/agentes/BotonFicha";
import { ConversacionEjemplo } from "@/components/agentes/ConversacionEjemplo";
import { IndiceAgentes } from "@/components/agentes/IndiceAgentes";
import { Personaje } from "@/components/agentes/Personaje";
import { DatosAgente, RetratoAgente, colorAgente } from "@/components/agentes/PiezasAgente";
import { DETALLE } from "@/components/agentes/detalle";
import { AGENTES_INFO } from "@/lib/agentes";

export const metadata: Metadata = { title: "Agentes" };

/*
 * /agentes: el equipo completo.
 * 1. Encabezado con los cuatro personajes de pie (cada uno lleva a su sección).
 * 2. Índice en píldoras pegado arriba que marca en qué agente vas.
 * 3. Una sección por agente (#lola, #clara, #victor, #iris) armada como la
 *    cabecera de un perfil: retrato, nombre, área y acciones; abajo, lo que
 *    hace y su conversación de ejemplo dentro del marco del producto.
 * 4. Acceso al chat.
 * "?ficha=lola" abre la ficha (lo resuelve FichasAgentes, en el Sitio).
 */
export default function Agentes() {
  return (
    <Sitio>
      <section className="agentes-cabeza con-halo" aria-labelledby="agentes-titulo">
        <Halo y="30%" ancho="min(880px, 120vw)" proporcion="16 / 9" />
        <div className="contenedor">
          <ul className="agentes-cabeza__equipo">
            {AGENTES_INFO.map((a) => (
              <li key={a.id}>
                <a href={`#${a.id}`} className="agentes-cabeza__agente" aria-label={`${a.nombre}, ${a.area}`}>
                  <Personaje agente={a.id} className="agentes-cabeza__personaje" />
                  <span className="agentes-cabeza__nombre" aria-hidden="true">
                    {a.nombre}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <Etiqueta className="agentes-cabeza__etiqueta">Tu equipo · 4 agentes</Etiqueta>
          <h1 id="agentes-titulo" className="t-grande agentes-cabeza__titulo">
            Lola contesta, Clara lleva tu correo, Víctor trae de regreso a tus clientes e Iris hace la oficina.
          </h1>
          <p className="t-intro agentes-cabeza__texto">
            Cada uno se encarga de un área de tu negocio. Abre su perfil para ver todo lo que hace, una conversación de
            ejemplo y en qué plan viene.
          </p>
          <div className="agentes-cabeza__acciones">
            <Boton href="/pruebalo">Habla con los agentes</Boton>
            <Boton href="/precios" variante="fantasma" flecha>
              Ver precios
            </Boton>
          </div>
        </div>
      </section>

      <IndiceAgentes />

      {AGENTES_INFO.map((a) => (
        <section key={a.id} id={a.id} className="agente-seccion" aria-labelledby={`${a.id}-titulo`}>
          <div className="contenedor">
            <header className="agente-seccion__cabeza">
              <RetratoAgente agente={a.id} tam="chico" />
              <div className="agente-seccion__identidad">
                <Etiqueta tono="tenue">
                  {a.area} · {a.abarca}
                </Etiqueta>
                <h2 id={`${a.id}-titulo`} className="t-seccion">
                  {a.nombre}
                </h2>
                <p className="agente-seccion__lema">{a.lema}</p>
              </div>
              <div className="agente-seccion__acciones">
                <Boton href={`/agentes/${a.id}`} variante="sutil" flecha>
                  Ver su perfil
                </Boton>
                <BotonFicha agente={a.id} className={claseBotonBase("fantasma")}>
                  Ver su ficha
                </BotonFicha>
              </div>
            </header>

            <div className="agente-seccion__cuerpo">
              <div className="agente-seccion__texto">
                <Etiqueta as="h3" tono="tenue">
                  Lo que hace
                </Etiqueta>
                <ul className="lista-check agente-seccion__lista">
                  {a.capacidades.map((c) => (
                    <li key={c} className="t-editorial">
                      <Icono nombre="check" tam={16} tono="cielo" />
                      {c}
                    </li>
                  ))}
                </ul>
                <p className="t-cuerpo agente-seccion__descripcion">{DETALLE[a.id].descripcion}</p>
                <DatosAgente agente={a.id} />
              </div>
              <MarcoNavegador
                titulo={`Conversación de ejemplo con ${a.nombre}`}
                pestanas={[{ etiqueta: `${a.nombre} · ${DETALLE[a.id].canal}`, adorno: <Personaje agente={a.id} avatar />, activa: true }]}
                relleno
              >
                <ConversacionEjemplo agente={a.id} />
              </MarcoNavegador>
            </div>
          </div>
        </section>
      ))}

      <section className="agentes-final" aria-labelledby="agentes-chat">
        <div className="contenedor agentes-final__caja">
          <span className="pila-agentes" aria-hidden="true">
            {AGENTES_INFO.map((a) => (
              <span key={a.id} className="pila-agentes__cara" style={colorAgente(a.id)}>
                <Personaje agente={a.id} avatar />
              </span>
            ))}
          </span>
          <h2 id="agentes-chat" className="t-seccion">
            Pruébalos en el chat
          </h2>
          <p className="t-intro">Escríbeles lo que necesitas, como en cualquier chat, o arma un grupo con los que quieras.</p>
          <div className="agentes-final__acciones">
            <Boton href="/pruebalo">Habla con los agentes</Boton>
            <Link href="/precios" className={claseBotonBase("fantasma")}>
              Ver precios
            </Link>
          </div>
        </div>
      </section>
    </Sitio>
  );
}
