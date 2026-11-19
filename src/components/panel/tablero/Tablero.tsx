"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icono } from "@/components/base/Iconos";
import { cambio, type AppTablero, type DatosTablero, type Destacada, type Hoy, type Mosaico, type Tarjeta } from "@/lib/tablero";
import "./tablero.css";

/*
 * EL TABLERO: lo primero al entrar (el Chat es otra pestaña del menú). El
 * saludo, un banner con lo importante, los mosaicos de cada sección y las
 * secciones del negocio; a la derecha, lo que viene, los pendientes y tus
 * apps. Todo se acomoda según lo que tiene cada quien (src/lib/tablero.ts).
 */

const numero = new Intl.NumberFormat("es-MX");

/** El color suave de cada tarjeta, según de qué es. */
const TINTE: Record<string, string> = {
  whatsapp: "verde",
  correo: "azul",
  personas: "naranja",
  citas: "morado",
  viene: "amarillo",
  hecho: "verde",
  respuestas: "azul",
  uso: "gris",
};
const tinteDe = (t: Tarjeta) => (t.tono === "alerta" ? "alerta" : (TINTE[t.id] ?? "gris"));

function Mosaicos({ mosaicos }: { mosaicos: Mosaico[] }) {
  return (
    <nav className="tb-mosaicos" aria-label="Secciones">
      {mosaicos.map((m) => (
        <a key={m.id} href={m.href} className="tb-mosaico" data-color={m.color}>
          <span className="tb-mosaico__arte" aria-hidden="true">
            <Icono nombre={m.icono} tam={30} />
          </span>
          <span className="tb-mosaico__texto">
            <span className="tb-mosaico__titulo">{m.titulo}</span>
            <span className="tb-mosaico__dato">{m.dato}</span>
          </span>
          {m.cuenta ? (
            <span className="tb-mosaico__globo" aria-label={`${m.cuenta} pendientes`}>
              {m.cuenta > 99 ? "99+" : m.cuenta}
            </span>
          ) : null}
        </a>
      ))}
    </nav>
  );
}

/* ---------- La columna de hoy (con pestañas) ---------- */

