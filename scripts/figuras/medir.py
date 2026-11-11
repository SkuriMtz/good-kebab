#!/usr/bin/env python3
"""
Medidas del cerebro contra el video de referencia (las de diseno/capturas/dala/figuras-a/NOTA.md).

  python scripts/figuras/medir.py VIDEO.png ATENDEL.png --t 1.0

Todo se mide igual en las dos imágenes, a 606 × 375 (la mitad de 1212 × 750, que es el tamaño
de los cuadros del video que hay para 2.2, 2.8 y 4.5 s):
  - silueta: la mancha que ocupa la figura (brillo emborronado → umbral → sin huecos) y su IoU;
  - reparto de color de los píxeles brillantes dentro de la silueta del video;
  - densidad: triangulitos (picos de brillo) por cada 1000 px² en el centro de la figura.
"""
from __future__ import annotations

import argparse
import json

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ANCHO, ALTO = 606, 375

# Zonas del video que no son figura (texto y barra), en px de 1212 × 750, por momento
FUERA = {
    1.0: [(0, 0, 1212, 70), (0, 0, 470, 750)],
    2.2: [(0, 0, 1212, 70), (0, 0, 470, 750)],
    2.8: [(0, 0, 1212, 40), (840, 0, 1212, 60)],
    4.5: [(0, 0, 1212, 56), (790, 90, 1212, 330)],
    6.0: [(0, 0, 1212, 50), (790, 90, 1212, 330)],
}


def cargar(ruta: str) -> np.ndarray:
    im = Image.open(ruta).convert("RGB")
    if im.size != (ANCHO, ALTO):
        im = im.resize((ANCHO, ALTO), Image.LANCZOS)
    return np.asarray(im).astype(np.float32)


def quitar_fuera(a: np.ndarray, t: float) -> np.ndarray:
    a = a.copy()
    for x0, y0, x1, y1 in FUERA.get(t, []):
        a[y0 // 2 : (y1 + 1) // 2, x0 // 2 : (x1 + 1) // 2] = 0
    return a


def silueta(a: np.ndarray, t: float, umbral: float = 15.0) -> np.ndarray:
    """La mancha de la figura: la pieza más grande del brillo emborronado, sin huecos."""
    a = quitar_fuera(a, t)
    brillo = a.max(axis=2)
    suave = ndi.gaussian_filter(brillo, 4.0)
    m = suave > umbral
    m = ndi.binary_closing(m, iterations=3)
    et, n = ndi.label(m)
    if n == 0:
        return m
    tam = ndi.sum(m, et, index=np.arange(1, n + 1))
    m = et == (1 + int(np.argmax(tam)))
    return ndi.binary_fill_holes(m)


def iou(a: np.ndarray, b: np.ndarray) -> float:
    return float((a & b).sum() / max(1, (a | b).sum()))


CLASES = ["blanco", "ambar", "violeta", "turquesa", "azul", "magenta", "otro"]


def reparto(a: np.ndarray, zona: np.ndarray, brillo_min: float = 90.0) -> dict[str, float]:
    """Reparto por color de los píxeles brillantes de la zona (en %)."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(axis=2)
    mn = a.min(axis=2)
    sel = zona & (mx >= brillo_min)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    d = np.maximum(mx - mn, 1e-6)
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    clase = np.full(a.shape[:2], 6, dtype=int)
    clase[(h >= 15) & (h < 70)] = 1      # ámbar y amarillo
    clase[(h >= 140) & (h < 195)] = 3    # turquesa
    clase[(h >= 195) & (h < 245)] = 4    # azul
    clase[(h >= 245) & (h < 285)] = 2    # violeta
    clase[(h >= 285) & (h < 345)] = 5    # magenta y rosa
    clase[sat < 0.3] = 0                 # blanco y lavanda
    total = max(1, int(sel.sum()))
    return {c: round(100.0 * float((sel & (clase == i)).sum()) / total, 1) for i, c in enumerate(CLASES)}


def densidad(a: np.ndarray, zona: np.ndarray, lado: int = 110) -> float:
    """Triangulitos (picos de brillo) por cada 1000 px² de 1212 × 750, en un cuadro al centro de la zona."""
    ys, xs = np.nonzero(zona)
    cy, cx = int(np.median(ys)), int(np.median(xs))
    y0, x0 = max(0, cy - lado // 2), max(0, cx - lado // 2)
    brillo = a.max(axis=2)
    s = ndi.gaussian_filter(brillo, 1.2)
    picos = (s == ndi.maximum_filter(s, size=5)) & (s > 38)
    n = int(picos[y0 : y0 + lado, x0 : x0 + lado].sum())
    return round(n / ((lado * 2) ** 2 / 1000.0), 2)


def medir(video: str, atendel: str, t: float) -> dict:
    v = cargar(video)
    a = cargar(atendel)
    sv = silueta(v, t)
    sa = silueta(a, t)
    return {
        "t": t,
        "iou": round(iou(sv, sa), 3),
        "color_video": reparto(quitar_fuera(v, t), sv),
        "color_atendel": reparto(quitar_fuera(a, t), sv),
        "densidad_video": densidad(quitar_fuera(v, t), sv),
        "densidad_atendel": densidad(quitar_fuera(a, t), sv),
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("atendel")
    ap.add_argument("--t", type=float, required=True)
    ap.add_argument("--mascaras", default=None, help="guarda aquí una imagen con las dos siluetas")
    args = ap.parse_args()
    res = medir(args.video, args.atendel, args.t)
    print(json.dumps(res, ensure_ascii=False))
    if args.mascaras:
        sv = silueta(cargar(args.video), args.t)
        sa = silueta(cargar(args.atendel), args.t)
        im = np.zeros((ALTO, ANCHO, 3), dtype=np.uint8)
        im[..., 0] = sv * 255
        im[..., 1] = sa * 255
        Image.fromarray(im).save(args.mascaras)
