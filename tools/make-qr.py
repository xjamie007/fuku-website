#!/usr/bin/env python3
"""
Erzeugt QR-Codes für die Website.

    python3 tools/make-qr.py                                  # → fuku.lu
    python3 tools/make-qr.py https://beispiel.lu --name test

Je Ziel entstehen drei Dateien in assets/img/:

  qr-<name>.svg        verlustfrei, für den Druck (Aufsteller, Flyer, Karte)
  qr-<name>.png        1200 px, für Bildschirm und soziale Netzwerke
  qr-<name>-karte.png  fertiger Aufsteller mit Logo, Adresse und Hinweis

Fehlerkorrektur steht auf Stufe H (30 %): So bleibt der Code lesbar, auch
wenn ein Aufsteller im Restaurant Kratzer oder Fettflecken abbekommt.

Den Code selbst erzeugt der QR-Generator von macOS (Core Image) über ein
kleines Swift-Hilfsprogramm. Eine eigene Implementierung wäre fehleranfällig
und müsste gepflegt werden; Core Image ist erprobt und immer vorhanden.

Nach jeder Änderung prüft das Skript den erzeugten Code, indem es ihn wieder
einliest. Ein QR-Code, der nicht zurückgelesen werden kann, wird nicht
gespeichert.
"""

import argparse
import os
import shutil
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

INK = (23, 17, 14)
PAPER = (251, 248, 244)
BRAND = (216, 65, 42)
MUTED = (125, 110, 101)

# --------------------------------------------------------------------
# Swift-Hilfsprogramme: erzeugen und zurücklesen
# --------------------------------------------------------------------

SWIFT_GEN = r"""
import Foundation
import CoreImage
import AppKit
let a = CommandLine.arguments
let f = CIFilter(name: "CIQRCodeGenerator")!
f.setValue(a[1].data(using: .utf8), forKey: "inputMessage")
f.setValue(a.count > 3 ? a[3] : "H", forKey: "inputCorrectionLevel")
guard let img = f.outputImage,
      let d = NSBitmapImageRep(ciImage: img).representation(using: .png, properties: [:])
else { exit(1) }
try d.write(to: URL(fileURLWithPath: a[2]))
"""

SWIFT_READ = r"""
import Foundation
import CoreImage
let a = CommandLine.arguments
guard let img = CIImage(contentsOf: URL(fileURLWithPath: a[1])) else { exit(1) }
let det = CIDetector(ofType: CIDetectorTypeQRCode, context: CIContext(),
                     options: [CIDetectorAccuracy: CIDetectorAccuracyHigh])!
let hits = det.features(in: img).compactMap { ($0 as? CIQRCodeFeature)?.messageString }
print(hits.first ?? "")
"""


def build_helper(source, name, workdir):
    """Übersetzt ein Swift-Schnipsel einmalig und liefert den Pfad."""
    src = os.path.join(workdir, f"{name}.swift")
    binary = os.path.join(workdir, name)
    open(src, "w", encoding="utf-8").write(source)
    r = subprocess.run(["swiftc", "-O", src, "-o", binary], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"✗ Swift-Übersetzung fehlgeschlagen:\n{r.stderr[:400]}")
    return binary


def qr_matrix(text, level, workdir):
    """QR-Code erzeugen und als Matrix aus 0/1 zurückgeben."""
    gen = build_helper(SWIFT_GEN, "genqr", workdir)
    raw = os.path.join(workdir, "raw.png")
    if subprocess.run([gen, text, raw, level]).returncode != 0:
        sys.exit("✗ QR-Code konnte nicht erzeugt werden")

    # Core Image liefert genau einen Bildpunkt je Modul.
    img = Image.open(raw).convert("L")
    w, h = img.size
    px = img.load()
    return [[1 if px[c, r] < 128 else 0 for c in range(w)] for r in range(h)]


def verify(path, expected, workdir):
    """Erzeugten Code zurücklesen – ein unlesbarer Code darf nicht bleiben."""
    reader = build_helper(SWIFT_READ, "readqr", workdir)
    r = subprocess.run([reader, path], capture_output=True, text=True)
    return r.stdout.strip() == expected


# --------------------------------------------------------------------
# Ausgabeformate
# --------------------------------------------------------------------

def write_svg(matrix, path, quiet=4):
    size = len(matrix)
    total = size + quiet * 2
    d = []
    for r, row in enumerate(matrix):
        for c, v in enumerate(row):
            if v:
                d.append(f"M{c + quiet} {r + quiet}h1v1h-1z")
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total} {total}" '
        f'shape-rendering="crispEdges" role="img" aria-label="QR-Code zur Website">'
        f'<rect width="{total}" height="{total}" fill="#FFFFFF"/>'
        f'<path fill="#17110E" d="{"".join(d)}"/></svg>'
    )
    open(path, "w", encoding="utf-8").write(svg)


