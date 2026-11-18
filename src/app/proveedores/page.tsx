import { PaginaLegal, metadatosLegal } from "@/components/legal/PaginaLegal";

/** /proveedores: un documento del Centro de privacidad (/privacy). */
export const generateMetadata = () => metadatosLegal("proveedores");

export default function Pagina() {
  return <PaginaLegal id="proveedores" />;
}
