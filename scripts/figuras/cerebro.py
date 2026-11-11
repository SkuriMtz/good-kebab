#!/usr/bin/env python3
"""
Genera los puntos del cerebro del inicio: public/figuras/cerebro.bin y cerebro-chico.bin.

De dónde sale la forma: la plantilla MNI ICBM152 2009a simétrica (materia gris + blanca,
el promedio de 152 resonancias), que viene dentro del paquete nilearn. Su licencia y su
aviso de copyright van en public/figuras/cerebro-LICENCIA.txt.

Pasos:
  1. Materia gris + blanca → umbral → se rellenan los huecos de adentro.
  2. Tronco: la plantilla lo corta abajo; se le agrega una columna que sigue bajando.
  3. Suavizado de ~5.5 mm con el relieve exagerado (quedan la fisura entre hemisferios, la
     cisura de Silvio, el temporal como lengua, el cerebelo y el tronco) → marching cubes.
  4. Pliegues estilizados: bultos separados por surcos que serpentean, para que la silueta
     se vea con bultos como en el video (la plantilla es un promedio y casi no los trae).
  5. Solo la cáscara de afuera: se quitan las caras hundidas (pared de la fisura, ínsula).
  6. Ajuste a las siluetas del video: estirado por eje y deformaciones suaves (FORMA).
  7. Por punto: normal, curvatura (surco o cresta) y parte (hemisferio izquierdo,
     hemisferio derecho, cerebelo, tronco).
  8. Puntos parejos, en filas: disco de Poisson y relajación de Lloyd sobre la superficie.
     Primero la rejilla base (la que se ve de frente) y luego el relleno, que queda en medio
     de la base (el motor lo enciende en el borde, donde los triangulitos se enciman).
  9. Se escribe el archivo (formato "CRB2", ver `escribir`).

Uso (ver README.md):
  python scripts/figuras/cerebro.py            # escribe los dos .bin en public/figuras
  python scripts/figuras/cerebro.py --vista d  # además deja imágenes de revisión en d/
  python scripts/figuras/cerebro.py --crudo f  # guarda en f.npz los puntos sin deformar (para ajustar.py)
"""
from __future__ import annotations

import argparse
import struct
from pathlib import Path

import numpy as np
from scipy import ndimage as ndi
from scipy.spatial import cKDTree
from skimage import measure

RAIZ = Path(__file__).resolve().parents[2]
SALIDA = RAIZ / "public" / "figuras"

# ---------------------------------------------------------------------------
# Parámetros (en milímetros del espacio MNI, salvo donde se diga)
# ---------------------------------------------------------------------------
UMBRAL = 0.5          # materia gris + blanca
SUAVIZADO_FWHM = 5.5  # mm: menos que esto y se ve ruido; más y se pierden los pliegues
RELIEVE = 1.2         # cuánto se exageran los pliegues (0 = como salen de la plantilla)
RELIEVE_ANCHO = 16.0  # mm: el suavizado ancho contra el que se comparan
PLIEGUE_ANCHO = 13.0  # mm: la rejilla del ruido que dibuja los surcos estilizados
PLIEGUE_ALTO = 3.2    # mm: cuánto sobresale un bulto sobre su surco
HONDO_MAX = 13.0      # mm: lo que queda más hondo que esto bajo la envolvente no se usa
TRONCO_FIN = -168.0   # mm (z de MNI): hasta dónde baja el tronco agregado
SEMILLA = 11

# Cuántos puntos: la rejilla base (la que se ve de frente, en filas) y el relleno (borde).
# La base sale de la densidad medida en el video (medir.py: triangulitos por 1000 px²).
TAMANOS = {
    "cerebro.bin": {"base": 7000, "relleno": 7000},
    "cerebro-chico.bin": {"base": 3200, "relleno": 2800},
}

# Ajuste a las siluetas del video (lo encuentra ajustar.py). Ejes del motor: x hacia el
# hemisferio izquierdo, y arriba, z al frente. La unidad es la mitad del largo del cerebro
# (335 px en la portada del video).
FORMA = {
    # medias cajas del cerebro (sin el tronco) antes de deformar
    "caja": (0.935, 0.759, 1.0125),
    # más ancho abajo que arriba (de frente, el video se ve como trapecio)
    "trapecio": 0.0,
    # el cerebelo: sube y se mete
    "cerebelo_sube": 0.0,
    "cerebelo_adelante": 0.0,
    # los temporales: más anchos, más abajo y más al frente
    "temporal_ancho": 0.0,
    "temporal_baja": 0.0,
    "temporal_adelante": 0.0,
    # la base del frontal: más abajo
    "frontal_baja": 0.0,
}


