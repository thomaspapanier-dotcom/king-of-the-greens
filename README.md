# King of the Greens (KOG)

A scorekeeping app for KOG, the putting game for 1–4 players.

This is the **prototype**: one phone keeps score for the group, it works offline on the course, and it installs to the iPhone home screen. It's a plain web app with no build step and no dependencies.

## Run it locally

```bash
python -m http.server 5173
```

Then open http://localhost:5173. Rules tests are at http://localhost:5173/tests/.

## Files

| Path | What it is |
| --- | --- |
| `js/rules.js` | Rules engine: scoring, King, putting order, special rounds, Eagle round, putt-off, stats. Pure functions, no UI. |
| `js/app.js` | Screens and taps |
| `js/store.js` | Saves players and games on the device (localStorage) |
| `css/styles.css` | Styles (dark mode only) |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline support and home-screen install |
| `tests/` | Rules tests that run in the browser |

## Rules as built

- **Distances:** Short 3–5 ft, Medium 6–9 ft, Long 10–15 ft.
- **Ball scoring:**
  - Birdie ball: 1 putt −1, 2 putts E, 3 putts +1, and so on.
  - Par ball: 1 putt E, 2 putts +1, and so on.
  - Eagle ball: 1 putt −2, 2 putts −1, 3 putts E, and so on.
  - No maximum and no pick-ups.
- **Game length:** 4 rounds, 30 balls: all Short, all Medium, all Long, then the Eagle round. **K.O.G. Remix** (coming soon, under Alternate games) plays Short, Medium and Long in each of Rounds 1–3, then the Eagle round, with the same balls so scores compare. Games saved earlier keep their 7- or 9-round layout.
- **Opening tee flip:** someone flips a tee; whoever it points at is the KOG for Round 1, and the other player (or duo) putts first. Three players flip again for who putts first.
- **KOG:** the outright low round score becomes the current King of the Greens (KOG) and sets the markers. On any tie, the current KOG sets again.
- **Putting order:** from Round 2 on, including the Eagle round, the leader (lowest running total) goes first. Ties keep the previous order.
- **Winning:** lowest total after the Eagle round wins. A tie for the lead goes to a tie-breaker: a ball is tossed onto the green, the tied players putt from there to the furthest hole, and the closest wins; toss again until someone does.
- **Players:** a regular game is 1–3 players. A foursome plays **co-op (2 vs 2)**: each team plays as one unit (one score, one turn). Teammates split each set's 3 balls: birdie ball 1 is always teammate A, birdie ball 2 teammate B, and the par ball alternates every set across the game. The Eagle round has 4 balls per team, two each. Toss: the closest player's team is KOG, and the furthest player's team putts first. Stats credit each ball to the person who putted it.

## Quick Play: Compass

Four tees around one hole (north, east, south, west) at Short, Medium or Long distance, or any mix. Three balls from each tee, and every ball is a birdie ball. Solo, or head-to-head for 2–4 players: a toss decides who putts first at the first tee, the order rotates every tee, lowest total wins, and a tie goes to the toss tie-breaker. The putts count toward each player's stats. The code is in `js/quick.js`.

## Lag 21 (working name)

Cornhole-style lag putting, 1 v 1 or 2 v 2, from a spot 25–35 ft from a hole. Each side putts 4 balls per frame, alternating ball by ball (teammates alternate within a side). Holed = 3, within a putter grip = 2, within a putter length = 1. Only the difference scores each frame, knocking the other side's ball away is allowed, the scorer putts first next frame, and first to 21 wins. The name lives in `GAME_NAME` in `js/lag.js`.

## Ranked (preview)

The rating engine (`js/ranked.js`), rank badges (`js/badges.js`) and a **Ranked · preview** screen are built. Real ranked play needs accounts and the server. See [docs/RANKED-PLAN.md](docs/RANKED-PLAN.md) for verification, integrity, looking-for-games, location and the build order.

## Live games

Everyone scores on their own phone. One phone starts a **live game** and gets a 6-character code. The others tap **Join a game**, enter the code, and pick which player they are.

- **How changes travel:** every tap is saved as a small change. If two phones save at the same moment, the second one re-applies its change on top of the first, so nothing is lost. Phones check for updates every 2.5 seconds.
- **No signal:** taps are kept on the phone, the badge shows **Offline**, and they send automatically when signal returns.
- **Files:** `js/ops.js` holds the changes, `js/sync.js` talks to the server, and `supabase/setup.sql` sets up the database.
- **Security:** the database table is locked. The app can only use three functions, and each needs a game's code.

### Setup

1. Create a free project at supabase.com.
2. Open **SQL Editor**, paste `supabase/setup.sql` and press **Run**.
3. Put the project URL and publishable (anon) key in `js/config.js`. Leave both empty to turn live games off.

### Local testing without Supabase

```bash
python tools/fake_backend.py
```

Then, in the browser console on localhost:

```js
localStorage.setItem('kog.devSync', 'http://127.0.0.1:54321')
```

To act as two phones, use http://localhost:5173 and http://127.0.0.1:5173. They keep separate storage.

## Roadmap

1. ~~Get it on the iPhone~~: done, as a claude.ai preview link (single phone).
2. **Live sync:** built. It still needs the Supabase project and its own website, since the claude.ai link can't reach outside servers.
3. **Friends:** add friends from contacts and see their stats. This needs sign-in accounts, and contacts access needs the native app (step 4).
4. **App Store / Google Play:** wrap the app with Capacitor. Publishing to the App Store needs an Apple Developer account ($99/yr).

The rules engine (`js/rules.js`) is UI-free and works on plain data, so it carries into each step unchanged.
