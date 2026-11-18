import { PaginaLegal, metadatosLegal } from "@/components/legal/PaginaLegal";

/** /preguntas-privacidad: un documento del Centro de privacidad (/privacy). */
export const generateMetadata = () => metadatosLegal("preguntas");

export default function Pagina() {
  return <PaginaLegal id="preguntas" />;
}
