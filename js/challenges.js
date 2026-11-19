// KOG Challenges. Each one awards a BADGE and a BANNER together; players can mix and match
// them on their nameplate. Almost everything comes from ranked play, where results are
// confirmed by both sides, so they can't be faked. Only a few come from Compass Putt and Lag 21.
//
// `badge` and `banner` describe the final art (ready to hand to an image generator).
// Until that art exists, each challenge shows placeholder art from the four suit Kings.

export const RARITY = {
  common: { label: 'Common', color: '#cfd6dd' },
  rare: { label: 'Rare', color: '#4dabf7' },
  'very-rare': { label: 'Very Rare', color: '#b197fc' },
  impossible: { label: 'Impossible', color: '#ff4d4d' },
};

// Placeholder art: [banner, badge, suit] from the new King images.
const SUIT_ART = {
  spades: { bn: ['card-spades', 'gfx-spades'], bd: ['emblem-spades', 'logo-spades'] },
  hearts: { bn: ['card-hearts', 'gfx-hearts'], bd: ['emblem-hearts', 'logo-hearts'] },
  diamonds: { bn: ['card-diamonds', 'gfx-diamonds'], bd: ['emblem-diamonds', 'logo-diamonds'] },
  clubs: { bn: ['card-clubs', 'gfx-clubs'], bd: ['emblem-clubs', 'logo-clubs'] },
};

const c = (id, section, mode, rarity, suit, name, how, badge, banner) => ({ id, section, mode, rarity, suit, name, how, badge, banner });

