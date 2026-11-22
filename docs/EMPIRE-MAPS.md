# Empire maps: painted, 3D-ish, with a castle in every Realm

The American Empire has a painted Realm map (`kog-realm-map-kingdoms-v1.png`): a vintage illustrated map in a gold frame, each Realm in its own bold color, and one 3D miniature landmark standing in each Realm. Every other Empire gets the same treatment, with a **castle** in each Realm, themed on a real castle from that region.

**How a painting is made:** the reference map for the Empire (`KOG Images/Map references/map-reference-XX.png`, drawn by `tools/make_map_refs.py`) gives the exact country shape, Realm borders and Realm colors. The American painting gives the style. `tools/make_map_art.py` sends both, plus the Empire's prompt below, to the image API. Once a painting exists, it gets lined up with the Kingdom outlines so tapping Realms and Kingdoms works, the same way as the American map.

Each Realm's color on the reference must stay that color in the painting (green #2fae7a, pink #e0528a, gold #e6b12e, orange #ec7a32, purple #8b7cf6, blue #3a9be0): that's how the app tells the Realms apart.

## The shared instructions (sent with every Empire)

```
Image 1 is the reference map for this Empire: follow its outline, its Realm borders and its Kingdom lines exactly, and keep EXACTLY the Realm colors shown on it (green #2fae7a, pink #e0528a, gold #e6b12e, orange #ec7a32, purple #8b7cf6, blue #3a9be0). Image 2 is our finished American map: paint in exactly its style. A vintage illustrated map with an ornate gold frame, a deep teal sea with soft clouds, each Realm raised slightly like a relief map in its own bold color with a light painted texture, thin dark lines between the Kingdoms, and ONE detailed 3D miniature castle standing in the middle of each Realm, with a little putting green and a flag beside it. Keep each castle inside its own Realm and don't paint over the borders more than you need to. Landscape. No text, no labels, no letters, no logos.
```

## One prompt per Empire

**Empire of the Isles (Great Britain)** `GB`
```
EMPIRE OF THE ISLES (Great Britain). Six Realms, each with its castle:
- GREEN, Realm of the Thistle (Scotland): Edinburgh Castle high on its volcanic crag, purple thistles and heather, a seaside links green.
- PINK, Realm of the Red Dragon (Wales): Caernarfon Castle with its banded many-sided towers, a red dragon banner, green valleys.
- GOLD, Realm of the Roses (Northern England): Bamburgh Castle on its rock above the North Sea dunes, red and white roses.
- ORANGE, Realm of the Forge (the Midlands): Warwick Castle above a river, glowing forge chimneys and a canal with narrowboats.
- PURPLE, Realm of the Heath (London, the South East and East): the Tower of London's white keep with its four corner turrets, heather and pines.
- BLUE, Realm of the Cliffs (South West England): St Michael's Mount, the castle on a tidal island off a rocky cove.
```

**Irish Empire** `IE`
```
IRISH EMPIRE (the whole island of Ireland). Four Realms, each with its castle:
- GREEN, Realm of the Emerald Throne (Leinster): Kilkenny Castle with its round corner towers over a river and a parkland green.
- PINK, Realm of the Wild Atlantic (Munster): the Rock of Cashel, a stone castle-cathedral on a green hill, Atlantic waves on the coast.
- GOLD, Realm of the Stone Walls (Connacht): Ashford Castle on the shore of a lake, criss-crossing stone walls.
- ORANGE, Realm of the Causeway (Ulster): the clifftop ruins of Dunluce Castle above hexagonal basalt columns stepping into the sea.
```

**Canadian Empire** `CA`
```
CANADIAN EMPIRE. Four Realms, each with its castle:
- GREEN, Realm of the Lighthouse Coast (Atlantic Canada): the star-shaped Halifax Citadel fort with a red-and-white lighthouse on the rocks.
- PINK, Realm of the Maple Throne (Quebec and Ontario): Château Frontenac with its green copper roofs above a river, red maple trees.
- GOLD, Realm of the Golden Prairie (the Prairies): Lower Fort Garry's stone walls and bastions among golden wheat and tall grain elevators.
- ORANGE, Realm of the Northern Lights (British Columbia and the North): Hatley Castle among evergreens and snowy peaks under green northern lights.
```

**Australian Empire** `AU`
```
AUSTRALIAN EMPIRE. Three Realms, each with its castle:
- GREEN, Realm of the Coral Coast (Queensland, New South Wales and the ACT): the Spanish-style castle of Paronella Park in the rainforest by a waterfall, a turquoise reef offshore.
- PINK, Realm of the Southern Cross (Victoria, South Australia and Tasmania): a honey-colored sandstone castle among vineyards, the Southern Cross on its banner.
- GOLD, Realm of the Red Centre (Western Australia and the Northern Territory): a castle carved into a giant red rock rising from the desert, kangaroos nearby.
```

**Cherry Blossom Empire (Japan)** `JP`
```
CHERRY BLOSSOM EMPIRE (Japan). Six Realms, each with its castle:
- GREEN, Realm of the Northern Snow (Hokkaido and Tohoku): Hirosaki Castle in snow with cherry blossoms, red-crowned cranes.
- PINK, Realm of the Eastern Capital (Kanto): Edo Castle's stone walls and gate with a city skyline behind, cherry blossoms.
- GOLD, Realm of the Sacred Mountain (Chubu): the black Matsumoto Castle over its moat, Mount Fuji behind.
- ORANGE, Realm of the Ancient Capital (Kansai): the white Himeji Castle, autumn maples.
- PURPLE, Realm of the Inland Sea (Chugoku and Shikoku): Matsuyama Castle on its hill above small islands and a red gate standing in the sea.
- BLUE, Realm of the Southern Isles (Kyushu and Okinawa): the red Shuri Castle on turquoise water, a smoking volcano behind.
```

