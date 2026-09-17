# -*- coding: utf-8 -*-
"""Recrea el script manuscrito "BeCool" del logo real como trazado SVG.

   El unico archivo que hay del logo es el avatar de Facebook: 150x150 px,
   JPG, y dentro de el la palabra "BeCool" ocupa 66 px de alto. No se
   "redibuja a ojo": se vectoriza ese bitmap (potrace) para conservar la
   forma exacta de la firma.

   El reclamo "Clothing, shoes & more" NO se vectoriza: en el original
   mide 7 px de alto, y un trazado de 7 px sale sucio. Va compuesto en
   tipografia (sans fina) en el propio SVG del wordmark.

   Uso: python scripts/trace_logo.py
"""
import numpy as np
from PIL import Image, ImageFilter
import potrace

SRC = r'C:/Users/alvar/Downloads/274954845_1060983508092241_627488876122304990_n.jpg'
ESCALA = 8          # se traza en grande y luego se divide: curvas mas limpias
BANDA = (30, 102)   # filas del script dentro del avatar (el reclamo va aparte)
UMBRAL = 130        # 130 conserva el trazo fino y los lazos abiertos de la 'l' y las 'oo'

im = Image.open(SRC).convert('L').crop((0, BANDA[0], 150, BANDA[1]))
im = im.resize((im.width * ESCALA, im.height * ESCALA), Image.LANCZOS)
im = im.filter(ImageFilter.GaussianBlur(1.0))   # quita el escalonado del JPG
a = np.array(im)

# potracer traza los pixeles "True". Ojo: invierte el bitmap el solo, asi
# que aqui se le pasa la tinta como False (ver memoria del pipeline).
bitmap = potrace.Bitmap(a > UMBRAL)
path = bitmap.trace(turdsize=12, alphamax=1.2, opticurve=True, opttolerance=0.2)

# caja real de la tinta, para que el viewBox no lleve aire de sobra
ys, xs = np.where(a <= UMBRAL)
x0, x1 = xs.min() - 6, xs.max() + 6
y0, y1 = ys.min() - 6, ys.max() + 6

def f(v):
    return round(v, 2)

partes = []
for curve in path:
    st = curve.start_point
    d = ['M%s,%s' % (f(st.x - x0), f(st.y - y0))]
    for seg in curve:
        e = seg.end_point
        if seg.is_corner:
            c = seg.c
            d.append('L%s,%s L%s,%s' % (f(c.x - x0), f(c.y - y0), f(e.x - x0), f(e.y - y0)))
        else:
            c1, c2 = seg.c1, seg.c2
            d.append('C%s,%s %s,%s %s,%s' % (f(c1.x - x0), f(c1.y - y0),
                                             f(c2.x - x0), f(c2.y - y0),
                                             f(e.x - x0), f(e.y - y0)))
    d.append('Z')
    partes.append(' '.join(d))

w, h = x1 - x0, y1 - y0
print('viewBox', w, h, 'subtrazos', len(partes))
with open('scripts/becool-script-path.txt', 'w', encoding='utf-8') as fh:
    fh.write('%s %s\n' % (w, h))
    fh.write(' '.join(partes))
