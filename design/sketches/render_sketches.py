"""P10 design sketches, rendered from the project's own seeded reference code (read-only import of analytics/).

Concept A "The Turn" (selected): one thread per seeded future of the m03 project-NPV environment.
  radius = years since the decision (centre = the decision, rim = year 8)
  angle  = cash recovered so far as a share of that future's own investment, clockwise from 12 o'clock
           (one full turn = the money back; ending past 12 o'clock = positive NPV)
  The rim is round because every future shares the same 8-year horizon.
Concept B "The Loom" (rejected): Brownian-bridge threads whose 95% envelope is an exact circle.
Concept C "The Bloom" (rejected, the plan's form): a central orb with rays, angle = current rank.

Sketch only: the per-year path below re-derives cumulative discounted cash with the same draw order as
analytics/mc.npv_trial (data request DR-1 asks m03 to publish these paths for parity).
Run from the project root:  python3 design/sketches/render_sketches.py
then rasterize:  NODE_PATH=../03-climate-signal-observatory/site/node_modules node design/sketches/render_sheet.mjs
"""
import math
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE / "../.."))
from analytics.mc import tri_inv  # noqa: E402
from analytics.rng import Xoshiro128ss  # noqa: E402

SEED = 20261011
VIOLET_LINE, VIOLET_FILL, LOSS = "#B48CFF", "#690DE2", "#FF5C8A"


def npv_path(rng):
    """[(year, cash recovered / investment)] for years 0..8, plus the NPV. Same draws as npv_trial."""
    inv = math.exp(math.log(100.0) + 0.15 * rng.normal())
    r1 = 48.0 + 8.0 * rng.normal()
    g = tri_inv(rng.uniform(), -0.02, 0.06, 0.15)
    m = 0.35 + 0.05 * rng.normal()
    r = 0.07 + 0.05 * rng.uniform()
    pv, cf, d, f = 0.0, r1 * m, 1.0, [0.0]
    for _ in range(8):
        d *= 1.0 + r
        pv += cf / d
        cf *= 1.0 + g
        f.append(pv / inv)
    return f, pv - inv


def futures(n):
    rng = Xoshiro128ss(SEED)
    return [npv_path(rng) for _ in range(n)]


def head(w, h):
    return [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">',
            '<defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>'
            '<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>',
            f'<rect width="{w}" height="{h}" fill="#000"/>',
            '<style>text{font-family:"JetBrains Mono",ui-monospace,monospace;fill:#fff;letter-spacing:.04em}'
            '.serif{font-family:"Newsreader",Georgia,serif;letter-spacing:0}.m{fill:rgba(255,255,255,.5)}</style>']


