"""Write docs/CHALLENGES.md: every challenge, split into "Already in the app" (art done) and "Still missing" (art to make)."""
import pathlib
import re

root = pathlib.Path(r'C:/Users/thoma/KOG')
s = (root / 'js/challenges.js').read_text(encoding='utf8')
body = s[s.index('export const CHALLENGES = ['):s.index('export const SECTIONS')]
blocks = re.findall(r"\n  c\((.*?)\),(?=\n)", body, re.S)
strs = re.compile(r"'((?:[^'\\]|\\.)*)'")
lab = {'common': 'Common', 'rare': 'Rare', 'very-rare': 'Very Rare', 'legendary': 'Legendary', 'impossible': 'Impossible'}
items = []
for b in blocks:
    f = [x.replace("\\'", "'") for x in strs.findall(b)]
    items.append(dict(zip(['id', 'section', 'mode', 'rarity', 'suit', 'name', 'how', 'badge', 'banner'], f)))
done = set(re.findall(r"'([^']+)'", re.search(r'export const ART = new Set\(\[(.*?)\]\);', s).group(1)))
have = [i for i in items if i['id'] in done]
need = [i for i in items if i['id'] not in done]

out = ['# KOG Challenges', '',
       'Every challenge earns a **badge** and a **banner**. Players can wear them together or mix and match.',
       'Almost all of them come from **ranked**, where both players confirm the score. Only a few come from Compass Putt and Lag 21.',
       '', 'Rarity ink: **Common** (silver), **Rare** (blue), **Very Rare** (purple), **Legendary** (gold), **Impossible** (red).', '',
       f'**{len(have)} of {len(items)} challenges have their art.** {len(need)} still need a badge and banner.', '']


def by_section(group, full):
    sec = None
    for it in group:
        if it['section'] != sec:
            out.extend(['', f'### {it["section"]}', ''])
            sec = it['section']
        if full:
            out.extend([f'#### {it["name"]} · {lab[it["rarity"]]}',
                        f'- **How to complete ({it["mode"]}):** {it["how"]}',
                        f'- **Badge:** {it["badge"]}',
                        f'- **Banner:** {it["banner"]}',
                        f'- **Files:** `badge-{it["id"]}.png`, `banner-{it["id"]}.png`', ''])
        else:
            out.append(f'- **{it["name"]}** · {lab[it["rarity"]]}: {it["how"]}')


out.extend(['---', '', f'## Already in the app ({len(have)})', ''])
by_section(have, False)
out.extend(['', '---', '', f'## Still missing ({len(need)})', '', 'These need art from ChatGPT. Ready-to-send prompts are in CHALLENGE-PROMPTS.md.'])
by_section(need, True)
(root / 'docs/CHALLENGES.md').write_text('\n'.join(out) + '\n', encoding='utf8')
print(len(items), len(have), len(need))
