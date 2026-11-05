import type { CSSProperties, ReactNode } from "react";
import { Icono } from "@/components/base/Iconos";
import { BarraBuscar, Enlace, Odometro, Pildoras, Tarjeta, TituloSeccion, Vacio } from "@/components/panel/Piezas";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { cambio, PERIODOS, sumarDias, type Dia, type Periodo } from "@/lib/estadisticas";
import { enlaceNegocio, lunesDe, type Cifra, type DatosNegocio, type DestinoNegocio } from "@/lib/estadisticas-negocio";
import { Calor } from "./Calor";
import { cifra, cuenta, DIAS_CORTOS, fechaConDia, lista, rangoTexto } from "./formato";
import { Grafica } from "./Grafica";
import "./negocio.css";

/* =====================================================================
   Estadísticas centradas en EL NEGOCIO (palabras del dueño), al estilo de
   Mercury: buscador ancho, título grande, periodo en píldoras, tarjetas de
   borde fino y una gráfica de área suave. Sirve igual para /panel (datos
   de cargarNegocio) y /pruebalo (datosNegocioEjemplo). Se pinta dentro de
   la columna de 768 px del armazón, con las piezas compartidas del panel
   (src/components/panel/Piezas.tsx).
   - Los agentes salen SOLO como crédito ("lo atendió Lola"), nunca en un
     ranking.
   - Todo se pica: un cliente lleva a Correo (?de=), un tema a Pendientes
     (?accion=), una hora o un día a la actividad (?hora=, ?dia=) y una
     cita a Citas. Los enlaces se arman con `base`.
   - Lo que no se guarda todavía muestra "—" y cómo se llena.
   - Sin funciones en las props de lo que corre en el navegador: se puede
     pintar desde una página del servidor.
   Animaciones (ANIMACIONES.md, puntos 2 a 5): tarjetas escalonadas,
   odómetro en las cifras, la línea que se dibuja y la cruz con burbuja.
   ===================================================================== */

export type PropsVistaNegocio = {
  datos: DatosNegocio;
  periodo: Periodo;
  /** Raíz de los enlaces: "/panel" o "/pruebalo". */
  base: string;
  /** Junto al rango de fechas (en /pruebalo, la insignia "Datos de ejemplo"). */
  insignia?: ReactNode;
};

const LOLA = "Se llena cuando conectes WhatsApp con Lola.";
const CLARA_O_LOLA = "Se llena cuando Clara lea tus correos o conectes WhatsApp con Lola.";
const nombre = (a: IdAgente | null) => (a ? AGENTE_POR_ID[a].nombre : null);

