// LUMENFALL v2 — particles, shockwaves, floating text and lightning bolts.
// Every visual effect the game shows is spawned through here.

export class Particles {
  constructor() {
    this.list = [];
    this.rings = [];
    this.texts = [];
    this.bolts = [];
  }

  burst(x, y, color, n, speed, life, size, gravity = 0) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.3 + Math.random() * 0.7);
      this.list.push({
        x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.25,
        life: life * (0.5 + Math.random() * 0.5), maxLife: life,
        size: size * (0.6 + Math.random() * 0.8), color, gravity,
      });
    }
  }

  trail(x, y, color, size = 3) {
    this.list.push({
      x, y, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20,
      life: 0.35, maxLife: 0.35, size, color, gravity: 0,
    });
  }

  ring(x, y, color, maxR = 90, life = 0.5) {
    this.rings.push({ x, y, color, r: 6, maxR, life, maxLife: life });
  }

  text(x, y, str, color, size = 15) {
    this.texts.push({ x, y, str, color, size, life: 1.0, maxLife: 1.0 });
  }

  bolt(points, color = '#c9a7ff', life = 0.18) {
    this.bolts.push({ points, color, life, maxLife: life });
  }

  update(dt) {
    for (const p of this.list) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
    }
    this.list = this.list.filter((p) => p.life > 0);
    for (const r of this.rings) {
      r.life -= dt;
      r.r += (r.maxR - r.r) * dt * 6;
    }
    this.rings = this.rings.filter((r) => r.life > 0);
    for (const t of this.texts) {
      t.life -= dt;
      t.y -= 34 * dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const b of this.bolts) b.life -= dt;
    this.bolts = this.bolts.filter((b) => b.life > 0);
  }

  draw(ctx) {
    for (const p of this.list) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * a + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const r of this.rings) {
      const a = Math.max(0, r.life / r.maxLife);
      ctx.globalAlpha = a * 0.9;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3 * a + 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, Math.max(0.1, r.r), 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const b of this.bolts) {
      const a = Math.max(0, b.life / b.maxLife);
      ctx.globalAlpha = a;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(b.points[0].x, b.points[0].y);
      for (let i = 1; i < b.points.length; i++) ctx.lineTo(b.points[i].x, b.points[i].y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    for (const t of this.texts) {
      const a = Math.max(0, t.life / t.maxLife);
      ctx.globalAlpha = a;
      ctx.font = `bold ${t.size}px 'Trebuchet MS', sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(5,10,25,0.85)';
      ctx.strokeText(t.str, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
