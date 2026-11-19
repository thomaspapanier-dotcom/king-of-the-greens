// Nameplate flair: a square BADGE on the left and a BANNER behind the whole strip.
// Layout (left to right, all on the banner): [badge] [rank badge] gamertag [win % crown].
// Starter set only for now; earning or picking them comes with accounts.

const BADGE_ART = {
  // [frame color, background, icon svg (in a 40x40 box), name]
  kog: ['#e6be4a', 'radial-gradient(circle at 35% 30%, #2f7d4f, #123a24)', '<text x="20" y="27.5" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="21" fill="#f5d76e" stroke="#7d5800" stroke-width=".8">K</text><path d="M9 32 H31" stroke="#f5d76e" stroke-width="1.4"/><path d="M20 4.5 L22.2 7.5 L20 10.5 L17.8 7.5 Z" fill="#e3262b"/>', 'King of the Greens'],
  spade: ['#c9c9cf', 'linear-gradient(160deg, #2a2a30, #0b0b0d)', '<path d="M20 7C16 13 8 17 8 23.5c0 3.6 2.8 5.8 5.8 5.8 2 0 3.4-.8 4.4-2-.3 2.6-1.4 4.2-3.4 5.6h10.4c-2-1.4-3.1-3-3.4-5.6 1 1.2 2.4 2 4.4 2 3 0 5.8-2.2 5.8-5.8C32 17 24 13 20 7Z" fill="#fff"/>', 'Black Spade'],
  heart: ['#e3262b', 'linear-gradient(160deg, #fff7ef, #f1e2cf)', '<path d="M20 32C12 26 7 21.5 7 15.8 7 12 10 9 13.6 9c2.7 0 4.9 1.5 6.4 3.6C21.5 10.5 23.7 9 26.4 9 30 9 33 12 33 15.8 33 21.5 28 26 20 32Z" fill="#e3262b"/>', 'Heartbreaker'],
  diamond: ['#e3262b', 'linear-gradient(160deg, #1d1d22, #0b0b0d)', '<path d="M20 6 L30 20 L20 34 L10 20 Z" fill="#e3262b"/><path d="M20 6 L23 20 L20 34" fill="#fff" opacity=".25"/>', 'Dirty Diamond'],
  club: ['#e6be4a', 'radial-gradient(circle at 40% 30%, #2e6b46, #0f2a1b)', '<circle cx="20" cy="13" r="5.6" fill="#fff"/><circle cx="13.5" cy="22" r="5.6" fill="#fff"/><circle cx="26.5" cy="22" r="5.6" fill="#fff"/><path d="M18.5 20 Q19 28 15 32 H25 Q21 28 21.5 20 Z" fill="#fff"/><circle cx="20" cy="19" r="3" fill="#fff"/>', 'Clubhouse'],
  flag: ['#f5d76e', 'linear-gradient(180deg, #8fd6ff, #5fb3e6 55%, #3f9b52 56%, #2f7d3f)', '<ellipse cx="20" cy="30" rx="11" ry="3" fill="#2a6a35"/><ellipse cx="20" cy="30.5" rx="2.4" ry="1" fill="#111"/><path d="M20 30 V8" stroke="#fff" stroke-width="1.6"/><path d="M20 8 L30 11.5 L20 15 Z" fill="#e3262b"/>', 'Pin Seeker'],
  putters: ['#e6be4a', 'linear-gradient(160deg, #1f2e55, #0e1630)', '<g stroke="#e9eef6" stroke-width="2" stroke-linecap="round"><path d="M10 9 L28 31"/><path d="M30 9 L12 31"/></g><rect x="24" y="29" width="8" height="3.4" rx="1.2" fill="#e9eef6"/><rect x="8" y="29" width="8" height="3.4" rx="1.2" fill="#e9eef6"/><circle cx="20" cy="20" r="2.4" fill="#f5d76e"/>', 'Crossed Putters'],
  ace: ['#e3262b', 'linear-gradient(160deg, #ffffff, #ece7dc)', '<text x="11" y="15" font-family="Georgia,serif" font-weight="900" font-size="9" fill="#111">A</text><path d="M20 13C17.6 16.6 13 19 13 22.6c0 2 1.6 3.3 3.3 3.3 1.1 0 1.9-.4 2.5-1.1-.2 1.5-.8 2.4-1.9 3.2h6.2c-1.1-.8-1.7-1.7-1.9-3.2.6.7 1.4 1.1 2.5 1.1 1.7 0 3.3-1.3 3.3-3.3C27 19 22.4 16.6 20 13Z" fill="#111"/>', 'Ace High'],
};
export const BADGES = Object.keys(BADGE_ART);

/** A square badge, `size` px. */
export function badgeHtml(id = 'kog', size = 24) {
  const [frame, bg, icon, name] = BADGE_ART[id] || BADGE_ART.kog;
  return `<span class="np-badge" style="width:${size}px;height:${size}px;background:${bg};border-color:${frame}" title="${name}" role="img" aria-label="Badge: ${name}"><svg viewBox="0 0 40 40" width="100%" height="100%" aria-hidden="true">${icon}</svg></span>`;
}

// Banner looks live in CSS (.bn-<id>), so they can use gradients and patterns.
export const BANNERS = ['fairway', 'felt', 'royal', 'midnight', 'sunset', 'gold', 'onyx', 'ivory'];
export const bannerClass = (id = 'fairway') => `bn-${BANNERS.includes(id) ? id : 'fairway'}`;
