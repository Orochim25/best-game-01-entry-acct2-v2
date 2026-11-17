// LUMENFALL v2 — the game itself: state machine, economy, waves, abilities, boons.
// Everything the player does flows through here; render.js only draws it.

import {
  W, H, PATH, PLOTS, START_GOLD, START_LIVES, MAX_WAVE, TOWERS, TIER,
  ABILITIES, METEOR_DMG, FREEZE_SLOW, FREEZE_DUR, REPAIR_LIVES, waveBonus,
} from './config.js';
import { mulberry32 } from './rng.js';
import { Particles } from './particles.js';
import { Sound } from './audio.js';
import { Tower, Projectile } from './towers.js';
import { Enemy } from './enemies.js';
import { Spawner } from './waves.js';

export const BOONS = [
  { id: 'gold', name: 'Salvage Cache', desc: '+80 gold, right now.', icon: '◉' },
  { id: 'lives', name: 'Beacon Blessing', desc: '+3 lighthouse lives (max 20).', icon: '♥' },
  { id: 'power', name: 'Storm Surge', desc: '+12% tower damage, rest of game.', icon: '⚡' },
];

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.rng = mulberry32(1337);
    this.sound = new Sound();
    this.particles = new Particles();
    this.spawner = new Spawner(this);
    this.reset();
  }

  reset() {
    this.state = 'title';
    this.gold = START_GOLD;
    this.lives = START_LIVES;
    this.score = 0;
    this.wave = 0;
    this.kills = 0;
    this.leakedTotal = 0;
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.particles = new Particles();
    this.spawner = new Spawner(this);
    this.now = 0;
    this.time = 0;
    this.waveActive = false;
    this.boonOffer = null;
    this.boonTaken = 0;
    this.dmgBonus = 0;
    this.abilityCd = { meteor: 0, freeze: 0 };
    this.repairUses = ABILITIES.repair.uses;
    this.shakeMag = 0;
    this.bannerText = '';
    this.bannerColor = '#ffe9a8';
    this.bannerT = 0;
    this.selectedPlot = null;
    this.selectedTower = null;
    this.selectedBuild = 'arrow';
    this.hover = { x: -1, y: -1 };
    this.speed = 1;
    this.stats = { damage: 0, earned: 0, spent: 0 };
    this.flashT = 0;
  }

  startGame() {
    this.reset();
    this.state = 'playing';
    this.sound.ensure();
    this.sound.startMusic();
    this.banner('DEFEND THE LAST LIGHTHOUSE', '#ffe9a8');
  }

  startWave() {
    if (this.state !== 'playing' || this.waveActive) return;
    this.wave++;
    this.waveActive = true;
    this.spawner.startWave(this.wave);
    this.sound.horn();
    this.banner(`WAVE ${this.wave}${this.wave === MAX_WAVE ? ' — FINAL' : ''}`, '#ffe9a8');
  }

  enemyById(id) {
    return this.enemies.find((e) => e.id === id);
  }

  plotAt(x, y) {
    for (const p of PLOTS) if (Math.hypot(p.x - x, p.y - y) < 30) return p;
    return null;
  }

  towerAt(x, y) {
    for (const t of this.towers) if (Math.hypot(t.x - x, t.y - y) < 28) return t;
    return null;
  }

  towerOnPlot(plot) {
    return this.towers.find((t) => t.x === plot.x && t.y === plot.y);
  }

  buildTower(plot, defId) {
    if (this.towerOnPlot(plot)) return false;
    const def = TOWERS[defId];
    if (!def || this.gold < def.cost) return false;
    this.gold -= def.cost;
    this.stats.spent += def.cost;
    const t = new Tower(defId, plot.x, plot.y);
    this.towers.push(t);
    this.sound.place();
    this.particles.ring(plot.x, plot.y, def.glow, 46, 0.4);
    this.particles.burst(plot.x, plot.y - 10, def.glow, 10, 90, 0.4, 3);
    this.selectedTower = t;
    this.selectedPlot = null;
    return true;
  }

  upgradeTower(t) {
    const cost = t.upgradeCost();
    if (cost === null || this.gold < cost) return false;
    this.gold -= cost;
    this.stats.spent += cost;
    t.tier++;
    t.spent += cost;
    this.sound.upgrade();
    this.particles.ring(t.x, t.y, '#ffd76a', 60, 0.5);
    this.particles.burst(t.x, t.y - 14, '#ffd76a', 16, 120, 0.5, 3.5);
    this.particles.text(t.x, t.y - 34, 'TIER ' + t.tier, '#ffd76a', 15);
    return true;
  }

  sellTower(t) {
    const v = t.sellValue();
    this.gold += v;
    this.towers = this.towers.filter((o) => o !== t);
    if (this.selectedTower === t) this.selectedTower = null;
    this.particles.text(t.x, t.y - 20, `+${v}g`, '#ffd76a', 15);
    this.sound.coin();
  }

  useAbility(id) {
    if (this.state !== 'playing') return false;
    if (id === 'meteor') {
      if (this.abilityCd.meteor > 0 || this.enemies.length === 0) return false;
      this.abilityCd.meteor = ABILITIES.meteor.cd;
      this.sound.meteor();
      this.shake(8);
      this.flashT = 0.25;
      for (const e of [...this.enemies]) {
        if (!e.alive) continue;
        const d = e.damage(METEOR_DMG, this);
        if (d > 0) this.onEnemyHit(e, d, null);
        this.particles.burst(e.x, e.y, '#ffb347', 10, 140, 0.5, 4, 160);
      }
      this.banner('STARFALL!', '#ffb347');
      return true;
    }
    if (id === 'freeze') {
      if (this.abilityCd.freeze > 0) return false;
      this.abilityCd.freeze = ABILITIES.freeze.cd;
      this.sound.freeze();
      for (const e of this.enemies) {
        if (e.alive) e.slow(1 - FREEZE_SLOW, FREEZE_DUR, this.now);
      }
      this.particles.ring(W / 2, H / 2, '#7fd4ff', 500, 0.8);
      this.banner('DEEP FREEZE', '#7fd4ff');
      return true;
    }
    if (id === 'repair') {
      if (this.repairUses <= 0 || this.lives >= START_LIVES) return false;
      this.repairUses--;
      this.lives = Math.min(START_LIVES, this.lives + REPAIR_LIVES);
      this.sound.upgrade();
      this.particles.text(150, 330, `+${REPAIR_LIVES} LIVES`, '#ff5c7a', 18);
      return true;
    }
    return false;
  }

  applyBoon(id) {
    if (this.state !== 'boon' || !this.boonOffer) return;
    if (id === 'gold') {
      this.gold += 80;
      this.stats.earned += 80;
    } else if (id === 'lives') {
      this.lives = Math.min(START_LIVES, this.lives + 3);
    } else if (id === 'power') {
      this.dmgBonus += 0.12;
      this.boonTaken++;
    }
    this.sound.upgrade();
    this.boonOffer = null;
    this.state = 'playing';
  }

  onEnemyHit(e, dmg, tower) {
    const whole = Math.round(dmg);
    this.score += whole;
    this.stats.damage += whole;
    if (tower) tower.kills++;
    const total = this.dmgBonus > 0 ? Math.round(dmg * (1 + this.dmgBonus)) : whole;
    this.particles.text(e.x, e.y - e.def.r - 6, String(total), '#ffffff', 12);
  }

  killEnemy(e) {
    this.kills++;
    this.gold += e.bounty;
    this.stats.earned += e.bounty;
    this.score += e.bounty * 10;
    this.particles.burst(e.x, e.y, e.def.color, e.def.id === 'boss' ? 60 : 12, e.def.id === 'boss' ? 260 : 130, 0.6, 4, 180);
    this.particles.ring(e.x, e.y, e.def.color, e.def.id === 'boss' ? 160 : 50, 0.5);
    this.particles.text(e.x, e.y - 20, `+${e.bounty}g`, '#ffd76a', 13);
    this.sound.explode(e.def.id === 'boss');
    if (e.def.id === 'boss') {
      this.shake(16);
      this.flashT = 0.4;
    }
    if (e.def.splits) {
      for (let i = 0; i < e.def.splits; i++) {
        const m = new Enemy('mite', e.wave, this.rng);
        m.x = e.x + (i === 0 ? -14 : 14);
        m.y = e.y + (i === 0 ? 8 : -8);
        m.seg = e.seg;
        m.dist = e.dist;
        this.enemies.push(m);
      }
    }
  }

  shake(m) { this.shakeMag = Math.max(this.shakeMag, m); }
  banner(text, color = '#ffe9a8') {
    this.bannerText = text;
    this.bannerColor = color;
    this.bannerT = 2.2;
  }

  update(rawDt) {
    const dt = Math.max(0, Math.min(0.05, rawDt)) * this.speed;
    this.time += dt;
    if (this.state !== 'playing') {
      this.particles.update(dt);
      if (this.bannerT > 0) this.bannerT -= dt;
      return;
    }
    this.now += dt;
    if (this.bannerT > 0) this.bannerT -= dt;
    if (this.flashT > 0) this.flashT -= dt;
    if (this.shakeMag > 0) this.shakeMag = Math.max(0, this.shakeMag - dt * 26);
    this.abilityCd.meteor = Math.max(0, this.abilityCd.meteor - dt);
    this.abilityCd.freeze = Math.max(0, this.abilityCd.freeze - dt);

    this.spawner.update(dt);
    for (const e of this.enemies) e.update(dt, this.now, this);
    for (const t of this.towers) t.update(dt, this);

    // Projectiles.
    const alive = [];
    for (const p of this.projectiles) {
      if (Projectile.step(p, dt, this)) alive.push(p);
    }
    this.projectiles = alive;

    // Deaths and leaks.
    const remaining = [];
    for (const e of this.enemies) {
      if (e.dead) {
        this.killEnemy(e);
        continue;
      }
      if (e.leaked) {
        this.leakedTotal++;
        this.lives -= e.def.id === 'boss' ? 10 : 1;
        this.sound.leak();
        this.shake(6);
        this.particles.text(150, 300, e.def.id === 'boss' ? '-10' : '-1', '#ff5c7a', 18);
        continue;
      }
      remaining.push(e);
    }
    this.enemies = remaining;
    this.particles.update(dt);

    if (this.lives <= 0) {
      this.lives = 0;
      this.state = 'lost';
      this.sound.leak();
      return;
    }
    if (this.waveActive && this.spawner.done && this.enemies.length === 0) {
      this.waveActive = false;
      const bonus = waveBonus(this.wave);
      this.gold += bonus;
      this.stats.earned += bonus;
      if (this.wave >= MAX_WAVE) {
        this.state = 'won';
        this.sound.victory();
        return;
      }
      this.banner(`WAVE ${this.wave} CLEARED  +${bonus}g`, '#7fe07f');
      if (this.wave % 3 === 0) {
        this.boonOffer = [...BOONS];
        this.state = 'boon';
      }
    }
  }

  // Step the simulation without rendering (playtest / balance sim).
  fastForward(seconds) {
    const step = 1 / 60;
    const n = Math.round(seconds / step);
    for (let i = 0; i < n; i++) this.update(step);
  }

  // Demo states for screenshots: real renders of the game's own code.
  setupDemo(kind) {
    this.startGame();
    if (kind === 'title') {
      this.state = 'title';
      return;
    }
    if (kind === 'play') {
      // Mid-game, wave 6 in progress: towers up, enemies on the road, HUD alive.
      this.wave = 6;
      this.waveActive = true;
      this.gold = 340;
      this.score = 2840;
      this.kills = 61;
      const spots = [PLOTS[0], PLOTS[1], PLOTS[3], PLOTS[4], PLOTS[9], PLOTS[10]];
      const kinds = ['arrow', 'cannon', 'frost', 'arc', 'sniper', 'arrow'];
      spots.forEach((p, i) => {
        const t = new Tower(kinds[i], p.x, p.y);
        if (i === 1) t.tier = 2;
        if (i === 3) t.tier = 3;
        t.angle = -0.6 - i * 0.3;
        this.towers.push(t);
      });
      const ids = ['mite', 'runner', 'brute', 'flyer', 'shield', 'splitter', 'wisp', 'runner', 'mite', 'healer'];
      ids.forEach((id, i) => {
        const e = new Enemy(id, 6, this.rng);
        const seg = Math.min(4 + Math.floor(i / 3), PATH.length - 2);
        e.seg = seg;
        e.dist = 20 + (i % 3) * 40;
        const a = PATH[seg], b = PATH[seg + 1];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        e.x = a.x + ((b.x - a.x) * e.dist) / len;
        e.y = a.y + ((b.y - a.y) * e.dist) / len;
        this.enemies.push(e);
      });
      this.particles.burst(900, 220, '#ffb347', 16, 140, 0.5, 4);
      this.particles.burst(770, 330, '#7fd4ff', 12, 110, 0.5, 3);
      this.banner('WAVE 6', '#ffe9a8');
      return;
    }
    if (kind === 'boss') {
      this.wave = 21;
      this.waveActive = true;
      this.gold = 520;
      this.score = 31200;
      this.kills = 288;
      this.lives = 14;
      const spots = [PLOTS[0], PLOTS[1], PLOTS[2], PLOTS[3], PLOTS[4], PLOTS[5], PLOTS[9], PLOTS[10]];
      const kinds = ['sniper', 'cannon', 'arc', 'arrow', 'frost', 'cannon', 'arc', 'sniper'];
      spots.forEach((p, i) => {
        const t = new Tower(kinds[i], p.x, p.y);
        t.tier = i % 3 === 0 ? 3 : 2;
        t.angle = -0.9 - i * 0.2;
        this.towers.push(t);
      });
      const boss = new Enemy('boss', 21, this.rng);
      boss.seg = 5;
      boss.dist = 30;
      const a = PATH[5], b = PATH[6];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      boss.x = a.x + ((b.x - a.x) * boss.dist) / len;
      boss.y = a.y + ((b.y - a.y) * boss.dist) / len;
      this.enemies.push(boss);
      ['runner', 'runner', 'healer', 'brute'].forEach((id, i) => {
        const e = new Enemy(id, 21, this.rng);
        e.seg = 3;
        e.dist = 40 + i * 50;
        const a2 = PATH[3], b2 = PATH[4];
        const l2 = Math.hypot(b2.x - a2.x, b2.y - a2.y);
        e.x = a2.x + ((b2.x - a2.x) * e.dist) / l2;
        e.y = a2.y + ((b2.y - a2.y) * e.dist) / l2;
        this.enemies.push(e);
      });
      this.particles.burst(boss.x, boss.y, '#ff4d6d', 30, 200, 0.7, 4);
      this.particles.ring(boss.x, boss.y, '#ff4d6d', 120, 0.6);
      this.banner('THE DREADTIDE LEVIATHAN', '#ff8fa8');
      return;
    }
    if (kind === 'victory') {
      this.wave = 21;
      this.gold = 640;
      this.score = 48750;
      this.kills = 312;
      this.lives = 17;
      this.stats.earned = 2840;
      this.stats.damage = 96400;
      this.bannerT = 0;
      this.bannerText = '';
      this.state = 'won';
    }
  }
}
