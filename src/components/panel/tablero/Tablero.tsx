"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Icono } from "@/components/base/Iconos";
import { Marca } from "@/components/Logo";
import { cambio, PEDIDO_TABLERO, type DatosTablero, type Destacada, type Tarjeta } from "@/lib/tablero";
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

/* ---------- La caja de la IA ---------- */

function CajaIA({ base }: { base: string }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const enviar = (e: FormEvent) => {
    e.preventDefault();
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
  return (
    <form className="tb-ia" onSubmit={enviar} role="search">
      <span className="tb-ia__orbe" aria-hidden="true">
        <Marca className="tb-ia__marca" />
      </span>
      <label htmlFor="tb-ia" className="sr-only">
        Pídele algo a Atendel
      </label>
      <input id="tb-ia" className="tb-ia__campo" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Pídele algo a Atendel…" maxLength={4000} autoComplete="off" />
      <button type="submit" className="tb-ia__enviar" aria-label="Pedírselo a Atendel" disabled={!texto.trim()}>
        <Icono nombre="enviar" tam={18} />
      </button>
    </form>
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

export function Tablero({ datos, saludo, base }: { datos: DatosTablero; saludo: string; fecha?: string; base: string }) {
  return (
    <div className="tb">
      <header className="tb-heroe">
        <h1 className="tb-heroe__titulo">{saludo}</h1>
        <CajaIA base={base} />
      </header>

      <nav className="tb-herramientas" aria-label="Herramientas">
        {datos.accesos.map((a) => (
          <a key={a.id} href={a.href} className="tb-herramienta">
            <span className="tb-herramienta__icono">
              <Icono nombre={a.icono} tam={22} />
            </span>
            <span className="tb-herramienta__texto">{a.titulo}</span>
          </a>
        ))}
      </nav>

      <Banner destacadas={datos.destacadas} />

      {datos.filas.map((f) => (
        <Seccion key={f.id} id={f.id} titulo={f.titulo} href={f.href}>
          {f.tarjetas.map((t) => (
            <TarjetaTablero key={t.id} t={t} />
          ))}
        </Seccion>
      ))}
    </div>
  );
}
