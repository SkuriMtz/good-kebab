import { PaginaLegal, metadatosLegal } from "@/components/legal/PaginaLegal";

/** /terminos: un documento del Centro de privacidad (/privacy), en el idioma del sitio (vale el español). */
export const generateMetadata = () => metadatosLegal("terminos");

export default function Pagina() {
  return <PaginaLegal id="terminos" />;
}
