"""Draw a flat reference map for each Empire: every Realm in its fixed color, thin dark lines between Kingdoms,
on a teal sea. The painter follows it for the country's shape and the Realm borders, and the colors let
the app tell the Realms apart in the finished painting.

Writes "KOG Images/Map references/map-reference-<EMPIRE>.png" (1536 x 1024).
Run from the repo root:  python tools/make_map_refs.py [GB,IE,...]
"""
import json
import pathlib
import re
import sys

from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(r'C:/Users/thoma/OneDrive/Desktop/KOG Images/Map references')
# The Realm colors in the order the Empire lists its Realms (the same palette the app uses).
PALETTE = ['#2fae7a', '#e0528a', '#e6b12e', '#ec7a32', '#8b7cf6', '#3a9be0']
SEA = '#0f4f5c'
W, H, PAD = 1536, 1024, 70


def empire_maps():
    s = (ROOT / 'js/empiremaps.js').read_text(encoding='utf8')
    return json.loads(s[s.index('{'):s.rindex(';')])


def realms_of():
    """{empire: [[kingdom codes of Realm 1], [Realm 2], ...]} from js/kingdoms.js."""
    s = (ROOT / 'js/kingdoms.js').read_text(encoding='utf8')
    out = {}
    for code, body in re.findall(r"\n  (\w\w): \{\n    code: '\w\w', name: [^\n]+\n(.*?)\n    \],\n  \},", s, re.S):
        rows = []
        for line in body.splitlines():
            if "R('" not in line:
                continue
            m = re.search(r"ks\('(\w\w)', '([^']+)'\)", line)
            if m:
                rows.append([f'{m.group(1)}-{k}' for k in m.group(2).split()])
                continue
            m = re.search(r"(gb|ie)\('([^']+)'\)", line)
            if m:
                rows.append([f'{m.group(1).upper()}-{k}' for k in m.group(2).split()])
                continue
            m = re.search(r"jp\((\d+), (\d+)\)", line)
            if m:
                rows.append([f'JP-{n:02d}' for n in range(int(m.group(1)), int(m.group(2)) + 1)])
                continue
            rows.append(re.findall(r"'(\w\w-\w+)'", line.split("',", 4)[-1]))
        out[code] = rows
    return out


def rings(d):
    return [[tuple(map(float, p.split(','))) for p in part.split('L')] for part in re.findall(r'M([^MZ]+)Z', d)]


def draw(code, m, realms):
    vw, vh = m['view']
    k = min((W - 2 * PAD) / vw, (H - 2 * PAD) / vh)
    ox, oy = (W - vw * k) / 2, (H - vh * k) / 2
    im = Image.new('RGB', (W, H), SEA)
    d = ImageDraw.Draw(im)
    color = {kg: PALETTE[i % len(PALETTE)] for i, kgs in enumerate(realms) for kg in kgs}
    for kg, path in m['paths'].items():
        for r in rings(path):
            pts = [(ox + x * k, oy + y * k) for x, y in r]
            if len(pts) > 2:
                d.polygon(pts, fill=color.get(kg, '#888888'))
    for kg, path in m['paths'].items():  # thin dark lines between Kingdoms
        for r in rings(path):
            pts = [(ox + x * k, oy + y * k) for x, y in r]
            if len(pts) > 2:
                d.line(pts + [pts[0]], fill='#1d2a22', width=2)
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f'map-reference-{code}.png'
    im.save(path)
    return path


if __name__ == '__main__':
    maps = empire_maps()
    rs = realms_of()
    want = sys.argv[1].split(',') if len(sys.argv) > 1 else list(maps)
    for code in want:
        print(draw(code, maps[code], rs[code]).name, len(rs[code]), 'Realms')
