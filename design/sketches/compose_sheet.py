"""Composes the P10 distinctness sheet at contact-sheet scale (ED #17: 240px-tall tiles) and a greyscale pair check.
Real frames where they exist (P01-P05), sketches for P06 and P07, text tiles for P08 and P09 (nothing designed yet).
Run from the project root: uv run --with pillow python design/sketches/compose_sheet.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

HERE = Path(__file__).parent
PJ = HERE / "../../.."
W, H, LAB, G = 384, 240, 18, 8
tiles = [
    (PJ / "01-atlas-human-mobility/artifacts/evidence/stage-b3/1440x900/06-futures-a-busier.png", "P01 REAL: STROKED RING, NODES, CHORDS"),
    (PJ / "02-market-microstructure-lab/artifacts/evidence/stage-a/1440x900/00-s00-t1250.png", "P02 REAL: ELECTRIC ORB, S00"),
    (PJ / "03-climate-signal-observatory/artifacts/evidence/stage-a/1440x900/01-s00-t4600-end.png", "P03 REAL: GLOBE OF CELLS, S00"),
    (PJ / "04-pulse-energy-grid/artifacts/evidence/stage-b/1440x900/fix1-s00-t3500.png", "P04 REAL: DAY ROSE, S00"),
    (PJ / "05-economic-atlas/artifacts/evidence/stage-a/1440x900/01-s00-t4600-end.png", "P05 REAL: SEED HEAD, S00 END"),
    (PJ / "06-sentinel-anomaly-lab/design/sketches/lens-s00-d.png", "P06 SKETCH: THE LENS, S00"),
    (PJ / "07-supply-chain-orchestra/design/sketches/dock-s00-d.png", "P07 SKETCH: THE CROSS-DOCK, S00"),
    ("P08 HEALTHSCAPE (PLANNED, NOT DESIGNED)\n\nCONCENTRIC POPULATION RINGS\nSETTLING ONTO A COUNTY MAP\nPURPLE #690DE2 + LIGHT BLUE\n\nP10 USES: NO RINGS, NO LIGHT BLUE", "P08 TEXT TILE"),
    ("P09 RETAIL STUDIO (PLANNED, NOT DESIGNED)\n\nROTATING COHORT RINGS, ARCS\nSHRINKING OUTWARD, RADIAL\nBASKET NETWORK, SPECTRAL + ORANGE\n\nP10 USES: NO ROTATION, NO ARCS,\nNO NODES OR LINKS", "P09 TEXT TILE"),
    (HERE / "turn-s00-d.png", "P10 A THE TURN, S00 D (SEEDED m03 CODE)"),
    (HERE / "loom-s00-d.png", "P10 B THE LOOM (REJECTED: A MESH)"),
    (HERE / "bloom-s00-d.png", "P10 C THE BLOOM (REJECTED: P02 ORB)"),
]


def tile(src):
    if isinstance(src, str):
        im = Image.new("RGB", (W, H), "#000")
        ImageDraw.Draw(im).multiline_text((14, 20), src, fill="#fff", spacing=6)
        return im
    return Image.open(src).convert("RGB").resize((W, H), Image.LANCZOS)


cols = 4
rows = (len(tiles) + cols - 1) // cols
m = Image.open(HERE / "turn-s00-m.png").convert("RGB")
mh = rows * (H + LAB + G) - G - LAB
mw = round(m.width * mh / m.height)
sheet = Image.new("RGB", (cols * (W + G) + G + mw + G, rows * (H + LAB + G) + G), "#111")
d = ImageDraw.Draw(sheet)
for i, (src, label) in enumerate(tiles):
    x, y = G + (i % cols) * (W + G), G + (i // cols) * (H + LAB + G)
    sheet.paste(tile(src), (x, y + LAB))
    d.text((x + 2, y + 3), label, fill="#fff")
x = G + cols * (W + G)
sheet.paste(m.resize((mw, mh), Image.LANCZOS), (x, G + LAB))
d.text((x + 2, G + 3), "P10 A S00 M", fill="#fff")
sheet.save(HERE / "distinctness-sheet.png")

# Greyscale watch-item pairs: P10 vs the two other frame-filling circular textures (P04 rose, P05 seed head)
pairs = [tiles[3], tiles[4], tiles[9]]
pair = Image.new("RGB", (3 * (W + G) + G, 2 * (H + LAB + G) + G), "#111")
d = ImageDraw.Draw(pair)
for i, (src, label) in enumerate(pairs):
    im = tile(src)
    for row, img in enumerate((im, ImageOps.grayscale(im).convert("RGB"))):
        x, y = G + i * (W + G), G + row * (H + LAB + G)
        pair.paste(img, (x, y + LAB))
        d.text((x + 2, y + 3), label + (" (GREY)" if row else ""), fill="#fff")
pair.save(HERE / "p04-p05-p10-grey.png")
print("sheet", sheet.size, "pair", pair.size)
