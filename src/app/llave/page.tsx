import type { Metadata } from "next";
import { GenerarLlave } from "./GenerarLlave";

export const metadata: Metadata = {
  title: "Llave de cifrado",
  robots: { index: false, follow: false },
};

/*
 * /llave: crea la llave de cifrado de Atendel (ATENDEL_LLAVE_CIFRADO, 32 bytes
 * en base64) en el navegador de quien la abre, sin Terminal. La llave nunca
 * sale del navegador: no se manda al servidor ni se guarda en ningún lado.
 */
export default function Llave() {
  return (
    <main className="llave">
      <GenerarLlave />
    </main>
  );
}
