"""Paint the Empire maps with OpenAI's image API, from the prompts in docs/EMPIRE-MAPS.md.

Each request sends the Empire's reference map (shape, borders and Realm colors) and the American painting
(the style), with the shared instructions and that Empire's castles. Results: "KOG Images/Generated/maps/
kog-realm-map-<EMPIRE>.png". Costs are logged to Generated/log.csv.

  python tools/make_map_art.py --dry-run
  python tools/make_map_art.py --only GB,JP,FR      # a test
  python tools/make_map_art.py                       # every Empire not painted yet
  python tools/make_map_art.py --redo GB
"""
import argparse
import base64
import csv
import json
import pathlib
import re
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import make_art_variants as m  # noqa: E402

DOC = m.ROOT / 'docs/EMPIRE-MAPS.md'
REFS = m.IMAGES / 'Map references'
STYLE = m.IMAGES / 'kog-realm-map-kingdoms-v1.png'
OUT = m.OUT / 'maps'


def prompts():
    s = DOC.read_text(encoding='utf8')
    shared = re.search(r'## The shared instructions.*?```\n(.*?)\n```', s, re.S).group(1).strip()
    return {code: f'{shared}\n\n{body.strip()}' for code, body in re.findall(r"\*\*[^*]+\*\* `(\w\w)`\n```\n(.*?)\n```", s, re.S)}


def paint(key, code, prompt, args):
    from PIL import Image
    ref = REFS / f'map-reference-{code}.png'
    w, h = Image.open(ref).size
    size = '1024x1536' if h > w else '1536x1024'  # same shape as the reference, so the country isn't squeezed
    fields = {'model': args.model, 'prompt': prompt, 'size': size, 'quality': args.quality, 'output_format': 'png', 'n': '1'}
    body, ctype = m.multipart(fields, [('image[]', REFS / f'map-reference-{code}.png'), ('image[]', STYLE)])
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
    ap.add_argument('--only')
    ap.add_argument('--redo')
    ap.add_argument('--model', default='gpt-image-2.6-sunburst')
    ap.add_argument('--quality', default='high')
    ap.add_argument('--workers', type=int, default=4)
    args = ap.parse_args()
    pick = lambda a: [x.strip().upper() for x in (a or '').split(',') if x.strip()]
    only, redo = pick(args.only), pick(args.redo)
    ps = prompts()
    todo = [c for c in ps if (not only or c in only) and (c in redo or not (OUT / f'kog-realm-map-{c}.png').exists())]
    print(f'{len(todo)} to paint: {", ".join(todo)}')
    if args.dry_run or not todo:
        return
    for c in todo:
        if not (REFS / f'map-reference-{c}.png').exists():
            sys.exit(f'Missing the reference map for {c}: run tools/make_map_refs.py')
    key = m.api_key()
    OUT.mkdir(parents=True, exist_ok=True)

    def run(code):
        t0 = time.time()
        try:
            res = paint(key, code, ps[code], args)
            (OUT / f'kog-realm-map-{code}.png').write_bytes(base64.b64decode(res['data'][0]['b64_json']))
            c = m.cost(res.get('usage'))
            row = [time.strftime('%Y-%m-%d %H:%M:%S'), f'maps/kog-realm-map-{code}.png', 'ok', f'{c:.4f}', json.dumps(res.get('usage'))]
            print(f'ok  {code}  ${c:.3f}  {time.time() - t0:.0f}s', flush=True)
        except Exception as e:
            c = 0.0
            row = [time.strftime('%Y-%m-%d %H:%M:%S'), f'maps/kog-realm-map-{code}.png', 'error', '0', str(e)[:300]]
            print(f'ERR {code}  {e}', flush=True)
        with open(m.OUT / 'log.csv', 'a', newline='', encoding='utf8') as f:
            csv.writer(f).writerow(row)
        return c

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
        total = sum(ex.map(run, todo))
    print(f'Done, about ${total:.2f}.')


if __name__ == '__main__':
    main()
