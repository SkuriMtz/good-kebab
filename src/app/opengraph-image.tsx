import { ImageResponse } from "next/og";
import { COLORES } from "@/components/Logo";
import { t, IDIOMA_POR_DEFECTO } from "@/i18n";

/**
 * La imagen al compartir un enlace de Atendel (WhatsApp, redes, correo):
 * el logo de cuatro puntos, el nombre y la frase de la portada, en el
 * idioma por defecto del sitio. Solo texto real del sitio: nada inventado.
 */
export const alt = "Atendel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Imagen() {
  const p = t(IDIOMA_POR_DEFECTO).inicio.portada;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 80px", background: "#000", color: "#ededed" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", width: 52, gap: 6 }}>
            {COLORES.map((c) => (
              <div key={c} style={{ width: 23, height: 23, borderRadius: 999, background: c }} />
            ))}
          </div>
          <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1 }}>Atendel</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: "#a1a1a1" }}>{p.etiqueta}</div>
          <div style={{ fontSize: 76, fontWeight: 500, letterSpacing: -3, lineHeight: 1.05, maxWidth: 980 }}>{p.titulo}</div>
        </div>
      </div>
    ),
    size,
  );
}
