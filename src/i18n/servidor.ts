import { cookies } from "next/headers";
import { IDIOMA_COOKIE, idiomaDe, t, type Idioma } from "./index";

/** El idioma que eligió la persona (cookie atendel-idioma); si no eligió, inglés. */
export async function idiomaServidor(): Promise<Idioma> {
  return idiomaDe((await cookies()).get(IDIOMA_COOKIE)?.value);
}

/** Los textos del idioma de esta petición. */
export async function textosServidor() {
  return t(await idiomaServidor());
}
