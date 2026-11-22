"""Line up each painted Empire map with its Kingdom outlines, and put the paintings in the app.

For every painting in "KOG Images/Generated/maps": find each Realm's colored area in the painting, then
fit one scale-and-shift (x and y separately) that carries the outlines (js/empiremaps.js coordinates)
onto those areas, using every Realm's bounding box. Writes:
  assets/maps/<EMPIRE>.webp   the painting, sized for phones
  js/empirepaint.js           { EMPIRE: { src, w, h, m: [sx, sy, tx, ty] } }: painting x = sx * x + tx, y = sy * y + ty

Run from the repo root:  python tools/fit_empire_paint.py   (prints how well each one fits)
"""
import json
import pathlib
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import make_map_refs as refs  # noqa: E402  (outlines, Realms and colors)

ROOT = refs.ROOT
SRC = pathlib.Path(r'C:/Users/thoma/OneDrive/Desktop/KOG Images/Generated/maps')
OUT = ROOT / 'assets/maps'
WIDTH = 1200  # pixels across in the app (portrait maps get 900)
# Paintings made from an earlier reference map, with more sea around the country.
OLD_PAD = {'FR': 70}


def hexrgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float32)


def realm_boxes_in_painting(img, colors):
    """Bounding box of each Realm color in the painting (robust: 2nd to 98th percentile of its pixels)."""
    a = np.asarray(img.convert('RGB').resize((img.width // 3, img.height // 3)), dtype=np.float32)
    pal = np.stack([hexrgb(c) for c in colors])
    d = np.linalg.norm(a[:, :, None, :] - pal[None, None, :, :], axis=3)
    best = d.argmin(axis=2)
    close = d.min(axis=2) < 62
    boxes = []
    for i in range(len(colors)):
        ys, xs = np.nonzero(close & (best == i))
        if len(xs) < 40:
            boxes.append(None)
            continue
        boxes.append([np.percentile(xs, 2) * 3, np.percentile(ys, 2) * 3, np.percentile(xs, 98) * 3, np.percentile(ys, 98) * 3])
    return boxes


def realm_boxes_in_outlines(m, realms):
    out = []
    for kgs in realms:
        b = [m['box'][k] for k in kgs if k in m['box']]
        out.append([min(x[0] for x in b), min(x[1] for x in b), max(x[2] for x in b), max(x[3] for x in b)])
    return out


def fit(src_boxes, dst_boxes):
    """Least squares: dst = s * src + t, separately for x and y, over every Realm's box edges."""
    xs, xd, ys, yd = [], [], [], []
    for s, d in zip(src_boxes, dst_boxes):
        if d is None:
            continue
        xs += [s[0], s[2]]
        xd += [d[0], d[2]]
        ys += [s[1], s[3]]
        yd += [d[1], d[3]]
    sx, tx = np.polyfit(xs, xd, 1)
    sy, ty = np.polyfit(ys, yd, 1)
    err = np.sqrt(np.mean(np.square(np.array(xd) - (sx * np.array(xs) + tx)).tolist() + np.square(np.array(yd) - (sy * np.array(ys) + ty)).tolist()))
    return [float(sx), float(sy), float(tx), float(ty)], float(err)


def refine(img, m, realms, start):
    """Small search around `start` (scale and shift) for the best overlap between the outlines and the
    painting's Realm-colored land (the frame is ignored)."""
    from PIL import ImageDraw
    q = 4  # work on a quarter-size copy
    a = np.asarray(img.resize((img.width // q, img.height // q)), dtype=np.float32)
    # Land: anything that isn't the teal sea and isn't a grey cloud (castles and textures count too).
    mh, mw = a.shape[:2]
    ring = np.concatenate([a[int(mh * 0.1):int(mh * 0.9), int(mw * 0.07):int(mw * 0.1)].reshape(-1, 3),
                           a[int(mh * 0.1):int(mh * 0.9), int(mw * 0.9):int(mw * 0.93)].reshape(-1, 3)])
    sea = np.median(ring, axis=0)
    mx, mn = a.max(axis=2), a.min(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1)
    land = (np.linalg.norm(a - sea, axis=2) > 55) & (sat > 0.28)
    land[: int(mh * 0.07)] = land[-int(mh * 0.07):] = False
    land[:, : int(mw * 0.05)] = land[:, -int(mw * 0.05):] = False
    rings = [r for p in m['paths'].values() for r in refs.rings(p)]

    def score(sx, sy, tx, ty):
        mask = Image.new('1', (mw, mh), 0)
        d = ImageDraw.Draw(mask)
        for r in rings:
            pts = [((sx * x + tx) / q, (sy * y + ty) / q) for x, y in r]
            if len(pts) > 2:
                d.polygon(pts, fill=1)
        o = np.asarray(mask, dtype=bool)
        return (o & land).sum() / max(1, (o | land).sum())

    vw, vh = m['view']

    def search(base, scales, ys, shifts):
        sx0, sy0, tx0, ty0 = base
        cx, cy = sx0 * vw / 2 + tx0, sy0 * vh / 2 + ty0  # keep the country's middle, try shifts around it
        best = (score(*base), base)
        for f in scales:
            for fy in ys:
                sx, sy = sx0 * f, sy0 * f * fy
                for dx in shifts:
                    for dy in shifts:
                        t = [cx - sx * vw / 2 + dx, cy - sy * vh / 2 + dy]
                        sc = score(sx, sy, *t)
                        if sc > best[0]:
                            best = (sc, [sx, sy, *t])
        return best

    coarse = search(start, np.linspace(0.9, 1.3, 9), (0.95, 1.0, 1.05), range(-150, 151, 30))
    fine = search(coarse[1], np.linspace(0.97, 1.03, 5), (0.98, 1.0, 1.02), range(-24, 25, 8))
    print(f'  refined: overlap {score(*start):.2f} -> {fine[0]:.2f}')
    return fine[1]


def main():
    maps = refs.empire_maps()
    rs = refs.realms_of()
    OUT.mkdir(parents=True, exist_ok=True)
    result = {}
    for p in sorted(SRC.glob('kog-realm-map-*.png')):
        code = p.stem.rsplit('-', 1)[-1]
        if code not in maps:
            continue
        img = Image.open(p).convert('RGB')
        # Each painting traced its reference map, so it sits exactly where the reference put the outlines.
        pad = OLD_PAD.get(code, refs.PAD)
        vw, vh = maps[code]['view']
        W, H = img.size
        kk = min((W - 2 * pad) / vw, (H - 2 * pad) / vh)
        sx = sy = kk
        tx, ty = (W - vw * kk) / 2, (H - vh * kk) / 2
        err = 0.0
        if code in OLD_PAD:
            # Painted from an older reference: nudge size and position until the outlines cover its land best.
            sx, sy, tx, ty = refine(img, maps[code], rs[code], [sx, sy, tx, ty])
        w = WIDTH if img.width >= img.height else 900
        k = w / img.width
        small = img.resize((w, round(img.height * k)), Image.LANCZOS)
        small.save(OUT / f'{code}.webp', 'WEBP', quality=80, method=6)
        result[code] = {'src': f'assets/maps/{code}.webp', 'w': small.width, 'h': small.height,
                        'm': [round(sx * k, 5), round(sy * k, 5), round(tx * k, 2), round(ty * k, 2)]}
        print(f'{code}: {small.width}x{small.height}  ({(OUT / f"{code}.webp").stat().st_size // 1024} KB)')
    js = ('// Where each painted Empire map (assets/maps/) lines up with the Kingdom outlines in js/empiremaps.js.\n'
          '// Built by tools/fit_empire_paint.py. Painting x = sx * x + tx, y = sy * y + ty.\n'
          'export const EMPIRE_PAINT = ' + json.dumps(result, separators=(',', ':')) + ';\n')
    (ROOT / 'js/empirepaint.js').write_text(js, encoding='utf8', newline='\n')


if __name__ == '__main__':
    main()
