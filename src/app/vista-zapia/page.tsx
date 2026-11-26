import type { Metadata } from "next";
import { PaginaInicio } from "@/components/inicio-dala/PaginaInicio";
import { PersonajeEchado } from "@/components/inicio-dala/zapia/Dibujos";
import { CajaEscribe, Etiqueta, GlobosHabilidades, Ideas } from "@/components/inicio-dala/zapia/Piezas";
import { textosZapia } from "@/components/inicio-dala/zapia/textos";
import { serifPanel } from "@/components/panel/fuente";
import { idiomaServidor } from "@/i18n/servidor";
import "@/components/inicio-dala/zapia/zapia.css";

export { viewport } from "../page";

export const metadata: Metadata = { title: "Vista previa: estilo Zapia", robots: { index: false, follow: false } };

/**
 * PRUEBA: el inicio de Atendel (todo lo que tiene) con las microinteracciones
 * y los dibujos al estilo de Zapia: etiquetas en globito, la caja que escribe
 * sola, los globos de pedidos que suben, ideas que se reparten, «Voy a tener
 * suerte», botones que se llenan y el personaje asomado. Si gusta, pasa a «/»;
 * si no, se borran esta carpeta y src/components/inicio-dala/zapia. No aparece
 * en buscadores.
 */
export default async function VistaZapia() {
  const idioma = await idiomaServidor();
  const z = textosZapia(idioma);
  return (
    <PaginaInicio
      extras={{
        clase: `zp ${serifPanel.variable}`,
        portadaCaja: <CajaEscribe idioma={idioma} />,
        portadaLado: <GlobosHabilidades idioma={idioma} />,
        etiquetas: {
          decisiones: <Etiqueta color="verde">{z.etiquetas.decisiones}</Etiqueta>,
          foco: <Etiqueta color="azul">{z.etiquetas.foco}</Etiqueta>,
          globo: <Etiqueta color="coral">{z.etiquetas.globo}</Etiqueta>,
          equipo: <Etiqueta color="amarillo">{z.etiquetas.equipo}</Etiqueta>,
          planes: <Etiqueta color="blanco">{z.etiquetas.planes}</Etiqueta>,
        },
        trasApps: (
          <div className="zp-ideas-marco">
            <PersonajeEchado className="zp-ideas-marco__personaje" />
            <Ideas idioma={idioma} />
          </div>
        ),
      }}
    />
  );
}
