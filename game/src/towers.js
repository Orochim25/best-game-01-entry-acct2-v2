// LUMENFALL v2 — tower behaviour: targeting, firing, projectiles, upgrades, selling.

import { TOWERS, TIER } from './config.js';
import { pathProgress } from './enemies.js';

let uid = 1;

export class Tower {
  constructor(defId, x, y) {
    this.id = uid++;
    this.def = TOWERS[defId];
    this.x = x;
    this.y = y;
    this.tier = 1;
    this.cool = 0;
    this.angle = -Math.PI / 2;
    this.kills = 0;
    this.spent = this.def.cost;
  }

  get dmg() { return this.def.dmg * TIER[this.tier].dmgMul; }
  get range() { return this.def.range * TIER[this.tier].rangeMul; }
  get rate() { return this.def.rate; }

  upgradeCost() {
    if (this.tier >= 3) return null;
    return Math.round(this.def.cost * TIER[this.tier + 1].cost);
  }

  sellValue() {
    return Math.round(this.spent * 0.7);
  }

  update(dt, game) {
    if (this.cool > 0) this.cool -= dt;
    const target = this.pickTarget(game);
    if (!target) return;
    this.angle = Math.atan2(target.y - this.y, target.x - this.x);
    if (this.cool <= 0) {
      this.cool = 1 / this.rate;
      this.fire(target, game);
    }
  }

  pickTarget(game) {
    let best = null;
    let bestScore = -Infinity;
    for (const e of game.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d > this.range) continue;
      // Prefer the foe furthest along the path; bosses outrank everything.
      const score = pathProgress(e) + (e.def.id === 'boss' ? 100000 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = e;
      }
    }
    return best;
  }

  fire(target, game) {
    const g = game;
    g.sound.shoot(this.def.id);
    const from = { x: this.x, y: this.y - 14 };
    if (this.def.id === 'arc') {
      // Instant chain lightning.
      let cur = target;
      const hit = new Set();
      const pts = [{ x: from.x, y: from.y }];
      let dmg = this.dmg;
      for (let i = 0; i < (this.def.chain || 1) && cur; i++) {
        hit.add(cur.id);
        pts.push({ x: cur.x, y: cur.y });
        const dealt = cur.damage(dmg, g);
        if (dealt > 0) g.onEnemyHit(cur, dealt, this);
        dmg *= 0.75;
        let next = null;
        let nd = 110;
        for (const e of g.enemies) {
          if (!e.alive || hit.has(e.id)) continue;
          const d = Math.hypot(e.x - cur.x, e.y - cur.y);
          if (d < nd) { nd = d; next = e; }
        }
        cur = next;
      }
      g.particles.bolt(pts);
      return;
    }
    g.projectiles.push({
      x: from.x, y: from.y,
      tx: target, targetId: target.id,
      speed: this.def.id === 'sniper' ? 1400 : this.def.id === 'cannon' ? 420 : 700,
      dmg: this.dmg,
      kind: this.def.id,
      splash: this.def.splash || 0,
      slow: this.def.slow || 0,
      slowDur: this.def.slowDur || 0,
      tower: this,
    });
    g.particles.burst(from.x, from.y, this.def.glow, 3, 60, 0.2, 2.5);
  }
}

export class Projectile {
  static step(p, dt, game) {
    const t = game.enemyById(p.targetId);
    if (!t || !t.alive) {
      // Target gone: fly on and fizzle.
      p.life = (p.life || 0) + dt;
      return p.life > 0.5;
    }
    const dx = t.x - p.x, dy = t.y - p.y;
    const d = Math.hypot(dx, dy);
    const step = p.speed * dt;
    if (d <= step + 6) {
      Projectile.hit(p, t, game);
      return false;
    }
    p.x += (dx / d) * step;
    p.y += (dy / d) * step;
    if (p.kind === 'arrow' || p.kind === 'sniper') game.particles.trail(p.x, p.y, '#ffffff', 2);
    return true;
  }

  static hit(p, t, game) {
    const dealt = t.damage(p.dmg, game);
    if (dealt > 0) game.onEnemyHit(t, dealt, p.tower);
    if (p.slow) t.slow(1 - p.slow, p.slowDur, game.now);
    if (p.splash) {
      game.particles.burst(t.x, t.y, '#ffb347', 14, 160, 0.4, 4, 200);
      game.particles.ring(t.x, t.y, '#ffb347', p.splash, 0.35);
      game.sound.explode(false);
      for (const e of game.enemies) {
        if (e === t || !e.alive) continue;
        if (Math.hypot(e.x - t.x, e.y - t.y) <= p.splash) {
          const d2 = e.damage(p.dmg * 0.6, game);
          if (d2 > 0) game.onEnemyHit(e, d2, p.tower);
        }
      }
    } else if (p.kind === 'sniper') {
      game.particles.burst(t.x, t.y, '#ff7f9e', 8, 120, 0.3, 3);
    } else if (p.kind === 'frost') {
      game.particles.burst(t.x, t.y, '#7fd4ff', 5, 60, 0.35, 3);
    }
  }
}