def cargar_plantilla():
    """Materia gris + blanca de la plantilla (probabilidad 0..1, vóxeles de 1 mm) y su afín."""
    from nilearn import datasets

    gm = datasets.load_mni152_gm_template(resolution=1)
    wm = datasets.load_mni152_wm_template(resolution=1)
    p = np.asarray(gm.get_fdata(), dtype=np.float32) + np.asarray(wm.get_fdata(), dtype=np.float32)
    return p, np.asarray(gm.affine, dtype=np.float64)


def volumen_del_cerebro():
    """Campo suave del cerebro con su tronco alargado, la máscara y el origen en mm de su vóxel (0,0,0)."""
    p, afin = cargar_plantilla()
    origen = afin[:3, 3].copy()  # vóxeles de 1 mm alineados con los ejes
    m = p > UMBRAL
    # la pieza más grande y sin huecos adentro (ventrículos)
    et, n = ndi.label(m)
    if n > 1:
        tam = ndi.sum(m, et, index=np.arange(1, n + 1))
        m = et == (1 + int(np.argmax(tam)))
    m = ndi.binary_fill_holes(m)
    # lugar para el tronco hacia abajo
    extra = int(round(origen[2] - TRONCO_FIN)) + 8
    m = np.pad(m, ((8, 8), (8, 8), (extra, 8)))
    origen = origen - np.array([8, 8, extra])
    # el tronco agregado: una columna que baja desde el corte de la plantilla, un poco hacia atrás
    X, Y = np.meshgrid(np.arange(m.shape[0]) + origen[0], np.arange(m.shape[1]) + origen[1], indexing="ij")
    z_corte = -66.0
    for k in range(m.shape[2]):
        z = k + origen[2]
        if z > z_corte:
            continue
        t = (z_corte - z) / (z_corte - TRONCO_FIN)  # 0 arriba → 1 abajo
        radio = 8.5 - 1.5 * min(1.0, t * 3)
        cy = -44.0 - 6.0 * t
        m[:, :, k] |= (X**2 + (Y - cy) ** 2) < radio**2
    fino = ndi.gaussian_filter(m.astype(np.float32), SUAVIZADO_FWHM / 2.3548)
    # Relieve: se exagera lo que el suavizado fino tiene de más o de menos contra uno ancho
    ancho = ndi.gaussian_filter(m.astype(np.float32), RELIEVE_ANCHO / 2.3548)
    campo = fino + RELIEVE * (fino - ancho)
    return campo, m, origen


def parte_de(p_mm: np.ndarray) -> np.ndarray:
    """0 hemisferio izquierdo, 1 hemisferio derecho, 2 cerebelo, 3 tronco (p en mm de MNI)."""
    x, y, z = p_mm[:, 0], p_mm[:, 1], p_mm[:, 2]
    parte = np.where(x < 0, 0, 1).astype(np.uint8)
    # cerebelo: atrás y abajo
    cerebelo = (z < -12 - 0.22 * (y + 60)) & (y < -34) & (z > -66)
    cerebelo &= ~((np.abs(x) > 30) & (z > -16 - 0.55 * (y + 60)))
    parte[cerebelo] = 2
    # tronco: alrededor de un eje que baja del mesencéfalo al bulbo, y la columna agregada
    t = np.clip((-8.0 - z) / 55.0, 0, 1)
    eje_y = -24.0 - 19.0 * t
    radio = 15.0 - 3.0 * t
    tronco = (z < -8) & (np.hypot(x, y - eje_y) < radio) & (y > eje_y - radio)
    tronco |= z < -64
    parte[tronco] = 3
    return parte


def ruido_suave(p_mm, paso, semilla):
    """Ruido suave 3D (0..1) con una rejilla de `paso` mm, interpolada con curvas."""
    rnd = np.random.default_rng(semilla + 101)
    lo = p_mm.min(0) - paso * 2
    n = np.ceil((p_mm.max(0) - lo) / paso).astype(int) + 4
    rejilla = rnd.random(tuple(n)).astype(np.float32)
    rejilla = ndi.gaussian_filter(rejilla, 0.6)
    rejilla = (rejilla - rejilla.min()) / (rejilla.max() - rejilla.min())
    q = ndi.map_coordinates(rejilla, ((p_mm - lo) / paso).T, order=3)
    # se centra para que la mitad quede de cada lado
    return np.clip(0.5 + (q - np.median(q)) * 2.2, 0, 1)


