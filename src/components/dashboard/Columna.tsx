"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/base/Avatar";
import { BarraProgreso } from "@/components/base/BarraProgreso";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { useTablero } from "./contexto";
import { MarcaAgente } from "./Marcas";
import { Ir } from "./Resumen";
import type { Cita, Destino, Metrica, Novedad } from "./tipos";

/* =====================================================================
   Columna derecha del Resumen: tu negocio y tu plan, próximas citas,
   números, un consejo, novedades, ayuda y el pie. Se alternan tarjetas
   y secciones sin caja para que no sea una pila de cuadros.
   ===================================================================== */

export function TarjetaNegocio({
  negocio,
  detalle,
  plan,
  usados,
  limite,
  mes,
  renueva,
  enlace,
}: {
  negocio: string;
  detalle: string;
  plan: string;
  usados: number;
  limite: number;
  mes: string;
  renueva: string;
  enlace?: Destino & { etiqueta: string };
}) {
  const quedan = Math.max(0, limite - usados);
  return (
    <section className="tarjeta-app negocio" aria-labelledby="negocio-nombre">
      <div className="negocio__cabeza">
        <Avatar nombre={negocio} tam={40} />
        <div className="negocio__texto">
          <h2 id="negocio-nombre" className="t-app-mediano">
            {negocio}
          </h2>
          <p>{detalle}</p>
        </div>
      </div>
      <div className="negocio__plan">
        <Insignia tono="azul">{plan}</Insignia>
      </div>
      <BarraProgreso
        etiqueta={`Mensajes de ${mes}`}
        valor={usados}
        max={limite}
        unidad="mensajes"
        detalle={
          <span suppressHydrationWarning>
            {quedan ? `Te quedan ${quedan.toLocaleString("es-MX")}. ` : "Llegaste al límite del mes. "}Se renueva el {renueva}.
          </span>
        }
      />
      {enlace ? (
        <Ir destino={enlace} className="columna__enlace">
          {enlace.etiqueta}
          <Icono nombre="chevron-derecha" tam={16} />
        </Ir>
      ) : null}
    </section>
  );
}

export function ProximasCitas({ citas, nota, vacio }: { citas: Cita[]; nota?: ReactNode; vacio?: ReactNode }) {
  return (
    <section className="columna__seccion" aria-labelledby="citas-titulo">
      <div className="columna__cabeza">
        <h2 id="citas-titulo" className="t-app-mediano">
          Próximas citas
        </h2>
        {nota}
      </div>
      {citas.length ? (
        <ol className="citas">
          {citas.map((c) => (
            <li key={c.id} className="cita">
              <span className="cita__hora">
                <span className="cifras">{c.hora}</span>
                <span className="cita__dia">{c.cuando}</span>
              </span>
              <span className="cita__texto">
                <span className="cita__quien">{c.quien}</span>
                <span className="cita__servicio">{c.servicio}</span>
                <PuntoEstado tono={c.tono} etiqueta={c.estado} mostrarEtiqueta />
              </span>
            </li>
          ))}
        </ol>
      ) : (
        vacio
      )}
    </section>
  );
}

export function Metricas({ titulo, nota, metricas }: { titulo: string; nota?: ReactNode; metricas: Metrica[] }) {
  return (
    <section className="columna__seccion" aria-labelledby="metricas-titulo">
      <div className="columna__cabeza">
        <h2 id="metricas-titulo" className="t-app-mediano">
          {titulo}
        </h2>
      </div>
      <dl className="metricas">
        {metricas.map((m) => (
          <div key={m.id} className="metrica">
            <dt>{m.etiqueta}</dt>
            <dd className="metrica__valor">{m.valor}</dd>
            {m.cambio ? (
              <dd className="metrica__cambio">
                <Insignia tono={m.tonoCambio ?? "neutra"}>{m.cambio}</Insignia>
              </dd>
            ) : null}
            {m.nota ? <dd className="metrica__nota">{m.nota}</dd> : null}
          </div>
        ))}
      </dl>
      {nota ? <p className="columna__nota">{nota}</p> : null}
    </section>
  );
}

export function Consejo({ agente, texto, accion }: { agente: IdAgente; texto: string; accion: Destino & { etiqueta: string } }) {
  return (
    <section className="tarjeta-app consejo" aria-labelledby="consejo-titulo">
      <div className="consejo__cabeza">
        <MarcaAgente agente={agente} />
        <h2 id="consejo-titulo" className="consejo__titulo">
          Pruébale esto a {AGENTE_POR_ID[agente].nombre}
        </h2>
      </div>
      <p className="consejo__texto">«{texto}»</p>
      {accion.href ? (
        <Boton href={accion.href} variante="fantasma" tam="compacto" flecha className="consejo__boton">
          {accion.etiqueta}
        </Boton>
      ) : (
        <Boton variante="fantasma" tam="compacto" flecha className="consejo__boton" onClick={accion.alElegir}>
          {accion.etiqueta}
        </Boton>
      )}
    </section>
  );
}

/** Novedades de Atendel: línea con puntos, como "Latest changes". */
export function Novedades({ novedades }: { novedades: Novedad[] }) {
  return (
    <section className="columna__seccion" aria-labelledby="novedades-titulo">
      <div className="columna__cabeza">
        <h2 id="novedades-titulo" className="t-app-mediano">
          Novedades de Atendel
        </h2>
      </div>
      <ol className="novedades">
        {novedades.map((n) => (
          <li key={n.id} className="novedad">
            <p className="novedad__titulo">{n.titulo}</p>
            <p className="novedad__texto">{n.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Ayuda({ extra }: { extra?: ReactNode }) {
  const { abrirAtajos, abrirPaleta } = useTablero();
  return (
    <section className="columna__seccion ayuda" aria-labelledby="ayuda-titulo">
      <h2 id="ayuda-titulo" className="columna__titulo-chico">
        Ayuda
      </h2>
      <ul className="ayuda__lista">
        <li>
          <button type="button" className="ayuda__enlace ayuda__solo-teclado" onClick={abrirAtajos}>
            <Icono nombre="rayo" tam={16} />
            Atajos de teclado
          </button>
        </li>
        <li>
          <button type="button" className="ayuda__enlace" onClick={abrirPaleta}>
            <Icono nombre="buscar" tam={16} />
            Buscar en Atendel
          </button>
        </li>
        <li>
          <Link href="/preguntas" className="ayuda__enlace">
            <Icono nombre="ayuda" tam={16} />
            Preguntas frecuentes
          </Link>
        </li>
        <li>
          <Link href="/preguntas#seguridad" className="ayuda__enlace">
            <Icono nombre="escudo" tam={16} />
            Tus datos y tu seguridad
          </Link>
        </li>
        {extra}
      </ul>
    </section>
  );
}

export function PieMinimo() {
  return (
    <footer className="pie-app">
      <span suppressHydrationWarning>© {new Date().getFullYear()} Atendel</span>
      <Link href="/precios">Precios</Link>
      <Link href="/preguntas">Preguntas</Link>
      <Link href="/preguntas#seguridad">Tus datos</Link>
      <Link href="/para-quien-es">Para quién es</Link>
    </footer>
  );
}