def turn_threads(cx, cy, R, fs, steps=12, width=0.6):
    """Polylines for concept A. Linear in f between year ends (drawn as if cash arrived evenly; data are year-end)."""
    out, cross = [], []
    for f, npv in fs:
        pts = []
        for y in range(8):
            for s in range(steps):
                t = y + s / steps
                ff = f[y] + (f[y + 1] - f[y]) * s / steps
                pts.append((t, ff))
        pts.append((8.0, f[8]))
        xy = []
        for t, ff in pts:
            rr, a = R * t / 8, 2 * math.pi * ff
            xy.append((cx + rr * math.sin(a), cy - rr * math.cos(a)))
        for (t0, f0), (t1, f1) in zip(pts, pts[1:]):
            if f0 < 1 <= f1:
                tc = t0 + (t1 - t0) * (1 - f0) / (f1 - f0)
                cross.append(R * tc / 8)
                break
        col = "#FFFFFF" if npv >= 0 else VIOLET_LINE
        d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in xy)
        out.append(f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{width}" stroke-opacity=".16" style="mix-blend-mode:screen"/>')
    return out, cross


def turn(name, w, h, cx, cy, R, n, text):
    fs = futures(n)
    svg = head(w, h)
    svg.append(f'<circle cx="{cx}" cy="{cy}" r="{R*0.55:.0f}" fill="{VIOLET_FILL}" opacity=".30" filter="url(#glow)"/>')
    threads, cross = turn_threads(cx, cy, R, fs)
    svg += threads
    for rc in cross:  # payback crossings: where a thread completes its first full turn
        svg.append(f'<rect x="{cx-0.9:.1f}" y="{cy-rc-0.9:.1f}" width="1.8" height="1.8" fill="#fff" opacity=".5"/>')
    svg.append(f'<rect x="{cx-2}" y="{cy-2}" width="4" height="4" fill="#fff"/>')
    svg += text(fs, cross)
    svg.append("</svg>")
    (HERE / f"{name}.svg").write_text("\n".join(svg))
    loss = sum(1 for _, v in fs if v < 0) / len(fs)
    print(name, "futures", len(fs), "loss share", round(loss, 4), "paid back", len(cross))


def text_d(fs, cross):
    loss = sum(1 for _, v in fs if v < 0) / len(fs)
    return [
        '<rect x="0" y="0" width="760" height="380" fill="url(#none)"/>',
        '<text x="96" y="52" font-size="13">DECISION UNIVERSE</text>',
        f'<text x="1408" y="52" font-size="13" text-anchor="end">INVEST 100 M USD · {len(fs):,} FUTURES · SEED {SEED}</text>',
        '<text x="1408" y="72" font-size="13" text-anchor="end" class="m">OUTWARD = YEARS · ONE FULL TURN = MONEY BACK</text>',
        '<text class="serif" x="96" y="170" font-size="72">Every decision creates</text>',
        '<text class="serif" x="96" y="250" font-size="72">a different future.</text>',
        '<rect x="96" y="282" width="452" height="28" fill="#ffffff1a"/>',
        '<text x="104" y="301" font-size="13" fill="#b48cff" style="fill:#b48cff">SYNTHETIC · SEEDED · RUNNING IN YOUR BROWSER</text>',
        f'<text x="96" y="840" font-size="13">{round(100*(1-loss))}% PAY BACK IN 8 YEARS · {round(100*loss)}% NEVER COMPLETE THE TURN</text>',
        '<text x="96" y="860" font-size="13" class="m">WHITE = POSITIVE NPV · VIOLET = LOSS · DOTS ON THE 12 O\'CLOCK LINE = PAYBACK YEAR</text>',
    ]


def text_m(fs, cross):
    """M composition: statement at the TOP, the Turn below it (not P04/P05's disc-above, statement-below)."""
    loss = sum(1 for _, v in fs if v < 0) / len(fs)
    return [
        '<rect x="0" y="0" width="390" height="236" fill="#000" opacity=".78"/>',
        '<text x="16" y="32" font-size="11">DECISION UNIVERSE</text>',
        f'<text x="374" y="32" font-size="11" text-anchor="end">SEED {SEED}</text>',
        '<text class="serif" x="16" y="96" font-size="40">Every decision</text>',
        '<text class="serif" x="16" y="138" font-size="40">creates a different</text>',
        '<text class="serif" x="16" y="180" font-size="40">future.</text>',
        '<rect x="16" y="200" width="196" height="22" fill="#ffffff1a"/>',
        '<text x="22" y="215" font-size="11" style="fill:#b48cff">SYNTHETIC · SEEDED</text>',
        f'<text x="16" y="760" font-size="11">{round(100*(1-loss))}% PAY BACK IN 8 YEARS</text>',
        '<rect x="115" y="790" width="160" height="32" fill="#fff"/><text x="195" y="811" font-size="11" text-anchor="middle" style="fill:#000">THE DECISION</text>',
    ]


def loom(name, w, h, n=1200):
    """Concept B: Brownian bridges (ECDF error of a 250-draw sample across all probability levels), poles top and bottom."""
    rng = Xoshiro128ss(SEED + 1)
    cx, cy, R = 900, 450, 560
    svg = head(w, h)
    svg.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{R*0.5}" ry="{R*0.8}" fill="{VIOLET_FILL}" opacity=".25" filter="url(#glow)"/>')
    k, steps = 250, 120
    scale = R / (1.959964 * 0.5)  # z * sqrt(u(1-u)) at u = .5 maps to R: the 95% envelope is the circle
    for _ in range(n):
        us = sorted(rng.uniform() for _ in range(k))
        pts, j = [], 0
        for i in range(steps + 1):
            u = i / steps
            while j < k and us[j] <= u:
                j += 1
            e = math.sqrt(k) * (j / k - u)
            pts.append((cx + scale * e, cy - R + 2 * R * u))
        d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts)
        svg.append(f'<path d="{d}" fill="none" stroke="#fff" stroke-width=".6" stroke-opacity=".12"/>')
    svg += ['<text class="serif" x="96" y="170" font-size="72">Every estimate</text>',
            '<text class="serif" x="96" y="250" font-size="72">has a shape.</text>', "</svg>"]
    (HERE / f"{name}.svg").write_text("\n".join(svg))


def bloom(name, w, h, n=1500):
    """Concept C, the plan's form: central orb, rays outward in time, angle = current rank of cash recovered."""
    fs = futures(n)
    cx, cy, R = 900, 450, 600
    svg = head(w, h)
    svg.append(f'<circle cx="{cx}" cy="{cy}" r="90" fill="#8F5BFF" opacity=".9" filter="url(#glow)"/>')
    paths = [[] for _ in fs]
    for s in range(0, 8 * 8 + 1):
        t = s / 8
        y = min(int(t), 7)
        vals = [f[y] + (f[y + 1] - f[y]) * (t - y) for f, _ in fs]
        order = sorted(range(len(fs)), key=vals.__getitem__)
        for rank, i in enumerate(order):
            a = 2 * math.pi * (rank + 0.5) / len(fs)
            paths[i].append((cx + R * t / 8 * math.sin(a), cy - R * t / 8 * math.cos(a)))
    for (f, npv), p in zip(fs, paths):
        d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in p)
        svg.append(f'<path d="{d}" fill="none" stroke="{"#fff" if npv >= 0 else VIOLET_LINE}" stroke-width=".6" stroke-opacity=".22"/>')
    svg += ['<text class="serif" x="96" y="760" font-size="72">Every decision creates</text>',
            '<text class="serif" x="96" y="840" font-size="72">a different future.</text>', "</svg>"]
    (HERE / f"{name}.svg").write_text("\n".join(svg))


if __name__ == "__main__":
    turn("turn-s00-d", 1440, 900, 1010, 470, 590, 2500, text_d)
    turn("turn-s00-m", 390, 844, 195, 600, 460, 1500, text_m)
    loom("loom-s00-d", 1440, 900)
    bloom("bloom-s00-d", 1440, 900)
