// LUMENFALL v2 — game configuration: canvas, path, towers, enemies, waves, economy.
// Every number the game balances on lives here, so tuning is one file.

export const W = 1280;
export const H = 720;

// The winding road the tide takes from the right edge to the lighthouse.
export const PATH = [
  { x: 1300, y: 110 },
  { x: 1010, y: 110 },
  { x: 1010, y: 300 },
  { x: 770, y: 300 },
  { x: 770, y: 540 },
  { x: 480, y: 540 },
  { x: 480, y: 360 },
  { x: 250, y: 360 },
  { x: 168, y: 360 },
];

// Build plots: {x, y} spots where a tower may stand.
export const PLOTS = [
  { x: 1085, y: 185 }, { x: 935, y: 185 }, { x: 935, y: 375 }, { x: 845, y: 225 },
  { x: 695, y: 375 }, { x: 845, y: 465 }, { x: 695, y: 615 }, { x: 555, y: 465 },
  { x: 405, y: 615 }, { x: 555, y: 285 }, { x: 405, y: 285 }, { x: 330, y: 460 },
];

export const START_GOLD = 220;
export const START_LIVES = 20;
export const MAX_WAVE = 21;
export const SELL_RATE = 0.7;

// Towers: id, name, cost, damage, rate (shots/sec), range, color, blurb.
export const TOWERS = {
  arrow: {
    id: 'arrow', name: 'Gale Bow', cost: 50, dmg: 12, rate: 2.2, range: 135,
    color: '#7fe07f', glow: '#a5ffb0', desc: 'Rapid arrows.',
  },
  cannon: {
    id: 'cannon', name: 'Ember Mortar', cost: 110, dmg: 34, rate: 0.7, range: 155,
    color: '#ffb347', glow: '#ffd27f', splash: 70, desc: 'Splash shells.',
  },
  frost: {
    id: 'frost', name: 'Rime Spire', cost: 80, dmg: 7, rate: 1.6, range: 145,
    color: '#7fd4ff', glow: '#bfe9ff', slow: 0.45, slowDur: 1.6, desc: 'Slows foes.',
  },
  arc: {
    id: 'arc', name: 'Storm Coil', cost: 150, dmg: 20, rate: 1.0, range: 165,
    color: '#c99aff', glow: '#e3ccff', chain: 3, desc: 'Chain lightning.',
  },
  sniper: {
    id: 'sniper', name: 'Dusk Longbow', cost: 190, dmg: 95, rate: 0.42, range: 330,
    color: '#ff7f9e', glow: '#ffb3c6', desc: 'Long-range shots.',
  },
};

// Upgrade multipliers per tier (tier 2, tier 3). Upgrade cost = round(base * factor).
export const TIER = [
  null,
  { dmgMul: 1, rangeMul: 1, cost: 0 },
  { dmgMul: 1.7, rangeMul: 1.12, cost: 1.1 },
  { dmgMul: 3.0, rangeMul: 1.25, cost: 2.0 },
];

// Enemies: id, name, hp, speed (px/s), bounty, radius, color, special.
export const ENEMIES = {
  mite:    { id: 'mite',    name: 'Tide Mite',   hp: 34,  speed: 58,  bounty: 4,  r: 11, color: '#8affc1', kind: 'crawl' },
  runner:  { id: 'runner',  name: 'Skitter',     hp: 26,  speed: 98,  bounty: 5,  r: 10, color: '#ffe066', kind: 'crawl' },
  brute:   { id: 'brute',   name: 'Hull Brute',  hp: 165, speed: 36,  bounty: 9,  r: 17, color: '#ff9d5c', kind: 'crawl', armor: 4 },
  shield:  { id: 'shield',  name: 'Aegis Crab',  hp: 95,  speed: 46,  bounty: 10, r: 15, color: '#9db8ff', kind: 'crawl', shield: 45 },
  healer:  { id: 'healer',  name: 'Mend Wisp',   hp: 64,  speed: 52,  bounty: 12, r: 12, color: '#ff9de2', kind: 'crawl', heals: 6 },
  splitter:{ id: 'splitter',name: 'Brood Pod',   hp: 56,  speed: 48,  bounty: 8,  r: 13, color: '#c1ff5c', kind: 'crawl', splits: 2 },
  flyer:   { id: 'flyer',   name: 'Gull Fiend',  hp: 30,  speed: 122, bounty: 7,  r: 10, color: '#e8f6ff', kind: 'fly' },
  wisp:    { id: 'wisp',    name: 'Hex Wisp',    hp: 44,  speed: 74,  bounty: 11, r: 11, color: '#b388ff', kind: 'crawl', evade: 0.25 },
  boss:    { id: 'boss',    name: 'Dreadtide Leviathan', hp: 6500, speed: 22, bounty: 500, r: 42, color: '#ff4d6d', kind: 'boss' },
};

// Wave composition: [enemyId, count, gapSeconds]. HP scales with wave: hp * (1 + 0.09*(wave-1)).
export function waveComp(wave) {
  const c = [];
  const add = (id, n, gap) => { if (n > 0) c.push([id, n, gap]); };
  if (wave === 21) {
    add('boss', 1, 0);
    add('runner', 8, 1.2);
    add('healer', 4, 2.0);
    add('brute', 6, 2.2);
    return c;
  }
  const w = wave;
  add('mite', 6 + w, 0.9);
  if (w >= 2) add('runner', 2 + Math.floor(w * 0.8), 1.0);
  if (w >= 3) add('brute', 1 + Math.floor(w / 3), 1.6);
  if (w >= 4) add('flyer', 2 + Math.floor(w / 2), 1.1);
  if (w >= 5) add('shield', 1 + Math.floor(w / 4), 1.8);
  if (w >= 6) add('splitter', 1 + Math.floor(w / 4), 1.5);
  if (w >= 7) add('wisp', 1 + Math.floor(w / 3), 1.4);
  if (w >= 8) add('healer', 1 + Math.floor(w / 5), 2.2);
  if (w === 7 || w === 14) add('brute', 3, 1.2); // mini-boss waves
  return c;
}

export function waveHpMul(wave) { return 1 + 0.09 * (wave - 1); }
export function waveBonus(wave) { return 40 + wave * 8; }

// Abilities: id, name, cooldown seconds, uses (Infinity = unlimited).
export const ABILITIES = {
  meteor: { id: 'meteor', name: 'Starfall', cd: 26, desc: '150 damage to every foe on the field.' },
  freeze: { id: 'freeze', name: 'Deep Freeze', cd: 22, desc: 'Slow all foes 70% for 5 seconds.' },
  repair: { id: 'repair', name: 'Mend Light', cd: 0, uses: 3, desc: 'Restore 6 lighthouse lives.' },
};

export const METEOR_DMG = 150;
export const FREEZE_SLOW = 0.7;
export const FREEZE_DUR = 5;
export const REPAIR_LIVES = 6;
