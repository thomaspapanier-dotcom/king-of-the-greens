"""Bring ChatGPT's skin-tone versions of the art into the app.

Looks in the KOG Images folder for:
  king-<suit>-<tone>.png              ->  assets/cards/king-<suit>-<tone>.webp
  badge-<id>-<tone>.png / banner-...  ->  assets/challenges/badge-<id>-<tone>.webp (same treatment as the originals)
where <tone> is brown or black. Keeps the originals in assets/originals/tones, rewrites TONED in
js/tones.js from what's on disk, lists the files in sw.js and bumps its version.
Run: python tools/add_tone_art.py
"""
import pathlib
import re
import shutil

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = pathlib.Path(r'C:/Users/thoma/OneDrive/Desktop/KOG Images')
KEEP = ROOT / 'assets/originals/tones'
KEEP.mkdir(parents=True, exist_ok=True)
TONES = ('brown', 'black')

added = []
for f in sorted(SRC.glob('*.png')):
    m = re.fullmatch(r'(king-(?:spades|hearts|clubs|diamonds)|badge-[a-z0-9-]+|banner-[a-z0-9-]+)-(brown|black)', f.stem)
    if not m:
        continue
    name, tone = m.groups()
    if name.startswith('king-'):
        out = ROOT / f'assets/cards/{name}-{tone}.webp'
        base = ROOT / f'assets/cards/{name}.webp'
    else:
        out = ROOT / f'assets/challenges/{name}-{tone}.webp'
        base = ROOT / f'assets/challenges/{name}.webp'
    if not base.exists():
        print(f'skip {f.name}: no original {base.name} in the app')
        continue
    if out.exists() and out.stat().st_mtime >= f.stat().st_mtime:
        continue
    shutil.copy(f, KEEP / f.name)
    im = Image.open(f)
    if name.startswith('king-'):
        im.convert('RGB').resize(Image.open(base).size, Image.LANCZOS).save(out, 'WEBP', quality=84, method=6)
    elif name.startswith('badge-'):
        b = im.convert('RGBA')
        box = b.getchannel('A').getbbox()
        if box:
            b = b.crop(box)
        b.thumbnail((256, 256), Image.LANCZOS)
        b.save(out, 'WEBP', quality=86, method=6)
    else:
        n = im.convert('RGB')
        w, h = n.size
        e = int(w * 0.025)
        n = n.crop((e, e, w - e, h - e))
        n = n.resize((960, round(960 * n.height / n.width)), Image.LANCZOS)
        n.save(out, 'WEBP', quality=80, method=6)
    added.append(out.name)

# TONED in js/tones.js: everything on disk with a tone version
toned = {t: sorted(
    str(p.relative_to(ROOT / 'assets')).replace('\\', '/')[:-len(f'-{t}.webp')]
    for p in list((ROOT / 'assets/cards').glob(f'*-{t}.webp')) + list((ROOT / 'assets/challenges').glob(f'*-{t}.webp'))
) for t in TONES}
js = (ROOT / 'js/tones.js').read_text(encoding='utf8')
for t in TONES:
    js = re.sub(rf"  {t}: new Set\(\[.*?\]\),", f"  {t}: new Set([{', '.join(repr(k) for k in toned[t])}]),", js, flags=re.S)
(ROOT / 'js/tones.js').write_text(js, encoding='utf8')

sw = (ROOT / 'sw.js').read_text(encoding='utf8')
sw = re.sub(r"  '\./assets/(?:cards|challenges)/[^']+-(?:brown|black)\.webp',\r?\n", '', sw)
lines = ''.join(f"  './assets/{k}-{t}.webp',\n" for t in TONES for k in toned[t])
sw = sw.replace("  './js/tones.js',\n", "  './js/tones.js',\n" + lines, 1)
if added:
    v = int(re.search(r"const VERSION = 'kog-v(\d+)';", sw).group(1))
    sw = re.sub(r"const VERSION = 'kog-v\d+';", f"const VERSION = 'kog-v{v + 1}';", sw)
(ROOT / 'sw.js').write_text(sw, encoding='utf8')
print('added:', ', '.join(added) or 'nothing new', '|', ', '.join(f'{len(toned[t])} {t}' for t in TONES))
