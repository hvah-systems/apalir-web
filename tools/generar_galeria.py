"""Genera la galería (fotos y videos del chat de WhatsApp «Maribel Pastora»).

Lee las fotos de ~/Downloads/WhatsApp-Maribel-Pastora-fotos (numeradas 001-520 por fecha)
y los videos de ~/Downloads/WhatsApp-Maribel-Pastora-videos, y escribe:
  assets/galeria/<iglesia|fundacion>/NNN.jpg  (1400 px, sin EXIF) + t/NNN.jpg (miniatura)
  assets/videos/vNN.mp4 + vNN.jpg (portada)
  galeria.html
Uso: PYTHONPATH=<pillow> python3 tools/generar_galeria.py <carpeta-de-portadas-png>
"""
import html
import os
import shutil
import sys

from PIL import Image, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOTOS = os.path.expanduser('~/Downloads/WhatsApp-Maribel-Pastora-fotos')
VIDEOS = os.path.expanduser('~/Downloads/WhatsApp-Maribel-Pastora-videos')

# Fotos que NO se publican: facturas/pedidos, cédula, capturas, logos y volantes repetidos,
# retratos privados, personas acostadas o sin camisa en su casa, interiores de carro.
EXCLUIR = {1, 2, 3, 4, 5, 37, 71, 95, 121, 122, 123, 141, 144, 146, 172, 180, 224, 296, 297,
           314, 326, 358, 362, 399, 400, 401, 402, 420, 423, 519}
IGLESIA = set(range(6, 9)) | {10} | set(range(35, 37)) | set(range(40, 51)) | set(range(52, 57)) \
    | set(range(363, 392)) | set(range(403, 470)) | set(range(471, 493))
VIDEOS_IGLESIA = {2, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 32, 35, 37}
UMBRAL_DUPLICADO = 5  # distancia de hash: menor o igual = foto casi idéntica


