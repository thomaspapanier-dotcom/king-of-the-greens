"""Line up the U.S. state outlines (js/usmap.js, Albers 975 x 610) with the painted Realm map
(assets/realm-map.webp) and cut each Realm out of the painting.

Writes:
  assets/realms/<realm>.webp   each Realm's part of the painting on a transparent background (cropped)
  js/realmpaint.js             the outline-to-painting transforms and each cut-out's position

Run from the repo root:  python tools/fit_realm_map.py
"""
import colorsys
import json
import pathlib
import re
from collections import deque

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

root = pathlib.Path(__file__).resolve().parent.parent
PAINT = root / 'assets/realm-map.webp'
REALM_OF = {}
kg = (root / 'js/kingdoms.js').read_text(encoding='utf8')
for rid, states in re.findall(r"id: '(\w+)'.*?states: \[([^\]]+)\]", kg):
    for c in re.findall(r"'(\w\w)'", states):
        REALM_OF[c] = rid
RIDS = ['pacific', 'peaks', 'plains', 'desert', 'magnolia', 'ivy']
HUES = {'desert': (14, 32), 'plains': (38, 56), 'ivy': (90, 165), 'pacific': (190, 225), 'peaks': (255, 300), 'magnolia': (318, 352)}

# ---------- 1. label every painting pixel with its Realm ----------
img = Image.open(PAINT).convert('RGB')
W, H = img.size
a = np.asarray(img).astype(np.float32) / 255
mx, mn = a.max(2), a.min(2)
v = mx
s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
d = np.maximum(mx - mn, 1e-6)
h = np.select([mx == r, mx == g], [((g - b) / d) % 6, (b - r) / d + 2], (r - g) / d + 4) * 60
ocean = (h >= 165) & (h <= 225) & (s > 0.45) & (v > 0.12) & (v < 0.45)
frame = np.zeros((H, W), bool)
m = int(W * 0.035)
frame[:m, :] = frame[-m:, :] = True
frame[:, :m] = frame[:, -m:] = True
land = ~ocean & ~frame
lab = np.full((H, W), -1, np.int8)
for i, rid in enumerate(RIDS):
    lo, hi = HUES[rid]
    lab[(h >= lo) & (h <= hi) & (s >= 0.55) & (v >= 0.5) & land] = i
# speckle clean-up: a seed needs a few same-Realm neighbours
seed = lab.copy()
# grow Realms over the land (castles, outlines) from the nearest strong color
q = deque(zip(*np.nonzero(lab >= 0)))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        yy, xx = y + dy, x + dx
        if 0 <= yy < H and 0 <= xx < W and land[yy, xx] and lab[yy, xx] < 0:
            lab[yy, xx] = lab[y, x]
            q.append((yy, xx))
# majority smoothing (removes stray wheat-orange inside the Plains, sand inside the Desert, etc.)
small = Image.fromarray((lab + 1).astype(np.uint8))
for _ in range(2):
    small = small.filter(ImageFilter.ModeFilter(9))
lab = np.asarray(small).astype(np.int8) - 1
lab[~land] = -1

def components(mask):
    """Connected areas of a boolean mask, biggest first: list of (size, ys, xs)."""
    seen = np.zeros(mask.shape, bool)
    out = []
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]:
            continue
        seen[y0, x0] = True
        q = [(y0, x0)]
        ys, xs = [], []
        while q:
            y, x = q.pop()
            ys.append(y); xs.append(x)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < mask.shape[0] and 0 <= xx < mask.shape[1] and mask[yy, xx] and not seen[yy, xx]:
                    seen[yy, xx] = True
                    q.append((yy, xx))
        out.append((len(ys), np.array(ys), np.array(xs)))
    return sorted(out, key=lambda t: -t[0])

# Keep only each Realm's real pieces (drops specks in the frame, clouds and corner scenery).
clean = np.full((H, W), -1, np.int8)
for i, rid in enumerate(RIDS):
    comps = components(lab == i)
    big = comps[0][0]
    for n, ys, xs in comps:
        keep = n >= big * 0.25 or (rid == 'pacific' and n >= 300 and ys.mean() > H * 0.6 and xs.mean() < W * 0.36)
        if keep:
            clean[ys, xs] = i
lab = clean

# ---------- 2. the outlines, rasterized in Albers space ----------
um = (root / 'js/usmap.js').read_text(encoding='utf8')
PATHS = dict(re.findall(r"  (\w\w): '([^']+)'", um))
def polys(d):
    out = []
    for part in d.split('M')[1:]:
        pts = [tuple(map(float, p.split(','))) for p in part.rstrip('Z').split('L')]
        out.append(pts)
    return out