def normales_de_malla(v, caras, respaldo):
    """Normal por vértice (promedio de sus caras, por área), suavizada con sus vecinos."""
    a, b, c = v[caras[:, 0]], v[caras[:, 1]], v[caras[:, 2]]
    nc = np.cross(b - a, c - a)
    n = np.zeros_like(v)
    for k in range(3):
        np.add.at(n, caras[:, k], nc)
    signo = np.sign((n * respaldo).sum(1, keepdims=True))  # hacia afuera, como el respaldo
    signo[signo == 0] = 1
    n = n * signo
    n /= np.linalg.norm(n, axis=1, keepdims=True) + 1e-9
    for _ in range(3):
        m = n.copy()
        for i, j in ((0, 1), (1, 2), (2, 0)):
            np.add.at(m, caras[:, i], n[caras[:, j]])
            np.add.at(m, caras[:, j], n[caras[:, i]])
        n = m / (np.linalg.norm(m, axis=1, keepdims=True) + 1e-9)
    return n


def malla():
    """Vértices (mm de MNI), caras y, por vértice: normal, curvatura (−1 cresta … +1 surco), hondura (mm)."""
    campo, mascara, origen = volumen_del_cerebro()
    v, caras, _, _ = measure.marching_cubes(campo, level=0.5)
    # normales hacia afuera: menos el gradiente del campo
    g = np.stack(np.gradient(ndi.gaussian_filter(campo, 1.0)), axis=-1)
    idx = np.clip(np.round(v).astype(int), 0, np.array(campo.shape) - 1)
    nor = -g[idx[:, 0], idx[:, 1], idx[:, 2]]
    nor /= np.linalg.norm(nor, axis=1, keepdims=True) + 1e-9
    # curvatura: en un surco hay más tejido alrededor que en una cresta
    ancho = ndi.gaussian_filter(mascara.astype(np.float32), 5.0)
    curv = ndi.map_coordinates(ancho, v.T, order=1) - 0.5
    curv = np.clip(curv / 0.22, -1, 1)
    # hondura bajo la envolvente (el cerebro con la fisura y los surcos tapados)
    r = 11
    zz, yy, xx = np.ogrid[-r : r + 1, -r : r + 1, -r : r + 1]
    bola = ((xx**2 + yy**2 + zz**2) <= r * r)[::2, ::2, ::2]
    chico = mascara[::2, ::2, ::2]
    envolvente = ndi.binary_erosion(ndi.binary_dilation(chico, bola), bola, border_value=1)
    dist = ndi.distance_transform_edt(envolvente) * 2.0
    hondo = ndi.map_coordinates(dist.astype(np.float32), (v / 2.0).T, order=1)
    v = v + origen
    # Pliegues estilizados: bultos separados por surcos que serpentean (las curvas donde un
    # ruido suave cruza su valor medio)
    parte_v = parte_de(v)
    r = ruido_suave(v, PLIEGUE_ANCHO, SEMILLA)
    bulto = np.clip(np.abs(r - 0.5) * 2.0 / 0.42, 0, 1)  # 0 en el surco → 1 en medio del bulto
    bulto = bulto * bulto * (3 - 2 * bulto)
    fuerza = np.where(parte_v < 2, 1.0, np.where(parte_v == 2, 0.45, 0.0))
    v = v + nor * (PLIEGUE_ALTO * (bulto - 0.62) * fuerza)[:, None]
    curv = np.clip(curv + (0.55 - bulto) * 1.3 * fuerza, -1, 1)
    nor = normales_de_malla(v, caras, nor)
    return v, caras, nor, curv, hondo


