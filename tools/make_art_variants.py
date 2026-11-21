"""Make the Queen and skin-tone versions of the challenge art with OpenAI's image API.

For every badge and banner that shows a King, it makes up to five versions:
  King in Brown and Black skin           -> banner-<id>-brown.png, banner-<id>-black.png
  Queen in White, Brown and Black skin   -> queen-banner-<id>.png, queen-banner-<id>-brown.png, queen-banner-<id>-black.png
and the Brown and Black versions of the four Queen cards (queen-<suit>-brown.png, ...).
Each request sends the original picture plus one reference sheet (the four Kings or Queens in the right skin),
and asks for the same picture with only the Kings changed. Results go to "KOG Images/Generated"; then
`python tools/add_tone_art.py` brings them into the app.

Your API key stays on your computer: put it in C:/Users/thoma/.kog/openai-key.txt (or the OPENAI_API_KEY
environment variable). The script never prints it.

Examples:
  python tools/make_art_variants.py --dry-run                 # list what it would make, and the count
  python tools/make_art_variants.py --limit 3                 # a small test
  python tools/make_art_variants.py --only north,west --variants king-brown,queen-white
  python tools/make_art_variants.py --redo banner-north-brown,queen-banner-west   # make these again
  python tools/make_art_variants.py                           # everything not made yet
"""
import argparse
import base64
import csv
import json
import os
import pathlib
import random
import re
import sys
import threading
import time
import urllib.error
import urllib.request
import uuid
from concurrent.futures import ThreadPoolExecutor

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMAGES = pathlib.Path(r'C:/Users/thoma/OneDrive/Desktop/KOG Images')
OUT = IMAGES / 'Generated'
REFS = OUT / 'reference sheets'
ORIG = ROOT / 'assets/originals/challenge-art'
KEY_FILE = pathlib.Path.home() / '.kog' / 'openai-key.txt'
API = 'https://api.openai.com/v1/images/edits'

# What one image costs is measured from each reply's token counts (per 1M tokens, standard prices, Nov 2026).
PRICE = {'image_in': 8.00, 'text_in': 5.00, 'image_out': 30.00}

SUITS = ['spades', 'hearts', 'clubs', 'diamonds']
KING_CARD = {  # the original (White) King cards
    'spades': IMAGES / 'King of Spades Royal Spade.png',
    'hearts': IMAGES / 'King of Hearts Heartbreak Golf.png',
    'clubs': IMAGES / 'King of Clubs Clubs2Cozy - Plumb Bob.png',
    'diamonds': IMAGES / 'King of Diamonds Dirty Diamond.png',
}
SKIN = {
    'white': 'the same light skin they have on the reference sheet',
    'brown': 'a warm medium brown skin tone, as on the reference sheet',
    'black': 'a deep, dark brown skin tone, as on the reference sheet',
}
VARIANTS = ['king-brown', 'king-black', 'queen-white', 'queen-brown', 'queen-black']
# Badges that show a King (the rest are emblems and look the same for everyone).
BADGES_WITH_KINGS = {'north', 'west', 'east', 'south', 'blackjack', 'built-for-this', 'king-of-skies', 'full-house', 'shoulder-burden'}


def challenges():
    s = (ROOT / 'js/challenges.js').read_text(encoding='utf8')
    body = s[s.index('export const CHALLENGES = ['):s.index('export const SECTIONS')]
    strs = re.compile(r"'((?:[^'\\]|\\.)*)'")
    items = [dict(zip(['id', 'section', 'mode', 'rarity', 'suit', 'name', 'how', 'badge', 'banner'], strs.findall(b)))
             for b in re.findall(r"\n  c\((.*?)\),(?=\n)", body, re.S)]
    art = set(re.findall(r"'([^']+)'", re.search(r'export const ART = new Set\(\[(.*?)\]\);', s).group(1)))
    return [i for i in items if i['id'] in art]


def queen_card(suit, tone='white'):
    name = f'queen-{suit}.png' if tone == 'white' else f'queen-{suit}-{tone}.png'
    return OUT / name if (OUT / name).exists() else IMAGES / name  # Brown/Black Queen cards come from this script


def king_card(suit, tone):
    return KING_CARD[suit] if tone == 'white' else IMAGES / f'king-{suit}-{tone}.png'


