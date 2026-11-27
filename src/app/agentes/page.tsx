import type { Metadata } from "next";
import { Sitio } from "@/components/Sitio";
import { Boton } from "@/components/base/Boton";
import { Halo } from "@/components/base/Halo";
import { EncabezadoSeccion } from "@/components/base/Seccion";
import { RecorridoAgentes } from "@/components/agentes/RecorridoAgentes";
import { TarjetasAgentes } from "@/components/agentes/TarjetasAgentes";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { metadatosDe } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.agentes);
}

/*
 * /agentes (G3-T1): el encabezado con los cuatro personajes de pie (cada uno
 * lleva a su parte del recorrido, sus ojos siguen al cursor); el recorrido
 * (texto y celular fijos que pasan por los cuatro: #lola, #clara, #victor,
 * #iris) y, al final, el cierre de siempre (la marca de fragmentos, en Sitio).
 * "?ficha=lola" abre la ficha (lo resuelve FichasAgentes, en Sitio).
 */
export default async function Agentes() {
  const idioma = await idiomaServidor();
  const P = t(idioma).paginaAgentes;
  return (
    <Sitio cierre="agentes">
      <section className="seccion con-halo agentes-portada" aria-labelledby="agentes-titulo">
        <Halo y="38%" ancho="min(1100px, 150vw)" proporcion="16 / 9" />
        <div className="contenedor">
          {/* Solo el título: las tarjetas de abajo ya dicen quién es quién */}
          <EncabezadoSeccion id="agentes-titulo" nivel={1} titulo={P.titulo} />
          <TarjetasAgentes idioma={idioma} />
          <div className="agentes-portada__acciones">
            <Boton href="/pruebalo">{P.hablar}</Boton>
            <Boton href="/precios" variante="fantasma" flecha>
              {P.verPrecios}
            </Boton>
          </div>
        </div>
      </section>

      {/* Al bajar: el texto y el celular se quedan fijos y pasan por los cuatro agentes */}
      <RecorridoAgentes idioma={idioma} />
    </Sitio>
  );
}