def muestras(v, caras, nor, curv, hondo, cuantas, rnd):
    """Puntos al azar, parejos por área, sobre las caras de la cáscara de afuera."""
    parte_v = parte_de(v)
    # la cáscara: ni muy hondo, ni la pared de adentro de la fisura
    medial = (np.abs(v[:, 0]) < 9) & (np.abs(nor[:, 0]) > 0.6) & (np.sign(nor[:, 0]) == -np.sign(v[:, 0])) & (parte_v < 2)
    usar_v = (hondo < HONDO_MAX) & ~(medial & (hondo > 7.0))
    usar_v |= parte_v == 3
    c = caras[usar_v[caras].all(axis=1)]
    a, b, d = v[c[:, 0]], v[c[:, 1]], v[c[:, 2]]
    area = 0.5 * np.linalg.norm(np.cross(b - a, d - a), axis=1)
    elegidas = rnd.choice(len(c), size=cuantas, p=area / area.sum())
    u = rnd.random(cuantas)
    w = rnd.random(cuantas)
    fuera = u + w > 1
    u[fuera], w[fuera] = 1 - u[fuera], 1 - w[fuera]
    t = 1 - u - w
    ce = c[elegidas]
    mez = lambda q: q[ce[:, 0]] * t[:, None] + q[ce[:, 1]] * u[:, None] + q[ce[:, 2]] * w[:, None]
    pos = mez(v)
    n = mez(nor)
    n /= np.linalg.norm(n, axis=1, keepdims=True) + 1e-9
    cu = curv[ce[:, 0]] * t + curv[ce[:, 1]] * u + curv[ce[:, 2]] * w
    return pos, n, cu, float(area.sum())


# ---------------------------------------------------------------------------
# Ajuste a las siluetas del video
# ---------------------------------------------------------------------------

def a_motor(p_mm):
    """De mm de MNI (x derecha, y adelante, z arriba) a los ejes del motor, aún en mm."""
    return np.stack([-p_mm[:, 0], p_mm[:, 2], p_mm[:, 1]], axis=1)


def normalizar(pos_mm, parte):
    """A los ejes del motor, con la caja del cerebro (sin el tronco) centrada y de medias (1, 1, 1)."""
    pm = a_motor(pos_mm)
    cuerpo = parte < 3
    lo, hi = pm[cuerpo].min(0), pm[cuerpo].max(0)
    return (pm - (lo + hi) / 2) / ((hi - lo) / 2), (hi - lo) / 2


def deformar(q, forma=FORMA):
    """De la caja normalizada (medias 1, 1, 1) a las unidades del motor, con las deformaciones suaves."""
    cx, cy, cz = forma["caja"]
    x, y, z = q[:, 0] * cx, q[:, 1] * cy, q[:, 2] * cz
    lado = np.sign(q[:, 0])
    campana = lambda dx, dy, dz, s: np.exp(-(dx * dx + dy * dy + dz * dz) / (s * s))
    # trapecio: más ancho abajo que arriba
    x = x * (1 + forma["trapecio"] * (-q[:, 1]))
    # cerebelo (atrás y abajo)
    w = campana(q[:, 0] * 0.6, q[:, 1] + 0.72, q[:, 2] + 0.62, 0.42)
    y = y + forma["cerebelo_sube"] * w
    z = z + forma["cerebelo_adelante"] * w
    # temporales (a los lados, abajo, hacia el frente)
    w = campana(np.abs(q[:, 0]) - 0.62, q[:, 1] + 0.55, q[:, 2] - 0.22, 0.45)
    x = x + lado * forma["temporal_ancho"] * w
    y = y - forma["temporal_baja"] * w
    z = z + forma["temporal_adelante"] * w
    # base del frontal
    w = campana(np.abs(q[:, 0]) - 0.3, q[:, 1] + 0.35, q[:, 2] - 0.72, 0.38)
    y = y - forma["frontal_baja"] * w
    return np.stack([x, y, z], axis=1)


def deformar_con_normales(q, n_mm, medias, forma=FORMA):
    """Posición final y normal final (la normal sale de deformar dos tangentes)."""
    # la normal en el espacio normalizado va con la inversa traspuesta del estirado
    nq = a_motor(n_mm) * medias
    nq /= np.linalg.norm(nq, axis=1, keepdims=True) + 1e-9
    ref = np.where(np.abs(nq[:, :1]) < 0.9, np.array([[1.0, 0, 0]]), np.array([[0, 1.0, 0]]))
    t1 = np.cross(nq, ref)
    t1 /= np.linalg.norm(t1, axis=1, keepdims=True) + 1e-9
    t2 = np.cross(nq, t1)
    e = 1e-3
    p0 = deformar(q, forma)
    n2 = np.cross(deformar(q + e * t1, forma) - p0, deformar(q + e * t2, forma) - p0)
    n2 /= np.linalg.norm(n2, axis=1, keepdims=True) + 1e-12
    # hacia afuera: del mismo lado que la normal original estirada
    guia = nq / np.array(forma["caja"])
    n2 *= np.sign((n2 * guia).sum(1, keepdims=True))
    return p0, n2