def reference_sheet(who, tone):
    """The four cards side by side (Spades, Hearts, Clubs, Diamonds) in one picture: one reference instead of four."""
    path = REFS / f'{who}s-{tone}.png'
    cards = [king_card(s, tone) if who == 'king' else queen_card(s, tone) for s in SUITS]
    if not all(c.exists() for c in cards):
        return None
    if path.exists() and path.stat().st_mtime >= max(c.stat().st_mtime for c in cards):
        return path
    REFS.mkdir(parents=True, exist_ok=True)
    ims = [Image.open(c).convert('RGB').resize((512, 768), Image.LANCZOS) for c in cards]
    sheet = Image.new('RGB', (512 * 4, 768), 'white')
    for i, im in enumerate(ims):
        sheet.paste(im, (512 * i, 0))
    sheet.save(path)
    return path


# Queens get a different outfit in every challenge (the same one in all three skins of that challenge).
QUEEN_LOOKS = [
    'a sleeveless polo and a pleated skort',
    'a cropped cable-knit sweater and tailored trousers',
    'a fitted quarter-zip pullover and high-waisted plaid pants',
    'an argyle sweater vest over a collared blouse with a pleated midi golf skirt',
    'a vintage 1950s belted golf dress',
    'a quilted puffer vest over a long-sleeve polo with slim pants',
    'a tailored blazer and wide-leg trousers',
    'a pleated tennis-style dress with a cardigan tied over her shoulders',
    'a knit polo dress with knee socks',
    'a windbreaker jacket and capri pants',
    'a linen button-down shirt tucked into high-waisted shorts',
    'a turtleneck under a tweed golf jacket with plus-fours',
    'a racerback golf top and a flowing wrap skirt',
    'a cardigan over a fitted polo with Bermuda shorts',
    'a mock-neck top and a pleated skirt with leg warmers',
    'a cropped golf jacket and tailored culottes',
    'a satin bomber jacket over a fitted top with a mini skort',
    'a striped rugby shirt and slim chinos',
]
QUEEN_HATS = ['a visor', 'a bucket hat', 'a wide-brim sun hat', 'a headband', 'a newsboy cap', 'no hat', 'no hat', 'no hat']
SUIT_COLORS = {'spades': 'black, charcoal and silver', 'hearts': 'red, cream and gold',
               'clubs': 'forest green, cream and gold', 'diamonds': 'red, white and gold'}


def queen_outfits(cid):
    """A different look for each Queen in this challenge, the same for every skin tone."""
    lines = []
    for suit in SUITS:
        rnd = random.Random(f'{cid}:{suit}')
        hat = rnd.choice(QUEEN_HATS)
        lines.append(f'the Queen of {suit.title()} wears {rnd.choice(QUEEN_LOOKS)} in {SUIT_COLORS[suit]}'
                     + ('' if hat == 'no hat' else f', with {hat} worn under or beside her crown'))
    return '; '.join(lines) + '.'


def prompt_for(kind, variant, card_suit=None, cid=None):
    who, tone = variant.split('-')
    shape = ('Keep the transparent background, the round badge shape and its rim exactly.' if kind == 'badge'
             else 'Keep the same wide framing and size.')
    if kind == 'card':
        return (f'Image 1 is a playing card to recreate exactly. Keep everything identical: the composition, her pose, '
                f'her outfit, the background, the colors, the card border, the corner letters and suit symbols, and the '
                f'linework and crosshatching. Change only her skin tone to {SKIN[tone]} (image 2 shows the four Kings in '
                f'this skin tone for reference). Keep her hair, face, expression and crown the same. Change nothing else.')
    if who == 'king':
        return ('Image 1 is the artwork to recreate. Recreate image 1 exactly: the same composition, poses, outfits, '
                'colors, background, lighting, linework and crosshatching. '
                f'{shape} The only change: every King\'s skin becomes {SKIN[tone]}. Image 2 is the reference sheet: '
                'the King of Spades, King of Hearts, King of Clubs and King of Diamonds, left to right, in that skin tone. '
                'Keep each King\'s white curled hair, mustache and beard, his face, expression and crown the same. '
                'Change nothing else.')
    return ('Image 1 is the artwork to recreate. Recreate image 1 exactly: the same composition, scene, colors, '
            f'background, lighting, linework and crosshatching. {shape} The only change: replace every King with the '
            'Queen of the same suit. Image 2 is the reference sheet: the Queen of Spades, Queen of Hearts, Queen of '
            'Clubs and Queen of Diamonds, left to right. King of Spades becomes the Queen of Spades, King of Hearts the '
            'Queen of Hearts, King of Clubs the Queen of Clubs, King of Diamonds the Queen of Diamonds. First work out '
            'each King\'s suit from the suit symbols (spade, heart, club, diamond) on his clothes and crown, and put that '
            'same suit\'s Queen exactly where he stands, even if the order differs from the sheet. Each Queen does '
            'exactly what that King was doing, in the same pose and place, holding the same things. Each Queen must have '
            'exactly the face, skin tone, hair and crown from her card on the reference sheet. '
            'Do NOT copy the clothes from her card: dress her in a new outfit for this scene. '
            f'Outfits: {queen_outfits(cid)} Adjust each outfit to the setting and weather in image 1 (add a coat, gloves '
            'or scarf in the cold, keep it light in the heat), and if a King wears a royal robe or cape, the Queen keeps '
            'a matching robe or cape over her outfit. Each outfit is stylish, tasteful golf wear. '
            'If you can\'t tell a King\'s suit, use the Queen whose colors fit him best. Change nothing else.')


