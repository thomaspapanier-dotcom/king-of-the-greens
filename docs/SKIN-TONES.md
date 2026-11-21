# Skin tones for the Kings: prompts for ChatGPT

Players pick how the Kings look in **Settings → How your Kings look**: **White**, **Brown** or **Black**.
Every picture that has a version in the chosen look is swapped in, and anything without one yet shows the original, so the art can be made a little at a time.

The art is the same in every version. Only the Kings' skin changes; their white hair, beard and mustache, outfits, poses and scenes all stay the same.

## Step 1: the four King cards (8 images)

Do these one at a time in your ChatGPT chat. For each one: **attach the card file listed** (from the KOG Images folder) **in the same message** as the prompt, so ChatGPT knows exactly which card to recreate. Then save the result with the file name shown.

### King of Spades

**1. Brown**: attach `King of Spades Royal Spade.png`, save as `king-spades-brown.png`
```
Recreate the attached King of Spades playing card exactly. Keep everything identical: the composition, his pose, his argyle sweater vest, the white clubhouse and the hydrangeas behind him, the colors, the card border, the corner letters and suit symbols, and the linework and crosshatching. Change only his skin tone to a warm medium brown, natural and consistent on his face, ears, neck, hands and arms. Keep his hair, mustache and beard white and curled exactly as they are, and keep his face, expression and crown the same. Don't change anything else.
```

**2. Black**: attach `King of Spades Royal Spade.png`, save as `king-spades-black.png`
```
Recreate the attached King of Spades playing card exactly. Keep everything identical: the composition, his pose, his argyle sweater vest, the white clubhouse and the hydrangeas behind him, the colors, the card border, the corner letters and suit symbols, and the linework and crosshatching. Change only his skin tone to a deep, dark brown, natural and consistent on his face, ears, neck, hands and arms. Keep his hair, mustache and beard white and curled exactly as they are, and keep his face, expression and crown the same. Don't change anything else.
```

### King of Hearts

**3. Brown**: attach `King of Hearts Heartbreak Golf.png`, save as `king-hearts-brown.png`
```
Recreate the attached King of Hearts playing card exactly. Keep everything identical: the composition, his pose, his red-and-black Heartbreak Golf top and the flags behind him, the colors, the card border, the corner letters and suit symbols, and the linework and crosshatching. Change only his skin tone to a warm medium brown, natural and consistent on his face, ears, neck, hands and arms. Keep his hair, mustache and beard white and curled exactly as they are, and keep his face, expression and crown the same. Don't change anything else.
```

**4. Black**: attach `King of Hearts Heartbreak Golf.png`, save as `king-hearts-black.png`
```
Recreate the attached King of Hearts playing card exactly. Keep everything identical: the composition, his pose, his red-and-black Heartbreak Golf top and the flags behind him, the colors, the card border, the corner letters and suit symbols, and the linework and crosshatching. Change only his skin tone to a deep, dark brown, natural and consistent on his face, ears, neck, hands and arms. Keep his hair, mustache and beard white and curled exactly as they are, and keep his face, expression and crown the same. Don't change anything else.
```

### King of Clubs

**5. Brown**: attach `King of Clubs Clubs2Cozy - Plumb Bob.png`, save as `king-clubs-brown.png`
```
Recreate the attached King of Clubs playing card exactly. Keep everything identical: the composition, his crouched plumb-bob pose, his palm-print shirt, his iced coffee and the beach sunset behind him, the colors, the card border, the corner letters and suit symbols, and the linework and crosshatching. Change only his skin tone to a warm medium brown, natural and consistent on his face, ears, neck, hands and arms. Keep his hair, mustache and beard white and curled exactly as they are, and keep his face, expression and crown the same. Don't change anything else.
```

**6. Black**: attach `King of Clubs Clubs2Cozy - Plumb Bob.png`, save as `king-clubs-black.png`
```
Recreate the attached King of Clubs playing card exactly. Keep everything identical: the composition, his crouched plumb-bob pose, his palm-print shirt, his iced coffee and the beach sunset behind him, the colors, the card border, the corner letters and suit symbols, and the linework and crosshatching. Change only his skin tone to a deep, dark brown, natural and consistent on his face, ears, neck, hands and arms. Keep his hair, mustache and beard white and curled exactly as they are, and keep his face, expression and crown the same. Don't change anything else.
```

### King of Diamonds

**7. Brown**: attach `King of Diamonds Dirty Diamond.png`, save as `king-diamonds-brown.png`
```
Recreate the attached King of Diamonds playing card exactly. Keep everything identical: the composition, his pose, his diamond-print shirt, gold chain, skateboard and the course behind him, the colors, the card border, the corner letters and suit symbols, and the linework and crosshatching. Change only his skin tone to a warm medium brown, natural and consistent on his face, ears, neck, hands and arms. Keep his hair, mustache and beard white and curled exactly as they are, and keep his face, expression and crown the same. Don't change anything else.
```

**8. Black**: attach `King of Diamonds Dirty Diamond.png`, save as `king-diamonds-black.png`
```
Recreate the attached King of Diamonds playing card exactly. Keep everything identical: the composition, his pose, his diamond-print shirt, gold chain, skateboard and the course behind him, the colors, the card border, the corner letters and suit symbols, and the linework and crosshatching. Change only his skin tone to a deep, dark brown, natural and consistent on his face, ears, neck, hands and arms. Keep his hair, mustache and beard white and curled exactly as they are, and keep his face, expression and crown the same. Don't change anything else.
```

**If one comes out wrong:** reply with what to fix, for example "keep everything, but put back the palm trees", instead of starting over. If ChatGPT changes the background or pose, say "only the skin should change; match the attached card exactly".

When all 8 are in the KOG Images folder, tell me and I'll add them (`python tools/add_tone_art.py`).

## Step 2 (later): the badges and banners

Same idea, a batch at a time. Attach the badge or banner and use the same prompt, with "the attached King of … playing card" changed to "the attached image" and "his skin tone" changed to "every King's skin tone". Save them with the tone at the end of the usual name, for example `badge-north-brown.png`, `banner-north-black.png`.
