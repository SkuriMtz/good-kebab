"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icono } from "@/components/base/Iconos";
import { cambio, type DatosTablero, type Destacada, type Tarjeta } from "@/lib/tablero";
import "./tablero.css";

/*
 * EL TABLERO: el resumen del negocio, lo primero al entrar. Filas que se
 * deslizan a los lados (con flechas y con el dedo) y se bajan; en cada fila
 * la tarjeta más importante va en grande. Arriba: el saludo, «Pídele algo a
 * Atendel» (una herramienta más, no toda la pantalla) y los accesos rápidos.
 */

const numero = new Intl.NumberFormat("es-MX");

/** La mini gráfica de los últimos días (con su resumen para lectores de pantalla). */
function Linea({ valores, titulo }: { valores: number[]; titulo: string }) {
  if (valores.length < 2) return null;
  const max = Math.max(1, ...valores);
  const ancho = 100;
  const alto = 32;
  const paso = ancho / (valores.length - 1);
  const puntos = valores.map((v, i) => [i * paso, alto - 2 - (v / max) * (alto - 6)] as const);
  const linea = puntos.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${linea} L${ancho} ${alto} L0 ${alto} Z`;
  return (
    <svg className="tb-linea" viewBox={`0 0 ${ancho} ${alto}`} preserveAspectRatio="none" role="img" aria-label={`${titulo}, últimos ${valores.length} días: ${valores.join(", ")}`}>
      <path d={area} className="tb-linea__area" />
      <path d={linea} className="tb-linea__trazo" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Cambio({ valor, antes }: { valor: number; antes: number | null }) {
  const c = cambio(valor, antes);
  if (c == null) return null;
  const sube = c > 0;
  const igual = c === 0;
  return (
    <span className="tb-cambio" data-sentido={igual ? "igual" : sube ? "sube" : "baja"}>
      <span aria-hidden="true">{igual ? "→" : sube ? "↗" : "↘"}</span> {Math.abs(c)} %<span className="sr-only"> {igual ? "igual que" : sube ? "más que" : "menos que"} la semana pasada</span>
    </span>
  );
}

/** Una fila que se desliza: flechas en compu, el dedo en el celular, y el teclado (cada tarjeta es un enlace). */
function Carril({ id, titulo, href, children }: { id: string; titulo: string; href?: string; children: ReactNode }) {
  const pista = useRef<HTMLUListElement>(null);
  const [lados, setLados] = useState({ izq: false, der: false });

  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    const medir = () => setLados({ izq: el.scrollLeft > 4, der: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => {
      el.removeEventListener("scroll", medir);
      obs.disconnect();
    };
  }, []);

  const mover = (dir: 1 | -1) => {
    const el = pista.current;
    if (!el) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: quieto ? "auto" : "smooth" });
  };

  return (
    <section className="tb-carril" aria-labelledby={`tb-${id}`} data-izq={lados.izq ? "" : undefined} data-der={lados.der ? "" : undefined}>
      <div className="tb-carril__cabeza">
        <h2 id={`tb-${id}`} className="tb-carril__titulo">
          {titulo}
        </h2>
        <div className="tb-carril__controles">
          {href ? (
            <a href={href} className="tb-carril__todo">
              Ver todo
            </a>
          ) : null}
          <button type="button" className="tb-flecha" aria-label={`Anteriores en ${titulo}`} disabled={!lados.izq} onClick={() => mover(-1)}>
            <Icono nombre="chevron-izquierda" tam={18} />
          </button>
          <button type="button" className="tb-flecha" aria-label={`Siguientes en ${titulo}`} disabled={!lados.der} onClick={() => mover(1)}>
            <Icono nombre="chevron-derecha" tam={18} />
          </button>
        </div>
      </div>
      <div className="tb-carril__marco">
        <ul ref={pista} className="tb-carril__pista">
          {children}
        </ul>
      </div>
    </section>
  );
}

function TarjetaDestacada({ d }: { d: Destacada }) {
  const contenido = (
    <>
      <span className="tb-destacada__etiqueta">
        {d.tono === "alerta" ? <Icono nombre="alerta" tam={14} /> : null}
        {d.etiqueta}
      </span>
      <span className="tb-destacada__titulo">{d.titulo}</span>
      {d.detalle ? <span className="tb-destacada__detalle">{d.detalle}</span> : null}
      <span className="tb-destacada__ir">
        {d.fuera ? (
          <>
            Leer en {d.fuera.nombre} <Icono nombre="flecha-arriba-derecha" tam={14} />
          </>
        ) : (
          <>
            Ver <Icono nombre="chevron-derecha" tam={14} />
          </>
        )}
      </span>
    </>
  );
  return (
    <li className="tb-destacada" data-tono={d.tono}>
      {d.fuera ? (
        <a href={d.href} target="_blank" rel="noopener noreferrer" className="tb-destacada__enlace">
          {contenido}
        </a>
      ) : (
        <a href={d.href} className="tb-destacada__enlace">
          {contenido}
        </a>
      )}
    </li>
  );
}

function TarjetaTablero({ t }: { t: Tarjeta }) {
  return (
    <li className="tb-tarjeta" data-grande={t.grande ? "" : undefined} data-tono={t.tono ?? "normal"}>
      <a href={t.href} className="tb-tarjeta__enlace">
        <span className="tb-tarjeta__cabeza">
          {t.app?.logo ? (
            // Los logos son SVG chicos de /public: no necesitan el optimizador de imágenes
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.app.logo} alt="" width={20} height={20} className="tb-tarjeta__logo" />
          ) : (
            <Icono nombre={t.icono} tam={18} />
          )}
          <span className="tb-tarjeta__titulo">{t.titulo}</span>
        </span>

        {t.cifra ? (
          <span className="tb-cifra">
            <span className="tb-cifra__fila">
              <span className="tb-cifra__valor">{numero.format(t.cifra.valor)}</span>
              <Cambio valor={t.cifra.valor} antes={t.cifra.antes} />
            </span>
            <span className="tb-cifra__etiqueta">{t.cifra.etiqueta}</span>
          </span>
        ) : null}

        {t.serie && t.serie.some((v) => v > 0) ? <Linea valores={t.serie} titulo={t.titulo} /> : null}

        {t.barras?.length ? (
          <span className="tb-barras">
            {t.barras.map((x) => (
              <span key={x.id} className="tb-barra" data-alto={x.pct >= 80 ? "" : undefined}>
                <span className="tb-barra__fila">
                  <span>{x.texto}</span>
                  <span className="tb-barra__pct">{x.pct} %</span>
                </span>
                <span className="tb-barra__riel" role="progressbar" aria-label={x.texto} aria-valuenow={x.pct} aria-valuemin={0} aria-valuemax={100}>
                  <span className="tb-barra__lleno" style={{ width: `${Math.max(2, Math.min(100, x.pct))}%` }} />
                </span>
              </span>
            ))}
          </span>
        ) : t.app ? (
          <span className="tb-app">
            {t.app.cuenta ? <span className="tb-app__cuenta">{t.app.cuenta}</span> : null}
            <span className="tb-app__estado" data-estado={t.app.estado}>
              <span className="tb-app__punto" aria-hidden="true" />
              {t.app.estado === "activa" ? "Conectada" : "Hay que volver a conectarla"}
            </span>
            {t.app.apps.length ? <span className="tb-app__apps">{t.app.apps.join(" · ")}</span> : null}
          </span>
        ) : t.renglones.length ? (
          <span className="tb-renglones">
            {t.renglones.map((r) => (
              <span key={r.id} className="tb-renglon">
                <span className="tb-renglon__texto">{r.texto}</span>
                {r.hora ? <span className="tb-renglon__hora">{r.hora}</span> : null}
              </span>
            ))}
          </span>
        ) : !t.cifra && t.vacio ? (
          <span className="tb-vacio">{t.vacio}</span>
        ) : null}

        <span className="tb-tarjeta__ir">
          Ver todo <Icono nombre="chevron-derecha" tam={14} />
        </span>
      </a>
    </li>
  );
}

export function Tablero({ datos, saludo, fecha, base }: { datos: DatosTablero; saludo: string; fecha: string; base: string }) {
  return (
    <div className="tb">
      <header className="tb-cabeza">
        <p className="tb-cabeza__fecha">{fecha}</p>
        <h1 className="tb-cabeza__saludo">{saludo}</h1>
        {/* Pedirle algo abre el chat con lo que escribiste, listo para mandar */}
        <form action={base} method="get" className="tb-pide" role="search">
          <label htmlFor="tb-pide" className="sr-only">
            Pídele algo a Atendel
          </label>
          <input id="tb-pide" name="pide" className="tb-pide__campo" placeholder="Pídele algo a Atendel…" maxLength={2000} autoComplete="off" required />
          <button type="submit" className="tb-pide__boton" aria-label="Pedir">
            <Icono nombre="enviar" tam={18} />
          </button>
        </form>
      </header>

      <nav className="tb-accesos" aria-label="Accesos rápidos">
        {datos.accesos.map((a) => (
          <a key={a.id} href={a.href} className="tb-acceso">
            <span className="tb-acceso__icono">
              <Icono nombre={a.icono} tam={20} />
            </span>
            <span className="tb-acceso__texto">{a.titulo}</span>
          </a>
        ))}
      </nav>

      {datos.destacadas.length ? (
        <Carril id="importante" titulo="Lo importante">
          {datos.destacadas.map((d) => (
            <TarjetaDestacada key={d.id} d={d} />
          ))}
        </Carril>
      ) : (
        <p className="tb-tranquilo">
          <Icono nombre="check-circulo" tam={18} /> Todo en orden: nada te necesita ahora.
        </p>
      )}

      {datos.filas.map((f) => (
        <Carril key={f.id} id={f.id} titulo={f.titulo} href={f.href}>
          {f.tarjetas.map((t) => (
            <TarjetaTablero key={t.id} t={t} />
          ))}
        </Carril>
      ))}
    </div>
  );
}