def out_name(kind, cid, variant):
    who, tone = variant.split('-')
    suffix = '' if tone == 'white' else f'-{tone}'
    base = f'{kind}-{cid}' if kind != 'card' else cid
    return f'{"queen-" if who == "queen" and kind != "card" else ""}{base}{suffix}.png'


def jobs(args):
    want = set(args.variants.split(',')) if args.variants else set(VARIANTS)
    only = set(args.only.split(',')) if args.only else None
    out = []
    # The Queen cards in Brown and Black come first: the Queen banners in those skins use them as references.
    if not only or 'cards' in only:
        for suit in SUITS:
            for tone in ('brown', 'black'):
                if f'queen-{tone}' in want and not (IMAGES / f'queen-{suit}-{tone}.png').exists():  # made by hand in ChatGPT
                    out.append({'kind': 'card', 'id': f'queen-{suit}', 'variant': f'queen-{tone}', 'src': queen_card(suit),
                                'name': f'queen-{suit}-{tone}.png', 'suit': suit})
    for ch in challenges():
        cid = ch['id']
        if only and cid not in only:
            continue
        for kind in ('banner', 'badge'):
            if kind == 'badge' and cid not in BADGES_WITH_KINGS:
                continue
            if kind == 'banner' and not re.search(r'\bKings?\b', ch['banner']):
                continue
            src = ORIG / f'{kind}-{cid}.png'
            if not src.exists():
                continue
            for v in VARIANTS:
                if v in want:
                    out.append({'kind': kind, 'id': cid, 'variant': v, 'src': src, 'name': out_name(kind, cid, v)})
    return out


def api_key():
    k = os.environ.get('OPENAI_API_KEY', '').strip()
    if not k and KEY_FILE.exists():
        k = KEY_FILE.read_text(encoding='utf8').strip()
    if not k:
        sys.exit(f'No API key. Put it in {KEY_FILE} (see docs/ART-AUTOMATION.md).')
    return k


def multipart(fields, files):
    boundary = uuid.uuid4().hex
    parts = []
    for k, v in fields.items():
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode('utf8'))
    for k, path in files:
        data = pathlib.Path(path).read_bytes()
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"; filename="{pathlib.Path(path).name}"\r\n'
                     f'Content-Type: image/png\r\n\r\n'.encode('utf8') + data + b'\r\n')
    parts.append(f'--{boundary}--\r\n'.encode('utf8'))
    return b''.join(parts), f'multipart/form-data; boundary={boundary}'


def edit(key, job, ref, args):
    size = {'banner': '1536x1024', 'badge': '1024x1024', 'card': '1024x1536'}[job['kind']]
    fields = {'model': args.model, 'prompt': prompt_for(job['kind'], job['variant'], cid=job['id']), 'size': size,
              'quality': args.quality, 'output_format': 'png', 'n': '1'}
    if job['kind'] == 'badge':
        fields['background'] = 'transparent'
    body, ctype = multipart(fields, [('image[]', job['src']), ('image[]', ref)])
    for attempt in range(6):
        req = urllib.request.Request(API, data=body, method='POST', headers={'Authorization': f'Bearer {key}', 'Content-Type': ctype})
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            detail = e.read().decode('utf8', 'replace')
            if e.code in (429, 500, 502, 503, 504) and 'insufficient_quota' not in detail:
                wait = min(120, 5 * 2 ** attempt) + random.random() * 3
                print(f'  {job["name"]}: busy ({e.code}), retrying in {wait:.0f}s')
                time.sleep(wait)
                continue
            raise RuntimeError(f'HTTP {e.code}: {detail[:400]}')
        except (urllib.error.URLError, TimeoutError) as e:
            time.sleep(10)
            last = e
    raise RuntimeError('gave up after retries')


