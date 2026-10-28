import type { Viewport } from "next";
import { Sitio } from "@/components/Sitio";
import { BotonLista } from "@/components/inicio-dala/BotonLista";
import { CarruselAgentes } from "@/components/inicio-dala/CarruselAgentes";
import { PlanesIconos } from "@/components/inicio-dala/PlanesIconos";
import { TextoDala } from "@/components/inicio-dala/TextoDala";

/*
 * El inicio, igual a los videos de referencia (diseno/capturas/dala/MEDIDAS.md):
 * ocho escenas a pantalla completa sobre el fondo de figuras. Cada bloque
 * mide lo mismo que su escena en el video y dice qué escena es
 * (data-escena): el fondo de figuras la lee para saber qué figura toca y
 * FondoInicio, qué enlace de la barra se enciende (src/lib/inicio.ts).
 * 1. portada (cerebro) · 2. decisiones (cerebro a la izquierda) · 3. caos
 * (polvo) · 4. foco · 5. globo · 6. equipo · 7. planes · 8. cierre.
 * El chat de demostración vive en /pruebalo (enlazado desde la ficha de
 * cada agente, la hoja del celular y la lista de espera).
 */
/** La barra del navegador del celular, del color del fondo del inicio (negro puro u #fafafa). */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
};

export default function Inicio() {
  return (
    <Sitio fondo="inicio">
      {/* 1. Portada */}
      <section className="ini-bloque ini-portada" data-escena="portada" aria-labelledby="portada-titulo">
        <div className="ini-col ini-col--izq ini-portada__texto">
          <TextoDala como="h1" tipo="titulo" id="portada-titulo" className="ini-display">
            Que ningún cliente se quede sin respuesta.
          </TextoDala>
          <TextoDala className="ini-etiqueta" inicio="top 95%">
            Tu equipo de agentes de IA
          </TextoDala>
          <TextoDala className="ini-cuerpo" inicio="top 95%" retraso={0.15}>
            Lola contesta tu WhatsApp y agenda citas, Clara ordena tu correo, Víctor trae de regreso a tus clientes e Iris lleva el
            trabajo de oficina. Lo importante no sale sin tu visto bueno.
          </TextoDala>
          <BotonLista className="ini-portada__boton" />
        </div>
      </section>

      {/* 2. Decisiones: atender sin perder un mensaje */}
      <section className="ini-bloque ini-decisiones" data-escena="decisiones" aria-labelledby="decisiones-titulo">
        <div className="ini-col ini-col--der ini-escena__texto">
          <TextoDala como="h2" tipo="titulo" id="decisiones-titulo" className="ini-titulo">
            Atiende sin perder un mensaje
          </TextoDala>
          <TextoDala className="ini-cuerpo" retraso={0.35}>
            Tus agentes contestan a cualquier hora, agendan y confirman citas, y te avisan cuando algo necesita a una persona.
          </TextoDala>
        </div>
      </section>

      {/* 3. El caos: así es tu día hoy */}
      <section className="ini-bloque ini-caos" data-escena="caos" aria-label="Así es tu día hoy">
        <div className="ini-caos__grupo">
          <TextoDala className="ini-caos__texto">
            Así es tu día hoy. Mensajes de WhatsApp, correos, citas y pendientes regados entre el celular, la libreta y tu cabeza.
          </TextoDala>
        </div>
        <div className="ini-caos__grupo">
          <TextoDala className="ini-caos__texto">
            Contestas tarde porque estás atendiendo. Se te pasa confirmar una cita. Un cliente que preguntó ya no regresa.
          </TextoDala>
        </div>
        <div className="ini-caos__grupo">
          <TextoDala className="ini-caos__texto">Y el papeleo se acumula para la noche.</TextoDala>
        </div>
      </section>

      {/* 4. Foco: tu equipo, listo a cualquier hora */}
      <section className="ini-bloque ini-foco" data-escena="foco" aria-labelledby="foco-titulo">
        <div className="ini-col ini-col--der ini-escena__texto">
          <TextoDala como="h2" tipo="titulo" id="foco-titulo" className="ini-titulo">
            Tu equipo, listo a cualquier hora
          </TextoDala>
          <TextoDala className="ini-cuerpo" retraso={0.35}>
            Atendel es un equipo de cuatro agentes de inteligencia artificial que trabajan para tu negocio.
          </TextoDala>
          <TextoDala className="ini-cuerpo" retraso={0.45}>
            Les escribes como a una persona y ellos resuelven: contestan, agendan, ordenan tu correo y preparan documentos.
          </TextoDala>
          <TextoDala className="ini-cuerpo" retraso={0.55}>
            Tú decides qué hacen solos y qué te consultan primero.
          </TextoDala>
        </div>
      </section>

      {/* 5. Globo: que tu negocio crezca */}
      <section className="ini-bloque ini-globo" data-escena="globo" aria-labelledby="globo-titulo">
        <div className="ini-col ini-col--izq ini-escena__texto">
          <TextoDala como="h2" tipo="titulo" id="globo-titulo" className="ini-titulo">
            Que tu negocio crezca, no tu trabajo
          </TextoDala>
          <TextoDala className="ini-cuerpo" retraso={0.35}>
            Queremos que atender bien no dependa de estar pegado al celular.
          </TextoDala>
          <TextoDala className="ini-cuerpo" retraso={0.45}>
            Tus clientes reciben respuesta y tú recuperas tu tiempo para <em className="ini-resalta">atender mejor</em>.
          </TextoDala>
          <TextoDala className="ini-cuerpo" retraso={0.55}>
            Entras con tu correo, sin contraseña, desde el celular o la computadora.
          </TextoDala>
        </div>
      </section>

      {/* 6. Tu equipo (carrusel de los agentes) */}
      <section id="agentes" className="ini-bloque ini-equipo" data-escena="equipo" aria-labelledby="equipo-titulo">
        <div className="ini-col ini-col--izq ini-equipo__texto">
          <TextoDala como="h2" tipo="titulo" id="equipo-titulo" className="ini-grande">
            Tu equipo
          </TextoDala>
          <TextoDala className="ini-sub" retraso={0.2}>
            Cuatro agentes, cada uno en lo suyo.
          </TextoDala>
          <TextoDala className="ini-cuerpo ini-cuerpo--chico" retraso={0.35}>
            Toca a cualquiera para ver todo lo que hace.
          </TextoDala>
        </div>
        <div className="ini-equipo__carrusel">
          <CarruselAgentes />
        </div>
      </section>

      {/* 7. Planes (y cuándo sale) */}
      <section id="precios" className="ini-bloque ini-planes" data-escena="planes" aria-labelledby="planes-titulo">
        <span id="cuando-sale" className="ini-ancla" aria-hidden="true" />
        <div className="ini-col ini-planes__texto">
          <TextoDala como="h2" tipo="titulo" id="planes-titulo" className="ini-grande">
            Planes
          </TextoDala>
          <TextoDala className="ini-cuerpo ini-cuerpo--chico" retraso={0.25}>
            Empieza gratis. One y Max abren por etapas: anótate en la lista y te avisamos.
          </TextoDala>
        </div>
        <PlanesIconos />
      </section>

      {/* 8. Cierre */}
      <section id="unete" className="ini-bloque ini-cierre" data-escena="cierre" aria-labelledby="cierre-titulo">
        <div className="ini-cierre__centro">
          <TextoDala como="h2" tipo="titulo" id="cierre-titulo" className="ini-cierre__texto">
            Tu negocio ya tiene quién atienda.
            <br />
            Deja que Atendel lo haga.
          </TextoDala>
          <BotonLista />
        </div>
      </section>
    </Sitio>
  );
}