**Black Eagle Empire (Germany)** `DE`
```
BLACK EAGLE EMPIRE (Germany). Four Realms, each with its castle:
- GREEN, Realm of the Northern Seas (Northern Germany): Schwerin Castle with its golden domes on an island in a lake, sailboats and North Sea dunes.
- PINK, Realm of the Rhine (Western Germany): Burg Eltz, the tall half-timbered castle in a wooded valley, vineyards on the Rhine.
- GOLD, Realm of the Linden Crown (Eastern Germany): the Wartburg on its forested hilltop, linden trees.
- ORANGE, Realm of the Alpine Castles (Southern Germany): Neuschwanstein's white towers before the snowy Alps.
```

**Three Crowns Empire (Sweden)** `SE`
```
THREE CROWNS EMPIRE (Sweden). Three Realms, each with its castle:
- GREEN, Realm of the Midnight Sun (Norrland): a sparkling ice castle in the snow under the midnight sun, reindeer and pine forest.
- PINK, Realm of the Royal Lakes (Svealand): Gripsholm Castle's round red-brick towers on a lake shore.
- GOLD, Realm of the Rune Stones (Götaland): Kalmar Castle on the water with its round towers, rune stones in a green field.
```

**Jade Dragon Empire (China)** `CN`
```
JADE DRAGON EMPIRE (China). Six Realms, each with its castle:
- GREEN, Realm of the Great Wall (North China): a Great Wall watchtower on a mountain ridge, red palace gates behind.
- PINK, Realm of the Ice Lanterns (Northeast China): a glowing castle made of carved ice blocks in the snow.
- GOLD, Realm of the Eastern Pearl (East China): the Zhonghua Gate fortress of Nanjing's city wall, a garden pagoda and canals.
- ORANGE, Realm of the Pearl River (Central and South China): the many-roofed Yellow Crane Tower among tall green karst hills and a river.
- PURPLE, Realm of the Misty Mountains (Southwest China): a mountain fortress with curved roofs among misty peaks, pandas in bamboo.
- BLUE, Realm of the Silk Road (Northwest China): the Jiayuguan Pass fortress in the desert, a camel caravan.
```

**Fleur-de-Lis Empire (France)** `FR`
```
FLEUR-DE-LIS EMPIRE (France). Five Realms, each with its castle:
- GREEN, Realm of the Seine (Paris and the North): Mont-Saint-Michel on its tidal island, a river winding inland.
- PINK, Realm of Champagne (the East): Haut-Kœnigsbourg on a forested hill above rows of vineyards.
- GOLD, Realm of the Loire Castles (the West): Château de Chambord with its forest of chimneys and turrets beside a river.
- ORANGE, Realm of the Pyrenees (the South West): the walled city of Carcassonne with its pointed towers, mountains behind.
- PURPLE, Realm of the Riviera (the South East and Corsica): the Palais des Papes in Avignon, lavender fields and the blue sea.
```

**Tulip Empire (Netherlands)** `NL`
```
TULIP EMPIRE (Netherlands). Four Realms, each with its castle:
- GREEN, Realm of the Wadden (the North): the moated Menkemaborg manor-castle, seals on the tidal mudflats.
- PINK, Realm of the Canals (Holland and Utrecht): the moated Muiderslot castle with its four round towers, canal houses.
- GOLD, Realm of the Veluwe (the East): Doorwerth Castle on the river, purple heath and deer.
- ORANGE, Realm of the Dikes (the South): Heeswijk Castle, windmills along a dike, tulip fields.
```

**Silver Fern Empire (New Zealand)** `NZ`
```
SILVER FERN EMPIRE (New Zealand). Three Realms, each with its castle:
- GREEN, Realm of the Kauri Coast (upper North Island): a wooden castle among giant kauri trees, a harbor and green islands.
- PINK, Realm of the Fire Mountains (lower North Island): a stone castle on the slopes of a snow-capped volcano, geothermal steam.
- GOLD, Realm of the Southern Alps (South Island): Larnach Castle on its hill, the snowy Southern Alps and a fiord behind.
```

**Golden Sun Empire (Spain)** `ES`
```
GOLDEN SUN EMPIRE (Spain). Four Realms, each with its castle:
- GREEN, Realm of the Green Coast (the North): the Royal Palace of Olite's towers among green hills, the Atlantic coast.
- PINK, Realm of the Castles (the Centre): the Alcázar of Segovia on its rocky point like a ship's prow, golden plains.
- GOLD, Realm of the Mediterranean (the East and the Balearics): Peñíscola Castle on its rock in the sea, orange groves.
- ORANGE, Realm of the Alhambra (Andalusia and the Canaries): the Alhambra's red walls before the snowy Sierra Nevada, a volcano island offshore.
```

**Morning Calm Empire (South Korea)** `KR`
```
MORNING CALM EMPIRE (South Korea). Four Realms, each with its castle:
- GREEN, Realm of the Han River (Seoul and the capital area): Hwaseong Fortress's walls and gate, the Han River and a city tower behind.
- PINK, Realm of the Diamond Mountains (Gangwon and Chungcheong): Gongsanseong mountain fortress walls winding over rocky peaks.
- GOLD, Realm of the Silla Crown (Gyeongsang): Bulguksa's palace-like halls and stone stairs, round royal tomb mounds.
- ORANGE, Realm of the Bamboo Groves (Jeolla and Jeju): the walled Naganeupseong fortress village in a bamboo grove, Jeju's volcano offshore.
```
