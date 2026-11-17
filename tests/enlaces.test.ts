import { describe, expect, it } from "vitest";
import { rutaInterna } from "@/lib/enlaces";

describe("rutaInterna", () => {
  it.each([
    "/panel?vista=pendientes",
    "/api/archivos/3f2b1c9e-1111-4222-8333-444455556666",
    "/panel?aprobar=3f2b1c9e-1111-4222-8333-444455556666",
    "/panel?vista=ajustes&seccion=notificaciones",
    "/",
  ])("acepta %s", (r) => {
    expect(rutaInterna(r)).toBe(true);
  });

  it.each([
    ["//evil.com", "doble diagonal"],
    ["/\\evil.com", "diagonal invertida"],
    ["/\\/evil.com", "diagonal invertida y diagonal"],
    ["https://evil.com", "URL absoluta"],
    ["evil.com", "sin diagonal inicial"],
    ["/javascript:alert(1)", "esquema con paréntesis"],
    ["javascript:alert(1)", "esquema sin diagonal"],
    ["/panel ?x=1", "espacio"],
    ["/panel\t?x=1", "tabulador"],
    ["/panel\n/evil", "salto de línea"],
    ["/%0d%0a//evil.com\n", "salto de línea real"],
    ["/panel?x=<script>", "signos de HTML"],
    ["", "vacía"],
  ])("rechaza %s (%s)", (r) => {
    expect(rutaInterna(r)).toBe(false);
  });
});
