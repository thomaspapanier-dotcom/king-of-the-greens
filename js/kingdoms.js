// Kingdoms, Realms and Empires. Every player belongs to a Kingdom (the state they sign up in),
// Kingdoms are grouped into Realms, and the Realms of a country make up its Empire.
// Leaderboards and challenges compare them. The American Empire is the first; more countries join later.

export const STATES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
  MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

// The six Realms (one per U.S. region) and the Kingdoms in each. All 50 states are covered exactly once.
export const REALMS = [
  { id: 'ivy', name: 'Realm of the Ivy Crown', region: 'Northeast', suit: 'spades', states: ['CT', 'DE', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'] },
  { id: 'magnolia', name: 'Realm of the Magnolia Throne', region: 'Southeast', suit: 'hearts', states: ['AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'] },
  { id: 'plains', name: 'Realm of the Golden Plains', region: 'Midwest', suit: 'clubs', states: ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'] },
  { id: 'desert', name: 'Realm of the Desert Sun', region: 'Southwest', suit: 'diamonds', states: ['AZ', 'NM', 'OK', 'TX'] },
  { id: 'peaks', name: 'Realm of the High Peaks', region: 'Mountain West', suit: 'spades', states: ['CO', 'ID', 'MT', 'NV', 'UT', 'WY'] },
  { id: 'pacific', name: 'Realm of the Pacific Tide', region: 'West Coast', suit: 'clubs', states: ['AK', 'CA', 'HI', 'OR', 'WA'] },
];

// The Empires (countries). Each has its own Kingdoms and Realms.
export const EMPIRES = { US: { code: 'US', name: 'American Empire', country: 'United States' } };

export const kingdomName = (code) => `${STATES[code]} Kingdom`;
export const realmOf = (code) => REALMS.find((r) => r.states.includes(code));
export const realmById = (id) => REALMS.find((r) => r.id === id);
/** "CT, DE, ME …" for a realm, used in challenge descriptions. */
export const realmStateList = (id) => realmById(id).states.map((c) => STATES[c]).join(', ');
