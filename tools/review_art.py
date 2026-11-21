"""Build tools/review/index.html: every challenge's original art next to its new versions, so you can spot bad ones.

Tick the ones to redo, press "Copy redo list", and the list is ready for
  python tools/make_art_variants.py --redo <paste>
Run after tools/add_tone_art.py:  python tools/review_art.py   (then open http://localhost:5173/tools/review/)
"""
import html
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
A = ROOT / 'assets'
VERS = [('King · Brown', '', '-brown'), ('King · Black', '', '-black'),
        ('Queen · White', 'queen-', ''), ('Queen · Brown', 'queen-', '-brown'), ('Queen · Black', 'queen-', '-black')]

s = (ROOT / 'js/challenges.js').read_text(encoding='utf8')
names = dict(re.findall(r"\n  c\('([^']+)', '[^']+', '[^']+', '[^']+', '[^']+', '((?:[^'\\]|\\.)*)'", s))

rows, made, total = [], 0, 0
cards = []
for suit in ('spades', 'hearts', 'clubs', 'diamonds'):
    cells = [('Original', f'cards/king-{suit}.webp', None)]
    for label, q, t in [('King · Brown', 'king', '-brown'), ('King · Black', 'king', '-black'), ('Queen · White', 'queen', ''),
                        ('Queen · Brown', 'queen', '-brown'), ('Queen · Black', 'queen', '-black')]:
        rel = f'cards/{q}-{suit}{t}.webp'
        cells.append((label, rel, f'{q}-{suit}{t}' if (A / rel).exists() else None))
    cards.append((f'King / Queen of {suit.title()}', cells, 'card'))
for cid in re.findall(r"\n  c\('([^']+)'", s):
    for kind in ('banner', 'badge'):
        base = f'challenges/{kind}-{cid}.webp'
        if not (A / base).exists():
            continue
        cells = [('Original', base, None)]
        any_made = False
        for label, q, t in VERS:
            rel = f'challenges/{q}{kind}-{cid}{t}.webp'
            ok = (A / rel).exists()
            any_made |= ok
            cells.append((label, rel, f'{q}{kind}-{cid}{t}' if ok else None))
        if any_made:
            rows.append((f'{html.unescape(names.get(cid, cid))} · {kind}', cells, kind))
            made += sum(1 for c in cells[1:] if c[2])
            total += 5


def cell(label, rel, name):
    if rel.startswith('cards/') and not (A / rel).exists() or (name is None and label != 'Original'):
        return f'<figure class="missing"><div>not made yet</div><figcaption>{label}</figcaption></figure>'
    box = f'<label><input type="checkbox" value="{name}"> redo</label>' if name else ''
    return f'<figure><img src="../../assets/{rel}" loading="lazy" alt=""><figcaption>{label}{box}</figcaption></figure>'


body = ''.join(f'<section class="{kind}"><h2>{html.escape(title)}</h2><div class="row">{"".join(cell(*c) for c in cells)}</div></section>'
               for title, cells, kind in cards + rows)
page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>KOG art review</title><style>
body{{margin:0;padding:16px;background:#101714;color:#eef2ef;font:15px/1.4 system-ui,sans-serif}}
header{{position:sticky;top:0;background:#101714;padding:8px 0 12px;z-index:2;display:flex;gap:12px;align-items:center;flex-wrap:wrap}}
h1{{font-size:20px;margin:0}} h2{{font-size:15px;margin:18px 0 6px;color:#f5d76e}}
.row{{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}}
figure{{margin:0;background:#1b2621;border-radius:8px;overflow:hidden}} img{{display:block;width:100%}}
.badge img,.card img{{max-width:160px;margin:auto}} figcaption{{padding:4px 6px;font-size:12px;display:flex;justify-content:space-between}}
.missing div{{aspect-ratio:3/2;display:grid;place-items:center;color:#6b7d74;font-size:12px}}
button{{font:inherit;padding:8px 14px;border-radius:8px;border:0;background:#2f9e6e;color:#fff;font-weight:700}}
@media (max-width:700px){{.row{{grid-template-columns:repeat(3,minmax(0,1fr))}}}}
</style></head><body>
<header><h1>KOG art review</h1><span>{made} of {total} new versions made</span>
<button id="copy">Copy redo list</button><span id="msg"></span></header>
{body}
<script>
document.getElementById('copy').onclick = async () => {{
  const list = [...document.querySelectorAll('input:checked')].map((i) => i.value).join(',');
  try {{ await navigator.clipboard.writeText(list); document.getElementById('msg').textContent = list ? 'Copied: ' + list : 'Nothing ticked'; }}
  catch {{ document.getElementById('msg').textContent = list; }}
}};
</script></body></html>'''
out = ROOT / 'tools/review'
out.mkdir(exist_ok=True)
(out / 'index.html').write_text(page, encoding='utf8')
print(f'tools/review/index.html: {len(rows)} pictures with new versions, {made} of {total} made')