# ---------------------------------------------------------------------------
# Puntos parejos
# ---------------------------------------------------------------------------
MM = 88.0          # mm por unidad del motor (solo para dar los radios en mm)
PESO_NORMAL = 3.0  # mm: separa las dos paredes de un surco (posición + normal)


def encajar(pos, nor):
    return np.hstack([pos * MM, nor * PESO_NORMAL])


def poisson(cands6, radio, rnd, fijos6=None):
    """Disco de Poisson sobre los candidatos (índices), respetando los puntos fijos."""
    orden = rnd.permutation(len(cands6))
    arbol = cKDTree(cands6)
    libre = np.ones(len(cands6), dtype=bool)
    if fijos6 is not None and len(fijos6):
        for vecinos in cKDTree(fijos6).query_ball_tree(arbol, radio):
            libre[vecinos] = False
    elegidos = []
    for i in orden:
        if not libre[i]:
            continue
        elegidos.append(i)
        libre[arbol.query_ball_point(cands6[i], radio)] = False
    return np.array(elegidos, dtype=int)


def poisson_hasta(cands6, cuantos, rnd, fijos6=None, radio0=4.0):
    """Busca el radio que deja ~`cuantos` puntos."""
    radio = radio0
    mejor = None
    for _ in range(9):
        mejor = poisson(cands6, radio, rnd, fijos6)
        if abs(len(mejor) - cuantos) / cuantos < 0.015:
            break
        radio *= (len(mejor) / cuantos) ** 0.5
    return mejor[:cuantos], radio


def lloyd(cands6, sitios, vueltas, fijos=0):
    """Relajación de Lloyd: cada sitio va al centro de su celda y vuelve a la superficie."""
    arbol_c = cKDTree(cands6)
    s = cands6[sitios].copy()
    idx = sitios.copy()
    movibles = np.arange(len(s)) >= fijos
    for _ in range(vueltas):
        _, celda = cKDTree(s).query(cands6)
        cuenta = np.bincount(celda, minlength=len(s)).astype(np.float64)
        centro = np.zeros_like(s)
        for k in range(s.shape[1]):
            centro[:, k] = np.bincount(celda, weights=cands6[:, k], minlength=len(s))
        ok = (cuenta > 0) & movibles
        centro[ok] /= cuenta[ok, None]
        _, cerca = arbol_c.query(centro[ok])
        idx[ok] = cerca
        s[ok] = cands6[cerca]
    return idx


def puntos_parejos(pos, nor, n_base, n_relleno, rnd):
    """Índices de los candidatos: primero la rejilla base y luego el relleno (en medio de la base)."""
    c6 = encajar(pos, nor)
    base, radio = poisson_hasta(c6, n_base, rnd)
    base = lloyd(c6, base, 40)
    relleno, _ = poisson_hasta(c6, n_relleno, rnd, fijos6=c6[base], radio0=radio * 0.6)
    todos = lloyd(c6, np.concatenate([base, relleno]), 25, fijos=len(base))
    return todos[: len(base)], todos[len(base) :], radio


# ---------------------------------------------------------------------------
# Archivo
# ---------------------------------------------------------------------------

def escribir(ruta: Path, pos, nor, curv, parte, n_base):
    """
    Formato CRB2 (little endian):
      "CRB2" · uint16 versión (2) · uint16 reservado · uint32 n · uint32 n_base · float32 escala
      n × int16 (x, y, z)  → posición = valor × escala
      n × int8  (nx, ny, nz) / 127
      n × int8  curvatura / 127 (−1 cresta … +1 surco)
      n × uint8 parte (0 hemisferio izquierdo, 1 derecho, 2 cerebelo, 3 tronco)
    Los primeros n_base puntos son la rejilla base; los demás, el relleno.
    """
    n = len(pos)
    escala = float(np.abs(pos).max() / 32000.0)
    with open(ruta, "wb") as f:
        f.write(b"CRB2")
        f.write(struct.pack("<HHIIf", 2, 0, n, n_base, escala))
        f.write(np.round(pos / escala).astype("<i2").tobytes())
        f.write(np.clip(np.round(nor * 127), -127, 127).astype("i1").tobytes())
        f.write(np.clip(np.round(curv * 127), -127, 127).astype("i1").tobytes())
        f.write(parte.astype("u1").tobytes())
    return ruta.stat().st_size


