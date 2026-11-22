"""Make the How to play pictures with OpenAI's image API, from the prompts in docs/LEADERBOARDS-AND-HOW-TO-PLAY-ART.md.

Each request sends the labeled sheet of all 24 Kings and Queens as the reference, plus the shared style paragraph
and the scene. Results go to "KOG Images/Generated/how-to-play/". Costs are logged to Generated/log.csv like the
challenge art. Your API key stays on your computer (see tools/make_art_variants.py).

  python tools/make_scene_art.py --dry-run          # list the pictures and stop
  python tools/make_scene_art.py --only htp-1       # one picture (a test)
  python tools/make_scene_art.py                    # every picture not made yet
  python tools/make_scene_art.py --redo htp-3       # make one again
"""
import argparse
import base64
import csv
import json
import pathlib
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import make_art_variants as m  # noqa: E402  (key, upload and cost helpers)

DOC = m.ROOT / 'docs/LEADERBOARDS-AND-HOW-TO-PLAY-ART.md'
REF = m.IMAGES / 'Leaderboards reference - all Kings and Queens.png'
OUT = m.OUT / 'how-to-play'


def scenes():
    """[(name, size, prompt)] from the doc: the shared paragraph, then each scene's own block."""
    s = DOC.read_text(encoding='utf8')
    part = s[s.index('## 2. How to play'):]
    blocks = re.findall(r'```\n(.*?)\n```', part, re.S)
    shared = blocks[0].strip()
    out = []
    for m_ in re.finditer(r"\*\*\d+ · [^*]+\*\* \(`(htp-[^`]+)\.png`([^)]*)\)\n```\n(.*?)\n```", part, re.S):
        name, note, scene = m_.group(1), m_.group(2), m_.group(3).strip()
        size = '1024x1536' if 'portrait' in note else '1536x1024'
        out.append((name, size, f'{shared}\n\n{scene}'))
    return out


CAST = re.compile(r'(King|Queen) of (Spades|Hearts|Clubs|Diamonds) v([123])')
TONE = {'1': 'white', '2': 'brown', '3': 'black'}


def cast_sheet(name, prompt):
    """Only the characters this picture names, side by side and labeled (the model follows a small sheet far
    more closely than all 24 cards)."""
    from PIL import Image, ImageDraw, ImageFont
    who = list(dict.fromkeys(CAST.findall(prompt)))
    if not who:
        return None
    font = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 28)
    W, H, TOP, PAD = 400, 600, 48, 16
    sheet = Image.new('RGB', (PAD + len(who) * (W + PAD), H + TOP + 2 * PAD), 'white')
    d = ImageDraw.Draw(sheet)
    for i, (kind, suit, v) in enumerate(who):
        card = m.king_card(suit.lower(), TONE[v]) if kind == 'King' else m.queen_card(suit.lower(), TONE[v])
        x = PAD + i * (W + PAD)
        label = f'{kind} of {suit} v{v}'
        d.text((x + W / 2 - d.textlength(label, font=font) / 2, PAD), label, font=font, fill='black')
        sheet.paste(Image.open(card).convert('RGB').resize((W, H), Image.LANCZOS), (x, PAD + TOP))
    path = OUT / 'casts' / f'{name}.png'
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path)
    return path


def make(key, name, size, prompt, model, quality):
    fields = {'model': model, 'size': size, 'quality': quality, 'output_format': 'png', 'n': '1'}
    cast = cast_sheet(name, prompt)
    files = [('image[]', cast)] if cast else []
    files.append(('image[]', REF))
    lead = ('Image 1 shows exactly the characters named below, each labeled with their name and version: draw each of them '
            'exactly like their card in image 1 (the same face, skin tone, hair, crown and outfit). Image 2 is the full cast, '
            'only for any other Kings and Queens in the background. ') if cast else ''
    fields['prompt'] = lead + prompt
    body, ctype = m.multipart(fields, files)
    import urllib.request
    import urllib.error
    for attempt in range(6):
        req = urllib.request.Request(m.API, data=body, method='POST', headers={'Authorization': f'Bearer {key}', 'Content-Type': ctype})
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            detail = e.read().decode('utf8', 'replace')
            if e.code in (429, 500, 502, 503, 504) and 'insufficient_quota' not in detail:
                time.sleep(min(120, 5 * 2 ** attempt))
                continue
            raise RuntimeError(f'HTTP {e.code}: {detail[:400]}')
        except (urllib.error.URLError, TimeoutError):
            time.sleep(10)
    raise RuntimeError('gave up after retries')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--only', help='picture names, comma-separated (e.g. htp-1,htp-3)')
    ap.add_argument('--redo', help='make these again even if they exist')
    ap.add_argument('--model', default='gpt-image-2.6-sunburst')
    ap.add_argument('--quality', default='medium')
    ap.add_argument('--workers', type=int, default=4)
    args = ap.parse_args()
    if not REF.exists():
        sys.exit(f'Missing the reference sheet: {REF}')
    pick = lambda arg: [x.strip() for x in (arg or '').split(',') if x.strip()]
    only, redo = pick(args.only), pick(args.redo)
    todo = [s for s in scenes()
            if (not only or any(s[0].startswith(o) for o in only))
            and (any(s[0].startswith(r) for r in redo) or not (OUT / f'{s[0]}.png').exists())]
    print(f'{len(todo)} to make')
    for name, size, _ in todo:
        print(' ', name, size)
    if args.dry_run or not todo:
        return
    key = m.api_key()
    OUT.mkdir(parents=True, exist_ok=True)
    log = m.OUT / 'log.csv'
    lock = threading.Lock()
    total = [0.0, 0]

    def run(job):
        name, size, prompt = job
        t0 = time.time()
        try:
            res = make(key, name, size, prompt, args.model, args.quality)
            (OUT / f'{name}.png').write_bytes(base64.b64decode(res['data'][0]['b64_json']))
            c = m.cost(res.get('usage'))
            msg, row = f'ok  {name}  ${c:.3f}  {time.time() - t0:.0f}s', [time.strftime('%Y-%m-%d %H:%M:%S'), f'how-to-play/{name}.png', 'ok', f'{c:.4f}', json.dumps(res.get('usage'))]
        except Exception as e:  # keep going; failures can be redone
            c = 0.0
            msg, row = f'ERR {name}  {e}', [time.strftime('%Y-%m-%d %H:%M:%S'), f'how-to-play/{name}.png', 'error', '0', str(e)[:300]]
        with lock:
            total[0] += c
            total[1] += 1
            print(f'[{total[1]}/{len(todo)}] {msg}  (so far ${total[0]:.2f})', flush=True)
            with open(log, 'a', newline='', encoding='utf8') as f:
                csv.writer(f).writerow(row)

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
        list(ex.map(run, todo))
    print(f'Done: {total[1]} pictures, about ${total[0]:.2f}.')


if __name__ == '__main__':
    main()
