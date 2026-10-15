import { Boton, claseBotonBase } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono } from "@/components/base/Iconos";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { Pestanas } from "@/components/base/Pestanas";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { TarjetaVidrio } from "@/components/base/TarjetaVidrio";
import { BotonFicha } from "@/components/agentes/BotonFicha";
import { ConversacionEjemplo } from "@/components/agentes/ConversacionEjemplo";
import { Personaje } from "@/components/agentes/Personaje";
import { DatosAgente, RetratoAgente, colorAgente } from "@/components/agentes/PiezasAgente";
import { DETALLE } from "@/components/agentes/detalle";
import { AGENTES_INFO } from "@/lib/agentes";

/**
 * 3. Los cuatro agentes (Grupo 3 · propuesta T2, "perfiles").
 * Una sola vista que cambia: pestañas en píldora compactas con la carita de
 * cada agente; al elegir una aparece su tarjeta de perfil en corto (retrato,
 * nombre, área, lo que hace, dónde trabaja y en qué plan viene) junto a su
 * conversación de ejemplo dentro del marco del producto. Lleva a su perfil
 * completo (/agentes/lola) y a su ficha.
 */
export function Agentes() {
  const pestanas = AGENTES_INFO.map((a) => ({
    id: a.id,
    etiqueta: a.nombre,
    adorno: <Personaje agente={a.id} avatar />,
    contenido: (
      <div className="agentes-inicio__panel">
        <TarjetaVidrio className="agentes-inicio__perfil">
          <div className="agentes-inicio__cabecera">
            <RetratoAgente agente={a.id} tam="chico" />
            <div>
              <h3 className="agentes-inicio__nombre">{a.nombre}</h3>
              <Etiqueta tono="tenue">
                {a.area} · {a.abarca}
              </Etiqueta>
            </div>
          </div>
          <p className="t-intro agentes-inicio__lema">{a.lema}</p>
          <ul className="lista-check agentes-inicio__lista">
            {a.capacidades.map((c) => (
              <li key={c} className="t-cuerpo">
                <Icono nombre="check" tam={16} tono="cielo" />
                {c}
              </li>
            ))}
          </ul>
          <DatosAgente agente={a.id} className="agentes-inicio__datos" />
          <div className="agentes-inicio__acciones">
            <Boton href={`/agentes/${a.id}`} variante="sutil" flecha>
              Ver el perfil de {a.nombre}
            </Boton>
            <BotonFicha agente={a.id} className={claseBotonBase("fantasma")}>
              Ver su ficha
            </BotonFicha>
          </div>
        </TarjetaVidrio>
        <MarcoNavegador
          titulo={`Conversación de ejemplo con ${a.nombre}`}
          pestanas={[{ etiqueta: `${a.nombre} · ${DETALLE[a.id].canal}`, adorno: <Personaje agente={a.id} avatar />, activa: true }]}
          relleno
          className="agentes-inicio__marco"
        >
          <ConversacionEjemplo agente={a.id} />
        </MarcoNavegador>
      </div>
    ),
  }));

  return (
    <Seccion id="agentes" etiquetadaPor="agentes-titulo">
      <EncabezadoSeccion
        id="agentes-titulo"
        adorno={
          <span className="pila-agentes">
            {AGENTES_INFO.map((a) => (
              <span key={a.id} className="pila-agentes__cara" style={colorAgente(a.id)}>
                <Personaje agente={a.id} avatar />
              </span>
            ))}
          </span>
        }
        etiqueta="Tu equipo"
        titulo="Cuatro agentes, cada uno con su parte del trabajo"
        texto="Atención, correo, clientes y oficina. Elige uno para ver qué hace y cómo les contesta a tus clientes."
      />
      <Pestanas etiqueta="Los agentes de Atendel" pestanas={pestanas} className="agentes-inicio" />
    </Seccion>
  );
}
