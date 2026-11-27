import type { Metadata } from "next";
import Link from "next/link";
import { Sitio } from "@/components/Sitio";
import { Etiqueta } from "@/components/base/Etiqueta";
import { BotonLista } from "@/components/inicio-dala/BotonLista";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { metadatosDe } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  return metadatosDe(idioma, t(idioma).paginaCuando.meta);
}

/**
 * /cuando-sale: en qué está cada plan. Free ya está abierto (se entra con el
 * correo); One y Max abren por etapas (lista de espera). Sin fechas ni
 * precios inventados. Ningún botón cambia el plan de una cuenta.
 */
export default async function CuandoSale() {
  const idioma = await idiomaServidor();
  const T = t(idioma).paginaCuando;
  return (
    <Sitio cierre="cuando">
      <header className="pagina-cabeza contenedor">
        <div className="pagina-cabeza__texto">
          <Etiqueta tono="cielo">{T.etiqueta}</Etiqueta>
          <h1 className="t-display">{T.titulo}</h1>
          <p className="t-intro">{T.intro}</p>
        </div>
      </header>

      <div className="contenedor cuando-pagina">
        <ol className="cuando-etapas">
          {T.etapas.map((e) => (
            <li key={e.plan} className="cuando-etapa" data-estado={e.estado}>
              <span className="cuando-etapa__estado">{e.estadoTexto}</span>
              <h2>{e.plan}</h2>
              <p>{e.texto}</p>
              <div className="cuando-etapa__accion">
                {e.estado === "abierto" ? (
                  <Link href="/crear-cuenta" className="boton-lista">
                    <span className="boton-lista__texto">{T.crear}</span>
                  </Link>
                ) : (
                  <BotonLista />
                )}
              </div>
            </li>
          ))}
        </ol>
        <p className="cuando-pagina__nota">{T.nota}</p>
      </div>
    </Sitio>
  );
}
