// LUMENFALL v2 — wave spawning: turns a wave composition into a timed queue of foes.

import { waveComp } from './config.js';
import { Enemy } from './enemies.js';

export class Spawner {
  constructor(game) {
    this.game = game;
    this.queue = [];
    this.timer = 0;
    this.active = false;
    this.spawned = 0;
    this.total = 0;
  }

  startWave(wave) {
    const comp = waveComp(wave);
    this.queue = [];
    for (const [id, n, gap] of comp) {
      for (let i = 0; i < n; i++) this.queue.push({ id, delay: i === 0 && this.queue.length === 0 ? 0.5 : gap });
    }
    this.total = this.queue.length;
    this.spawned = 0;
    this.timer = 0;
    this.active = true;
  }

  get done() {
    return this.active && this.queue.length === 0;
  }

  update(dt) {
    if (!this.active || this.queue.length === 0) return;
    this.timer -= dt;
    if (this.timer <= 0) {
      const next = this.queue.shift();
      const e = new Enemy(next.id, this.game.wave, this.game.rng);
      this.game.enemies.push(e);
      this.spawned++;
      if (next.id === 'boss') {
        this.game.sound.boss();
        this.game.shake(10);
        this.game.banner('THE DREADTIDE LEVIATHAN', '#ff4d6d');
      }
      this.timer = next.delay;
    }
  }
}
