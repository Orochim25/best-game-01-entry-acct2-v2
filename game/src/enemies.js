// LUMENFALL v2 — enemy behaviour: path walking, damage, slows, shields, splitting, healing.

import { PATH, ENEMIES, waveHpMul } from './config.js';

let uid = 1;

export class Enemy {
  constructor(id, wave, rng) {
    const def = ENEMIES[id];
    this.id = uid++;
    this.def = def;
    this.wave = wave;
    this.maxHp = Math.round(def.hp * waveHpMul(wave));
    this.hp = this.maxHp;
    this.maxShield = def.shield || 0;
    this.shield = this.maxShield;
    this.speed = def.speed * (1 + Math.min(0.25, wave * 0.008));
    this.bounty = def.bounty;
    this.x = PATH[0].x;
    this.y = PATH[0].y;
    this.seg = 0;
    this.dist = 0;
    this.slowUntil = 0;
    this.slowFactor = 1;
    this.flash = 0;
    this.seed = rng() * 10;
    this.dead = false;
    this.leaked = false;
    this.healTick = 0;
  }

  get alive() { return !this.dead && !this.leaked; }

  speedNow(now) {
    return this.speed * (now < this.slowUntil ? this.slowFactor : 1);
  }

  update(dt, now, game) {
    if (!this.alive) return;
    if (this.flash > 0) this.flash -= dt;
    const v = this.speedNow(now) * dt;
    let remaining = v;
    while (remaining > 0 && this.seg < PATH.length - 1) {
      const a = PATH[this.seg];
      const b = PATH[this.seg + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const step = Math.min(remaining, len - this.dist);
      this.dist += step;
      remaining -= step;
      this.x = a.x + (dx * this.dist) / len;
      this.y = a.y + (dy * this.dist) / len;
      if (this.dist >= len - 0.001) {
        this.seg++;
        this.dist = 0;
      }
    }
    if (this.seg >= PATH.length - 1) {
      this.leaked = true;
      return;
    }
    // Healer mends nearby allies.
    if (this.def.heals) {
      this.healTick -= dt;
      if (this.healTick <= 0) {
        this.healTick = 1;
        for (const o of game.enemies) {
          if (o !== this && o.alive && Math.hypot(o.x - this.x, o.y - this.y) < 90) {
            o.hp = Math.min(o.maxHp, o.hp + this.def.heals);
          }
        }
      }
    }
  }

  // Damage: shield absorbs first, armor reduces, evade can dodge.
  damage(amount, game) {
    if (!this.alive) return 0;
    if (this.def.evade && Math.random() < this.def.evade) {
      game.particles.text(this.x, this.y - 14, 'MISS', '#c9c9c9', 12);
      return 0;
    }
    let left = amount;
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, left);
      this.shield -= absorbed;
      left -= absorbed;
    }
    if (left > 0) {
      if (this.def.armor) left = Math.max(1, left - this.def.armor);
      this.hp -= left;
      this.flash = 0.08;
    }
    if (this.hp <= 0) {
      this.dead = true;
      return left;
    }
    return left;
  }

  slow(factor, dur, now) {
    this.slowFactor = Math.min(this.slowFactor, factor);
    this.slowUntil = Math.max(this.slowUntil, now + dur);
    if (now >= this.slowUntil - dur + 0.01) this.slowFactor = factor;
  }
}

// Distance along the path, for "first" targeting.
export function pathProgress(e) {
  let d = 0;
  for (let i = 0; i < e.seg; i++) {
    d += Math.hypot(PATH[i + 1].x - PATH[i].x, PATH[i + 1].y - PATH[i].y);
  }
  return d + e.dist;
}
