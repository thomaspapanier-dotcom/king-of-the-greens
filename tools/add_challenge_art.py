"""Bring ChatGPT's challenge art into the app.

Looks in the KOG Images folder for badge-<id>.png + banner-<id>.png pairs, converts each new pair
to assets/challenges/*.webp (badge trimmed to its circle, banner with a thin edge trimmed),
keeps the originals in assets/originals/challenge-art, adds the id to ART in js/challenges.js
and lists the files in sw.js. Run: python tools/add_challenge_art.py
"""
import pathlib
import re
import shutil

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = pathlib.Path(r'C:/Users/thoma/OneDrive/Desktop/KOG Images')
OUT = ROOT / 'assets/challenges'
KEEP = ROOT / 'assets/originals/challenge-art'
OUT.mkdir(parents=True, exist_ok=True)
KEEP.mkdir(parents=True, exist_ok=True)

js = (ROOT / 'js/challenges.js').read_text(encoding='utf8')
known = set(re.findall(r"\n  c\('([^']+)'", js))
art = set(re.findall(r"'([^']+)'", re.search(r'export const ART = new Set\(\[(.*?)\]\);', js).group(1)))

added = []
for badge in sorted(SRC.glob('badge-*.png')):
    cid = badge.stem[len('badge-'):]
    banner = SRC / f'banner-{cid}.png'
    if cid not in known:
        print(f'skip {cid}: no challenge with that id')
        continue
    if not banner.exists():
        print(f'skip {cid}: banner missing')
        continue
    if cid in art and (OUT / f'badge-{cid}.webp').exists():
        continue
    shutil.copy(badge, KEEP / badge.name)
    shutil.copy(banner, KEEP / banner.name)
    b = Image.open(badge).convert('RGBA')
    box = b.getchannel('A').getbbox()
    if box:
        b = b.crop(box)
    b.thumbnail((256, 256), Image.LANCZOS)
    b.save(OUT / f'badge-{cid}.webp', 'WEBP', quality=86, method=6)
    n = Image.open(banner).convert('RGB')
    w, h = n.size
    m = int(w * 0.025)
    n = n.crop((m, m, w - m, h - m))
    n = n.resize((960, round(960 * n.height / n.width)), Image.LANCZOS)
    n.save(OUT / f'banner-{cid}.webp', 'WEBP', quality=80, method=6)
    art.add(cid)
    added.append(cid)

if added:
    order = [c for c in re.findall(r"\n  c\('([^']+)'", js) if c in art]
    js = re.sub(r'export const ART = new Set\(\[.*?\]\);', 'export const ART = new Set([' + ', '.join(f"'{c}'" for c in order) + ']);', js)
    (ROOT / 'js/challenges.js').write_text(js, encoding='utf8')
    sw = (ROOT / 'sw.js').read_text(encoding='utf8')
    sw = re.sub(r"  '\./assets/challenges/[^']+',\r?\n", '', sw)
    lines = ''.join(f"  './assets/challenges/{k}-{c}.webp',\n" for c in order for k in ('badge', 'banner'))
    sw = sw.replace("  './js/challenges.js',\n", "  './js/challenges.js',\n" + lines, 1)
    v = int(re.search(r"const VERSION = 'kog-v(\d+)';", sw).group(1))
    sw = re.sub(r"const VERSION = 'kog-v\d+';", f"const VERSION = 'kog-v{v + 1}';", sw)
    (ROOT / 'sw.js').write_text(sw, encoding='utf8')
print('added:', ', '.join(added) or 'nothing new', f'| {len(art)} challenges have art')
