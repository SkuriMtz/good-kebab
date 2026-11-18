import { PaginaLegal, metadatosLegal } from "@/components/legal/PaginaLegal";

/** /privacidad: un documento del Centro de privacidad (/privacy), en el idioma del sitio (vale el español). */
export const generateMetadata = () => metadatosLegal("privacidad");

export default function Pagina() {
  return <PaginaLegal id="privacidad" />;
}
