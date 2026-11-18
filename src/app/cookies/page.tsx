import { PaginaLegal, metadatosLegal } from "@/components/legal/PaginaLegal";

/** /cookies: un documento del Centro de privacidad (/privacy), en el idioma del sitio (vale el español). */
export const generateMetadata = () => metadatosLegal("cookies");

export default function Pagina() {
  return <PaginaLegal id="cookies" />;
}
