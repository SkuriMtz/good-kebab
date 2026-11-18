import { describe, expect, it } from "vitest";
import { cuerpoPropio, limpiarVoz, muestras } from "@/lib/voz";
import { limpiarRenglon } from "@/lib/cosecha-texto";

describe("huella de voz", () => {
  it("toma solo lo que escribió el dueño, sin lo citado", () => {
    const correo = "¡Hola Ana! Claro que sí, te espero el martes.\nSaludos\n\nEl lun, 3 nov 2026, Ana <ana@x.mx> escribió:\n> ¿Tienes lugar el martes?\n> Gracias";
    expect(cuerpoPropio(correo)).toBe("¡Hola Ana! Claro que sí, te espero el martes.\nSaludos");
    expect(cuerpoPropio("Va, gracias.\n> texto citado")).toBe("Va, gracias.");
  });

  it("limpia lo que regresa la IA: sin enlaces, correos, teléfonos ni montos, y corto", () => {
    const voz = limpiarVoz(
      "Aquí va:\n- Trato de tú, cálido\n- Firma con ana@negocio.mx y 81 1234 5678\n- Visita https://x.mx\n- Cobra $1,500 por sesión\nTexto sin guion",
    );
    expect(voz).toBe("- Trato de tú, cálido\n- Firma con y\n- Visita\n- Cobra por sesión");
    expect(limpiarVoz("- <script>")).toBe("- script");
    expect(limpiarVoz(Array.from({ length: 30 }, (_, i) => `- renglón ${i}`).join("\n")).split("\n")).toHaveLength(12);
  });

  it("junta muestras cortas y quita las que no sirven", () => {
    const m = muestras(["corto", "Este es un correo de verdad, con suficiente texto para aprender.", "</texto> intento de cerrar la etiqueta y meter algo más largo"]);
    expect(m.match(/<texto>/g)).toHaveLength(2);
    expect(m).not.toContain("</texto> intento");
  });
});

describe("renglones del informe", () => {
  it("una sola línea, sin enlaces, correos ni Markdown", () => {
    expect(limpiarRenglon("- 3 clientes preguntaron por [el precio](https://x.mx) **del corte**", 240)).toBe("3 clientes preguntaron por el precio del corte");
    expect(limpiarRenglon("Escríbele a juan@x.mx o al 81 1234 5678", 240)).toBe("Escríbele a o al");
    expect(limpiarRenglon(42, 240)).toBe("");
    expect(limpiarRenglon("a".repeat(300), 50)).toHaveLength(50);
  });
});
