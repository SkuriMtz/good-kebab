# Figuras del inicio: el cerebro

Aquí está lo que genera y mide el cerebro de partículas del inicio. El generador anterior se
perdió por no guardarlo; este se queda en el repo.

| Archivo | Para qué |
|---|---|
| `cerebro.py` | Genera `public/figuras/cerebro.bin` (~14 000 puntos) y `cerebro-chico.bin` (~6 000, celular). |
| `ajustar.py` | Ajusta la forma (`FORMA` en `cerebro.py`) y las poses a las siluetas del video. |
| `medir.py` | Mide una captura contra un cuadro del video: silueta (IoU), reparto de color y densidad. |

## De dónde sale la forma

De la plantilla **MNI ICBM152 2009a simétrica** (materia gris + blanca, el promedio de 152
resonancias). Viene dentro del paquete `nilearn` (`load_mni152_gm_template` y
`load_mni152_wm_template`): no hay que bajar nada. También está en TemplateFlow como
`tpl-MNI152NLin2009aSym`. Su licencia y su aviso de copyright van en
`public/figuras/cerebro-LICENCIA.txt` y deben seguir en todas las copias.

## Cómo correrlo

```bash
python3 -m venv /tmp/venv-cerebro
/tmp/venv-cerebro/bin/pip install nilearn scikit-image scipy numpy trimesh pillow
/tmp/venv-cerebro/bin/python scripts/figuras/cerebro.py                    # escribe los dos .bin (~1 min)
/tmp/venv-cerebro/bin/python scripts/figuras/cerebro.py --vista /tmp/vista # además, imágenes de revisión
```

El resultado es siempre el mismo (azar con semilla). Los pasos están al inicio de `cerebro.py`:
umbral → tronco agregado → suavizado de ~5.5 mm con el relieve exagerado → marching cubes →
pliegues estilizados → solo la cáscara de afuera → ajuste a las siluetas del video → puntos
parejos (disco de Poisson y relajación de Lloyd) → archivo.

## Formato del archivo (`CRB2`, versión 2)

Little endian: `"CRB2"`, versión (uint16), reservado (uint16), `n` (uint32), `nBase` (uint32),
escala (float32) y luego, por punto:

- `n × int16 (x, y, z)`: posición = valor × escala. Ejes del motor: x hacia el hemisferio
  izquierdo, y arriba, z al frente. La unidad es la mitad del largo del cerebro.
- `n × int8 (nx, ny, nz)` / 127: la normal.
- `n × int8` curvatura / 127: −1 cresta … +1 surco.
- `n × uint8` parte: 0 hemisferio izquierdo, 1 derecho, 2 cerebelo, 3 tronco.

Los primeros `nBase` puntos son la rejilla base (la que se ve de frente, en filas); los demás
son el relleno, que queda en medio de la base y que el motor solo enciende en el borde. Lo lee
`leerCerebro` en `src/components/escena/figuras/formas.ts`.

## Ajustar la forma y medir

```bash
python scripts/figuras/cerebro.py --crudo /tmp/crudo.npz           # puntos sin deformar
python scripts/figuras/ajustar.py CUADROS /tmp/crudo.npz --vista /tmp/ajuste
python scripts/figuras/medir.py CUADROS/video-1.0.png captura.png --t 1.0
```

`CUADROS` es una carpeta con `video-1.0.png`, `video-2.2.png`, `video-2.8.png`, `video-4.5.png`
y `video-6.0.png` (los cuadros del video, a 1212 × 750 o a 606 × 375). Lo que imprime
`ajustar.py` se copia a mano a `FORMA` (`cerebro.py`) y a las llaves `CEREBRO_A` y `CEREBRO_B`
(`motor.ts`). Las medidas van en `diseno/capturas/dala/figuras-a/NOTA.md`.