def cost(usage):
    if not usage:
        return 0.0
    d = usage.get('input_tokens_details') or {}
    img_in = d.get('image_tokens', 0)
    txt_in = d.get('text_tokens', usage.get('input_tokens', 0) - img_in)
    return (img_in * PRICE['image_in'] + txt_in * PRICE['text_in'] + usage.get('output_tokens', 0) * PRICE['image_out']) / 1e6


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--dry-run', action='store_true', help='list the jobs and stop')
    ap.add_argument('--limit', type=int, help='make at most this many')
    ap.add_argument('--only', help='challenge ids (comma-separated); "cards" for the Queen cards')
    ap.add_argument('--variants', help='comma-separated: ' + ','.join(VARIANTS))
    ap.add_argument('--redo', help='output names to make again, comma-separated (with or without .png)')
    ap.add_argument('--model', default='gpt-image-2.6-sunburst')
    ap.add_argument('--quality', default='medium', choices=['low', 'medium', 'high', 'xhigh', 'max', 'auto'])
    ap.add_argument('--workers', type=int, default=3, help='how many at once')
    args = ap.parse_args()

    redo = {n if n.endswith('.png') else n + '.png' for n in (args.redo or '').split(',') if n}
    todo, waiting = [], 0
    for j in jobs(args):
        if redo and j['name'] not in redo:
            continue
        if not redo and (OUT / j['name']).exists():
            continue
        who, tone = j['variant'].split('-')
        if not j['src'].exists():
            waiting += 1  # e.g. Queen cards not made yet
            continue
        # Kings and Queen cards use the Kings in that skin as the reference; Queen artwork uses the four Queens.
        ref = reference_sheet('king' if who == 'king' or j['kind'] == 'card' else 'queen', tone)
        if ref is None:
            waiting += 1
            continue
        j['ref'] = ref
        todo.append(j)
    if args.limit:
        todo = todo[:args.limit]
    print(f'{len(todo)} to make' + (f' ({waiting} waiting on the Queen cards or other references)' if waiting else ''))
    if args.dry_run:
        for j in todo:
            print(' ', j['name'], '<-', j['src'].name, '+', j['ref'].name)
        return
    if not todo:
        return
    key = api_key()
    OUT.mkdir(parents=True, exist_ok=True)
    log = OUT / 'log.csv'
    lock = threading.Lock()
    total = [0.0, 0]

    def run(j):
        t0 = time.time()
        try:
            res = edit(key, j, j['ref'], args)
            (OUT / j['name']).write_bytes(base64.b64decode(res['data'][0]['b64_json']))
            c = cost(res.get('usage'))
            msg = f'ok  {j["name"]}  ${c:.3f}  {time.time() - t0:.0f}s'
            row = [time.strftime('%Y-%m-%d %H:%M:%S'), j['name'], 'ok', f'{c:.4f}', json.dumps(res.get('usage'))]
        except Exception as e:  # keep going; failures are logged and can be redone
            c = 0.0
            msg = f'ERR {j["name"]}  {e}'
            row = [time.strftime('%Y-%m-%d %H:%M:%S'), j['name'], 'error', '0', str(e)[:300]]
        with lock:
            total[0] += c
            total[1] += 1
            print(f'[{total[1]}/{len(todo)}] {msg}  (so far ${total[0]:.2f})', flush=True)
            new = not log.exists()
            with open(log, 'a', newline='', encoding='utf8') as f:
                w = csv.writer(f)
                if new:
                    w.writerow(['time', 'file', 'result', 'cost_usd', 'usage'])
                w.writerow(row)

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
        list(ex.map(run, todo))
    print(f'Done: {total[1]} images, about ${total[0]:.2f}. Next: python tools/add_tone_art.py')


if __name__ == '__main__':
    main()
