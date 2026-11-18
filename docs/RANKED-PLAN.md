# Ranked KOG: plan

## Built now (works offline, no accounts needed)

- **Rating engine** in `js/ranked.js`, with tests:
  - Elo-style MMR, like the hidden ratings behind Rocket League and Rainbow Six Siege.
  - 31 ranks: Copper V up to Diamond I, then **Putt Master** (2060+) at the top, 40 MMR apart. New players start at 1450 (Silver I), the middle of the ladder.
  - 10 placement matches with double-size swings before a rank appears.
  - Beating a higher rank earns more, and losing to a lower rank costs more. The swing scales with the gap.
  - A 15 MMR demotion buffer, so ranks don't flip back and forth at a division edge (Rocket League's "overlapping" ranges).
  - Free-for-all scoring for 3-player KOG.
  - **Ranked duos (2 v 2):** all four players must be verified, and any ranks can team up. Each player is rated on their own MMR against the other team's average, so the higher-ranked teammate loses more on a loss and gains less on a win.
  - Anti-boosting: a repeat opponent counts half the same day, then a quarter.
  - Bail penalty (−30 MMR).
  - Season reset: ratings pull halfway back to the middle, then 3 placement matches.
- **Rank badges** in `js/badges.js`:
  - A polished-metal golf crest per tier: Copper plain, Bronze rimmed, Silver with crossed putters, Gold with laurels, Platinum with a crown, Diamond with a gem and glow. Putt Master is deep magenta with rays and one big ball.
  - The number of golf balls shows the division: V = 5 balls, I = 1.
- **Ranked · preview** screen: the full ladder plus a "try a match" calculator.

## Needs the backend (Supabase) and sign-in

Ranked results can't live on one phone, because anyone could edit them. Every ranked match is played as a live game: both players score on their own phones, and the server records the result.

### Accounts and gamertags

- Sign in with Apple, Google or a phone number.
- **Gamertag:** unique and case-insensitive ("Tommy" and "tommy" are the same tag), enforced by the database.
- Renaming later can be a paid in-app purchase. That needs the App Store app.

### Verification (the check mark)

- **Level 1, required for ranked: phone-verified.** One phone number per account makes throwaway alt accounts expensive. Costs a few cents per text message.
- **Level 2, the check mark: identity-verified.** An optional ID and selfie check through a service such as Stripe Identity, which charges per check. The check mark appears next to the gamertag.

### Integrity: why a result can be trusted

1. **Both players confirm.** Each player enters their own balls. The opponent confirms each round, and the result counts only when both sides have signed off.
2. **Disputes:** a disputed match is voided (no rank change) and flagged. Players with repeated upheld disputes lose access to ranked.
3. **Check-in:** both phones must be within about 200 m of the course when the match starts (location permission).
4. **Anti-boosting:** repeat-opponent limits are already in the engine. The server can later flag suspicious patterns, such as the same two players trading wins.
5. **Solo games never change rank.** Only matches between two verified players count.

### Looking for games (LFG)

- **A post holds:** course, date and time window, game (KOG, co-op, head-to-head Compass, Lag 21) and the ranks you'll accept.
- **Feed:** posts sorted by distance, closest first, up to 50 miles.
- **Filters:**
  - **Distance:** a slider, 1–50 miles.
  - **Rank range:** for example "Gold V to Platinum I". A strong player can skip low ranks, and a new player can avoid a Gold I.
- **Booking:** tap a post and propose a time. When both sides accept, the match is **locked**.
- **Bailing:** bailing within 1 hour of a locked match costs 30 MMR. Not checking in within 15 minutes of the start counts as a no-show, with the same penalty. The other player loses nothing.

### Location

- **While the app is open:** the web app can ask "Allow KOG to use your location" (Safari supports this). That covers the LFG distance sort and check-in at match start.
- **Native app needed:** arrival detection in the background and push notifications ("your match starts in 1 hour").
- **Limits:** location can be faked on a modified phone, so check-in is a deterrent. Mutual confirmation is the real safeguard.

### Course difficulty (later)

- There's no free public feed of practice-green difficulty.
- **Recommended:** start by crowd-sourcing it. After a match, each player rates the green from 1 to 5. Once a course has enough ratings, it can slightly scale the swing.
- Keep it out of MMR until the data is solid.

### Inactivity (recommended)

Diamond players who don't play a ranked match for 4 weeks start losing a little MMR. This keeps the top of the ladder active.

## Order to build

1. Supabase project, sign-in, unique gamertags, profiles with photos. Live sync is already built.
2. Ranked matches over live sync with mutual confirmation, plus the server-side rating update using `js/ranked.js`.
3. Location check-in and the LFG feed with filters, booking, locking and penalties.
4. Native app (Capacitor) for push notifications, background location, contacts and the App Store. This needs the Apple Developer Program ($99/yr).
5. Identity verification for the check mark, paid renames, green-difficulty ratings.
