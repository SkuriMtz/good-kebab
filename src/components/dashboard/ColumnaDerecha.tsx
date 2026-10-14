"use client";

import Link from "next/link";
import { Avatar } from "@/components/base/Avatar";
import { BarraProgreso } from "@/components/base/BarraProgreso";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Kbd } from "@/components/base/Kbd";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { cambio, numero } from "./actividad";
import { MiniGrafica } from "./MiniGrafica";
import { CabezaSeccion, CaraAgente, DatosDeEjemplo, EnlaceAccion, Vacio } from "./piezas";
import type { Accion, Cita, Metrica, Negocio, Novedad, Recomendacion, Vacio as DatosVacio } from "./tipos";

/*
 * Columna derecha del resumen (abajo del centro en tableta y celular).
 * Una sola tarjeta (el negocio con el uso del plan); lo demás son secciones
 * sueltas separadas por aire y una línea fina, para no llenar de cajas.
 */

export function TarjetaNegocio({ negocio, ejemplo }: { negocio: Negocio; ejemplo: boolean }) {
  return (
    <section className="tb-caja tb-negocio" aria-labelledby="negocio-titulo">
      <div className="tb-negocio__cabeza">
        <Avatar nombre={negocio.nombre} tam={40} />
        <div className="tb-negocio__nombres">
          <h2 id="negocio-titulo" className="tb-negocio__nombre">
            {negocio.nombre}
          </h2>
          {negocio.giro ? <p className="tb-negocio__giro">{negocio.giro}</p> : null}
        </div>
      </div>
      <div className="tb-negocio__plan">
        <Insignia tono="azul">{negocio.plan}</Insignia>
        {ejemplo ? <DatosDeEjemplo /> : null}
        {negocio.accion ? (
          <EnlaceAccion accion={negocio.accion} className="tb-enlace tb-enlace--chico tb-negocio__enlace">
            {negocio.accion.etiqueta}
          </EnlaceAccion>
        ) : null}
      </div>
      <BarraProgreso etiqueta={negocio.uso.etiqueta} valor={negocio.uso.valor} max={negocio.uso.max} unidad="mensajes" detalle={negocio.uso.detalle} />
    </section>
  );
}

