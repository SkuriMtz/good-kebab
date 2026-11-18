import { PaginaLegal, metadatosLegal } from "@/components/legal/PaginaLegal";

/** /reembolsos: un documento del Centro de privacidad (/privacy). */
export const generateMetadata = () => metadatosLegal("reembolsos");

export default function Pagina() {
  return <PaginaLegal id="reembolsos" />;
}