export const CHALLENGES = [
  // ---------- Compass Putt (one of the few outside ranked) ----------
  c('north', 'Compass Putt', 'Compass Putt', 'common', 'spades', 'The North Remembers',
    'Make a Long putt (in on the first putt) from the North tee in Compass Putt.',
    'The King of Spades as the King in the North: fur cloak, iron crown, frost in his beard, holding his putter like a longsword.',
    'A frozen castle wall above a snowy practice green under a grey sky, the suited Kings standing watch in fur cloaks.'),
  c('west', 'Compass Putt', 'Compass Putt', 'common', 'clubs', 'West Coast, Best Coast',
    'Make a Long putt from the West tee in Compass Putt.',
    'The King of Clubs with a bandana and round sunglasses, palm trees behind him, 90s West Coast style.',
    'Sunset over a California beach course with palm trees and lowriders in the lot, the suited Kings leaning on their putters.'),
  c('east', 'Compass Putt', 'Compass Putt', 'common', 'diamonds', 'East Coast, Beast Coast',
    'Make a Long putt from the East tee in Compass Putt.',
    'The King of Diamonds in a puffer jacket and tan work boots, the Empire State Building behind him.',
    'A New York rooftop putting green with a subway sign and the skyline at night, the suited Kings in streetwear.'),
  c('south', 'Compass Putt', 'Compass Putt', 'common', 'hearts', 'The Deep South',
    'Make a Long putt from the South tee in Compass Putt.',
    'The King of Hearts rising out of flames, smoke curling around his crown like horns.',
    'The suited Kings rising from a fiery, smoky underworld onto a scorched practice green.'),
  c('compass-rose', 'Compass Putt', 'Compass Putt', 'rare', 'spades', 'Never Lost',
    'Earn all four Compass Putt challenges: North, East, South and West.',
    'A golden compass rose with a crown at North and the four suits at the four points.',
    'An old treasure map of a golf course with a dotted putt line and a suited King at each compass point.'),

  // ---------- Lag 21 ----------
  c('blackjack', 'Lag 21', 'Lag 21', 'common', 'clubs', 'Blackjack',
    'Win a game of Lag 21 against at least one other player.',
    'A blackjack hand: the King of Spades and an Ace, with a golf ball for a chip.',
    'A green-felt casino table turned into a putting green, chips stacked by the cup and a neon "21" above.'),

  // ---------- Eagles ----------
  c('big-wings', 'Eagles', 'Ranked', 'rare', 'spades', 'The Bird with Big Wings',
    'Make an eagle putt (sink an eagle ball on the first putt) in a ranked match.',
    'A bald eagle in a tiny crown, wings spread, clutching a golf ball.',
    'The suited Kings standing in a golden wheat field while a huge eagle soars overhead.'),
  c('albatross', 'Eagles', 'Ranked', 'very-rare', 'clubs', 'Albatross',
    'Make 2 eagle putts in the same ranked match. (Two eagles make an albatross, golf’s rarest bird.)',
    'An albatross gliding with two golf balls in its feet.',
    'Ocean cliffs at sunset with two great seabirds over a seaside green, the Kings watching from the clifftop.'),
  c('king-of-skies', 'Eagles', 'Ranked', 'impossible', 'diamonds', 'King of the Skies',
    'Sink all three eagle balls on the first putt in one ranked match.',
    'A golden eagle wearing the King’s crown, three golf balls set like jewels beneath it.',
    'Above the clouds: the four Kings on a green floating in the sky, eagles circling a sunburst.'),

  // ---------- Perfect rounds ----------
  c('flawless-shawty', 'Perfect Rounds', 'Ranked', 'very-rare', 'hearts', 'Flawless Shawty',
    'One-putt all 9 balls in the Short-putt round (Round 2) of a ranked match.',
    'A diamond-studded putter head with a sparkle and "FLAWLESS" engraved on it.',
    'A spotless, perfectly striped green under spotlights, nine balls in the cup and the Kings applauding.'),
  c('dead-center', 'Perfect Rounds', 'Ranked', 'impossible', 'spades', 'Dead Center',
    'One-putt all 9 balls in the Medium-putt round (Round 4) of a ranked match.',
    'A bullseye with a golf ball dead center and a crown on top.',
    'A green with target rings mowed into it, the suited Kings standing with arms crossed.'),
  c('long-live', 'Perfect Rounds', 'Ranked', 'impossible', 'diamonds', 'Long Live the King',
    'One-putt all 9 balls in the Long-putt round (Round 6) of a ranked match.',
    'A golden crown floating above a putter, glowing like a holy relic.',
    'A royal procession on a cathedral-lit green, crowds cheering as the King walks to the cup.'),
  c('royal-flush', 'Perfect Rounds', 'Ranked', 'impossible', 'hearts', 'Royal Flush',
    'One-putt every ball in a regular round: all three sets, Short, Medium and Long.',
    'Five cards fanned out, 10 to Ace of spades, with a golf ball for the Ace.',
    'A high-roller table in green felt with a royal flush laid out and the four Kings in tuxedos.'),
  c('triple-threat', 'Perfect Rounds', 'Ranked', 'very-rare', 'clubs', 'Triple Threat',
    'One-putt all 3 balls of a Long set (both birdie balls and the par ball, from 10–15 ft).',
    'Three golf balls in a row split by a lightning bolt.',
    'Three long putt lines curving across a green into one cup, each leaving a glowing trail.'),

  // ---------- Scoring ----------
  c('even-steven', 'Scoring', 'Ranked', 'common', 'spades', 'Even Steven',
    'Finish a ranked match at E or better.',
    'A balanced golden scale with a golf ball on each side.',
    'A calm, perfectly level green at sunrise, the King of Spades tipping his crown.'),
  c('under-radar', 'Scoring', 'Ranked', 'common', 'clubs', 'Under the Radar',
    'Finish a ranked match at −2 or better.',
    'A radar screen with a golf-ball blip and a little crown.',
    'A night-vision green with a sweeping radar beam, the Kings in dark sunglasses.'),
  c('seeing-red', 'Scoring', 'Ranked', 'rare', 'hearts', 'Seeing Red',
    'Finish a ranked match at −4 or better.',
    'A scorecard full of red under-par numbers with a red crown on top.',
    'A leaderboard wall glowing with red numbers, the King of Hearts pointing at the top line.'),
  c('lights-out', 'Scoring', 'Ranked', 'very-rare', 'diamonds', 'Lights Out',
    'Finish a ranked match at −8 or better.',
    'A light switch flipped off, with a crown glowing in the dark.',
    'A stadium green at night as the floodlights cut out one by one, the Kings walking off.'),
  c('untouchable', 'Scoring', 'Ranked', 'impossible', 'spades', 'Untouchable',
    'Finish a ranked match at −12 or better.',
    'A crown inside a shatterproof glass case.',
    'A marble throne room with velvet ropes around the green and the King seated on his throne.'),

  // ---------- Beatdowns ----------
  c('might-be-him', 'Beatdowns', 'Ranked', 'common', 'diamonds', '“I Might Be Him”',
    'Win a ranked match by 3 or more strokes.',
    'A hand mirror reflecting a crown.',
    'The King of Diamonds checking himself out in a locker-room mirror, crown tilted just right.'),
  c('himothy', 'Beatdowns', 'Ranked', 'rare', 'diamonds', 'Himothy',
    'Win a ranked match by 5 or more strokes.',
    'A crown with "HIM" engraved on the band.',
    'A red carpet leading to the green, camera flashes everywhere, the King strutting.'),
  c('him', 'Beatdowns', 'Ranked', 'very-rare', 'diamonds', 'Him.',
    'Win a ranked match by 7 or more strokes.',
    'A single bold gold period under a crown. Him.',
    'All black except a gold spotlight on the King alone, crowd silhouettes bowing.'),

  // ---------- Upsets ----------
  c('underdog', 'Upsets', 'Ranked', 'very-rare', 'clubs', 'Underdog',
    'Beat a ranked opponent rated 500–999 Elo higher than you.',
    'A scrappy bulldog in a crown standing on a golf ball.',
    'A small dog squaring up to four giant Kings on a green at sunset.'),
  c('giant-slayer', 'Upsets', 'Ranked', 'impossible', 'spades', 'Giant Slayer',
    'Beat a ranked opponent rated 1,000+ Elo higher than you.',
    'A slingshot loaded with a golf ball.',
    'A toppled giant King statue lying on a green, the challenger standing on top of it.'),

  // ---------- Long range ----------
  c('downtown', 'Long Range', 'Ranked', 'common', 'diamonds', 'From Way Downtown',
    'Make 2 Long putts (in on the first putt from the Long marker) in the same ranked match.',
    'A basketball net hanging over a golf cup, with a long arc drawn to it.',
    'A downtown skyline at dusk with a long putt arcing across the rooftops into a cup.'),
  c('sharpshooter', 'Long Range', 'Ranked', 'rare', 'spades', 'Sharpshooter',
    'Make 3 Long putts in the same ranked match.',
    'A rifle-scope crosshair centered on a golf ball.',
    'A misty green seen through a scope, the King lying flat behind his putter.'),
  c('sniper', 'Long Range', 'Ranked', 'very-rare', 'clubs', 'Deadly Sniper',
    'Make 5 or more Long putts in the same ranked match.',
    'A crowned skull over two crossed putters.',
    'A camouflaged King on a ridge above a long green, a red laser line running to the cup.'),

  // ---------- Clutch ----------
  c('not-so-fast', 'Clutch', 'Ranked', 'rare', 'hearts', 'Not So Fast',
    'Win a ranked match by taking the lead in the Eagle round (the last round).',
    'A hand snatching a crown before it lands on someone else’s head.',
    'A photo finish on the green: one King lunging past the others at the line.'),
  c('wire-to-wire', 'Clutch', 'Ranked', 'rare', 'spades', 'Wire to Wire',
    'Be the KOG (the leader) after every round of a ranked match, and win.',
    'A crown balanced on a tightrope wire.',
    'A finish ribbon stretched across the green, the King breaking the tape.'),
  c('regicide', 'Clutch', 'Ranked', 'rare', 'hearts', 'Regicide',
    'Win a ranked match after taking the crown from a KOG who had held it for 3 or more rounds in a row.',
    'A toppled crown with a putter laid across it.',
    'A throne room with an empty throne and the old crown on the floor as the new King walks in.'),
  c('comeback', 'Clutch', 'Ranked', 'very-rare', 'hearts', 'Comeback King',
    'Win a ranked match after being 5 or more strokes behind at the end of any round.',
    'A phoenix rising with a crown on its head.',
    'Storm clouds breaking into sunlight over the green as the King rises from the bunker.'),
  c('ice-cold', 'Clutch', 'Ranked', 'rare', 'clubs', 'Ice Cold',
    'Win a ranked match in a sudden-death putt-off.',
    'A golf ball frozen inside an ice cube with a crown on top.',
    'A frozen green with icicles hanging from the flag, the King blowing on his hands.'),
  c('smooth', 'Clutch', 'Ranked', 'very-rare', 'diamonds', 'Smooth Operator',
    'Finish a ranked match without a single 3-putt.',
    'A silk ribbon curling around a putter shaft.',
    'A lounge with velvet curtains and warm jazz-club lights, the King putting in a smoking jacket.'),

  // ---------- Duos and groups ----------
  c('two-better', 'Duos & Groups', 'Ranked', 'common', 'hearts', 'Two Is Better',
    'Win a ranked duos match.',
    'Two crowns linked by a golf club.',
    'The Red Kings and Black Kings shaking hands across the green.'),
  c('dynamic-duo', 'Duos & Groups', 'Ranked', 'rare', 'clubs', 'Dynamic Duo',
    'Win 5 ranked duos matches with the same partner.',
    'A superhero-style emblem with two crowns and two capes.',
    'A comic-book city skyline with two Kings striking a hero pose on a rooftop green.'),
  c('full-house', 'Duos & Groups', 'Ranked', 'common', 'diamonds', 'Full House',
    'Win a 3-player (1v1v1) ranked match.',
    'A fanned poker hand: three Kings and a pair of golf balls.',
    'A poker table set up on the green, the King raking in a pile of chips.'),

  // ---------- The climb ----------
  c('fresh-blood', 'The Climb', 'Ranked', 'common', 'spades', 'Fresh Blood',
    'Finish your 10 placement matches and get your first rank.',
    'A blank shield getting its very first rank stamp.',
    'A rookie locker with the King’s first jersey hanging in it.'),
  c('silver-lining', 'The Climb', 'Ranked', 'common', 'clubs', 'Silver Lining',
    'Reach Silver.',
    'The Silver rank crest with a cloud wrapped around it.',
    'Storm clouds with a bright silver edge over the green.'),
  c('heart-of-gold', 'The Climb', 'Ranked', 'rare', 'hearts', 'Heart of Gold',
    'Reach Gold.',
    'A golden heart wearing a crown.',
    'A gold-leaf sunset over a gilded green.'),
  c('platinum', 'The Climb', 'Ranked', 'very-rare', 'spades', 'Platinum Plated',
    'Reach Platinum.',
    'A platinum record with a golf ball for its label.',
    'Platinum records lining a studio wall, the King wearing headphones.'),
  c('diamond-hands', 'The Climb', 'Ranked', 'very-rare', 'diamonds', 'Diamond Hands',
    'Reach Diamond.',
    'Two hands holding a glowing diamond.',
    'A glittering diamond mine, the Kings carrying lanterns.'),
  c('putt-master', 'The Climb', 'Ranked', 'impossible', 'hearts', 'Putt Master',
    'Reach Putt Master, the very top rank.',
    'The magenta Putt Master crest shooting out rays of light.',
    'A green floating among the stars, the King seated on a throne made of putters.'),

  // ---------- Streaks ----------
  c('hat-trick', 'Streaks', 'Ranked', 'common', 'clubs', 'Hat Trick',
    'Win 3 ranked matches in a row.',
    'Three crowns stacked on top of each other.',
    'A hat rack holding three crowns, the King tossing a fourth onto it.'),
  c('heater', 'Streaks', 'Ranked', 'rare', 'hearts', 'Heater',
    'Win 5 ranked matches in a row.',
    'A golf ball on fire.',
    'A green with flames licking its edges, the King blowing smoke off his putter.'),
  c('dynasty', 'Streaks', 'Ranked', 'very-rare', 'spades', 'Dynasty',
    'Win 10 ranked matches in a row.',
    'A royal crest with ten stars around it.',
    'A long hall of portraits of the same King, ten in a row.'),

  // ---------- Career ----------
  c('four-of-a-kind', 'Career', 'Ranked', 'rare', 'diamonds', 'Four of a Kind',
    'Win ranked matches at 4 different golf courses.',
    'Four golf flags fanned out like four aces.',
    'A road map with four pins on it and the King’s convertible parked beside the green.'),
  c('iron-man', 'Career', 'Ranked', 'rare', 'spades', 'Iron Man',
    'Play 100 ranked matches.',
    'An armored gauntlet gripping a putter.',
    'A blacksmith’s forge full of sparks, the King hammering out a putter.'),
  c('dawn-patrol', 'Career', 'Ranked', 'common', 'clubs', 'Dawn Patrol',
    'Finish a ranked match before 8 AM.',
    'A rooster wearing a crown.',
    'A misty sunrise over a dewy green, the Kings holding coffee.'),
  c('crown-jewel', 'Career', 'Ranked', 'impossible', 'diamonds', 'Crown Jewel',
    'Earn the magenta win % crown by winning 65% or more of your ranked matches.',
    'The magenta win % crown resting on a velvet pillow.',
    'A royal vault full of jewels, the magenta crown under a single spotlight.'),
];

export const SECTIONS = [...new Set(CHALLENGES.map((x) => x.section))];

/** Placeholder art for a challenge until its own badge and banner are made. */
export function artFor(ch) {
  const k = CHALLENGES.indexOf(ch);
  const a = SUIT_ART[ch.suit];
  return { banner: `assets/challenges/bn-${a.bn[k % 2]}.webp`, badge: `assets/challenges/bd-${a.bd[Math.floor(k / 2) % 2]}.webp` };
}