export function VistaNegocio({ datos, periodo, base, insignia }: PropsVistaNegocio) {
  const ir = (d: DestinoNegocio) => enlaceNegocio(d, base);
  const contra = PERIODOS.find((p) => p.id === periodo)?.contra ?? "";
  const { canales, serie } = datos;
  let orden = 0;
  const siguiente = () => orden++;

  const picoDia = serie && serie.actual.length ? serie.actual.indexOf(Math.max(...serie.actual)) : -1;
  const resumenGrafica =
    serie && picoDia >= 0
      ? `Clientes por día, ${rangoTexto(datos.actual.desde, datos.actual.hasta).toLowerCase()}. El día con más fue el ${fechaConDia(serie.dias[picoDia])}, con ${cuenta(serie.actual[picoDia], "cliente", "clientes")}. La línea punteada es el periodo anterior.`
      : "";
  const lunes = lunesDe(datos.hoy);

  return (
    <section className="neg" aria-labelledby="neg-titulo">
      <BarraBuscar texto="Busca un cliente, un tema o una cita" />

      <div className="neg-cabeza">
        <TituloSeccion
          id="neg-titulo"
          titulo={`Cómo va ${datos.negocio}`}
          texto={
            <span className="neg-rango">
              {insignia}
              <span>
                {rangoTexto(datos.actual.desde, datos.actual.hasta)} · {contra}
              </span>
            </span>
          }
          acciones={<Pildoras etiqueta="Periodo" activa={periodo} opciones={PERIODOS.map((p) => ({ id: p.id, etiqueta: p.etiqueta, href: ir({ tipo: "periodo", periodo: p.id }) }))} />}
        />
      </div>

      {datos.recortado && <p className="neg-aviso">Tienes mucho movimiento: los números más viejos pueden quedarse un poco cortos.</p>}

      <div className="neg-rejilla">
        {/* Clientes atendidos, con la gráfica (como el saldo de Mercury) */}
        <Tarjeta como="article" indice={siguiente()} className="neg-grande" etiqueta="Clientes atendidos">
          <div className="neg-grande__cabeza">
            <h2 className="neg-etiqueta">Clientes atendidos</h2>
            <Odometro valor={datos.clientes.valor} className="neg-cifra neg-cifra--grande" />
            <div className="neg-grande__fila">
              <Cambio cifra={datos.clientes} contra={contra} />
              {datos.clientes.nuevos !== null && (
                <p className="neg-detalle neg-detalle--fuerte">
                  <span className="neg-punto neg-punto--nuevo" aria-hidden="true" />
                  {cuenta(datos.clientes.nuevos, "nuevo", "nuevos")}
                  <span className="neg-punto" aria-hidden="true" />
                  {datos.clientes.regresan} {datos.clientes.regresan === 1 ? "regresa" : "regresan"}
                </p>
              )}
            </div>
            <p className="neg-credito">
              {canales.whatsapp
                ? "Por WhatsApp y correo. Los atendieron Lola y Clara."
                : canales.correo
                  ? "Por correo, los atendió Clara. WhatsApp se suma cuando conectes a Lola."
                  : CLARA_O_LOLA}
            </p>
          </div>

          {serie ? (
            <>
              <div className="neg-grande__leyenda" aria-hidden="true">
                <span>
                  <i className="neg-linea-ej" /> Clientes por día
                </span>
                <span>
                  <i className="neg-linea-ej neg-linea-ej--antes" /> Periodo anterior
                </span>
              </div>
              <Grafica
                key={`${periodo}-${datos.actual.hasta}`}
                dias={serie.dias}
                diasAntes={serie.diasAntes}
                actual={serie.actual}
                antes={serie.antes}
                una="cliente"
                varias="clientes"
                base={base}
                resumen={resumenGrafica}
              />
              <details className="neg-tabla">
                <summary>Ver los números por día</summary>
                <div className="neg-tabla__caja">
                  <table>
                    <caption className="pc-oculto">Clientes por día y el mismo día del periodo anterior</caption>
                    <thead>
                      <tr>
                        <th scope="col">Día</th>
                        <th scope="col">Clientes</th>
                        <th scope="col">Periodo anterior</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serie.dias.map((d, j) => (
                        <tr key={d}>
                          <th scope="row">
                            <Enlace href={ir({ tipo: "dia", dia: d })}>{fechaConDia(d)}</Enlace>
                          </th>
                          <td>{serie.actual[j]}</td>
                          <td>{serie.antes[j] ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          ) : (
            <div className="neg-grande__vacio">
              <Vacio icono="grafica" titulo="Todavía no hay clientes que contar" texto={CLARA_O_LOLA} />
            </div>
          )}
        </Tarjeta>

        {/* Los otros tres números: cada uno lleva a su sección */}
        <div className="neg-numeros">
          <Numero
            indice={siguiente()}
            href={ir({ tipo: "citas" })}
            titulo="Citas agendadas"
            cifra={datos.citas.agendadas}
            contra={contra}
            detalle={
              datos.citas.canceladas !== null ? `${cuenta(datos.citas.canceladas, "cancelada", "canceladas")} · ${cuenta(datos.citas.reagendadas ?? 0, "reagendada", "reagendadas")}` : LOLA
            }
            credito={canales.citas ? "Las agenda Lola." : null}
          />
          <Numero
            indice={siguiente()}
            href={ir({ tipo: "correo" })}
            titulo="Correos de clientes respondidos o resumidos"
            cifra={datos.correos}
            contra={contra}
            detalle={datos.correos.conAccion !== null ? `${cuenta(datos.correos.conAccion, "traía", "traían")} algo que hacer` : "Se llena cuando Clara lea tus correos."}
            credito={canales.correo ? "Los leyó Clara." : null}
          />
          <Numero
            indice={siguiente()}
            href={ir({ tipo: "actividad" })}
            titulo="Mensajes que tu equipo contestó por ti"
            cifra={datos.respuestas}
            contra={contra}
            detalle={
              datos.respuestas.conversaciones !== null
                ? `En ${cuenta(datos.respuestas.conversaciones, "conversación", "conversaciones")}${canales.whatsapp ? "" : " de tu chat del panel"}`
                : LOLA
            }
            credito={datos.respuestas.agentes.length ? `Contestó ${lista(datos.respuestas.agentes.map((a) => AGENTE_POR_ID[a].nombre))}.` : null}
          />
        </div>

        {/* Lo que más preguntan */}
        <Tarjeta como="article" indice={siguiente()} className="neg-caja" etiqueta="Lo que más preguntan tus clientes">
          <Cabeza titulo="Lo que más preguntan tus clientes" detalle={canales.whatsapp ? "Por WhatsApp y correo" : "Lo que Clara vio en sus correos"} />
          {datos.temas.length ? (
            <ul className="neg-filas">
              {datos.temas.map((t) => (
                <li key={t.texto}>
                  <Enlace href={ir({ tipo: "tema", accion: t.accion })} className="neg-fila">
                    <span className="neg-fila__texto">
                      <span className="neg-fila__nombre">
                        <span className="neg-fila__corta">{t.texto}</span>
                      </span>
                      {nombre(t.agente) && <span className="neg-credito">lo atendió {nombre(t.agente)}</span>}
                    </span>
                    <span className="neg-barra" aria-hidden="true">
                      <i style={{ transform: `scaleX(${t.total / datos.temas[0].total})` }} />
                    </span>
                    <span className="neg-fila__num">{t.total}</span>
                    <Icono nombre="chevron" tam={16} className="neg-fila__ir" />
                  </Enlace>
                </li>
              ))}
            </ul>
          ) : (
            <Vacio icono="mensaje" titulo={canales.correo ? "En este periodo nadie pidió algo" : "Todavía no hay temas"} texto={canales.correo ? undefined : CLARA_O_LOLA} />
          )}
        </Tarjeta>

        {/* Quién te escribe más */}
        <Tarjeta como="article" indice={siguiente()} className="neg-caja" etiqueta="Quién te escribe más">
          <Cabeza titulo="Quién te escribe más" />
          {datos.quienes.length ? (
            <ul className="neg-filas">
              {datos.quienes.map((c) => (
                <li key={c.clave}>
                  <Enlace href={ir({ tipo: "cliente", nombre: c.nombre, canal: c.canal })} className="neg-fila neg-fila--cliente">
                    <span className="neg-inicial" aria-hidden="true">
                      {c.nombre.trim().charAt(0).toLocaleUpperCase("es-MX")}
                    </span>
                    <span className="neg-fila__texto">
                      <span className="neg-fila__nombre">
                        <span className="neg-fila__corta">{c.nombre}</span>
                        {c.nuevo && <span className="neg-nuevo">Nuevo</span>}
                      </span>
                      <span className="neg-credito">
                        {c.canal === "whatsapp" ? "WhatsApp" : "Correo"}
                        {nombre(c.agente) && ` · lo atendió ${nombre(c.agente)}`}
                      </span>
                    </span>
                    <span className="neg-fila__num">{cuenta(c.total, "mensaje", "mensajes")}</span>
                    <Icono nombre="chevron" tam={16} className="neg-fila__ir" />
                  </Enlace>
                </li>
              ))}
            </ul>
          ) : (
            <Vacio icono="usuarios" titulo={canales.correo ? "En este periodo no te escribió nadie" : "Todavía no hay clientes"} texto={canales.correo ? undefined : CLARA_O_LOLA} />
          )}
        </Tarjeta>

        {/* Días y horas */}
        <Tarjeta como="article" indice={siguiente()} className="neg-caja neg-ancha" etiqueta="Días y horas con más movimiento">
          <Cabeza titulo="Días y horas con más movimiento" detalle={canales.whatsapp ? "Mensajes y correos de tus clientes" : "Tus correos y tu chat del panel"} />
          {datos.calor ? (
            <Calor calor={datos.calor} diasTop={datos.diasTop} horasTop={datos.horasTop} base={base} />
          ) : (
            <Vacio icono="reloj" titulo="Todavía no hay movimiento" texto="Se llena en cuanto tu equipo atienda algo." />
          )}
        </Tarjeta>

        {/* Citas de la semana */}
        <Tarjeta como="article" indice={siguiente()} className="neg-caja neg-ancha" etiqueta="Citas de esta semana">
          <Cabeza titulo="Citas de esta semana" detalle={rangoTexto(lunes, sumarDias(lunes, 6))} />
          {datos.semana ? (
            <Semana semana={datos.semana} hoy={datos.hoy} base={base} />
          ) : (
            <Vacio icono="calendario" titulo="Todavía no hay citas que contar" texto={LOLA} />
          )}
        </Tarjeta>
      </div>

      {datos.ahorro !== null && (
        <p className="neg-ahorro pc-entra" style={{ "--d": `${Math.min(240, orden * 40)}ms` } as CSSProperties}>
          <Icono nombre="rayo" tam={16} />
          <span>
            Tu equipo te ahorró <strong>{cifra(datos.ahorro)}</strong> {datos.ahorro === 1 ? "conversación" : "conversaciones"}
          </span>
          <span className="neg-ahorro__de">· {canales.whatsapp ? "chats de WhatsApp que atendió Lola y correos que leyó Clara" : "correos que leyó Clara"}</span>
        </p>
      )}
    </section>
  );
}

/* ---------- Piezas ---------- */

function Cabeza({ titulo, detalle }: { titulo: string; detalle?: string }) {
  return (
    <div className="neg-caja__cabeza">
      <h2 className="neg-caja__titulo">{titulo}</h2>
      {detalle && <p className="neg-detalle">{detalle}</p>}
    </div>
  );
}

function Cambio({ cifra: c, contra }: { cifra: Cifra; contra: string }) {
  const delta = cambio(c.valor, c.antes);
  if (delta === null) return c.valor === null ? null : <p className="neg-cambio neg-cambio--igual">Sin periodo anterior para comparar</p>;
  const tono = delta > 0 ? "sube" : delta < 0 ? "baja" : "igual";
  return (
    <p className={`neg-cambio neg-cambio--${tono}`}>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
        {tono === "igual" ? <path d="M3 8h10" /> : tono === "sube" ? <path d="M4.5 11.5l7-7M5.5 4.5h6v6" /> : <path d="M4.5 4.5l7 7M11.5 5.5v6h-6" />}
      </svg>
      <span className="pc-oculto">{tono === "sube" ? "Subió" : tono === "baja" ? "Bajó" : "Igual"}</span>
      {Math.abs(delta)} %<span className="neg-cambio__contra"> {contra}</span>
    </p>
  );
}

function Numero({
  indice,
  href,
  titulo,
  cifra: c,
  contra,
  detalle,
  credito,
}: {
  indice: number;
  href: string;
  titulo: string;
  cifra: Cifra;
  contra: string;
  detalle: string;
  credito: string | null;
}) {
  return (
    <Tarjeta href={href} indice={indice} className="neg-numero">
      <span className="neg-etiqueta">{titulo}</span>
      <Odometro valor={c.valor} className="neg-cifra neg-cifra--mediana" />
      <Cambio cifra={c} contra={contra} />
      <span className="neg-detalle">{detalle}</span>
      {credito && <span className="neg-credito">{credito}</span>}
      <Icono nombre="chevron" tam={16} className="neg-numero__ir" />
    </Tarjeta>
  );
}

function Semana({ semana, hoy, base }: { semana: { dia: Dia; citas: number }[]; hoy: Dia; base: string }) {
  const maximo = Math.max(1, ...semana.map((d) => d.citas));
  const total = semana.reduce((t, d) => t + d.citas, 0);
  return (
    <div className="neg-semana">
      <p className="neg-semana__total">
        <Odometro valor={total} className="neg-cifra neg-cifra--mediana" />
        <span className="neg-detalle">{total === 1 ? "cita" : "citas"} · las agenda Lola</span>
      </p>
      <ol className="neg-semana__barras">
        {semana.map((d, j) => (
          <li key={d.dia}>
            <Enlace
              href={enlaceNegocio({ tipo: "citas", dia: d.dia }, base)}
              className="neg-semana__dia"
              data-hoy={d.dia === hoy ? "" : undefined}
              data-pasado={d.dia < hoy ? "" : undefined}
              aria-label={`${fechaConDia(d.dia)}${d.dia === hoy ? " (hoy)" : ""}: ${cuenta(d.citas, "cita", "citas")}`}
            >
              <span className="neg-semana__num" aria-hidden="true">
                {d.citas}
              </span>
              <span className="neg-semana__pista" aria-hidden="true">
                <i style={{ transform: `scaleY(${d.citas / maximo})`, "--j": j } as CSSProperties} />
              </span>
              <span className="neg-semana__nombre" aria-hidden="true">
                {DIAS_CORTOS[j]}
              </span>
            </Enlace>
          </li>
        ))}
      </ol>
    </div>
  );
}
