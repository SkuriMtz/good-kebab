import { PaginaLegal, metadatosLegal } from "@/components/legal/PaginaLegal";

/** /acceso-a-tus-datos: cómo entra Atendel a tus cuentas y cómo mantiene privada la información (Centro de privacidad). */
export const generateMetadata = () => metadatosLegal("acceso");

export default function Pagina() {
  return <PaginaLegal id="acceso" />;
}
