# -*- coding: utf-8 -*-
"""Descarga y prepara las fotografias de archivo de la web de BeCool.

   IMPORTANTE: no son fotos de la tienda. Son imagenes de banco (Pexels)
   elegidas a mano en scripts/contact_sheets/ y van marcadas como
   "imagen de archivo" en la propia pagina. Estan para que la tienda vea
   el sitio ocupado mientras llegan las fotos reales del escaparate y
   del interior de Rua Horreo, 14.

   El grado de color busca la paleta de la web: blancos limpios, lino
   calido, negro profundo y nada de saturacion de catalogo. Se hace con
   curvas y balance, sin filtros de desenfoque por frame ni nada que
   tenga que calcular el navegador.

   Uso: python scripts/process_photos.py
"""
import os
import urllib.request
from PIL import Image, ImageEnhance, ImageOps

AQUI = os.path.dirname(os.path.abspath(__file__))
ORIGEN = os.path.join(AQUI, 'photos_src')
DESTINO = os.path.abspath(os.path.join(AQUI, '..', 'assets', 'img', 'photos'))
os.makedirs(ORIGEN, exist_ok=True)
os.makedirs(DESTINO, exist_ok=True)

UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36')

# nombre -> (id de Pexels, proporcion, anchos, calidez)
# La calidez es el empujon hacia el lino. En "cristal" va a 0 y ademas
# se le quita rosa: la pared de esa foto tira a blush y la paleta de
# esta web no admite rosa de boutique.
FOTOS = {
    'escaparate': (16688527, (3, 4), (640, 900), 1.0),
    'barra':      (32796102, (4, 3), (560, 900), 1.0),
    'espejo':     (6594397,  (4, 3), (560, 900), 0.8),
    'punto':      (5788366,  (4, 3), (560, 900), 1.0),
    'calzado':    (38858587, (4, 3), (560, 900), 1.0),
    'cristal':    (6773800,  (4, 3), (700, 1200), -0.9),
}


def descarga(pid):
    destino = os.path.join(ORIGEN, '%d.jpg' % pid)
    if os.path.exists(destino):
        return destino
    url = ('https://images.pexels.com/photos/%d/pexels-photo-%d.jpeg'
           '?auto=compress&cs=tinysrgb&w=1900' % (pid, pid))
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r, open(destino, 'wb') as f:
        f.write(r.read())
    return destino


def grada(im, calidez=1.0):
    """Acerca la foto a la paleta: menos saturacion, blancos limpios,
       negro con cuerpo y un punto de calidez en las medias.
       Con calidez negativa hace lo contrario y enfria la imagen."""
    im = ImageEnhance.Color(im).enhance(0.72 if calidez >= 0 else 0.5)
    im = ImageEnhance.Contrast(im).enhance(1.06)
    im = ImageEnhance.Brightness(im).enhance(1.03)
    r, g, b = im.split()
    campana = lambda v: (v / 255.0) * (1 - v / 255.0) * 4
    r = r.point(lambda v: max(0, min(255, int(v + 7 * calidez * campana(v)))))
    b = b.point(lambda v: max(0, min(255, int(v - 6 * calidez * campana(v)))))
    return Image.merge('RGB', (r, g, b))


for nombre, (pid, prop, anchos, calidez) in FOTOS.items():
    src = descarga(pid)
    im = Image.open(src).convert('RGB')
    im = grada(im, calidez)
    for ancho in anchos:
        alto = int(round(ancho * prop[1] / prop[0]))
        rec = ImageOps.fit(im, (ancho, alto), Image.LANCZOS, centering=(0.5, 0.42))
        salida = os.path.join(DESTINO, '%s-%d.jpg' % (nombre, ancho))
        rec.save(salida, 'JPEG', quality=84, optimize=True, progressive=True)
        print(os.path.basename(salida), rec.size)