export function ProximasCitas({ citas, vacio, verAgenda }: { citas: Cita[] | null; vacio: DatosVacio; verAgenda?: Accion }) {
  const dias = citas ? Array.from(new Set(citas.map((c) => c.dia))) : [];
  return (
    <section className="tb-lado" aria-labelledby="citas-titulo">
      <CabezaSeccion id="citas-titulo" titulo="Próximas citas" accion={citas?.length ? verAgenda : undefined} />
      {citas && citas.length ? (
        dias.map((dia) => (
          <div key={dia} className="tb-citas__dia">
            <h3 className="tb-citas__fecha">{dia}</h3>
            <ul className="tb-citas">
              {citas
                .filter((c) => c.dia === dia)
                .map((c) => (
                  <li key={c.id} className="tb-cita">
                    <time className="tb-cita__hora cifras">{c.hora}</time>
                    <span className="tb-cita__texto">
                      <span className="tb-cita__cliente">{c.cliente}</span>
                      <span className="tb-cita__servicio">
                        {c.servicio}
                        {c.agente ? ` · agendó ${AGENTE_POR_ID[c.agente].nombre}` : ""}
                      </span>
                    </span>
                    {c.estado.tono !== "exito" ? (
                      <Insignia tono={c.estado.tono} conPunto className="tb-cita__estado">
                        {c.estado.texto}
                      </Insignia>
                    ) : (
                      <span className="sr-only">{c.estado.texto}</span>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))
      ) : (
        <Vacio vacio={vacio} icono="calendario" compacto />
      )}
    </section>
  );
}

export function Metricas({ metricas, titulo = "En 30 días" }: { metricas: Metrica[]; titulo?: string }) {
  if (!metricas.length) return null;
  return (
    <section className="tb-lado" aria-labelledby="metricas-titulo">
      <CabezaSeccion id="metricas-titulo" titulo={titulo} />
      <ul className="tb-metricas">
        {metricas.map((m) => {
          const c = cambio(m.valor, m.anterior);
          return (
            <li key={m.id} className="tb-metrica">
              <div className="tb-metrica__texto">
                <p className="tb-metrica__etiqueta">
                  {m.agente ? <CaraAgente id={m.agente} tam={20} /> : null}
                  {m.etiqueta}
                </p>
                <p className="tb-metrica__valor">
                  {numero(m.valor)}
                  {c ? (
                    <span className="tb-metrica__cambio" data-sube={c.porcentaje > 0 || undefined} data-baja={c.porcentaje < 0 || undefined}>
                      <Icono nombre="flecha-arriba-derecha" tam={12} />
                      {c.texto}
                      <span className="sr-only"> contra los {m.periodo} anteriores</span>
                    </span>
                  ) : null}
                </p>
              </div>
              {m.serie.some((v) => v > 0) ? (
                <MiniGrafica valores={m.serie} etiqueta={`${m.etiqueta}, por día`} className="tb-metrica__grafica" />
              ) : (
                <span className="tb-metrica__sin">Sin actividad</span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="tb-lado__nota">Comparado con los 30 días anteriores. Los últimos 7 días, en azul.</p>
    </section>
  );
}

export function Sugerencias({ lista }: { lista: Recomendacion[] }) {
  if (!lista.length) return null;
  return (
    <section className="tb-lado" aria-labelledby="sugerencias-titulo">
      <CabezaSeccion id="sugerencias-titulo" titulo="Sugerencias" />
      <ul className="tb-sugerencias">
        {lista.map((r) => (
          <li key={r.id} className="tb-sugerencia">
            {r.agente ? <CaraAgente id={r.agente} tam={24} /> : <Icono nombre="rayo" tam={20} className="tb-sugerencia__icono" />}
            <div className="tb-sugerencia__texto">
              <p>{r.texto}</p>
              {r.accion ? (
                <EnlaceAccion accion={r.accion} className="tb-enlace tb-enlace--chico">
                  {r.accion.etiqueta}
                  <Icono nombre="chevron-derecha" tam={14} />
                </EnlaceAccion>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Novedades({ lista }: { lista: Novedad[] }) {
  return (
    <section className="tb-lado" aria-labelledby="novedades-titulo">
      <CabezaSeccion id="novedades-titulo" titulo="Novedades de Atendel" />
      <ol className="tb-novedades">
        {lista.map((n) => (
          <li key={n.id} className="tb-novedad">
            <time className="tb-novedad__fecha cifras">{n.fecha}</time>
            <p className="tb-novedad__titulo">{n.titulo}</p>
            <p className="tb-novedad__texto">{n.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Ayuda() {
  return (
    <section className="tb-lado tb-ayuda" aria-labelledby="ayuda-titulo">
      <CabezaSeccion id="ayuda-titulo" titulo="Ayuda" />
      <ul className="tb-ayuda__atajos" aria-label="Atajos de teclado">
        <li>
          <Kbd>/</Kbd> Buscar citas, agentes o chats
        </li>
        <li>
          <Kbd>Esc</Kbd> Cerrar un menú o la búsqueda
        </li>
      </ul>
      <ul className="tb-ayuda__enlaces">
        <li>
          <Link href="/preguntas" className="tb-enlace tb-enlace--chico">
            <Icono nombre="ayuda" tam={16} />
            Preguntas frecuentes
          </Link>
        </li>
        <li>
          <Link href="/preguntas#seguridad" className="tb-enlace tb-enlace--chico">
            <Icono nombre="escudo" tam={16} />
            Tus datos y tu privacidad
          </Link>
        </li>
        <li>
          <Link href="/precios" className="tb-enlace tb-enlace--chico">
            <Icono nombre="facturacion" tam={16} />
            Planes y precios
          </Link>
        </li>
      </ul>
    </section>
  );
}