def generar(vista: Path | None = None, crudo: Path | None = None):
    rnd = np.random.default_rng(SEMILLA)
    print("malla…")
    v, caras, nor, curv, hondo = malla()
    print(f"  {len(v)} vértices, {len(caras)} caras")
    pos_mm, n_mm, cu, area = muestras(v, caras, nor, curv, hondo, 420_000, rnd)
    print(f"  área de la cáscara: {area:.0f} mm²")
    parte = parte_de(pos_mm)
    # el tronco, más ralo: es una columna tenue
    quedan = (parte != 3) | (rnd.random(len(parte)) < 0.55)
    pos_mm, n_mm, cu, parte = pos_mm[quedan], n_mm[quedan], cu[quedan], parte[quedan]
    q, medias = normalizar(pos_mm, parte)
    print(f"  medias cajas en mm (x, y, z): {np.round(medias, 1)}")
    if crudo:
        sub = rnd.choice(len(q), size=40_000, replace=False)
        np.savez_compressed(crudo, q=q[sub].astype(np.float32), n_mm=n_mm[sub].astype(np.float32), parte=parte[sub], medias=medias)
        print(f"  puntos sin deformar → {crudo}")
    pos, nor_m = deformar_con_normales(q, n_mm, medias)

    for nombre, t in TAMANOS.items():
        print(f"{nombre}: puntos parejos…")
        base, relleno, radio = puntos_parejos(pos, nor_m, t["base"], t["relleno"], rnd)
        idx = np.concatenate([base, relleno])
        bytes_ = escribir(SALIDA / nombre, pos[idx], nor_m[idx], cu[idx], parte[idx], len(base))
        print(f"  base {len(base)} (disco de {radio:.2f} mm), relleno {len(relleno)}, {bytes_ / 1024:.0f} KB")
        if vista:
            revisar(vista / nombre.replace(".bin", ".png"), pos[idx], nor_m[idx], cu[idx], parte[idx], len(base))


def revisar(ruta: Path, pos, nor, curv, parte, n_base):
    """Imagen de revisión: de lado, de frente y desde arriba (arriba, solo la base; abajo, todo)."""
    from PIL import Image, ImageDraw

    ruta.parent.mkdir(parents=True, exist_ok=True)
    S = 300
    im = Image.new("RGB", (S * 6 + 40, S * 4 + 40), (8, 8, 12))
    d = ImageDraw.Draw(im)
    colores = [(240, 238, 248), (201, 195, 230), (35, 217, 181), (128, 82, 255)]
    vistas = [
        (lambda p: (-p[:, 2], p[:, 1], p[:, 0]), lambda n: n[:, 0]),   # de lado
        (lambda p: (-p[:, 0], p[:, 1], p[:, 2]), lambda n: n[:, 2]),   # de frente
        (lambda p: (-p[:, 0], p[:, 2], p[:, 1]), lambda n: n[:, 1]),   # desde arriba
    ]
    for fila, (de, a) in enumerate([(0, n_base), (0, len(pos))]):
        for j, (proy, frente) in enumerate(vistas):
            x, y, z = proy(pos[de:a])
            nz = frente(nor[de:a])
            ox = 20 + j * S * 2 + S
            oy = 20 + fila * S * 2 + S
            for i in np.argsort(z):
                if nz[i] < 0:
                    continue
                c = colores[parte[de + i]]
                if curv[de + i] > 0.35:
                    c = tuple(int(k * 0.45) for k in c)
                px, py = ox + x[i] * S * 0.95, oy - y[i] * S * 0.95 + 60
                d.ellipse((px - 1.6, py - 1.6, px + 1.6, py + 1.6), fill=c)
    im.save(ruta)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--vista", type=Path, default=None, help="carpeta para dejar imágenes de revisión")
    ap.add_argument("--crudo", type=Path, default=None, help="guarda los puntos sin deformar (para ajustar.py)")
    args = ap.parse_args()
    generar(args.vista, args.crudo)
