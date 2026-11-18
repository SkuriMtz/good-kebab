import { PaginaLegal, metadatosLegal } from "@/components/legal/PaginaLegal";

/** /inteligencia-artificial: un documento del Centro de privacidad (/privacy). */
export const generateMetadata = () => metadatosLegal("ia");

export default function Pagina() {
  return <PaginaLegal id="ia" />;
}
