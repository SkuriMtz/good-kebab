#!/usr/bin/env python3
"""
Ajusta la forma y las poses del cerebro a las siluetas del video.

Toma los puntos sin deformar (cerebro.py --crudo crudo.npz), los deforma con `deformar`
(cerebro.py), los proyecta igual que el motor (motor.ts, `proyectar`), arma la silueta como
lo hace medir.py y busca, con Nelder-Mead, lo que más sube el IoU contra la silueta del
video en cada momento:
  - la forma (FORMA en cerebro.py: estirado por eje y deformaciones suaves), compartida, y
  - la pose de cada momento (centro y escala; con --angulos, también giro, inclinación y ladeo).

  python scripts/figuras/cerebro.py --crudo /tmp/crudo.npz
  python scripts/figuras/ajustar.py CUADROS /tmp/crudo.npz [--angulos] [--vista CARPETA]

CUADROS es la carpeta con video-1.0.png, video-2.2.png, video-2.8.png y video-4.5.png
(1212 × 750 o 606 × 375). El resultado se copia a mano a FORMA (cerebro.py) y a las llaves
CEREBRO_A / CEREBRO_B (motor.ts).
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from scipy import ndimage as ndi
from scipy.optimize import minimize

sys.path.insert(0, str(Path(__file__).parent))
import cerebro  # noqa: E402
import medir  # noqa: E402

# Cuánto brilla un triangulito en la silueta (calibrado contra capturas del motor)
PESO = 1500.0
NOMBRES = ["trapecio", "cerebelo_sube", "cerebelo_adelante", "temporal_ancho", "temporal_baja", "temporal_adelante", "frontal_baja"]
# Poses de partida: las llaves del motor en esos momentos (cx, cy, escala, yaw, pitch, roll)
MOMENTOS = {
    1.0: [847.5, 378, 335.1, -90, 0, 0],
    2.2: [773.5, 378, 339.6, -30, -1, 0],
    2.8: [428.5, 372, 379.4, 14.5, -4, 0],
    4.5: [295, 386, 418.8, 32, 9, 0],
}


def proyectar(pos, c):
    """Igual que MotorFiguras.proyectar, a 1212 × 750. c = (cx, cy, escala, yaw, pitch, roll)."""
    cx, cy, S, yaw, pitch, roll = c
    D = 2300.0
    g = np.pi / 180
    cyw, syw = np.cos(yaw * g), np.sin(yaw * g)
    cp, sp = np.cos(pitch * g), np.sin(pitch * g)
    cr, sr = np.cos(roll * g), np.sin(roll * g)
    x1 = pos[:, 0] * cyw + pos[:, 2] * syw
    z1 = -pos[:, 0] * syw + pos[:, 2] * cyw
    y2 = pos[:, 1] * cp - z1 * sp
    z2 = pos[:, 1] * sp + z1 * cp
    x3 = x1 * cr - y2 * sr
    y3 = x1 * sr + y2 * cr
    f = D / (D - z2 * S)
    return cx + x3 * S * f, cy - y3 * S * f, z2


def silueta_puntos(x, y, peso, t, densidad):
    """Silueta de una nube de puntos, armada como en medir.silueta (a 606 × 375)."""
    h, _, _ = np.histogram2d(y / 2, x / 2, bins=[medir.ALTO, medir.ANCHO], range=[[0, medir.ALTO], [0, medir.ANCHO]], weights=peso)
    a = ndi.gaussian_filter(h, 4.0) * PESO * densidad
    return medir.silueta(np.repeat(a[..., None], 3, axis=2), t)


def simplex(n):
    """Símplex inicial con pasos de 1 (Nelder-Mead arranca con pasos demasiado chicos si x0 = 0)."""
    return np.vstack([np.zeros(n), np.eye(n)])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cuadros", type=Path)
    ap.add_argument("crudo", type=Path)
    ap.add_argument("--angulos", action="store_true", help="deja libres también el giro, la inclinación y el ladeo")
    ap.add_argument("--solo-poses", action="store_true")
    ap.add_argument("--vueltas", type=int, default=4)
    ap.add_argument("--vista", type=Path, default=None, help="carpeta para dejar las siluetas (rojo video, verde modelo)")
    args = ap.parse_args()
    d = np.load(args.crudo)
    q, parte = d["q"].astype(np.float64), d["parte"]
    # los puntos crudos son más que los de la rejilla base (7000): cada uno pesa menos
    densidad = 7000.0 / len(q)
    # el tronco es tenue: solo cuenta su arranque
    peso = np.where(parte == 3, 0.0, 1.0)

    videos = {}
    for t in MOMENTOS:
        f = args.cuadros / f"video-{t}.png"
        if f.exists():
            videos[t] = medir.silueta(medir.cargar(str(f)), t)
    # en 4.5 s, abajo está la cola de polvo, que no es cerebro: no se cuenta
    zona = {t: np.ones_like(m) for t, m in videos.items()}
    if 4.5 in zona:
        zona[4.5][295:, :] = False
        zona[4.5][:, :12] = False

    forma = dict(cerebro.FORMA)
    caja0 = np.array(forma["caja"], dtype=float)

    def forma_de(v):
        f = dict(forma)
        f["caja"] = tuple(caja0 * (1 + v[:3] * 0.03))
        for k, nombre in enumerate(NOMBRES):
            f[nombre] = forma[nombre] + v[3 + k] * 0.03
        return f

    def error_de(t, c, pos):
        x, y, _ = proyectar(pos, c)
        s = silueta_puntos(x, y, peso, t, densidad)
        z = zona[t]
        return 1 - medir.iou(s & z, videos[t] & z)

    libres = 6 if args.angulos else 3
    pasos = np.array([8, 8, 8, 4, 3, 2], dtype=float)[:libres]
    poses = {t: np.array(c, dtype=float) for t, c in MOMENTOS.items() if t in videos}
    v = np.zeros(3 + len(NOMBRES))
    for vuelta in range(args.vueltas):
        pos = cerebro.deformar(q, forma_de(v))
        for t in poses:
            def f(dq, t=t):
                c = poses[t].copy()
                c[:libres] += dq * pasos
                return error_de(t, c, pos)
            r = minimize(f, np.zeros(libres), method="Nelder-Mead", options={"xatol": 0.02, "fatol": 1e-4, "maxiter": 220, "initial_simplex": simplex(libres)})
            poses[t][:libres] += r.x * pasos
        if not args.solo_poses:
            def g(vv):
                p = cerebro.deformar(q, forma_de(vv))
                return float(np.mean([error_de(t, poses[t], p) for t in poses])) + 0.002 * float(np.sum(vv[3:] ** 2)) / len(NOMBRES)
            r = minimize(g, v, method="Nelder-Mead", options={"xatol": 0.03, "fatol": 1e-4, "maxiter": 500, "initial_simplex": v + simplex(len(v))})
            v = r.x
        pos = cerebro.deformar(q, forma_de(v))
        print(f"vuelta {vuelta + 1}")
        for t in poses:
            print(f"  {t} s: IoU {1 - error_de(t, poses[t], pos):.3f}  pose {np.round(poses[t], 1).tolist()}")
    f = forma_de(v)
    print("FORMA = {")
    for k, val in f.items():
        print(f'    "{k}": {tuple(round(float(a), 4) for a in val) if isinstance(val, tuple) else round(float(val), 4)},')
    print("}")
    if args.vista:
        from PIL import Image

        args.vista.mkdir(parents=True, exist_ok=True)
        hoja = Image.new("RGB", (medir.ANCHO * len(poses), medir.ALTO))
        for i, t in enumerate(poses):
            x, y, _ = proyectar(pos, poses[t])
            s = silueta_puntos(x, y, peso, t, densidad)
            im = np.zeros((medir.ALTO, medir.ANCHO, 3), dtype=np.uint8)
            im[..., 0] = videos[t] * 255
            im[..., 1] = s * 255
            hoja.paste(Image.fromarray(im), (i * medir.ANCHO, 0))
        hoja.save(args.vista / "ajuste.png")


if __name__ == "__main__":
    main()
