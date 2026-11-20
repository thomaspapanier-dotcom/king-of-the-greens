"""Write docs/CHALLENGE-PROMPTS.md: ChatGPT prompts for every challenge's badge and banner, in batches by rarity."""
import pathlib
import re

root = pathlib.Path(r'C:/Users/thoma/KOG')
s = (root / 'js/challenges.js').read_text(encoding='utf8')
body = s[s.index('export const CHALLENGES = ['):s.index('export const SECTIONS')]
blocks = re.findall(r"\n  c\((.*?)\),(?=\n)", body, re.S)
strs = re.compile(r"'((?:[^'\\]|\\.)*)'")
items = []
for b in blocks:
    f = [x.replace("\\'", "'") for x in strs.findall(b)]
    items.append(dict(zip(['id', 'section', 'mode', 'rarity', 'suit', 'name', 'how', 'badge', 'banner'], f)))
# Only list the challenges that still need art (ART in js/challenges.js lists the finished ones).
done = set(re.findall(r"'([^']+)'", re.search(r'export const ART = new Set\(\[(.*?)\]\);', s).group(1)))
total = len(items)
all_items = items
items = [i for i in items if i['id'] not in done]

KING = {
    'spades': 'King of Spades (Royal Spade): classic country-club style, calm old-money confidence; pick a fresh preppy outfit (knit, blazer, tweed, rugby) with spade details',
    'hearts': 'King of Hearts (Heartbreak Golf Co.): sleek tour athlete, focused and intense; pick a fresh performance outfit in red, black and white with heart details',
    'diamonds': 'King of Diamonds (Dirty Diamond Ltd.): golf streetwear, gold chain, cocky smirk; pick a fresh streetwear fit (hoodie, varsity or bomber jacket, oversized tee) with diamond prints',
    'clubs': 'King of Clubs (Clubs2Cozy): laid-back coastal, sunglasses on his crown, iced coffee; pick a fresh relaxed outfit (linen, knit polo, cardigan) with club or palm prints',
}
TIER = {
    'common': ('Common', 'Simple and clean. Badge: one bold symbol, 2–3 colors plus gold, a plain brushed-silver rim. Banner: one clear scene in daylight, not busy.'),
    'rare': ('Rare', 'More detail. Badge: polished sapphire-blue enamel rim with small gold accents and a bit of shine. Banner: richer lighting (golden hour or night), more props and depth.'),
    'very-rare': ('Very Rare', 'Intricate. Badge: amethyst-purple rim set with small gemstones and a soft purple glow, layered details. Banner: dramatic cinematic lighting, two or more Kings, lots of hidden details.'),
    'legendary': ('Legendary', 'Lavish, one notch below Impossible. Badge: a polished gold rim with engraved laurels, a few cut gems and a warm golden glow, with fine detail throughout. Banner: a grand, cinematic scene with rich golden lighting, several Kings and plenty of story details to discover.'),
    'impossible': ('Impossible', 'The most exotic, detailed art in the game. Badge: a crimson-and-molten-gold rim with intricate filigree, embedded rubies, floating embers and a living aura, like a relic from another world. Banner: a breathtaking, otherworldly scene (surreal settings, impossible architecture, wild weather or celestial skies) with extreme detail in every corner and spectacular lighting. Each one must look completely unlike every other badge and banner.'),
}
ORDER = ['common', 'rare', 'very-rare', 'legendary', 'impossible']
PER_MSG = {'common': 4, 'rare': 3, 'very-rare': 2, 'legendary': 1, 'impossible': 1}


def entry(it, n):
    t = TIER[it['rarity']][0]
    return '\n'.join([
        f'{n}. **{it["name"]}** ({t}), file names: `badge-{it["id"]}.png` and `banner-{it["id"]}.png`',
        f'   - Earned by: {it["how"]}',
        f'   - Main King: {KING[it["suit"]]}',
        f'   - Badge: {it["badge"]}',
        f'   - Banner: {it["banner"]}',
    ])


