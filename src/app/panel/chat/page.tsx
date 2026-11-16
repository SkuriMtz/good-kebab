import { redirect } from "next/navigation";

/**
 * /panel/chat (la dirección de antes): el chat ahora ES el Inicio del panel.
 * Se conserva lo que traiga (?c=, ?agente=, ?pide=) para que los enlaces
 * viejos sigan abriendo lo mismo.
 */
export default async function ChatPage(
  props: { searchParams: Promise<Record<string, string | string[] | undefined>> }
) {
  const searchParams = await props.searchParams;
  const q = new URLSearchParams();
  for (const clave of ["c", "agente", "pide"]) {
    const v = searchParams[clave];
    const uno = Array.isArray(v) ? v[0] : v;
    if (uno) q.set(clave, uno.slice(0, 2000));
  }
  const texto = q.toString();
  redirect(`/panel${texto ? `?${texto}` : ""}`);
}
