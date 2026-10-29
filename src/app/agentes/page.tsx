import type { Metadata } from "next";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Halo } from "@/components/base/Halo";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { HojaAgente } from "@/components/agentes/HojaAgente";
import { NavAgentes } from "@/components/agentes/NavAgentes";
import { Personaje } from "@/components/agentes/Personaje";
import { TarjetasAgentes } from "@/components/agentes/TarjetasAgentes";
import { AGENTES_INFO } from "@/lib/agentes";

export const metadata: Metadata = {
  title: "Agentes",
  description: "Lola, Clara, Víctor e Iris: qué hace cada agente de Atendel, cómo habla y en qué plan viene.",
};

/*
 * /agentes (G3-T1): el encabezado con los cuatro personajes de pie (cada uno
 * abre su ficha, sus ojos siguen al cursor); una fila de pestañas en píldora
 * que se queda pegada mientras bajas; una sección profunda por agente
 * (#lola, #clara, #victor, #iris) y el acceso al chat al final.
 * "?ficha=lola" abre la ficha (lo resuelve FichasAgentes, en Sitio).
 */
export default function Agentes() {
  return (
    <Sitio>
      <section className="seccion con-halo agentes-portada" aria-labelledby="agentes-titulo">
        <Halo y="38%" ancho="min(1100px, 150vw)" proporcion="16 / 9" />
        <div className="contenedor">
          <EncabezadoSeccion
            id="agentes-titulo"
            nivel={1}
            etiqueta="Atención · Correo · Clientes · Oficina"
            titulo="¿Qué le encargas hoy?"
            texto="Lola contesta tu WhatsApp y agenda, Clara lleva tu correo, Víctor trae de regreso a tus clientes e Iris hace el trabajo de oficina. Toca a cualquiera para ver su ficha."
          />
          <TarjetasAgentes />
          <div className="agentes-portada__acciones">
            <Boton href="/pruebalo">Habla con los agentes</Boton>
            <Boton href="/precios" variante="fantasma" flecha>
              Ver precios
            </Boton>
          </div>
        </div>
      </section>

      <div className="agentes-hojas">
        <NavAgentes />
        {AGENTES_INFO.map((a, i) => (
          <HojaAgente key={a.id} agente={a} invertida={i % 2 === 1} />
        ))}
      </div>

      {/* Acceso al chat */}
      <Seccion halo fondo="fondo-2" etiquetadaPor="agentes-chat-titulo" className="agentes-cierre">
        <Halo y="60%" ancho="min(900px, 140vw)" suave />
        <EncabezadoSeccion
          id="agentes-chat-titulo"
          adorno={
            <span className="agentes-cierre__equipo">
              {AGENTES_INFO.map((a) => (
                <Personaje key={a.id} agente={a.id} avatar />
              ))}
            </span>
          }
          etiqueta="El chat"
          titulo="Pruébalos en el chat"
          texto="Escríbeles lo que necesitas, como en cualquier chat, o arma un grupo con los que quieras."
        />
        <div className="agentes-portada__acciones">
          <Boton href="/pruebalo">Habla con los agentes</Boton>
          <Boton href="/precios" variante="sutil" flecha>
            Ver precios
          </Boton>
        </div>
      </Seccion>
    </Sitio>
  );
}
