// Kingdoms, Realms and Empires. Every player belongs to a Kingdom (the state, province, county or
// prefecture they sign up in), Kingdoms are grouped into Realms, and the Realms of a country make up its Empire.
// Leaderboards and challenges compare them.
//
// Kingdom codes: U.S. states use their two letters (FL); everywhere else the code starts with the Empire
// (GB-surrey, IE-kerry, CA-ON, AU-NSW, JP-13). Outlines: js/usmap.js (U.S.) and js/empiremaps.js (the rest).

export const STATES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
  MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

// The six Realms of the American Empire. All 50 states are covered exactly once.
export const REALMS = [
  { id: 'ivy', name: 'Realm of the Ivy Crown', region: 'Northeast', suit: 'spades', states: ['CT', 'DE', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'] },
  { id: 'magnolia', name: 'Realm of the Magnolia Throne', region: 'Southeast', suit: 'hearts', states: ['AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'] },
  { id: 'plains', name: 'Realm of the Golden Plains', region: 'Midwest', suit: 'clubs', states: ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'] },
  { id: 'desert', name: 'Realm of the Desert Sun', region: 'Southwest', suit: 'diamonds', states: ['AZ', 'NM', 'OK', 'TX'] },
  { id: 'peaks', name: 'Realm of the High Peaks', region: 'Mountain West', suit: 'spades', states: ['CO', 'ID', 'MT', 'NV', 'UT', 'WY'] },
  { id: 'pacific', name: 'Realm of the Pacific Tide', region: 'West Coast', suit: 'clubs', states: ['AK', 'CA', 'HI', 'OR', 'WA'] },
];

// ---------- the other Empires ----------
const NAMES = {
  // Great Britain (counties; Northern Ireland plays in the Irish Empire, like golf does)
  'GB-highland': 'Highland', 'GB-moray': 'Moray', 'GB-aberdeenshire': 'Aberdeenshire', 'GB-angus': 'Angus', 'GB-perthshire': 'Perthshire',
  'GB-fife': 'Fife', 'GB-stirlingshire': 'Stirlingshire', 'GB-east-lothian': 'East Lothian', 'GB-lothians': 'Edinburgh & the Lothians',
  'GB-clyde': 'Glasgow & the Clyde', 'GB-ayrshire': 'Ayrshire', 'GB-dumfries': 'Dumfries & Galloway', 'GB-borders': 'Scottish Borders',
  'GB-argyll': 'Argyll & Bute', 'GB-isles': 'The Scottish Isles',
  'GB-gwynedd': 'Gwynedd', 'GB-clwyd': 'Clwyd', 'GB-powys': 'Powys', 'GB-dyfed': 'Dyfed', 'GB-glamorgan': 'Glamorgan', 'GB-gwent': 'Gwent',
  'GB-northumberland': 'Northumberland', 'GB-tyne-wear': 'Tyne & Wear', 'GB-durham': 'County Durham', 'GB-north-yorkshire': 'North Yorkshire',
  'GB-east-yorkshire': 'East Yorkshire', 'GB-south-yorkshire': 'South Yorkshire', 'GB-west-yorkshire': 'West Yorkshire', 'GB-cumbria': 'Cumbria',
  'GB-lancashire': 'Lancashire', 'GB-merseyside': 'Merseyside', 'GB-manchester': 'Greater Manchester', 'GB-cheshire': 'Cheshire',
  'GB-lincolnshire': 'Lincolnshire', 'GB-derbyshire': 'Derbyshire', 'GB-nottinghamshire': 'Nottinghamshire', 'GB-leicestershire': 'Leicestershire & Rutland',
  'GB-northamptonshire': 'Northamptonshire', 'GB-staffordshire': 'Staffordshire', 'GB-shropshire': 'Shropshire', 'GB-herefordshire': 'Herefordshire',
  'GB-worcestershire': 'Worcestershire', 'GB-warwickshire': 'Warwickshire', 'GB-west-midlands': 'West Midlands',
  'GB-london': 'London', 'GB-kent': 'Kent', 'GB-surrey': 'Surrey', 'GB-east-sussex': 'East Sussex', 'GB-west-sussex': 'West Sussex',
  'GB-hampshire': 'Hampshire', 'GB-isle-of-wight': 'Isle of Wight', 'GB-berkshire': 'Berkshire', 'GB-oxfordshire': 'Oxfordshire',
  'GB-buckinghamshire': 'Buckinghamshire', 'GB-bedfordshire': 'Bedfordshire', 'GB-hertfordshire': 'Hertfordshire', 'GB-essex': 'Essex',
  'GB-cambridgeshire': 'Cambridgeshire', 'GB-norfolk': 'Norfolk', 'GB-suffolk': 'Suffolk',
  'GB-cornwall': 'Cornwall', 'GB-devon': 'Devon', 'GB-somerset': 'Somerset', 'GB-dorset': 'Dorset', 'GB-wiltshire': 'Wiltshire',
  'GB-gloucestershire': 'Gloucestershire', 'GB-bristol': 'Bristol',
  // Ireland (the whole island: 32 counties)
  'IE-dublin': 'Dublin', 'IE-wicklow': 'Wicklow', 'IE-wexford': 'Wexford', 'IE-kilkenny': 'Kilkenny', 'IE-carlow': 'Carlow', 'IE-kildare': 'Kildare',
  'IE-meath': 'Meath', 'IE-louth': 'Louth', 'IE-westmeath': 'Westmeath', 'IE-longford': 'Longford', 'IE-offaly': 'Offaly', 'IE-laois': 'Laois',
  'IE-cork': 'Cork', 'IE-kerry': 'Kerry', 'IE-limerick': 'Limerick', 'IE-clare': 'Clare', 'IE-tipperary': 'Tipperary', 'IE-waterford': 'Waterford',
  'IE-galway': 'Galway', 'IE-mayo': 'Mayo', 'IE-sligo': 'Sligo', 'IE-leitrim': 'Leitrim', 'IE-roscommon': 'Roscommon',
  'IE-donegal': 'Donegal', 'IE-cavan': 'Cavan', 'IE-monaghan': 'Monaghan', 'IE-antrim': 'Antrim', 'IE-down': 'Down', 'IE-armagh': 'Armagh',
  'IE-londonderry': 'Londonderry', 'IE-tyrone': 'Tyrone', 'IE-fermanagh': 'Fermanagh',
  // Canada
  'CA-NL': 'Newfoundland and Labrador', 'CA-NS': 'Nova Scotia', 'CA-NB': 'New Brunswick', 'CA-PE': 'Prince Edward Island', 'CA-QC': 'Quebec',
  'CA-ON': 'Ontario', 'CA-MB': 'Manitoba', 'CA-SK': 'Saskatchewan', 'CA-AB': 'Alberta', 'CA-BC': 'British Columbia', 'CA-YT': 'Yukon',
  'CA-NT': 'Northwest Territories', 'CA-NU': 'Nunavut',
  // Australia
  'AU-QLD': 'Queensland', 'AU-NSW': 'New South Wales', 'AU-ACT': 'Australian Capital Territory', 'AU-VIC': 'Victoria', 'AU-SA': 'South Australia',
  'AU-TAS': 'Tasmania', 'AU-WA': 'Western Australia', 'AU-NT': 'Northern Territory',
  // Japan (prefectures)
  'JP-01': 'Hokkaido', 'JP-02': 'Aomori', 'JP-03': 'Iwate', 'JP-04': 'Miyagi', 'JP-05': 'Akita', 'JP-06': 'Yamagata', 'JP-07': 'Fukushima',
  'JP-08': 'Ibaraki', 'JP-09': 'Tochigi', 'JP-10': 'Gunma', 'JP-11': 'Saitama', 'JP-12': 'Chiba', 'JP-13': 'Tokyo', 'JP-14': 'Kanagawa',
  'JP-15': 'Niigata', 'JP-16': 'Toyama', 'JP-17': 'Ishikawa', 'JP-18': 'Fukui', 'JP-19': 'Yamanashi', 'JP-20': 'Nagano', 'JP-21': 'Gifu',
  'JP-22': 'Shizuoka', 'JP-23': 'Aichi', 'JP-24': 'Mie', 'JP-25': 'Shiga', 'JP-26': 'Kyoto', 'JP-27': 'Osaka', 'JP-28': 'Hyogo', 'JP-29': 'Nara',
  'JP-30': 'Wakayama', 'JP-31': 'Tottori', 'JP-32': 'Shimane', 'JP-33': 'Okayama', 'JP-34': 'Hiroshima', 'JP-35': 'Yamaguchi', 'JP-36': 'Tokushima',
  'JP-37': 'Kagawa', 'JP-38': 'Ehime', 'JP-39': 'Kochi', 'JP-40': 'Fukuoka', 'JP-41': 'Saga', 'JP-42': 'Nagasaki', 'JP-43': 'Kumamoto',
  'JP-44': 'Oita', 'JP-45': 'Miyazaki', 'JP-46': 'Kagoshima', 'JP-47': 'Okinawa',
};
const R = (id, name, region, suit, states) => ({ id, name, region, suit, states });
const jp = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => `JP-${String(a + i).padStart(2, '0')}`);
const gb = (s) => s.split(' ').map((k) => `GB-${k}`);
const ie = (s) => s.split(' ').map((k) => `IE-${k}`);

// The Empires (countries) and their Realms.
export const EMPIRES = {
  US: { code: 'US', name: 'American Empire', country: 'United States', realms: REALMS },
  GB: {
    code: 'GB', name: 'Empire of the Isles', country: 'Great Britain', realms: [
      R('gb-thistle', 'Realm of the Thistle', 'Scotland', 'spades', gb('highland moray aberdeenshire angus perthshire fife stirlingshire east-lothian lothians clyde ayrshire dumfries borders argyll isles')),
      R('gb-dragon', 'Realm of the Red Dragon', 'Wales', 'hearts', gb('gwynedd clwyd powys dyfed glamorgan gwent')),
      R('gb-roses', 'Realm of the Roses', 'Northern England', 'clubs', gb('northumberland tyne-wear durham north-yorkshire east-yorkshire south-yorkshire west-yorkshire cumbria lancashire merseyside manchester cheshire')),
      R('gb-forge', 'Realm of the Forge', 'The Midlands', 'diamonds', gb('lincolnshire derbyshire nottinghamshire leicestershire northamptonshire staffordshire shropshire herefordshire worcestershire warwickshire west-midlands')),
      R('gb-heath', 'Realm of the Heath', 'London, the South East and East', 'spades', gb('london kent surrey east-sussex west-sussex hampshire isle-of-wight berkshire oxfordshire buckinghamshire bedfordshire hertfordshire essex cambridgeshire norfolk suffolk')),
      R('gb-cliffs', 'Realm of the Cliffs', 'South West England', 'clubs', gb('cornwall devon somerset dorset wiltshire gloucestershire bristol')),
    ],
  },
  IE: {
    code: 'IE', name: 'Irish Empire', country: 'Ireland (the whole island)', realms: [
      R('ie-leinster', 'Realm of the Emerald Throne', 'Leinster', 'spades', ie('dublin wicklow wexford kilkenny carlow kildare meath louth westmeath longford offaly laois')),
      R('ie-munster', 'Realm of the Wild Atlantic', 'Munster', 'hearts', ie('cork kerry limerick clare tipperary waterford')),
      R('ie-connacht', 'Realm of the Stone Walls', 'Connacht', 'clubs', ie('galway mayo sligo leitrim roscommon')),
      R('ie-ulster', 'Realm of the Causeway', 'Ulster', 'diamonds', ie('donegal cavan monaghan antrim down armagh londonderry tyrone fermanagh')),
    ],
  },
  CA: {
    code: 'CA', name: 'Canadian Empire', country: 'Canada', realms: [
      R('ca-atlantic', 'Realm of the Lighthouse Coast', 'Atlantic Canada', 'spades', ['CA-NL', 'CA-NS', 'CA-NB', 'CA-PE']),
      R('ca-maple', 'Realm of the Maple Throne', 'Quebec and Ontario', 'hearts', ['CA-QC', 'CA-ON']),
      R('ca-prairie', 'Realm of the Golden Prairie', 'The Prairies', 'clubs', ['CA-MB', 'CA-SK', 'CA-AB']),
      R('ca-north', 'Realm of the Northern Lights', 'British Columbia and the North', 'diamonds', ['CA-BC', 'CA-YT', 'CA-NT', 'CA-NU']),
    ],
  },
  AU: {
    code: 'AU', name: 'Australian Empire', country: 'Australia', realms: [
      R('au-coral', 'Realm of the Coral Coast', 'Queensland, New South Wales and the ACT', 'spades', ['AU-QLD', 'AU-NSW', 'AU-ACT']),
      R('au-southern', 'Realm of the Southern Cross', 'Victoria, South Australia and Tasmania', 'hearts', ['AU-VIC', 'AU-SA', 'AU-TAS']),
      R('au-outback', 'Realm of the Red Centre', 'Western Australia and the Northern Territory', 'diamonds', ['AU-WA', 'AU-NT']),
    ],
  },
  JP: {
    code: 'JP', name: 'Cherry Blossom Empire', country: 'Japan', realms: [
      R('jp-snow', 'Realm of the Northern Snow', 'Hokkaido and Tohoku', 'spades', jp(1, 7)),
      R('jp-capital', 'Realm of the Eastern Capital', 'Kanto', 'hearts', jp(8, 14)),
      R('jp-fuji', 'Realm of the Sacred Mountain', 'Chubu', 'clubs', jp(15, 23)),
      R('jp-kansai', 'Realm of the Ancient Capital', 'Kansai', 'diamonds', jp(24, 30)),
      R('jp-inland', 'Realm of the Inland Sea', 'Chugoku and Shikoku', 'spades', jp(31, 39)),
      R('jp-isles', 'Realm of the Southern Isles', 'Kyushu and Okinawa', 'hearts', jp(40, 47)),
    ],
  },
};
for (const e of Object.values(EMPIRES)) for (const r of e.realms) r.empire = e.code;

/** Every Realm in every Empire. */
export const ALL_REALMS = Object.values(EMPIRES).flatMap((e) => e.realms);
const KINGDOM = { ...STATES, ...NAMES };
/** Every Kingdom code, Empire by Empire. */
export const ALL_KINGDOMS = ALL_REALMS.flatMap((r) => r.states);

/** 'FL' -> 'US', 'CA-ON' -> 'CA'. */
export const empireOf = (code) => (code.includes('-') ? code.split('-')[0] : 'US');
export const kingdomName = (code) => `${KINGDOM[code]} Kingdom`;
/** The Kingdom's plain name: 'Florida', 'Ontario', 'Fife'. */
export const kingdomPlain = (code) => KINGDOM[code];
export const realmOf = (code) => ALL_REALMS.find((r) => r.states.includes(code));
export const realmById = (id) => ALL_REALMS.find((r) => r.id === id);
/** "CT, DE, ME …" for a realm, used in challenge descriptions. */
export const realmStateList = (id) => realmById(id).states.map((c) => KINGDOM[c]).join(', ');
