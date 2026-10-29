import type { Metadata } from "next";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Halo } from "@/components/base/Halo";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { HojaAgente } from "@/components/agentes/HojaAgente";
import { NavAgentes } from "@/components/agentes/NavAgentes";
import { Personaje } from "@/components/agentes/Personaje";
import { TarjetasAgentes } from "@/components/agentes/TarjetasAgentes";
import { agentesDe, t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { metadatosDe } from "@/lib/seo";

export function generateMetadata(): Metadata {
  const idioma = idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.agentes);
}

/*
 * /agentes (G3-T1): el encabezado con los cuatro personajes de pie (cada uno
 * abre su ficha, sus ojos siguen al cursor); una fila de pestañas en píldora
 * que se queda pegada mientras bajas; una sección profunda por agente
 * (#lola, #clara, #victor, #iris) y el acceso al chat al final.
 * "?ficha=lola" abre la ficha (lo resuelve FichasAgentes, en Sitio).
 */
export default function Agentes() {
  const idioma = idiomaServidor();
  const P = t(idioma).paginaAgentes;
  const agentes = agentesDe(idioma);
  return (
    <Sitio>
      <section className="seccion con-halo agentes-portada" aria-labelledby="agentes-titulo">
        <Halo y="38%" ancho="min(1100px, 150vw)" proporcion="16 / 9" />
        <div className="contenedor">
          <EncabezadoSeccion
            id="agentes-titulo"
            nivel={1}
            etiqueta={P.etiqueta}
            titulo={P.titulo}
            texto={P.texto}
          />
          <TarjetasAgentes idioma={idioma} />
          <div className="agentes-portada__acciones">
            <Boton href="/pruebalo">{P.hablar}</Boton>
            <Boton href="/precios" variante="fantasma" flecha>
              {P.verPrecios}
            </Boton>
          </div>
        </div>
      </section>

      <div className="agentes-hojas">
        <NavAgentes />
        {agentes.map((a, i) => (
          <HojaAgente key={a.id} agente={a} invertida={i % 2 === 1} idioma={idioma} />
        ))}
      </div>

      {/* Acceso al chat */}
      <Seccion halo fondo="fondo-2" etiquetadaPor="agentes-chat-titulo" className="agentes-cierre">
        <Halo y="60%" ancho="min(900px, 140vw)" suave />
        <EncabezadoSeccion
          id="agentes-chat-titulo"
          adorno={
            <span className="agentes-cierre__equipo">
              {agentes.map((a) => (
                <Personaje key={a.id} agente={a.id} avatar />
              ))}
            </span>
          }
          etiqueta={P.chatEtiqueta}
          titulo={P.chatTitulo}
          texto={P.chatTexto}
        />
        <div className="agentes-portada__acciones">
          <Boton href="/pruebalo">{P.hablar}</Boton>
          <Boton href="/precios" variante="sutil" flecha>
            {P.verPrecios}
          </Boton>
        </div>
      </Seccion>
    </Sitio>
  );
}