def dhash(im, lado=8):
    g = im.convert('L').resize((lado + 1, lado), Image.LANCZOS)
    px = list(g.get_flattened_data()) if hasattr(g, "get_flattened_data") else list(g.getdata())
    return sum(1 << i for i in range(lado * lado)
               if px[(i // lado) * (lado + 1) + i % lado] > px[(i // lado) * (lado + 1) + i % lado + 1])


def guardar(im, destino, ancho, calidad):
    if im.width > ancho:
        im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
    im.save(destino, quality=calidad, optimize=True, progressive=True)  # sin EXIF ni GPS
    return im.size


def fotos():
    archivos = sorted(f for f in os.listdir(FOTOS) if f.lower().endswith('.jpg'))
    vistos, salida = [], {'iglesia': [], 'fundacion': []}
    duplicadas = 0
    for n, nombre in enumerate(archivos, 1):
        if n in EXCLUIR:
            continue
        im = ImageOps.exif_transpose(Image.open(os.path.join(FOTOS, nombre))).convert('RGB')
        h = dhash(im)
        if any(bin(h ^ v).count('1') <= UMBRAL_DUPLICADO for v in vistos):
            duplicadas += 1
            continue
        vistos.append(h)
        grupo = 'iglesia' if n in IGLESIA else 'fundacion'
        carpeta = os.path.join(RAIZ, 'assets', 'galeria', grupo)
        os.makedirs(os.path.join(carpeta, 't'), exist_ok=True)
        w, hh = guardar(im, os.path.join(carpeta, f'{n:03d}.jpg'), 1400, 78)
        tw, th = guardar(im.copy(), os.path.join(carpeta, 't', f'{n:03d}.jpg'), 420, 70)
        salida[grupo].append((n, tw, th))
    return salida, duplicadas


def videos(portadas):
    destino = os.path.join(RAIZ, 'assets', 'videos')
    os.makedirs(destino, exist_ok=True)
    salida = {'iglesia': [], 'fundacion': []}
    for nombre in sorted(f for f in os.listdir(VIDEOS) if f.endswith('.mp4')):
        num = int(nombre[1:3])
        shutil.copy2(os.path.join(VIDEOS, nombre), os.path.join(destino, f'v{num:02d}.mp4'))
        png = os.path.join(portadas, nombre + '.png')
        im = Image.open(png).convert('RGB')
        guardar(im, os.path.join(destino, f'v{num:02d}.jpg'), 640, 72)
        salida['iglesia' if num in VIDEOS_IGLESIA else 'fundacion'].append((num, im.width, im.height))
    return salida


def rejilla(grupo, lista, titulo):
    items = '\n'.join(
        f'<li><button class="mini" type="button" data-full="assets/galeria/{grupo}/{n:03d}.jpg">'
        f'<img src="assets/galeria/{grupo}/t/{n:03d}.jpg" alt="{html.escape(titulo)}, foto {i}" '
        f'width="{w}" height="{h}" loading="lazy"></button></li>'
        for i, (n, w, h) in enumerate(lista, 1))
    return f'<ul class="rejilla">\n{items}\n</ul>'


def rejilla_videos(lista, titulo):
    return '<ul class="rejilla videos">\n' + '\n'.join(
        f'<li><video controls preload="none" playsinline poster="assets/videos/v{n:02d}.jpg" '
        f'width="{w}" height="{h}" aria-label="{html.escape(titulo)}, video {i}">'
        f'<source src="assets/videos/v{n:02d}.mp4" type="video/mp4"></video></li>'
        for i, (n, w, h) in enumerate(lista, 1)) + '\n</ul>'


def enlace(href, texto, clase=''):
    c = f' class="{clase}"' if clase else ''
    return f'        <li><a{c} href="{href}">{texto}</a></li>'


SITIOS = {
    'iglesia': dict(
        archivo='galeria.html', NOMBRE='Iglesia Apalir', INICIO='index.html', LOGO='assets/logo.png',
        LOGO_W='505', LOGO_H='192',
        H1='Momentos de la <em>Iglesia Apalir</em>',
        TEXTO='Cultos, celebraciones y encuentros de la familia Apalir junto a la Pastora Maribel.',
        DESCRIPCION='Fotos y videos de la Iglesia Apalir: cultos, el encuentro Quitando la piedra y '
                    'celebraciones junto a la Pastora Maribel.',
        NAV=[('index.html', 'Inicio'), ('index.html#pastora', 'Pastora'), ('viaje-israel.html', 'Viaje a Israel'), ('#fotos', 'Galería'),
             ('fundacion.html', 'Fundación'), ('index.html#contacto', 'Contacto'),
             ('index.html#cultos', 'Cultos por Zoom', 'nav-cta')],
        CTA='<a class="btn btn-oro ver-mas" href="index.html#cultos">Únete a un culto por Zoom</a>'),
    'fundacion': dict(
        archivo='galeria-fundacion.html', NOMBRE='Fundación Apalir', INICIO='fundacion.html',
        LOGO='assets/fundacion-logo.png', LOGO_W='937', LOGO_H='408',
        H1='La obra de la <em>Fundación Apalir</em>',
        TEXTO='Entregas a envejecientes, Una tarde con Jesús, De regreso a clases y operativos médicos.',
        DESCRIPCION='Fotos y videos de la Fundación Apalir: entregas a envejecientes, Una tarde con '
                    'Jesús, De regreso a clases y operativos médicos.',
        NAV=[('fundacion.html', 'Inicio'), ('fundacion.html#programas', 'Programas'), ('#fotos', 'Galería'),
             ('fundacion.html#contacto', 'Contacto'), ('index.html', 'Iglesia Apalir'),
             ('fundacion.html#donar', 'Donar', 'nav-cta')],
        CTA='<a class="btn btn-oro ver-mas" href="fundacion.html#donar">Apoya la obra de la Fundación</a>'),
}


def pagina(tema, fotos_tema, videos_tema):
    s = SITIOS[tema]
    t = open(os.path.join(RAIZ, 'tools', 'galeria.plantilla.html'), encoding='utf-8').read()
    valores = {k: v for k, v in s.items() if k not in ('archivo', 'NAV')}
    valores.update(TEMA=tema, NAV='\n'.join(enlace(*n) for n in s['NAV']),
                   FOTOS=rejilla(tema, fotos_tema, s['NOMBRE']),
                   VIDEOS=rejilla_videos(videos_tema, s['NOMBRE']),
                   N_F=str(len(fotos_tema)), N_V=str(len(videos_tema)))
    for k, v in valores.items():
        t = t.replace('{{' + k + '}}', v)
    assert '{{' not in t, 'quedó un hueco sin llenar en la plantilla'
    return s['archivo'], t


if __name__ == '__main__':
    f, dup = fotos()
    v = videos(sys.argv[1])
    for tema in ('iglesia', 'fundacion'):
        archivo, contenido = pagina(tema, f[tema], v[tema])
        open(os.path.join(RAIZ, archivo), 'w', encoding='utf-8').write(contenido)
    assert len(f['iglesia']) + len(f['fundacion']) + dup + len(EXCLUIR) == 520, 'faltan fotos por contar'
    print(f"fotos iglesia={len(f['iglesia'])} fundacion={len(f['fundacion'])} duplicadas={dup} "
          f"excluidas={len(EXCLUIR)} | videos iglesia={len(v['iglesia'])} fundacion={len(v['fundacion'])}")
