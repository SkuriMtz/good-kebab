import { PaginaLegal, metadatosLegal } from "@/components/legal/PaginaLegal";

/** /tratamiento-de-datos: un documento del Centro de privacidad (/privacy). */
export const generateMetadata = () => metadatosLegal("tratamiento");

export default function Pagina() {
  return <PaginaLegal id="tratamiento" />;
}