/** Tus apps: cada cuenta conectada con su logo, su correo y si funciona. */
function TusApps({ lista, href }: { lista: AppTablero[]; href: string }) {
  return (
    <section className="tb-panel tb-apps">
      <div className="tb-panel__cabeza">
        <h2 className="tb-panel__titulo">Tus apps</h2>
        <a href={href} className="tb-panel__enlace">
          {lista.length ? "Ver todo" : "Conectar"}
        </a>
      </div>
      {lista.length ? (
        <ul className="tb-apps__lista">
          {lista.map((a) => (
            <li key={a.id}>
              <a href={href} className="tb-apps__fila">
                <span className="tb-apps__logo">
                  {a.logo ? (
                    // Logos chicos y fijos de /public
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.logo} alt="" width={20} height={20} />
                  ) : (
                    <Icono nombre="enlace" tam={16} />
                  )}
                </span>
                <span className="tb-apps__texto">
                  <span className="tb-apps__nombre">{a.nombre}</span>
                  {a.cuenta ? <span className="tb-apps__cuenta">{a.cuenta}</span> : null}
                </span>
                <span className="tb-apps__estado" data-estado={a.estado}>
                  <span className="tb-app__punto" aria-hidden="true" />
                  {a.estado === "activa" ? "Conectada" : "Reconectar"}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="tb-panel__vacio">Conecta tu correo, agenda, WhatsApp o cobros y Atendel podrá usarlos.</p>
      )}
    </section>
  );
}

function ColumnaHoy({ hoy, hrefTareas, children }: { hoy: Hoy; hrefTareas: string; children?: ReactNode }) {
  const [activa, setActiva] = useState(hoy.pestanas.find((p) => p.cuenta)?.id ?? hoy.pestanas[0]?.id);
  const pestana = hoy.pestanas.find((p) => p.id === activa) ?? hoy.pestanas[0];
  const mover = (dir: 1 | -1) => {
    const i = hoy.pestanas.findIndex((p) => p.id === activa);
    const sig = hoy.pestanas[(i + dir + hoy.pestanas.length) % hoy.pestanas.length];
    setActiva(sig.id);
    document.getElementById(`tb-pest-${sig.id}`)?.focus();
  };
  return (
    <aside className="tb-hoy" aria-label="Hoy">
      <section className="tb-panel">
        <div className="tb-panel__cabeza">
          <h2 className="tb-panel__titulo">Lo que viene</h2>
          <a href={hrefTareas} className="tb-panel__enlace">
            Ver tareas
          </a>
        </div>
        {hoy.viene.length ? (
          <ul className="tb-agenda">
            {hoy.viene.map((r) => (
              <li key={r.id} className="tb-agenda__fila">
                <span className="tb-agenda__punto" aria-hidden="true" />
                <span className="tb-agenda__texto">{r.texto}</span>
                {r.hora ? <span className="tb-agenda__hora">{r.hora}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="tb-panel__vacio">Nada programado. Pídele a Atendel algo que se repita.</p>
        )}
      </section>

      {pestana ? (
        <section className="tb-panel">
          <div className="tb-panel__cabeza">
            <h2 className="tb-panel__titulo">Pendientes</h2>
            <a href={pestana.href} className="tb-panel__enlace">
              Ver todo
            </a>
          </div>
          <div className="tb-pestanas" role="tablist" aria-label="Pendientes">
            {hoy.pestanas.map((p) => (
              <button
                key={p.id}
                id={`tb-pest-${p.id}`}
                type="button"
                role="tab"
                aria-selected={p.id === activa}
                aria-controls="tb-pest-panel"
                tabIndex={p.id === activa ? 0 : -1}
                className="tb-pestana"
                onClick={() => setActiva(p.id)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") mover(1);
                  if (e.key === "ArrowLeft") mover(-1);
                }}
              >
                {p.titulo}
                {p.cuenta ? <span className="tb-pestana__cuenta">{p.cuenta}</span> : null}
              </button>
            ))}
          </div>
          <div id="tb-pest-panel" role="tabpanel" aria-labelledby={`tb-pest-${pestana.id}`}>
            {pestana.renglones.length ? (
              <ul className="tb-lista">
                {pestana.renglones.map((r) => (
                  <li key={r.id}>
                    <a href={r.href ?? pestana.href} className="tb-lista__fila">
                      <span className="tb-lista__texto">{r.texto}</span>
                      {r.detalle ? <span className="tb-lista__detalle">{r.detalle}</span> : null}
                      {r.hora ? <span className="tb-lista__detalle">{r.hora}</span> : null}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="tb-panel__vacio">{pestana.vacio}</p>
            )}
          </div>
        </section>
      ) : null}
      {children}
    </aside>
  );
}

/* ---------- El banner de lo importante ---------- */

function Banner({ destacadas }: { destacadas: Destacada[] }) {
  const [i, setI] = useState(0);
  const total = destacadas.length;
  const actual = destacadas[Math.min(i, total - 1)];
  if (!actual) {
    return (
      <section className="tb-banner" data-tono="bien" aria-label="Lo importante">
        <div className="tb-banner__cuerpo">
          <span className="tb-banner__etiqueta">Todo en orden</span>
          <p className="tb-banner__titulo">Nada te necesita ahora.</p>
          <p className="tb-banner__detalle">Atendel sigue al pendiente de tus clientes, tu correo y tus apps. Si algo pide tu OK, aparece aquí.</p>
        </div>
      </section>
    );
  }
  return (
    <section className="tb-banner" data-tono={actual.tono} aria-roledescription="carrusel" aria-label="Lo importante">
      <div key={actual.id} className="tb-banner__cuerpo" aria-live="polite">
        <span className="tb-banner__etiqueta">
          {actual.tono === "alerta" ? <Icono nombre="alerta" tam={14} /> : null}
          {actual.etiqueta}
        </span>
        <p className="tb-banner__titulo">{actual.titulo}</p>
        {actual.detalle ? <p className="tb-banner__detalle">{actual.detalle}</p> : null}
        <a href={actual.href} className="tb-banner__boton">
          {actual.tono === "alerta" ? "Resolverlo" : "Ver"} <Icono nombre="chevron-derecha" tam={16} />
        </a>
      </div>
      {total > 1 ? (
        <div className="tb-banner__controles">
          <button type="button" className="tb-banner__flecha" aria-label="Anterior" onClick={() => setI((x) => (x - 1 + total) % total)}>
            <Icono nombre="chevron-izquierda" tam={18} />
          </button>
          <div className="tb-banner__puntos">
            {destacadas.map((d, n) => (
              <button key={d.id} type="button" className="tb-banner__punto" aria-label={`${n + 1} de ${total}`} aria-current={n === i ? "true" : undefined} onClick={() => setI(n)} />
            ))}
          </div>
          <button type="button" className="tb-banner__flecha" aria-label="Siguiente" onClick={() => setI((x) => (x + 1) % total)}>
            <Icono nombre="chevron-derecha" tam={18} />
          </button>
        </div>
      ) : null}
    </section>
  );
}

/* ---------- Las secciones ---------- */

function Linea({ valores, titulo }: { valores: number[]; titulo: string }) {
  if (valores.length < 2 || !valores.some((v) => v > 0)) return null;
  const max = Math.max(1, ...valores);
  const paso = 100 / (valores.length - 1);
  const linea = valores.map((v, i) => `${i ? "L" : "M"}${(i * paso).toFixed(1)} ${(30 - (v / max) * 26).toFixed(1)}`).join(" ");
  return (
    <svg className="tb-linea" viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-label={`${titulo}, últimos ${valores.length} días: ${valores.join(", ")}`}>
      <path d={`${linea} L100 32 L0 32 Z`} className="tb-linea__area" />
      <path d={linea} className="tb-linea__trazo" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Cambio({ valor, antes }: { valor: number; antes: number | null }) {
  const c = cambio(valor, antes);
  if (c == null) return null;
  const sentido = c === 0 ? "igual" : c > 0 ? "sube" : "baja";
  return (
    <span className="tb-cambio" data-sentido={sentido}>
      <span aria-hidden="true">{sentido === "igual" ? "→" : sentido === "sube" ? "↗" : "↘"}</span> {Math.abs(c)} %
      <span className="sr-only">{sentido === "igual" ? " igual que" : sentido === "sube" ? " más que" : " menos que"} la semana pasada</span>
    </span>
  );
}

function TarjetaTablero({ t }: { t: Tarjeta }) {
  return (
    <li className="tb-tarjeta" data-tinte={tinteDe(t)}>
      <a href={t.href} className="tb-tarjeta__enlace">
        <span className="tb-tarjeta__cabeza">
          <span className="tb-tarjeta__icono">
            {t.app?.logo ? (
              // Logos chicos y fijos de /public
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.app.logo} alt="" width={20} height={20} />
            ) : (
              <Icono nombre={t.icono} tam={18} />
            )}
          </span>
          <span className="tb-tarjeta__titulo">{t.titulo}</span>
          {t.tono === "alerta" ? <span className="tb-tarjeta__aviso">Atención</span> : null}
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

        {t.serie ? <Linea valores={t.serie} titulo={t.titulo} /> : null}

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
      </a>
    </li>
  );
}

/** Una sección: su título, «Ver todo» y sus tarjetas (si no caben, se deslizan con flechas o con el dedo). */
function Seccion({ id, titulo, href, children }: { id: string; titulo: string; href?: string; children: ReactNode }) {
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
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: quieto ? "auto" : "smooth" });
  };
  const desliza = lados.izq || lados.der;
  return (
    <section className="tb-seccion" aria-labelledby={`tb-${id}`} data-izq={lados.izq ? "" : undefined} data-der={lados.der ? "" : undefined}>
      <div className="tb-seccion__cabeza">
        <h2 id={`tb-${id}`} className="tb-seccion__titulo">
          {titulo}
        </h2>
        <div className="tb-seccion__controles">
          {desliza ? (
            <>
              <button type="button" className="tb-flecha" aria-label={`Anteriores en ${titulo}`} disabled={!lados.izq} onClick={() => mover(-1)}>
                <Icono nombre="chevron-izquierda" tam={18} />
              </button>
              <button type="button" className="tb-flecha" aria-label={`Siguientes en ${titulo}`} disabled={!lados.der} onClick={() => mover(1)}>
                <Icono nombre="chevron-derecha" tam={18} />
              </button>
            </>
          ) : null}
          {href ? (
            <a href={href} className="tb-seccion__todo">
              Ver todo <Icono nombre="chevron-derecha" tam={14} />
            </a>
          ) : null}
        </div>
      </div>
      <div className="tb-seccion__marco">
        <ul ref={pista} className="tb-seccion__pista">
          {children}
        </ul>
      </div>
    </section>
  );
}

/**
 * La transición (ver tablero.css, «Aparecen»): cada pieza aparece suave al
 * entrar a la pantalla, una tras otra. Nada se esconde si hay «reducir
 * movimiento» o si no hay IntersectionObserver.
 */
function useTransicion() {
  const raiz = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = raiz.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches || el.closest(".pc")?.getAttribute("data-movimiento") === "reducido";
    if (quieto) return;
    el.classList.add("tb--anima");
    const piezas = [...el.querySelectorAll<HTMLElement>(".tb-banner, .tb-mosaicos, .tb-hoy > *, .tb-secciones > *")];
    const ver = new IntersectionObserver(
      (entradas) => {
        entradas
          .filter((e) => e.isIntersecting)
          .forEach((e, n) => {
            const pieza = e.target as HTMLElement;
            pieza.style.setProperty("--tb-retraso", `${n * 90}ms`);
            pieza.classList.add("tb-visto");
            ver.unobserve(pieza);
          });
      },
      { threshold: 0.06 },
    );
    for (const p of piezas) {
      p.classList.add("tb-aparece");
      ver.observe(p);
    }
    return () => {
      ver.disconnect();
      el.classList.remove("tb--anima");
      for (const p of piezas) p.classList.remove("tb-aparece", "tb-visto");
    };
  }, []);
  return raiz;
}

export function Tablero({ datos, saludo, fecha, base }: { datos: DatosTablero; saludo: string; fecha?: string; base: string }) {
  const raiz = useTransicion();
  return (
    <div className="tb" ref={raiz}>
      <header className="tb-cabeza">
        <h1 className="tb-cabeza__saludo">{saludo}</h1>
        {fecha ? <p className="tb-cabeza__fecha">{fecha}</p> : null}
      </header>
      <div className="tb-cuerpo">
        <Banner destacadas={datos.destacadas} />
        {datos.mosaicos.length ? <Mosaicos mosaicos={datos.mosaicos} /> : null}
        <ColumnaHoy hoy={datos.hoy} hrefTareas={`${base}?vista=tareas`}>
          <TusApps lista={datos.apps.lista} href={datos.apps.href} />
        </ColumnaHoy>
        <div className="tb-secciones">
          {datos.filas.map((f) => (
            <Seccion key={f.id} id={f.id} titulo={f.titulo} href={f.href}>
              {f.tarjetas.map((t) => (
                <TarjetaTablero key={t.id} t={t} />
              ))}
            </Seccion>
          ))}
        </div>
      </div>
    </div>
  );
}
