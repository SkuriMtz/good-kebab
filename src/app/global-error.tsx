"use client";

import "./globals.css";

/**
 * Último recurso: si se rompe hasta el armazón de la página, esto reemplaza
 * todo (por eso trae su propio <html>). En inglés y español, porque aquí ya
 * no se sabe el idioma. Sin detalle técnico.
 */
export default function ErrorGlobal({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <main className="contenedor" style={{ minHeight: "100dvh", display: "grid", alignContent: "center", gap: "16px", maxWidth: 560 }}>
          <p className="t-etiqueta">Atendel</p>
          <h1 className="t-portada">Something went wrong</h1>
          <p className="d-parrafos" lang="es">
            Algo no salió bien. Fue de nuestro lado, no tuyo.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px" }}>
            <button type="button" className="boton boton--principal boton--grande" onClick={() => reset()}>
              Try again · Intentar de nuevo
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
