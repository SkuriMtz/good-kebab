"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Marca } from "@/components/Logo";
import { useIdioma } from "@/i18n/Idioma";
import { FondoListones } from "./FondoListones";

/**
 * El marco de las páginas de acceso (entrar, crear cuenta, 404 y 500):
 * fondo oscuro a pantalla completa con listones de fragmentos, una tarjeta
 * oscura al centro (la marca, el título y lo que traiga) y, abajo, los
 * enlaces discretos. Estas páginas son SIEMPRE oscuras, también en modo
 * claro (data-tema="oscuro" vuelve a poner los colores oscuros aquí).
 */
export function MarcoAcceso({
  titulo,
  tituloId = "acceso-titulo",
  texto,
  children,
  pie,
  etiqueta,
  notaPrivada = false,
}: {
  titulo: string;
  tituloId?: string;
  texto?: string;
  children?: ReactNode;
  /** Lo que va debajo del contenido, dentro de la tarjeta (el enlace entre entrar y crear). */
  pie?: ReactNode;
  /** Etiqueta chica sobre el título (ej. "Error 404"). */
  etiqueta?: string;
  /** Muestra la nota de navegación privada al pie de la página. */
  notaPrivada?: boolean;
}) {
  const { d } = useIdioma();
  const A = d.acceso;
  return (
    <div className="acc" data-tema="oscuro">
      <FondoListones />
      <main id="contenido" tabIndex={-1} className="acc__centro" aria-labelledby={tituloId}>
        <section className="acc__tarjeta">
          <Link href="/" className="acc__marca" aria-label={A.inicio}>
            <Marca className="acc__marca-svg" />
          </Link>
          {etiqueta ? <p className="acc__etiqueta">{etiqueta}</p> : null}
          <h1 id={tituloId} className="acc__titulo" tabIndex={-1}>
            {titulo}
          </h1>
          {texto ? <p className="acc__texto">{texto}</p> : null}
          {children}
          {pie ? <div className="acc__pie-tarjeta">{pie}</div> : null}
        </section>
      </main>
      <footer className="acc__pie">
        <nav aria-label={A.pie.aria}>
          <ul>
            <li>
              <Link href="/preguntas">{A.pie.ayuda}</Link>
            </li>
            <li>
              <Link href="/terminos">{A.pie.terminos}</Link>
            </li>
            <li>
              <Link href="/privacidad">{A.pie.privacidad}</Link>
            </li>
          </ul>
        </nav>
        {notaPrivada ? <p>{A.pie.privado}</p> : null}
      </footer>
    </div>
  );
}
