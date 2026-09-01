#!/usr/bin/env python3
"""
Erzeugt das Kartenbild für die Kontaktseite.

Die Karte wird einmalig aus OpenStreetMap-Kacheln zusammengesetzt und als
Bild im Projekt abgelegt. Dadurch ist sie beim Besuch sofort sichtbar, ohne
dass eine Anfrage an einen fremden Server geht – die Seite bleibt ohne
Cookie-Banner. Der Klick auf das Bild führt nach Google Maps.

    python3 tools/make-map.py

Kartendaten © OpenStreetMap-Mitwirkende (ODbL). Die Namensnennung steht
sichtbar unter der Karte auf kontakt.html.
"""

import math
import os
import re
import sys
import urllib.request
from io import BytesIO

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ZOOM = 18                 # ~0,4 m pro Pixel – Strassenzüge klar erkennbar
WIDTH, HEIGHT = 1600, 900  # doppelte Auflösung für scharfe Darstellung
TILE = 256
BRAND = (216, 65, 42)     # --brand aus style.css
INK = (23, 17, 14)

UA = "RestaurantFukuWebsite/1.0 (einmaliger Kartenbau; info@fuku.lu)"


def coords_from_app_js():
    """Liest lat/lon aus assets/js/app.js – eine Quelle für beide Seiten."""
    src = open(os.path.join(ROOT, "assets/js/app.js"), encoding="utf-8").read()
    m = re.search(r"coords:\s*\{\s*lat:\s*([\d.]+),\s*lon:\s*([\d.]+)", src)
    if not m:
        sys.exit("✗ coords nicht in app.js gefunden")
    return float(m.group(1)), float(m.group(2))


def to_pixels(lat, lon, zoom):
    """Weltkoordinaten → Pixelposition (Web-Mercator)."""
    n = TILE * 2 ** zoom
    x = (lon + 180.0) / 360.0 * n
    rad = math.radians(lat)
    y = (1.0 - math.asinh(math.tan(rad)) / math.pi) / 2.0 * n
    return x, y


def fetch_tile(z, x, y):
    url = f"https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return Image.open(BytesIO(r.read())).convert("RGB")


def build(lat, lon):
    cx, cy = to_pixels(lat, lon, ZOOM)
    left, top = cx - WIDTH / 2, cy - HEIGHT / 2

    x0, y0 = int(left // TILE), int(top // TILE)
    x1, y1 = int((left + WIDTH) // TILE), int((top + HEIGHT) // TILE)

    canvas = Image.new("RGB", ((x1 - x0 + 1) * TILE, (y1 - y0 + 1) * TILE), "#eee")
    total = (x1 - x0 + 1) * (y1 - y0 + 1)
    done = 0

    for tx in range(x0, x1 + 1):
        for ty in range(y0, y1 + 1):
            try:
                canvas.paste(fetch_tile(ZOOM, tx, ty), ((tx - x0) * TILE, (ty - y0) * TILE))
            except Exception as exc:  # einzelne fehlende Kachel bricht nichts
                print(f"  ⚠︎ Kachel {tx}/{ty}: {exc}")
            done += 1
            print(f"\r  Kacheln {done}/{total}", end="", flush=True)
    print()

    img = canvas.crop((
        int(left - x0 * TILE), int(top - y0 * TILE),
        int(left - x0 * TILE) + WIDTH, int(top - y0 * TILE) + HEIGHT,
    ))

    draw_marker(img)
    return img


def draw_marker(img):
    """Tropfenförmiger Marker in der Markenfarbe, mittig auf der Adresse."""
    d = ImageDraw.Draw(img, "RGBA")
    cx, cy = WIDTH // 2, HEIGHT // 2
    r = 26

    # weicher Schatten unter dem Marker
    d.ellipse((cx - r, cy + r - 8, cx + r, cy + r + 6), fill=(23, 17, 14, 55))
    # Spitze
    d.polygon([(cx - 15, cy + 6), (cx + 15, cy + 6), (cx, cy + r + 4)], fill=BRAND)
    # Kopf mit weissem Ring
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=BRAND, outline=(255, 255, 255), width=5)
    d.ellipse((cx - 9, cy - 9, cx + 9, cy + 9), fill=(255, 255, 255))


def main():
    lat, lon = coords_from_app_js()
    print(f"→ Karte für {lat}, {lon} (Zoom {ZOOM}) …")
    img = build(lat, lon)

    out = os.path.join(ROOT, "assets/img/karte.jpg")
    img.save(out, quality=86, optimize=True, progressive=True)
    print(f"✓ {out} – {img.size[0]}×{img.size[1]}, {os.path.getsize(out)//1024} KB")


if __name__ == "__main__":
    main()
