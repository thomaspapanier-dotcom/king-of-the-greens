"""Bring the skin-tone and Queen versions of the art into the app.

Looks in the KOG Images folder and its "Generated" folder (where tools/make_art_variants.py saves) for:
  king-<suit>-<tone>.png                     ->  assets/cards/king-<suit>-<tone>.webp
  queen-<suit>.png, queen-<suit>-<tone>.png  ->  assets/cards/queen-<suit>[-<tone>].webp
  badge-<id>-<tone>.png, banner-<id>-<tone>.png               (Kings in Brown or Black)
  queen-badge-<id>[-<tone>].png, queen-banner-<id>[-<tone>].png  (Queens in White, Brown or Black)
where <tone> is brown or black. Converts them like the originals, keeps the PNGs in assets/originals/tones,
rewrites the lists in js/tones.js from what's on disk, lists the files in sw.js and bumps its version.
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
NAME = re.compile(r'(queen-)?(king-(?:spades|hearts|clubs|diamonds)|(?:spades|hearts|clubs|diamonds)|badge-[a-z0-9-]+?|banner-[a-z0-9-]+?)(?:-(brown|black))?')

added = []
for folder in (SRC, SRC / 'Generated'):
    if not folder.exists():
        continue
    for f in sorted(folder.glob('*.png')):
        m = NAME.fullmatch(f.stem)
        if not m:
            continue
        queen, name, tone = m.groups()
        if queen and name.startswith('king-'):
            continue
        if not queen and not tone:
            continue  # an original: tools/add_challenge_art.py handles those
        is_card = queen and name in ('spades', 'hearts', 'clubs', 'diamonds') or name.startswith('king-')
        if not queen and name in ('spades', 'hearts', 'clubs', 'diamonds'):
            continue
        stem = (f'queen-{name}' if queen else name) + (f'-{tone}' if tone else '')
        if is_card:
            out = ROOT / f'assets/cards/{stem}.webp'
            base = ROOT / 'assets/cards/king-spades.webp'
        else:
            out = ROOT / f'assets/challenges/{stem}.webp'
            base = ROOT / f'assets/challenges/{name}.webp'
        if not base.exists():
            print(f'skip {f.name}: no original {base.name} in the app')
            continue
        if out.exists() and out.stat().st_mtime >= f.stat().st_mtime:
            continue
        shutil.copy(f, KEEP / f.name)
        im = Image.open(f)
        if is_card:
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


def keys(pattern):
    """Art keys like 'challenges/banner-north' for files on disk matching pattern (relative to assets)."""
    found = []
    for p in (ROOT / 'assets').glob(pattern):
        rel = str(p.relative_to(ROOT / 'assets')).replace('\\', '/')[:-len('.webp')]
        found.append(rel)
    return found


strip = lambda k, t: k[:-len(f'-{t}')]
toned = {t: sorted(strip(k, t) for k in keys(f'cards/king-*-{t}.webp') + keys(f'challenges/b*-{t}.webp')) for t in TONES}
# Queen art, keyed by the King picture it stands in for ('challenges/banner-north', 'cards/king-spades')
to_king = lambda k: k.replace('challenges/queen-', 'challenges/').replace('cards/queen-', 'cards/king-')
queened = {
    'white': sorted(to_king(k) for k in keys('cards/queen-*.webp') + keys('challenges/queen-*.webp') if not re.search(r'-(brown|black)$', k)),
    **{t: sorted(to_king(strip(k, t)) for k in keys(f'cards/queen-*-{t}.webp') + keys(f'challenges/queen-*-{t}.webp')) for t in TONES},
}
js = (ROOT / 'js/tones.js').read_text(encoding='utf8')
for t in TONES:
    js = re.sub(rf"  {t}: new Set\(\[.*?\]\),", f"  {t}: new Set([{', '.join(repr(k) for k in toned[t])}]),", js, count=1, flags=re.S)
qblock = 'export const QUEENED = {\n' + ''.join(f"  {t}: new Set([{', '.join(repr(k) for k in queened[t])}]),\n" for t in ('white', *TONES)) + '};'
js = re.sub(r'export const QUEENED = \{.*?\n\};', qblock, js, flags=re.S)
(ROOT / 'js/tones.js').write_text(js, encoding='utf8')

sw = (ROOT / 'sw.js').read_text(encoding='utf8')
sw = re.sub(r"  '\./assets/(?:cards|challenges)/(?:queen-[^']+|[^']+-(?:brown|black))\.webp',\r?\n", '', sw)
files = sorted({p for t in TONES for p in (f'{k}-{t}.webp' for k in toned[t])}
               | {k.replace('challenges/', 'challenges/queen-').replace('cards/king-', 'cards/queen-') + ('' if t == 'white' else f'-{t}') + '.webp'
                  for t in queened for k in queened[t]})
sw = sw.replace("  './js/tones.js',\n", "  './js/tones.js',\n" + ''.join(f"  './assets/{f}',\n" for f in files), 1)
if added:
    v = int(re.search(r"const VERSION = 'kog-v(\d+)';", sw).group(1))
    sw = re.sub(r"const VERSION = 'kog-v\d+';", f"const VERSION = 'kog-v{v + 1}';", sw)
(ROOT / 'sw.js').write_text(sw, encoding='utf8')
print('added:', ', '.join(added) or 'nothing new', '|', ', '.join(f'{len(toned[t])} {t}' for t in TONES),
      '| queen:', ', '.join(f'{len(queened[t])} {t}' for t in queened))
