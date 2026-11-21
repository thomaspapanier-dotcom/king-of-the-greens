# Skin tones for the Kings: prompts for ChatGPT

Players pick how the Kings look in **Settings → How your Kings look**: **White**, **Brown** or **Black**.
Every picture that has a version in the chosen look is swapped in, and anything without one yet shows the original, so the art can be made a little at a time.

The art is the same in every version. Only the Kings' skin changes; their white hair, beard and mustache, outfits, poses and scenes all stay the same.

## Step 1: the four King cards (8 images)

Use your existing ChatGPT chat. Attach one King card (from the KOG Images folder, or `assets/cards/king-spades.webp` and so on), send the prompt, then do the same for the other tone. One image per reply.

**Brown** (a warm medium brown):
```
Recreate this exact playing card. Keep everything identical: the composition, pose, outfit, colors, background, card border, corner letters and suit symbols, linework and crosshatching. Change only the King's skin tone to a warm medium brown, natural and consistent on his face, ears, neck, hands and arms. Keep his hair, mustache and beard white and curled exactly as they are, and keep his face, expression and crown the same. Don't change anything else.
```

**Black** (a deep, dark brown):
```
Recreate this exact playing card. Keep everything identical: the composition, pose, outfit, colors, background, card border, corner letters and suit symbols, linework and crosshatching. Change only the King's skin tone to a deep, dark brown, natural and consistent on his face, ears, neck, hands and arms. Keep his hair, mustache and beard white and curled exactly as they are, and keep his face, expression and crown the same. Don't change anything else.
```

Save them in the KOG Images folder as:

| King | Brown | Black |
|---|---|---|
| Spades | `king-spades-brown.png` | `king-spades-black.png` |
| Hearts | `king-hearts-brown.png` | `king-hearts-black.png` |
| Clubs | `king-clubs-brown.png` | `king-clubs-black.png` |
| Diamonds | `king-diamonds-brown.png` | `king-diamonds-black.png` |

Tell me when they're in the folder and I'll add them (`python tools/add_tone_art.py`).

**If one comes out wrong:** reply with what to fix, for example "keep everything, but put back the palm trees", instead of starting over. If ChatGPT changes the background or pose, say "only the skin should change; match the original exactly".

## Step 2 (later): the badges and banners

Same idea, a batch at a time. Attach the badge or banner and use the same prompts, with "this exact playing card" changed to "this exact image" and "the King's" changed to "every King's". Save them with the tone at the end of the usual name, for example `badge-north-brown.png`, `banner-north-black.png`.
