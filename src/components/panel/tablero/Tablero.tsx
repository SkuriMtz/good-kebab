"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import PromptBar from "@/components/PromptBar";
import { Icono } from "@/components/base/Iconos";
import { Marca } from "@/components/Logo";
import { cambio, PEDIDO_TABLERO, type DatosTablero, type Destacada, type Hoy, type Mosaico, type NoticiaTablero, type Tarjeta } from "@/lib/tablero";
import { FragmentosInicio } from "../FragmentosInicio";
import "./tablero.css";

/*
 * EL TABLERO: lo primero al entrar. Arriba, al centro, la IA (el corazón de
 * Atendel): «¿En qué te ayudo hoy?» y su caja; al mandar, Atendel empieza en
 * el chat. Luego las herramientas, un banner con lo importante y las
 * secciones del negocio (tarjetas del mismo tamaño, que se deslizan si no
 * caben). Todo se acomoda según lo que tiene cada quien (src/lib/tablero.ts).
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

/* ---------- La IA: la barra de Atendel, con sus fragmentos ---------- */

/** Pedidos de un toque (van directo a la IA). */
// Tres, no más (ley de Hick): lo de «cómo voy» ya lo enseña el Tablero al bajar
const SUGERENCIAS = ["Dame el informe de hoy", "Contesta a mis clientes de hoy", "Agenda una cita"];

function useMandarAIA(base: string) {
  const router = useRouter();
  return (texto: string) => {
    const t = texto.trim();
    if (!t) return;
    if (base === "/panel") {
      // Se guarda en esta pestaña y el chat lo manda al abrir (nunca va en la dirección)
      try {
        sessionStorage.setItem(PEDIDO_TABLERO, t.slice(0, 4000));
        router.push("/panel?vista=chat");
        return;
      } catch {
        /* sin almacenamiento: abre el chat con el texto escrito */
      }
    }
    router.push(`${base}?pide=${encodeURIComponent(t.slice(0, 2000))}`);
  };
}