AW, AH = 975, 610
alb = Image.new('L', (AW, AH), 0)
dr = ImageDraw.Draw(alb)
for code, d in PATHS.items():
    for pts in polys(d):
        if len(pts) > 2:
            dr.polygon(pts, fill=RIDS.index(REALM_OF[code]) + 1)
alab = np.asarray(alb).astype(np.int8) - 1

def fit(codes, region, init, target):
    """Affine (Albers -> painting) that best matches Realm labels for these states inside a painting region."""
    ok_alb = np.zeros((AH, AW), bool)
    sub = Image.new('L', (AW, AH), 0)
    sd = ImageDraw.Draw(sub)
    for c in codes:
        for pts in polys(PATHS[c]):
            if len(pts) > 2:
                sd.polygon(pts, fill=1)
    ok_alb = np.asarray(sub) > 0
    ys, xs = np.nonzero(ok_alb)
    rng = np.random.default_rng(1)
    pick = rng.choice(len(xs), min(6000, len(xs)), replace=False)
    ax, ay = xs[pick].astype(float), ys[pick].astype(float)
    sel_alb = ok_alb
    x0, y0, x1, y1 = region
    reg = np.zeros((H, W), bool)
    reg[y0:y1, x0:x1] = True
    tgt = (lab == target) & reg
    pys, pxs = np.nonzero(tgt)
    pk = rng.choice(len(pxs), min(6000, len(pxs)), replace=False)
    px, py = pxs[pk].astype(float), pys[pk].astype(float)

    def score(p):
        A = np.array([[p[0], p[1], p[2]], [p[3], p[4], p[5]]])
        tx = A[0, 0] * ax + A[0, 1] * ay + A[0, 2]
        ty = A[1, 0] * ax + A[1, 1] * ay + A[1, 2]
        ix, iy = np.round(tx).astype(int), np.round(ty).astype(int)
        inside = (ix >= 0) & (ix < W) & (iy >= 0) & (iy < H)
        f1 = np.mean(np.where(inside, tgt[np.clip(iy, 0, H - 1), np.clip(ix, 0, W - 1)], False))
        M = np.vstack([A, [0, 0, 1]])
        Mi = np.linalg.inv(M)
        bx = Mi[0, 0] * px + Mi[0, 1] * py + Mi[0, 2]
        by = Mi[1, 0] * px + Mi[1, 1] * py + Mi[1, 2]
        jx, jy = np.round(bx).astype(int), np.round(by).astype(int)
        ins = (jx >= 0) & (jx < AW) & (jy >= 0) & (jy < AH)
        f2 = np.mean(np.where(ins, sel_alb[np.clip(jy, 0, AH - 1), np.clip(jx, 0, AW - 1)], False))
        return (f1 + f2) / 2

    # Nelder-Mead
    p0 = np.array(init, float)
    steps = np.array([0.03, 0.02, 15, 0.02, 0.03, 15])
    simplex = [p0] + [p0 + np.eye(6)[i] * steps[i] for i in range(6)]
    vals = [-score(p) for p in simplex]
    for it in range(1500):
        o = np.argsort(vals)
        simplex = [simplex[i] for i in o]
        vals = [vals[i] for i in o]
        c = np.mean(simplex[:-1], axis=0)
        xr = c + (c - simplex[-1])
        fr = -score(xr)
        if fr < vals[0]:
            xe = c + 2 * (c - simplex[-1])
            fe = -score(xe)
            simplex[-1], vals[-1] = (xe, fe) if fe < fr else (xr, fr)
        elif fr < vals[-2]:
            simplex[-1], vals[-1] = xr, fr
        else:
            xc = c + 0.5 * (simplex[-1] - c)
            fc = -score(xc)
            if fc < vals[-1]:
                simplex[-1], vals[-1] = xc, fc
            else:
                simplex = [simplex[0]] + [simplex[0] + 0.5 * (p - simplex[0]) for p in simplex[1:]]
                vals = [vals[0]] + [-score(p) for p in simplex[1:]]
    best = simplex[int(np.argmin(vals))]
    return best, -min(vals)

def bbox_init(codes, region):
    ys, xs = [], []
    for c in codes:
        for pts in polys(PATHS[c]):
            xs += [p[0] for p in pts]
            ys += [p[1] for p in pts]
    x0, y0, x1, y1 = region
    sub = (lab >= 0)
    sub2 = np.zeros_like(sub)  # painted land inside the region
    sub2[y0:y1, x0:x1] = sub[y0:y1, x0:x1]
    pys, pxs = np.nonzero(sub2)
    sx = (pxs.max() - pxs.min()) / (max(xs) - min(xs))
    sy = (pys.max() - pys.min()) / (max(ys) - min(ys))
    return [sx, 0, pxs.min() - min(xs) * sx, 0, sy, pys.min() - min(ys) * sy]

