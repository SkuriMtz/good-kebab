import { PaginaLegal, metadatosLegal } from "@/components/legal/PaginaLegal";

/** /uso-aceptable: un documento del Centro de privacidad (/privacy). */
export const generateMetadata = () => metadatosLegal("uso");

export default function Pagina() {
  return <PaginaLegal id="uso" />;
}
