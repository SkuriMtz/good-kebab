import Link from "next/link";
import { Boton, claseBotonBase } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { Pestanas } from "@/components/base/Pestanas";
import { BotonFicha } from "./BotonFicha";
import { ConversacionEjemplo } from "./ConversacionEjemplo";
import { DETALLE } from "./detalle";
import { Personaje } from "./Personaje";
import { DatosAgente, EquipoAgente, FuncionesAgente, PlanesAgente, PresentacionAgente, RetratoAgente } from "./PiezasAgente";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";

/**
 * La página de un agente como un perfil: a la izquierda su columna (el
 * personaje grande en su retrato redondo, nombre, área, lo que hace en una
 * línea, la acción para hablarle, sus datos y con quién trabaja); a la
 * derecha, pestañas en píldora "Lo que hace · Ejemplo · Plan".
 * En celular la columna se vuelve una cabecera (retrato junto al nombre).
 */
export function PerfilAgente({ agente }: { agente: IdAgente }) {
  const info = AGENTE_POR_ID[agente];
  const detalle = DETALLE[agente];

  const pestanas = [
    {
      id: "hace",
      etiqueta: (
        <>
          Lo que hace
          <span className="perfil__contador" aria-hidden="true">
            {detalle.funciones.length}
          </span>
        </>
      ),
      contenido: (
        <div className="perfil__panel">
          <PresentacionAgente agente={agente} />
          <FuncionesAgente agente={agente} />
        </div>
      ),
    },
    {
      id: "ejemplo",
      etiqueta: "Ejemplo",
      contenido: (
        <div className="perfil__panel">
          <MarcoNavegador
            titulo={`Conversación de ejemplo con ${info.nombre}`}
            pestanas={[{ etiqueta: `${info.nombre} · ${detalle.canal}`, adorno: <Personaje agente={agente} avatar />, activa: true }]}
            relleno
          >
            <ConversacionEjemplo agente={agente} />
          </MarcoNavegador>
          <p className="perfil__sigue">
            ¿Quieres ver cómo contesta a lo que tú le escribes?{" "}
            <Link href={`/pruebalo?con=${agente}`} className="enlace-agente">
              Escríbele en el chat
              <Icono nombre="flecha" tam={16} />
            </Link>
          </p>
        </div>
      ),
    },
    {
      id: "plan",
      etiqueta: "Plan",
      contenido: (
        <div className="perfil__panel">
          <PlanesAgente agente={agente} />
          <p className="perfil__sigue">
            Precios, mensajes al mes y lo que trae cada plan, lado a lado.{" "}
            <Link href="/precios" className="enlace-agente">
              Comparar planes
              <Icono nombre="flecha" tam={16} />
            </Link>
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="contenedor perfil">
      <nav aria-label="Ruta" className="perfil__ruta">
        <Link href="/agentes">Agentes</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{info.nombre}</span>
      </nav>

      <div className="perfil__rejilla">
        <aside className="perfil__lateral" aria-labelledby="perfil-nombre">
          <div className="perfil__cabecera">
            <RetratoAgente agente={agente} tam="perfil" className="perfil__retrato" />
            <div className="perfil__identidad">
              <h1 id="perfil-nombre" className="perfil__nombre">
                {info.nombre}
              </h1>
              <p className="perfil__area">
                {info.area} · {info.abarca}
              </p>
            </div>
          </div>
          <p className="perfil__lema">{info.lema}</p>
          <div className="perfil__acciones">
            <Boton href={`/pruebalo?con=${agente}`} bloque>
              Háblale a {info.nombre}
            </Boton>
            <BotonFicha agente={agente} className={claseBotonBase("sutil", "normal", true)}>
              Ver su ficha
            </BotonFicha>
          </div>
          <DatosAgente agente={agente} className="perfil__datos" />
        </aside>

        <div className="perfil__principal">
          <Pestanas etiqueta={`Sobre ${info.nombre}`} alineacion="izquierda" pestanas={pestanas} />
        </div>

        <div className="perfil__equipo">
          <EquipoAgente agente={agente} />
        </div>
      </div>
    </div>
  );
}