# One fit per Realm: each Realm's outline is stretched onto that Realm's painted shape.
# (The painting bends the country a bit, so one stretch for the whole map doesn't line up.)
ak_zone = np.zeros((H, W), bool)
ak_zone[int(H * 0.62):, :int(W * 0.36)] = True
T_realm = {}
for i, rid in enumerate(RIDS):
    codes = [c for c in PATHS if REALM_OF[c] == rid and c not in ('AK', 'HI')]
    keep = lab.copy()
    if rid == 'pacific':
        lab[ak_zone] = -1
    ys_, xs_ = np.nonzero(lab == i)
    region = (int(xs_.min()), int(ys_.min()), int(xs_.max()) + 1, int(ys_.max()) + 1)
    T_realm[rid], sc = fit(codes, region, bbox_init(codes, region), target=i)
    lab = keep
    print('fit', rid, round(sc, 3))
T_ak, sc_ak = fit(['AK'], (0, int(H * 0.62), int(W * 0.22), H), bbox_init(['AK'], (0, int(H * 0.62), int(W * 0.22), H)), target=RIDS.index('pacific'))
print('fit AK', round(sc_ak, 3))
# Hawaii is painted as a little golf island chain, so just stretch the outline over it.
hx = [p[0] for pts in polys(PATHS['HI']) for p in pts]
hy = [p[1] for pts in polys(PATHS['HI']) for p in pts]
HI_BOX = (W * 0.175, H * 0.73, W * 0.32, H * 0.885)
sx = (HI_BOX[2] - HI_BOX[0]) / (max(hx) - min(hx))
sy = (HI_BOX[3] - HI_BOX[1]) / (max(hy) - min(hy))
T_hi, sc_hi = [sx, 0, HI_BOX[0] - min(hx) * sx, 0, sy, HI_BOX[1] - min(hy) * sy], 1.0

# ---------- 3. cut each Realm out of the painting ----------
out_dir = root / 'assets/realms'
out_dir.mkdir(exist_ok=True)
rgba = np.dstack([np.asarray(img), np.zeros((H, W), np.uint8)])
cuts = {}
for i, rid in enumerate(RIDS):
    mask = Image.fromarray(((lab == i) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    al = np.asarray(mask)
    ys, xs = np.nonzero(al > 8)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    piece = rgba.copy()
    piece[..., 3] = al
    Image.fromarray(piece[y0:y1, x0:x1], 'RGBA').save(out_dir / f'{rid}.webp', quality=85, method=6)
    cuts[rid] = [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]

aff = lambda p: [round(float(x), 5) for x in (p[0], p[3], p[1], p[4], p[2], p[5])]  # SVG matrix(a b c d e f)
js = ('// Where the painted Realm map (assets/realm-map.webp) and the state outlines line up.\n'
      '// Built by tools/fit_realm_map.py. MATRIX turns outline (Albers) coordinates into painting pixels:\n'
      '// one for the lower 48, one each for Alaska and Hawaii. CUT is each Realm\'s cut-out: x, y, width, height.\n'
      f'export const SIZE = [{W}, {H}];\n'
      f'export const MATRIX = {json.dumps({**{rid: aff(T_realm[rid]) for rid in RIDS}, "AK": aff(T_ak), "HI": aff(T_hi)})};\n'
      f'export const CUT = {json.dumps(cuts)};\n')
(root / 'js/realmpaint.js').write_text(js, encoding='utf8', newline='\n')
print(cuts)

if __name__ == '__main__':
    prev = img.copy().convert('RGBA')
    ov = Image.new('RGBA', prev.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    for code, d in PATHS.items():
        T = T_ak if code == 'AK' else T_hi if code == 'HI' else T_realm[REALM_OF[code]]
        for pts in polys(d):
            q = [(T[0] * x + T[1] * y + T[2], T[3] * x + T[4] * y + T[5]) for x, y in pts]
            if len(q) > 2:
                od.line(q + [q[0]], fill=(255, 255, 255, 255), width=2)
    import tempfile
    preview = pathlib.Path(tempfile.gettempdir()) / 'kog-realm-fit-preview.png'
    Image.alpha_composite(prev, ov).convert('RGB').save(preview)
    print('outline check image:', preview)
