# -*- coding: utf-8 -*-
"""Prepara para la web las fotografias REALES de la tienda.

   A diferencia de scripts/process_photos.py (imagenes de banco), estas
   son fotos de la propia BeCool, publicadas por ellas en
   instagram.com/becoolcarballo. Se descargan con scripts/ig_bajar.js a
   su tamaño original (3024x4032) y aqui se recortan y se ajustan.

   Dos cosas que hay que vigilar:
   1. Varias fotos llevan el PRECIO rotulado encima. En las tarjetas de
      novedades el precio ya lo pone la etiqueta de la web, asi que el
      recorte se elige para dejar ese texto fuera.
   2. El grado de color es minimo: son fotos de tienda con luz calida y
      pared blanca, que es justo la paleta de la web. Solo se limpia un
      punto el blanco y se baja algo la saturacion.

   Uso: python scripts/process_ig.py
"""
import os
from PIL import Image, ImageEnhance

AQUI = os.path.dirname(os.path.abspath(__file__))
ORIGEN = os.path.join(AQUI, 'ig_src')
DESTINO = os.path.abspath(os.path.join(AQUI, '..', 'assets', 'img', 'tienda'))
os.makedirs(DESTINO, exist_ok=True)

# salida -> (codigo del post, recorte relativo (x0,y0,x1,y1), proporcion, anchos)
# El recorte va en 0-1 sobre la foto original.
SALIDAS = {
    # --- prendas para "Recién colgado" (3:4, el producto) ---
    # Ojo con los recortes de p-blusa y p-vaquero: sus fotos llevan el
    # precio rotulado encima y hay que dejarlo fuera, porque el precio
    # ya lo pone la etiqueta de la web.
    'p-cazadora':  ('DdJzgWHAjbr', (0.06, 0.04, 0.94, 0.92), (3, 4), (420, 700)),
    'p-jersey':    ('DdJ2U5GAnM9', (0.02, 0.02, 0.72, 0.92), (3, 4), (420, 700)),
    'p-blusa':     ('DdJyGGPq-de', (0.12, 0.00, 0.88, 0.69), (3, 4), (420, 700)),
    'p-camiseta':  ('DdZOT6LiJ5W', (0.02, 0.06, 0.98, 0.94), (3, 4), (420, 700)),
    'p-vaquero':   ('DdJwgLFsxCn', (0.24, 0.02, 0.62, 0.80), (3, 4), (420, 700)),
    'p-bolso':     ('DdJ2U5GAnM9', (0.42, 0.22, 0.96, 0.62), (3, 4), (420, 700)),

    # --- "Dentro de la tienda": ambiente y detalle ---
    'percheros':   ('DcwjA8csM7h', (0.14, 0.00, 0.86, 0.66), (3, 4), (640, 900)),
    'perchas':     ('DdJzgWHAjbr', (0.08, 0.01, 0.96, 0.30), (4, 3), (560, 900)),
    'rayas':       ('DdZOT6LiJ5W', (0.10, 0.28, 0.86, 0.85), (4, 3), (560, 900)),
    'conjunto':    ('DdJxwgvAmVr', (0.10, 0.06, 0.88, 0.58), (4, 3), (560, 900)),
    'lechera':     ('DdJxwgvAmVr', (0.46, 0.64, 1.00, 1.00), (4, 3), (560, 900)),
    'rail':        ('DcwjA8csM7h', (0.00, 0.08, 1.00, 0.52), (16, 9), (700, 1200)),
}


def grada(im):
    """Muy poco: la luz de la tienda ya es la paleta de la web."""
    im = ImageEnhance.Color(im).enhance(0.88)
    im = ImageEnhance.Contrast(im).enhance(1.04)
    return ImageEnhance.Brightness(im).enhance(1.02)


def recorta(im, caja, prop):
    """Recorta a la caja pedida y despues ajusta a la proporcion final
       por el centro, sin deformar nada."""
    w, h = im.size
    x0, y0, x1, y1 = (int(caja[0] * w), int(caja[1] * h), int(caja[2] * w), int(caja[3] * h))
    im = im.crop((x0, y0, x1, y1))
    w, h = im.size
    objetivo = prop[0] / prop[1]
    if w / h > objetivo:                      # sobra ancho
        nuevo = int(h * objetivo)
        izq = (w - nuevo) // 2
        im = im.crop((izq, 0, izq + nuevo, h))
    else:                                     # sobra alto
        nuevo = int(w / objetivo)
        arriba = (h - nuevo) // 2
        im = im.crop((0, arriba, w, arriba + nuevo))
    return im


for nombre, (codigo, caja, prop, anchos) in SALIDAS.items():
    src = os.path.join(ORIGEN, codigo + '.jpg')
    if not os.path.exists(src):
        print('FALTA', src)
        continue
    base = grada(recorta(Image.open(src).convert('RGB'), caja, prop))
    for ancho in anchos:
        alto = int(round(ancho * prop[1] / prop[0]))
        im = base.resize((ancho, alto), Image.LANCZOS)
        salida = os.path.join(DESTINO, '%s-%d.jpg' % (nombre, ancho))
        im.save(salida, 'JPEG', quality=84, optimize=True, progressive=True)
        print(os.path.basename(salida), im.size)
