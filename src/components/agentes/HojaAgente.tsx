import { Boton, claseBotonBase } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { BotonFicha } from "./BotonFicha";
import { ConversacionEjemplo } from "./ConversacionEjemplo";
import { Personaje } from "./Personaje";
import { PlanesDelAgente } from "./piezas";
import type { AgenteInfo } from "@/lib/agentes";
import { t, type Idioma } from "@/i18n";

/**
 * La sección profunda de un agente en /agentes (ancla #lola, #clara…):
 * arriba quién es (personaje, área, nombre y lo que hace en una línea) con
 * sus botones; abajo, en dos columnas que se alternan de lado, todo lo que
 * hace (lista con divisiones, como una lista de GitHub) y su conversación de
 * ejemplo dentro de la ventana del producto.
 */
export function HojaAgente({ agente: a, invertida = false, idioma = "es" }: { agente: AgenteInfo; invertida?: boolean; idioma?: Idioma }) {
  const d = t(idioma);
  const P = d.paginaAgentes;
  const detalle = d.detalle[a.id];
  return (
    <section id={a.id} aria-labelledby={`${a.id}-titulo`} className="seccion seccion--fondo hoja">
      <div className="contenedor">
        <header className="hoja__cabeza">
          <Personaje agente={a.id} className="hoja__personaje" />
          <div className="hoja__titulos">
            <Etiqueta tono="cielo">
              {a.area} · {a.abarca}
            </Etiqueta>
            <h2 id={`${a.id}-titulo`} className="t-seccion">
              {a.nombre}
            </h2>
            <p className="t-intro">{a.lema}</p>
          </div>
          <div className="hoja__acciones">
            <BotonFicha agente={a.id} className={claseBotonBase("sutil")}>
              {P.verFicha}
            </BotonFicha>
            <Boton href={`/agentes/${a.id}`} variante="fantasma" flecha>
              {P.suPagina}
            </Boton>
          </div>
        </header>

        <div className={`hoja__cuerpo${invertida ? " hoja__cuerpo--invertida" : ""}`}>
          <div className="hoja__texto">
            <p className="t-cuerpo">{detalle.descripcion}</p>
            <h3 className="etiqueta hoja__subtitulo">{P.todoLoQueHace}</h3>
            <ul className="funciones">
              {detalle.funciones.map((f) => (
                <li key={f.titulo} className="funciones__fila">
                  <p className="funciones__titulo">{f.titulo}</p>
                  <p className="t-cuerpo">{f.detalle}</p>
                </li>
              ))}
            </ul>
            <PlanesDelAgente agente={a.id} className="hoja__planes" idioma={idioma} />
          </div>
          <MarcoNavegador
            className="hoja__marco"
            titulo={P.conversacionCon(a.nombre)}
            pestanas={[{ etiqueta: `${a.nombre} · ${detalle.canal}`, adorno: <Personaje agente={a.id} avatar />, activa: true }]}
          >
            <ConversacionEjemplo agente={a.id} idioma={idioma} />
          </MarcoNavegador>
        </div>
      </div>
    </section>
  );
}
