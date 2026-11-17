import { describe, expect, it } from "vitest";
import { legalesCompletos, type DatosLegales } from "@/lib/legal";
import { privacidadEs, terminosEs } from "@/legal/textos-es";
import { privacyEn, termsEn } from "@/legal/textos-en";

const EJEMPLO: DatosLegales = {
  responsable: "Persona de Ejemplo",
  correo: "privacidad@ejemplo.mx",
  domicilio: "Calle 1, Ciudad de México",
  jurisdiccion: "Ciudad de México",
  actualizado: "2026-11-17",
};

describe("textos legales", () => {
  for (const [nombre, es, en] of [
    ["privacidad", privacidadEs, privacyEn],
    ["términos", terminosEs, termsEn],
  ] as const) {
    it(`${nombre}: español e inglés tienen la misma estructura`, () => {
      const a = es(EJEMPLO);
      const b = en(EJEMPLO);
      expect(b.secciones.length).toBe(a.secciones.length);
      a.secciones.forEach((s, i) => {
        const o = b.secciones[i];
        expect(o.parrafos?.length ?? 0, `parrafos de «${s.titulo}»`).toBe(s.parrafos?.length ?? 0);
        expect(o.lista?.length ?? 0, `lista de «${s.titulo}»`).toBe(s.lista?.length ?? 0);
        expect(o.despues?.length ?? 0, `despues de «${s.titulo}»`).toBe(s.despues?.length ?? 0);
      });
    });
    it(`${nombre}: el inglés trae el aviso de traducción y los datos del responsable`, () => {
      const b = en(EJEMPLO);
      expect(b.nota).toContain("courtesy translation");
      const texto = JSON.stringify(b);
      expect(texto).toContain(EJEMPLO.correo);
    });
  }
  it("con datos vacíos legalesCompletos() es false", () => {
    expect(legalesCompletos({ ...EJEMPLO, responsable: "", correo: "", domicilio: "", jurisdiccion: "" })).toBe(false);
    expect(legalesCompletos({ ...EJEMPLO, correo: " " })).toBe(false);
    expect(legalesCompletos(EJEMPLO)).toBe(true);
  });
});