function Heroe({ saludo, base }: { saludo: string; base: string }) {
  const mandar = useMandarAIA(base);
  return (
    <section className="pc-inicio tb-heroe" aria-label="Pídele algo a Atendel">
      <FragmentosInicio />
      <div className="pc-inicio__centro tb-heroe__centro">
        <h1 className="pc-saludo">
          <Marca className="pc-saludo__marca pc-logo-entra" />
          <span>{saludo}</span>
        </h1>
        <div className="pc-inicio__caja">
          <PromptBar className="pc-caja" placeholder="Pídele algo a Atendel…" forma="fila" sources={[]} models={[]} efforts={[]} onSend={(t) => mandar(t)} maxRows={8} sparkBoost={0} dictarPronto />
        </div>
        <div className="tb-sugerencias">
          {SUGERENCIAS.map((s) => (
            <button key={s} type="button" className="tb-sugerencia" onClick={() => mandar(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Mosaicos (como Toddle) ---------- */

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
    <section className="tb-banner" data-tono={actual.tono} data-foto={actual.foto ? "" : undefined} aria-roledescription="carrusel" aria-label="Lo importante">
      {actual.foto ? (
        <>
          {/* La foto de la nota (guardada en Storage por el servidor); si no carga, se quita */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={`f-${actual.id}`} className="tb-banner__foto" src={actual.foto} alt="" referrerPolicy="no-referrer" decoding="async" onError={(e) => (e.currentTarget.hidden = true)} />
          {actual.fuera ? <span className="tb-banner__credito">Foto: {actual.fuera.nombre}</span> : null}
        </>
      ) : null}
      <div key={actual.id} className="tb-banner__cuerpo" aria-live="polite">
        <span className="tb-banner__etiqueta">
          {actual.tono === "alerta" ? <Icono nombre="alerta" tam={14} /> : null}
          {actual.etiqueta}
        </span>
        <p className="tb-banner__titulo">{actual.titulo}</p>
        {actual.detalle ? <p className="tb-banner__detalle">{actual.detalle}</p> : null}
        {actual.fuera ? (
          <a href={actual.href} target="_blank" rel="noopener noreferrer" className="tb-banner__boton">
            Leer en {actual.fuera.nombre} <Icono nombre="flecha-arriba-derecha" tam={16} />
          </a>
        ) : (
          <a href={actual.href} className="tb-banner__boton">
            {actual.tono === "alerta" ? "Resolverlo" : "Ver"} <Icono nombre="chevron-derecha" tam={16} />
          </a>
        )}
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
 * Las noticias de tu industria, si las guardadas no son de hoy: se piden
 * después de abrir (la búsqueda tarda). null mientras se buscan.
 */
function useNoticias(alDia: boolean): NoticiaTablero[] | null {
  const [nuevas, setNuevas] = useState<NoticiaTablero[] | null>(null);
  useEffect(() => {
    if (alDia) return;
    const control = new AbortController();
    fetch("/api/tablero/noticias", { method: "POST", signal: control.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ noticias?: NoticiaTablero[] }>) : null))
      .then((d) => setNuevas((d?.noticias ?? []).filter((n) => typeof n?.url === "string" && n.url.startsWith("https://") && typeof n.titulo === "string").slice(0, 3)))
      .catch(() => setNuevas([]));
    return () => control.abort();
  }, [alDia]);
  return nuevas;
}

/** Las noticias de tu industria: una a la vez, con su foto, y flechas para pasar a otra. */
function Noticias({ noticias, cargando, sinNada }: { noticias: NoticiaTablero[]; cargando: boolean; sinNada: boolean }) {
  const [i, setI] = useState(0);
  const total = noticias.length;
  // Las fotos de todas se bajan de una vez (son ligeras): al picar la flecha, la siguiente ya está
  const fotos = noticias.map((n) => n.foto ?? "").join("|");
  useEffect(() => {
    for (const f of fotos.split("|")) {
      if (!f) continue;
      const img = new Image();
      img.decoding = "async";
      img.src = f;
    }
  }, [fotos]);
  if (!total && !cargando && !sinNada) return null;
  const n = noticias[Math.min(i, total - 1)];
  return (
    <section className="tb-panel tb-noticias" aria-roledescription="carrusel" aria-label="Noticias de tu industria">
      <div className="tb-panel__cabeza">
        <h2 className="tb-panel__titulo">Tu industria</h2>
        {total > 1 ? (
          <div className="tb-noticias__flechas">
            <span className="tb-noticias__cuenta" aria-hidden="true">
              {Math.min(i, total - 1) + 1} de {total}
            </span>
            <button type="button" className="tb-flecha" aria-label="Noticia anterior" onClick={() => setI((x) => (x - 1 + total) % total)}>
              <Icono nombre="chevron-izquierda" tam={16} />
            </button>
            <button type="button" className="tb-flecha" aria-label="Siguiente noticia" onClick={() => setI((x) => (x + 1) % total)}>
              <Icono nombre="chevron-derecha" tam={16} />
            </button>
          </div>
        ) : null}
      </div>
      {!n && !cargando ? (
        // Ya se buscó y no hubo nada que valga la pena (o se vuelve a buscar en un rato): se dice, no se esconde
        <p className="tb-panel__vacio" aria-live="polite">
          Todavía no hay noticias importantes de hoy para tu negocio. Vuelvo a buscar en un rato.
        </p>
      ) : !n ? (
        <div className="tb-noticia tb-noticia--cargando" aria-live="polite">
          <span className="tb-noticia__foto" />
          <span className="tb-panel__vacio">Buscando las noticias de hoy…</span>
        </div>
      ) : (
        <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer" className="tb-noticia" aria-live="polite">
          <span className="tb-noticia__foto">
            {n.foto ? (
              // La foto de la nota (guardada en Storage por el servidor); si no carga, se queda el fondo
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={n.foto}
                alt=""
                decoding="async"
                fetchPriority="high"
                referrerPolicy="no-referrer"
                // También si falló antes de que React tomara la página
                ref={(el) => {
                  if (el?.complete && el.naturalWidth === 0) el.hidden = true;
                }}
                onError={(e) => (e.currentTarget.hidden = true)}
              />
            ) : null}
          </span>
          <span className="tb-noticia__titulo">{n.titulo}</span>
          {n.resumen ? <span className="tb-noticia__resumen">{n.resumen}</span> : null}
          <span className="tb-noticia__fuente">
            Leer en {n.fuente} <Icono nombre="flecha-arriba-derecha" tam={14} />
          </span>
        </a>
      )}
    </section>
  );
}

/**
 * La transición al bajar (ver tablero.css, «Al bajar»): el saludo se va al
 * pasarlo y cada pieza de abajo aparece al entrar, una tras otra. Nada se
 * esconde si hay «reducir movimiento» o si no hay IntersectionObserver.
 */
function useTransicion() {
  const raiz = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = raiz.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches || el.closest(".pc")?.getAttribute("data-movimiento") === "reducido";
    if (quieto) return;
    el.classList.add("tb--anima");
    // Cada pieza aparece al entrar; las que entran juntas, una tras otra
    const piezas = [...el.querySelectorAll<HTMLElement>(".tb-banner, .tb-mosaicos, .tb-hoy, .tb-secciones > *")];
    const ver = new IntersectionObserver(
      (entradas) => {
        entradas
          .filter((e) => e.isIntersecting)
          .forEach((e, n) => {
            const pieza = e.target as HTMLElement;
            pieza.style.setProperty("--tb-retraso", `${n * 110}ms`);
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
    // El saludo se va cuando ya pasó casi la mitad (y regresa al volver arriba)
    const heroe = el.querySelector(".tb-heroe");
    const salida = new IntersectionObserver(([e]) => el.classList.toggle("tb--abajo", e.intersectionRatio < 0.55), { threshold: [0, 0.55, 1] });
    if (heroe) salida.observe(heroe);
    return () => {
      ver.disconnect();
      salida.disconnect();
      el.classList.remove("tb--anima", "tb--abajo");
      for (const p of piezas) p.classList.remove("tb-aparece", "tb-visto");
    };
  }, []);
  return raiz;
}

export function Tablero({ datos, saludo, base }: { datos: DatosTablero; saludo: string; fecha?: string; base: string }) {
  const raiz = useTransicion();
  const nuevas = useNoticias(datos.noticiasAlDia);
  // Si llegaron las de hoy, reemplazan a las guardadas (de otro día)
  const noticias = nuevas?.length ? nuevas : datos.noticias;
  const buscando = !datos.noticiasAlDia && nuevas === null && !datos.noticias.length;
  const sinNada = !datos.noticiasAlDia && nuevas !== null && !noticias.length;
  return (
    <div className="tb" ref={raiz}>
      <Heroe saludo={saludo} base={base} />
      <div className="tb-cuerpo">
        <Banner destacadas={datos.destacadas} />
        {datos.mosaicos.length ? <Mosaicos mosaicos={datos.mosaicos} /> : null}
        <ColumnaHoy hoy={datos.hoy} hrefTareas={`${base}?vista=tareas`}>
          <Noticias noticias={noticias} cargando={buscando} sinNada={sinNada} />
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
