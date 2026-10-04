import type { CSSProperties } from "react";
import { BotonLink } from "@/components/Buttons";
import { Sitio } from "@/components/Sitio";
import { CarruselEquipo } from "@/components/agentes/CarruselEquipo";
import { Revela } from "@/components/escena/Revela";
import { Tetra } from "@/components/escena/Tetra";

/** Para quién es, acomodado como constelación: cada negocio con su tetraedro (posición en la sala y de dónde llega volando). */
const NEGOCIOS = [
  { nombre: "Clínicas", href: "/para-quien-es#clinicas", color: "#ffb829", x: "10%", y: "0px", dx: "160px", dy: "-120px" },
  { nombre: "Estéticas", href: "/para-quien-es#esteticas", color: "#2fd6a8", x: "25%", y: "64px", dx: "-90px", dy: "-160px" },
  { nombre: "Consultorios", sub: "Cuando atiendes tú mismo", href: "/para-quien-es#consultorios", color: "#ffb829", x: "9.5%", y: "184px", dx: "120px", dy: "60px" },
  { nombre: "Negocios de servicios", sub: "Spas, fisioterapia, nutrición", href: "/para-quien-es#servicios", color: "#8052ff", x: "43%", y: "228px", dx: "-140px", dy: "-90px" },
  { nombre: "Tu negocio", sub: "Si vives de atender personas", href: "/para-quien-es", color: "#8052ff", x: "18%", y: "296px", dx: "80px", dy: "-200px" },
];

/*
 * Inicio, igual que el sitio de Dala: cinco escenas a pantalla completa.
 * Detrás, la escena de triangulitos (data-escena) se queda quieta mientras
 * lees y cambia de figura cuando llega la siguiente:
 * 1. Burbuja de chat a la izquierda: qué es Atendel.
 * 2. Globo a la derecha: cómo funciona.
 * 3. El globo se deshace en polvo: tu equipo (carrusel de los agentes).
 * 4. El polvo se va a la izquierda: para quién es (constelación de tetraedros).
 * 5. El polvo forma el logo: el llamado final.
 */
export default function Inicio() {
  return (
    <Sitio>
      {/* ---------- 1. Qué es (la burbuja) ---------- */}
      <section className="d-escena d-escena--primera" data-escena="burbuja">
        <Revela className="d-col d-col--derecha">
          <h1 className="d-titulo">Agentes de IA para negocios que atienden personas</h1>
          <div className="d-parrafos">
            <p>Atendel es un equipo de cuatro agentes de inteligencia artificial para clínicas, consultorios y estéticas.</p>
            <p>Atienden tu WhatsApp y tus citas, ordenan tu correo, traen de regreso a tus clientes y hacen el trabajo de oficina.</p>
            <p>Les hablas como a una persona y te entregan el trabajo hecho: mensajes, tablas, reportes y documentos.</p>
          </div>
        </Revela>
      </section>

      {/* ---------- 2. Cómo funciona (el globo) ---------- */}
      <section id="como-funciona" className="d-escena" data-escena="globo">
        <Revela className="d-col d-col--izquierda">
          <h2 className="d-titulo">Un equipo que trabaja contigo</h2>
          <div className="d-parrafos">
            <p>Entras con tu correo, sin contraseña y sin instalar nada, desde el celular, la tablet o la computadora.</p>
            <p>Eliges qué agentes trabajan contigo: atención, correo, clientes u oficina.</p>
            <p>
              Les escribes como a una persona. Ellos resuelven, y <em className="d-resalta">lo importante no sale sin tu visto bueno.</em>
            </p>
          </div>
        </Revela>
      </section>

      {/* ---------- 3. Tu equipo (carrusel) ---------- */}
      <section id="agentes" className="d-escena d-escena--equipo" data-escena="equipo" data-nav="/agentes">
        <div className="equipo-zona">
          <Revela className="equipo-zona__texto">
            <h2 className="d-grande">Tu equipo</h2>
            <p className="d-sub">Cuatro agentes, un solo equipo.</p>
            <div className="d-parrafos d-parrafos--chico">
              <p>
                Cada uno lleva un área de tu negocio: atención, correo, clientes y oficina. Toca a cada uno para ver todo lo que hace, una
                conversación de ejemplo y en qué plan está.
              </p>
              <p>
                Conoce todo lo que hace cada uno <a href="/agentes" className="d-enlace">aquí</a>
              </p>
            </div>
          </Revela>
          <CarruselEquipo />
        </div>
      </section>

      {/* ---------- 4. Para quién es (constelación) ---------- */}
      <section id="para-quien-es" className="d-escena d-escena--lista" data-escena="lista" data-nav="/para-quien-es">
        <div className="lista-zona">
          <Revela className="lista-zona__texto">
            <h2 className="d-grande">Para quién es</h2>
            <div className="d-parrafos d-parrafos--chico">
              <p>Para negocios que viven de atender, agendar y que sus clientes regresen.</p>
            </div>
          </Revela>
          <Revela className="lista">
            <ul>
              {NEGOCIOS.map((n, i) => (
                <li
                  key={n.nombre}
                  className="lista__item"
                  style={{ "--x": n.x, "--y": n.y, "--dx": n.dx, "--dy": n.dy, "--c": n.color, "--i": i } as CSSProperties}
                >
                  <a href={n.href} className="lista__enlace">
                    <Tetra color={n.color} className="lista__tetra" />
                    <span className="lista__textos">
                      <span className="lista__nombre">{n.nombre}</span>
                      {n.sub ? <span className="lista__sub">{n.sub}</span> : null}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Revela>
        </div>
      </section>

      {/* ---------- 5. Llamado final (el logo) ---------- */}
      <section id="empezar" className="d-escena d-escena--final" data-escena="logo">
        <Revela className="d-final">
          <h2 className="d-titulo">
            Tus clientes ya te escriben.
            <br />
            Atendel te ayuda a contestarles.
          </h2>
          <div className="mt-[var(--spacing-24)]">
            <BotonLink href="/entrar" tam="chico">
              Empieza gratis
            </BotonLink>
          </div>
        </Revela>
      </section>
    </Sitio>
  );
}
