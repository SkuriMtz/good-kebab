import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FormularioLista } from "@/components/FormularioLista";
import { Sitio } from "@/components/Sitio";
import { Personaje } from "@/components/agentes/Personaje";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { IDS_AGENTES } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";

export const metadata: Metadata = {
  title: "Lista de espera",
  description: "Déjanos tu correo y te avisamos cuando abramos tu lugar en Atendel.",
};

/** Qué pasa después de anotarte. Solo lo que de verdad pasa (ver src/app/api/lista y las preguntas frecuentes). */
const DESPUES = [
  {
    titulo: "Tu correo queda en la lista",
    texto: "No te pedimos nada más: ni teléfono, ni contraseña, ni datos de tu negocio.",
  },
  {
    titulo: "Te escribimos cuando abramos tu lugar",
    texto: "Atendel abre por etapas: la conexión de Lola con tu WhatsApp y tu agenda llega poco a poco. Te avisamos a ese correo.",
  },
  {
    titulo: "Mientras, ya puedes empezar",
    texto: "Con Atendel Free entras hoy con tu correo, sin contraseña, y trabajas con Clara en tu correo. Y en Pruébalo platicas con los cuatro.",
  },
];

/**
 * /lista: la lista de espera, sobria y centrada. Arriba el equipo, el
 * título y el formulario a lo grande sobre el halo; abajo, en una columna
 * angosta, qué pasa después de anotarte (tres pasos con número en Mono y una
 * línea de 1px que los une).
 */
export default function Lista() {
  return (
    <Sitio>
      <section className="pagina-sobria con-halo" aria-labelledby="lista-pagina-titulo">
        <Halo y="38%" ancho="min(760px, 120vw)" suave />
        <div className="pagina-sobria__centro">
          <ul className="pagina-sobria__equipo" aria-label="Lola, Clara, Víctor e Iris">
            {IDS_AGENTES.map((a) => (
              <li
                key={a}
                className="marca-agente marca-agente--chica"
                style={{ "--agente": PERSONAJES[a].color } as CSSProperties}
              >
                <Personaje agente={a} avatar />
              </li>
            ))}
          </ul>
          <Etiqueta tono="cielo">Lista de espera</Etiqueta>
          <h1 id="lista-pagina-titulo" className="t-grande">
            Anótate y te avisamos cuando abramos tu lugar
          </h1>
          <p className="t-intro">
            Para clínicas, estéticas, consultorios y negocios que atienden personas. Solo necesitamos tu correo.
          </p>
          <FormularioLista centrado conSecundario={false} className="pagina-sobria__formulario" />
        </div>
      </section>

      <section className="pagina-sobria pagina-sobria--siguiente" aria-labelledby="despues-titulo">
        <div className="pagina-sobria__columna">
          <h2 id="despues-titulo" className="etiqueta">
            Qué pasa después
          </h2>
          <ol className="pasos-lista">
            {DESPUES.map((d, i) => (
              <li key={d.titulo} className="pasos-lista__paso">
                <span className="pasos-lista__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="t-sub">{d.titulo}</h3>
                  <p className="t-cuerpo">{d.texto}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="pagina-sobria__acciones">
            <Boton href="/pruebalo" variante="sutil">
              Prueba los agentes
            </Boton>
            <Boton href="/entrar" variante="fantasma" flecha>
              Empieza con Free
            </Boton>
          </div>
          <p className="t-chico">
            ¿Prefieres preguntarnos algo primero?{" "}
            <Link href="/contacto" className="enlace">
              Escríbenos
            </Link>
          </p>
        </div>
      </section>
    </Sitio>
  );
}