def render(matrix, px, quiet=4):
    """Matrix als scharfes Bild – NEAREST, damit die Kanten hart bleiben."""
    size = len(matrix) + quiet * 2
    img = Image.new("RGB", (size, size), "white")
    for r, row in enumerate(matrix):
        for c, v in enumerate(row):
            if v:
                img.putpixel((c + quiet, r + quiet), INK)
    return img.resize((px, px), Image.NEAREST)


def font(size, bold=False):
    base = "/System/Library/Fonts/Supplemental"
    name = "Arial Bold.ttf" if bold else "Arial.ttf"
    path = os.path.join(base, name)
    if os.path.exists(path):
        return ImageFont.truetype(path, size)
    return ImageFont.load_default(size)


def write_card(matrix, path, url, px=1200):
    """Aufsteller für den Tisch oder die Theke."""
    # Höhe aus dem Inhalt ableiten: Ein festes Seitenverhältnis liess unten
    # einen breiten leeren Streifen stehen.
    rand = int(px * 0.055)
    qr_px = int(px * 0.60)
    pad = int(px * 0.028)
    qy = int(px * 0.235)
    unterkante = qy + qr_px + pad * 2 + int(px * 0.05) + int(px * 0.155)

    W, H = px, unterkante + rand
    card = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(card)

    def center(text, y, f, fill=INK):
        w = d.textbbox((0, 0), text, font=f)[2]
        d.text(((W - w) // 2, y), text, font=f, fill=fill)

    logo_path = os.path.join(ROOT, "assets/img/logo.png")
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        lh = int(px * 0.10)
        logo = logo.resize((max(1, int(logo.width * lh / logo.height)), lh), Image.LANCZOS)
        card.paste(logo, ((W - logo.width) // 2, int(px * 0.055)), logo)

    center("VIANDEN", int(px * 0.175), font(int(px * 0.025), True), MUTED)

    plate = Image.new("RGB", (qr_px + pad * 2, qr_px + pad * 2), "white")
    plate.paste(render(matrix, qr_px), (pad, pad))
    card.paste(plate, ((W - plate.width) // 2, qy))

    y = qy + plate.height + int(px * 0.05)
    center("Karte scannen & bestellen", y, font(int(px * 0.052), True))
    center(url.replace("https://", "").rstrip("/"), y + int(px * 0.072), font(int(px * 0.030)), BRAND)
    center("9, Rue de la Gare · L-9420 Vianden", y + int(px * 0.125), font(int(px * 0.026)), MUTED)

    card.save(path, quality=95)


# --------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url", nargs="?", default="https://fuku.lu/")
    ap.add_argument("--name", default="fuku")
    ap.add_argument("--level", default="H", choices=["L", "M", "Q", "H"])
    args = ap.parse_args()

    if not shutil.which("swiftc"):
        sys.exit("✗ swiftc fehlt – dieses Skript braucht die Xcode-Kommandozeilenwerkzeuge:\n"
                 "  xcode-select --install")

    out_dir = os.path.join(ROOT, "assets/img")
    os.makedirs(out_dir, exist_ok=True)

    with tempfile.TemporaryDirectory() as work:
        matrix = qr_matrix(args.url, args.level, work)

        svg = os.path.join(out_dir, f"qr-{args.name}.svg")
        png = os.path.join(out_dir, f"qr-{args.name}.png")
        card = os.path.join(out_dir, f"qr-{args.name}-karte.png")

        render(matrix, 1200).save(png)

        # Erst prüfen, dann die übrigen Formate schreiben.
        if not verify(png, args.url, work):
            os.remove(png)
            sys.exit("✗ Der erzeugte Code liess sich nicht zurücklesen – nichts gespeichert.")

        write_svg(matrix, svg)
        write_card(matrix, card, args.url)

        if not verify(card, args.url, work):
            sys.exit("✗ Der Aufsteller liess sich nicht zurücklesen – bitte prüfen.")

    print(f"→ {args.url}")
    print(f"  {len(matrix)}×{len(matrix)} Module, Fehlerkorrektur {args.level}")
    print("  ✓ zurückgelesen und bestätigt")
    for p in (svg, png, card):
        print(f"  ✓ {os.path.relpath(p, ROOT)} – {os.path.getsize(p) // 1024} KB")


if __name__ == "__main__":
    main()
