// Player avatars: full-body 3D Kings and Queens, 3 per skin tone (light, brown, dark).
// The chosen base avatar is only the body. Anything a player owns or wears from the store
// lives in a separate locker, so it carries over when they switch avatars.
export const AVATARS = [
  { id: 'king-classic', name: 'The Classic', kind: 'king', tone: 'light' },
  { id: 'king-young-gun', name: 'The Young Gun', kind: 'king', tone: 'light' },
  { id: 'king-jolly-redhead', name: 'The Jolly Redhead', kind: 'king', tone: 'light' },
  { id: 'king-smooth-operator', name: 'The Smooth Operator', kind: 'king', tone: 'brown' },
  { id: 'king-gentleman', name: 'The Gentleman', kind: 'king', tone: 'brown' },
  { id: 'king-wink', name: 'The Wink', kind: 'king', tone: 'brown' },
  { id: 'king-closer', name: 'The Closer', kind: 'king', tone: 'dark' },
  { id: 'king-showman', name: 'The Showman', kind: 'king', tone: 'dark' },
  { id: 'king-elder', name: 'The Elder', kind: 'king', tone: 'dark' },
  { id: 'queen-silver', name: 'The Silver Queen', kind: 'queen', tone: 'light' },
  { id: 'queen-sunny', name: 'The Sunny One', kind: 'queen', tone: 'light' },
  { id: 'queen-sharp-shooter', name: 'The Sharp Shooter', kind: 'queen', tone: 'light' },
  { id: 'queen-radiant', name: 'The Radiant', kind: 'queen', tone: 'brown' },
  { id: 'queen-focused', name: 'The Focused', kind: 'queen', tone: 'brown' },
  { id: 'queen-free-spirit', name: 'The Free Spirit', kind: 'queen', tone: 'brown' },
  { id: 'queen-crowned-afro', name: 'The Crowned Afro', kind: 'queen', tone: 'dark' },
  { id: 'queen-boss', name: 'The Boss', kind: 'queen', tone: 'dark' },
  { id: 'queen-matriarch', name: 'The Matriarch', kind: 'queen', tone: 'dark' },
];

export const DEFAULT_AVATAR = 'king-classic';
export const avatarById = (id) => AVATARS.find((a) => a.id === id) || null;
export const avatarSrc = (id) => `assets/avatars/${id}.webp`;

/**
 * An avatar standing on a little glowing pedestal, gently breathing.
 * `size` is the figure height in px; `still` turns the idle motion off.
 */
export function avatarFigure(id, size = 120, { still = false, cls = '' } = {}) {
  const a = avatarById(id) || avatarById(DEFAULT_AVATAR);
  return `<span class="av-figure ${still ? 'still' : ''} ${cls}" style="--av-h:${size}px">
    <span class="av-pedestal" aria-hidden="true"></span>
    <span class="av-body"><img class="av-img" src="${avatarSrc(a.id)}" alt="${a.name}" draggable="false"></span>
  </span>`;
}
