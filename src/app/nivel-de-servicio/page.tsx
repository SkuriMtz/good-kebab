import { PaginaLegal, metadatosLegal } from "@/components/legal/PaginaLegal";

/** /nivel-de-servicio: un documento del Centro de privacidad (/privacy). */
export const generateMetadata = () => metadatosLegal("servicio");

export default function Pagina() {
  return <PaginaLegal id="servicio" />;
}
