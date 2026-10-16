import type { CSSProperties, ReactNode } from "react";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { Personaje } from "@/components/agentes/Personaje";
import { DETALLE } from "@/components/agentes/detalle";
import { Revelar } from "@/app/para-quien-es/Revelar";
import { AGENTES_INFO } from "@/lib/agentes";
import { PASOS } from "@/lib/contenido";
import { PERSONAJES } from "@/lib/personajes";

/*
 * Las tres miniaturas copian textos reales del producto:
 * - Entrar (src/app/entrar/Login.tsx): "Tu correo", "tu@correo.com", "Link enviado", "Revisa tu correo".
 * - Mis agentes (src/app/panel/agentes/MisAgentes.tsx): "En tu equipo" / "+ Agregar" (así se ve en Max, donde eliges).
 * - El mensaje de Lola a Mariana sale de su conversación de ejemplo (detalle.ts).
 */
const MENSAJE_MARIANA = DETALLE.lola.conversacion[0];
const BORRADOR_LOLA = DETALLE.lola.conversacion[1];
const EN_EQUIPO = new Set(["clara", "lola"]);

function MiniEntrar() {
  return (
    <MarcoNavegador
      titulo="Miniatura: entrar a Atendel con tu correo"
      pestanas={[{ etiqueta: "Entrar", activa: true }]}
      relleno
    >
      <div className="inf-mini" aria-hidden="true">
        <div className="inf-mini__campo">
          <span className="inf-mini__campo-etiqueta">Tu correo</span>
          <span className="inf-mini__campo-valor">tu@correo.com</span>
        </div>
        <div className="inf-mini__linea">
          <Insignia tono="exito" conPunto>
            Link enviado
          </Insignia>
          <span className="inf-mini__nota">
            Revisa tu correo. Sin contraseñas.
          </span>
        </div>
      </div>
    </MarcoNavegador>
  );
}

function MiniEquipo() {
  return (
    <MarcoNavegador
      titulo="Miniatura: armar tu equipo de agentes"
      pestanas={[{ etiqueta: "Tu equipo", activa: true }]}
    >
      <ul className="inf-mini-equipo" aria-hidden="true">
        {AGENTES_INFO.map((a) => {
          const dentro = EN_EQUIPO.has(a.id);
          return (
            <li key={a.id} className="inf-mini-equipo__fila">
              <span
                className="marca-agente marca-agente--mini"
                style={{ "--agente": PERSONAJES[a.id].color } as CSSProperties}
              >
                <Personaje agente={a.id} avatar />
              </span>
              <span className="min-w-0">
                <span className="inf-mini-equipo__nombre">{a.nombre}</span>
                <span className="inf-mini-equipo__area">{a.area}</span>
              </span>
              <span
                className={`inf-mini__boton${dentro ? " inf-mini__boton--hecho" : ""}`}
              >
                {dentro ? <Icono nombre="check" tam={16} /> : null}
                {dentro ? "En tu equipo" : "+ Agregar"}
              </span>
            </li>
          );
        })}
      </ul>
    </MarcoNavegador>
  );
}

function MiniVistoBueno() {
  return (
    <MarcoNavegador
      titulo="Miniatura: un mensaje de Lola que espera tu visto bueno"
      pestanas={[
        {
          etiqueta: "Lola · WhatsApp",
          activa: true,
          adorno: <Personaje agente="lola" avatar />,
        },
      ]}
      relleno
    >
      <div className="inf-mini" aria-hidden="true">
        <div className="inf-mini__linea inf-mini__linea--entre">
          <span className="inf-mini__quien">Para {MENSAJE_MARIANA.quien}</span>
          <Insignia tono="atencion" conPunto>
            Espera tu visto bueno
          </Insignia>
        </div>
        <p className="inf-mini__recibido">
          <span>{MENSAJE_MARIANA.texto}</span>
          <Etiqueta as="span" tono="tenue">
            {MENSAJE_MARIANA.hora}
          </Etiqueta>
        </p>
        <div className="inf-mini__borrador">
          <Etiqueta as="span" tono="cielo">
            Respuesta de Lola · sin enviar
          </Etiqueta>
          <span className="inf-mini__borrador-texto">
            {BORRADOR_LOLA.texto}
          </span>
        </div>
        <div className="inf-mini__acciones">
          <span className="inf-mini__boton inf-mini__boton--hecho">
            <Icono nombre="check" tam={16} />
            Enviar
          </span>
          <span className="inf-mini__boton">Editar</span>
        </div>
      </div>
    </MarcoNavegador>
  );
}

const MUESTRAS: ReactNode[] = [
  <MiniEntrar key="entrar" />,
  <MiniEquipo key="equipo" />,
  <MiniVistoBueno key="visto" />,
];

/**
 * 5. Cómo funciona (Grupo 4 · G4-T2, "el producto manda"). Línea de tiempo
 * vertical con los tres pasos (números en Mono sobre la línea) y, junto a
 * cada paso, la miniatura de la pantalla real que vas a ver: entrar con tu
 * correo, elegir a tu equipo y el mensaje que espera tu visto bueno.
 */
export function ComoFunciona() {
  return (
    <Seccion id="como-funciona" etiquetadaPor="como-funciona-titulo">
      <EncabezadoSeccion
        id="como-funciona-titulo"
        alineacion="izquierda"
        etiqueta="Cómo funciona"
        titulo="Un equipo que trabaja contigo"
        texto="Sin instalar nada y sin aprender un sistema nuevo. Así se ve cada paso."
        className="inf-como__encabezado"
      />
      <ol className="inf-pasos">
        {PASOS.map(([titulo, texto], i) => (
          <li key={titulo} className="inf-paso">
            <span className="inf-paso__nodo" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <Revelar className="inf-paso__cuerpo">
              <div
                className="inf-paso__texto"
                style={{ "--i": 0 } as CSSProperties}
              >
                <Etiqueta tono="cielo">Paso {i + 1} de 3</Etiqueta>
                <h3 className="t-titulo">{titulo}</h3>
                <p className="t-cuerpo">{texto}</p>
              </div>
              <div
                className="inf-paso__muestra"
                style={{ "--i": 1 } as CSSProperties}
              >
                {MUESTRAS[i]}
              </div>
            </Revelar>
          </li>
        ))}
      </ol>
    </Seccion>
  );
}
