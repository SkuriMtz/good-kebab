import { cookies } from "next/headers";
import { IDIOMA_COOKIE, idiomaDe, t, type Idioma } from "./index";

/** El idioma que eligió la persona (cookie atendel-idioma); si no eligió, inglés. */
export function idiomaServidor(): Idioma {
  return idiomaDe(cookies().get(IDIOMA_COOKIE)?.value);
}

/** Los textos del idioma de esta petición. */
export function textosServidor() {
  return t(idiomaServidor());
}