out = []
add = out.append
add('# Challenge art: prompts for ChatGPT')
add('')
add('Each challenge gets a **badge** (square) and a **banner** (wide). Send these to ChatGPT in order:')
add('the setup message first, then one batch at a time. Easy ones go fast; the higher the rarity, the more time ChatGPT should take.')
add('')
counts = {r: sum(1 for i in items if i['rarity'] == r) for r in ORDER}
add(f'**Still to make:** {counts["common"]} Common, {counts["rare"]} Rare, {counts["very-rare"]} Very Rare, {counts["legendary"]} Legendary, {counts["impossible"]} Impossible ({len(items)} challenges, {2 * len(items)} images). {total - len(items)} of {total} challenges already have their art and aren’t listed here.')
add('')
have = [i for i in all_items if i['id'] in done]
add(f'**Already in the app ({len(have)}):** ' + ' · '.join(i['name'] for i in have))
add('')
add(f'**Still missing ({len(items)}):** everything below, easiest first.')
add('')
add('**Halfway point: switch up the fits.** Most of the art so far has the Kings in the same four shirts. Paste this into your ChatGPT chat once, before the next batch:')
add('')
add('```')
add("OUTFITS: Switch up the Kings' fits from image to image. Keep each King's face, crown and personality, and keep every outfit suit-themed and true to his brand, but don't keep repeating the same four shirts. King of Spades (Royal Spade): cable-knit sweaters, cardigans, blazers, tweed vests, rugby shirts, pullovers with subtle spade argyle. King of Hearts (Heartbreak Golf Co.): mock necks, tour polos, quarter-zips, windbreakers and rain jackets in red, black and white with heart graphics. King of Diamonds (Dirty Diamond Ltd.): hoodies, varsity and bomber jackets, oversized tees, track jackets, bucket hats, loud diamond prints. King of Clubs (Clubs2Cozy): linen shirts, knit polos, cozy cardigans, overshirts, joggers and shorts in coastal colors with club or palm prints.")
add('```')
add('')
add('**New rarity: Legendary.** If your ChatGPT chat already has the setup message, paste this once before the next batch:')
add('')
add('```')
add('RARITY UPDATE: There is a new rarity between Very Rare and Impossible. LEGENDARY: lavish, one notch below Impossible. ' + TIER['legendary'][1][len('Lavish, one notch below Impossible. '):] + ' IMPOSSIBLE is now the very top and should be the most exotic, detailed art in the game: ' + TIER['impossible'][1][len('The most exotic, detailed art in the game. '):])
add('```')
add('')
add('**Tips**')
add('- Use one ChatGPT chat for everything, so it remembers the style and the Kings.')
add('- When an image comes out right, save it with the file name shown (for example `badge-north.png`). Send them to me in groups and I’ll drop them into the app.')
add('- If one comes out wrong, reply with what to fix (for example "keep everything, but make the crown gold") instead of starting over.')
add('')
add('---')
add('')
add('## Step 1: setup message (send once, with images attached; skip it if your ChatGPT chat already has it)')
add('')
add('Attach the 4 new King cards plus the emblem, logo and graphic images from the KOG Images folder, then send:')
add('')
add('```')
add('''You're the art director for "King of the Greens" (KOG), a real-life putting game played on golf practice greens. Players earn a BADGE and a BANNER for completing challenges, and wear them on their player nameplate.

CHARACTERS: The attached images are the four suit Kings. Keep each King exactly on-model every time: same face, curled white hair, swirled mustache and beard, gold crown, outfit and personality.
- King of Spades (Royal Spade): classic country club, argyle sweater vest, pleated khakis, saddle shoes, calm old-money confidence.
- King of Hearts (Heartbreak Golf Co.): sleek tour athlete, red and black performance gear, focused and intense.
- King of Diamonds (Dirty Diamond Ltd.): golf streetwear, oversized diamond-print polo, gold chain, baggy pants, skateboard, cocky.
- King of Clubs (Clubs2Cozy): laid-back coastal, palm-print camp shirt, sunglasses on his crown, iced coffee.
You can also use eagles, animals, objects, places and other characters when a challenge calls for it, but the Kings are the stars.

OUTFITS: Switch up the Kings' fits from image to image. Keep each King's face, crown and personality, and keep every outfit suit-themed and true to his brand, but don't keep repeating the same four shirts. King of Spades (Royal Spade): cable-knit sweaters, cardigans, blazers, tweed vests, rugby shirts, pullovers with subtle spade argyle. King of Hearts (Heartbreak Golf Co.): mock necks, tour polos, quarter-zips, windbreakers and rain jackets in red, black and white with heart graphics. King of Diamonds (Dirty Diamond Ltd.): hoodies, varsity and bomber jackets, oversized tees, track jackets, bucket hats, loud diamond prints. King of Clubs (Clubs2Cozy): linen shirts, knit polos, cozy cardigans, overshirts, joggers and shorts in coastal colors with club or palm prints.

STYLE: Match the attached art: vintage engraved playing-card illustration, bold ink linework, fine crosshatching, rich warm colors. No real-world brand logos. Use playing-card suits, crowns, putters, golf balls, flags and greens as motifs.

FORMATS:
- BADGE: square 1024x1024, transparent background. One centered emblem inside a rim. It must still read at a tiny size (about the size of a fingernail on a phone), so use a bold silhouette and no small text.
- BANNER: landscape 1536x1024, no text. The app shows it as a long thin strip across the whole screen (about 4 wide by 1 tall), cut from the upper part of the image, with the round badge sitting on the far left. So keep the Kings' faces, crowns and the main action in the upper-middle band (roughly the top 15% to 50% of the image), and keep the far left calmer.

RARITY sets how detailed and luxurious the art is. The badge rim tells you the rarity at a glance:
- Common: simple and clean, brushed-silver rim.
- Rare: more detail, sapphire-blue enamel rim with gold accents.
- Very Rare: intricate, amethyst-purple rim with gemstones and a soft glow.
- Legendary: lavish, a notch below Impossible. Polished gold rim with engraved laurels, a few cut gems and a warm golden glow; grand, cinematic banners.
- Impossible: the most exotic and detailed art in the game. Crimson-and-molten-gold rim, filigree, rubies, floating embers and a living aura; otherworldly banners, each unlike anything else.

HOW WE'LL WORK: I'll send challenges in batches. For each challenge, make the badge first, then the banner, one image per reply. Wait for me to say "next" before moving on. Take more time and care the rarer the challenge is.

Reply "Ready" if you understand.''')
add('```')
add('')
step = 2
for r in ORDER:
    group = [i for i in items if i['rarity'] == r]
    label, look = TIER[r]
    add('---')
    add('')
    add(f'## {label} ({len(group)} challenges)')
    add('')
    if r == 'impossible':
        add('One challenge per message. Ask ChatGPT to pitch the concept first, then make the badge, then the banner. These should feel worth grinding for.')
        add('')
    k = 0
    for start in range(0, len(group), PER_MSG[r]):
        chunk = group[start:start + PER_MSG[r]]
        k += 1
        add(f'### Step {step}: {label} batch {k}')
        step += 1
        add('')
        add('```')
        if r == 'legendary':
            add(f'LEGENDARY challenge. Rarity look: {look}')
            add('')
            add('Make the badge, wait for "next", then the banner. Take your time and go big on detail, gold and lighting, a notch below the Impossible ones. Dress the Kings in fresh, suit-themed outfits fit for the moment.')
        elif r == 'impossible':
            add(f'IMPOSSIBLE challenge. Rarity look: {look}')
            add('')
            add('Before drawing anything, pitch me your concept for the badge and the banner in a few sentences and wait for my OK. Then make the badge, wait for "next", then the banner. Take your time; push the detail, materials and lighting as far as you can, and make it unlike any badge or banner so far. Dress the Kings in brand-new, suit-themed outfits fit for a legendary moment.')
        else:
            add(f'{label} challenges. Rarity look: {look}')
            add('')
            add('For each one, make the badge, then the banner (one image per reply, wait for "next"). Give the Kings fresh, suit-themed outfits, not the same four shirts as before.')
        add('')
        for n, it in enumerate(chunk, 1):
            add(entry(it, n).replace('**', ''))
            add('')
        add('```')
        add('')
add('---')
add('')
add('## Bonus: new pose for the King of Clubs')
add('')
add('The King of Spades, King of Diamonds and King of Clubs cards all lean cross-legged on a putter. Send this with the King of Clubs card attached:')
add('')
add('```')
add('Redraw this King of Clubs playing card in exactly the same style, card layout, colors, outfit and face, but change his pose: he is crouched down behind a golf ball on the green, reading the putt, holding his putter up in front of one eye to plumb-bob the line. His iced coffee sits on the grass next to him and his sunglasses are still on his crown. Keep the beach, palm trees, sunset, flag and ball basket.')
add('```')
(root / 'docs/CHALLENGE-PROMPTS.md').write_text('\n'.join(out) + '\n', encoding='utf8')
print(counts, step - 1)
