// LUMENFALL v2 — all art is drawn in canvas: layered parallax scenery, the lighthouse,
// detailed tower and enemy sprites. No image assets, no network.

import { W, H, PATH } from './config.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---- sky, sea, cliffs -------------------------------------------------------

export function drawSky(ctx, t, stars) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0b1030');
  g.addColorStop(0.45, '#1b2a55');
  g.addColorStop(0.72, '#2c4a6e');
  g.addColorStop(1, '#0e2a3d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Stars, twinkling.
  for (const s of stars) {
    const a = 0.35 + 0.65 * Math.abs(Math.sin(t * s.tw + s.ph));
    ctx.globalAlpha = a * s.a;
    ctx.fillStyle = '#dfe9ff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Moon with halo.
  const mx = 1090, my = 92;
  const halo = ctx.createRadialGradient(mx, my, 8, mx, my, 90);
  halo.addColorStop(0, 'rgba(255,244,200,0.55)');
  halo.addColorStop(1, 'rgba(255,244,200,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(mx - 90, my - 90, 180, 180);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(mx, my, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(210,190,140,0.5)';
  ctx.beginPath();
  ctx.arc(mx - 10, my - 6, 7, 0, Math.PI * 2);
  ctx.arc(mx + 12, my + 10, 5, 0, Math.PI * 2);
  ctx.arc(mx + 4, my - 14, 4, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCliffs(ctx, t) {
  // Far cliff silhouette, slow parallax.
  ctx.fillStyle = '#16233f';
  ctx.beginPath();
  ctx.moveTo(0, 300);
  const off = Math.sin(t * 0.05) * 4;
  ctx.bezierCurveTo(180, 250 + off, 320, 320, 520, 285);
  ctx.bezierCurveTo(700, 255, 900, 320, 1120, 280);
  ctx.bezierCurveTo(1210, 268, 1260, 290, 1280, 285);
  ctx.lineTo(1280, 470);
  ctx.lineTo(0, 470);
  ctx.closePath();
  ctx.fill();
  // Near cliff, darker.
  ctx.fillStyle = '#0e1a30';
  ctx.beginPath();
  ctx.moveTo(0, 380);
  ctx.bezierCurveTo(220, 340, 420, 400, 640, 365);
  ctx.bezierCurveTo(860, 335, 1080, 400, 1280, 360);
  ctx.lineTo(1280, 520);
  ctx.lineTo(0, 520);
  ctx.closePath();
  ctx.fill();
}

export function drawSea(ctx, t) {
  // Sea band with animated wave lines and foam.
  const g = ctx.createLinearGradient(0, 430, 0, H);
  g.addColorStop(0, '#16425e');
  g.addColorStop(0.5, '#0f3247');
  g.addColorStop(1, '#081d2c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 430, W, H - 430);
  ctx.strokeStyle = 'rgba(140,220,255,0.35)';
  ctx.lineWidth = 2;
  for (let row = 0; row < 5; row++) {
    const y = 470 + row * 48;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 16) {
      const yy = y + Math.sin(x * 0.02 + t * 1.4 + row * 1.7) * 5;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  // Foam sparkles.
  ctx.fillStyle = 'rgba(200,240,255,0.5)';
  for (let i = 0; i < 26; i++) {
    const x = (i * 137 + t * 30) % W;
    const y = 455 + ((i * 53) % 240);
    ctx.globalAlpha = 0.25 + 0.25 * Math.sin(t * 2 + i);
    ctx.fillRect(x, y, 14, 2);
  }
  ctx.globalAlpha = 1;
}

// ---- the path ----------------------------------------------------------------

export function drawPath(ctx, t) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // Dirt trail.
  ctx.strokeStyle = '#6b5233';
  ctx.lineWidth = 46;
  ctx.beginPath();
  PATH.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.strokeStyle = '#8a6f45';
  ctx.lineWidth = 36;
  ctx.stroke();
  // Center dashes marching toward the lighthouse.
  ctx.strokeStyle = 'rgba(255,220,150,0.55)';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 22]);
  ctx.lineDashOffset = -t * 30;
  ctx.beginPath();
  PATH.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.setLineDash([]);
  // Edge stones.
  ctx.fillStyle = '#4d3d28';
  for (let i = 0; i < PATH.length - 1; i++) {
    const a = PATH[i], b = PATH[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.floor(len / 70);
    for (let s = 0; s <= steps; s++) {
      const px = a.x + ((b.x - a.x) * s) / steps;
      const py = a.y + ((b.y - a.y) * s) / steps;
      const nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
      ctx.beginPath();
      ctx.arc(px + nx * 26, py + ny * 26, 4, 0, Math.PI * 2);
      ctx.arc(px - nx * 26, py - ny * 26, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---- the lighthouse ------------------------------------------------------------

export function drawLighthouse(ctx, t, lives, maxLives, beamAngle) {
  const x = 150, baseY = 470;
  // Rock.
  ctx.fillStyle = '#2a2f3d';
  ctx.beginPath();
  ctx.moveTo(x - 95, baseY + 30);
  ctx.quadraticCurveTo(x - 80, baseY - 70, x - 30, baseY - 95);
  ctx.lineTo(x + 30, baseY - 95);
  ctx.quadraticCurveTo(x + 80, baseY - 70, x + 95, baseY + 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3a4152';
  ctx.beginPath();
  ctx.moveTo(x - 60, baseY - 40);
  ctx.lineTo(x - 20, baseY - 85);
  ctx.lineTo(x + 10, baseY - 45);
  ctx.closePath();
  ctx.fill();

  // Tower: striped, with glow.
  ctx.save();
  ctx.shadowColor = '#ffe9a8';
  ctx.shadowBlur = 24;
  const tw = 44, th = 150, top = baseY - 95 - th;
  ctx.fillStyle = '#f4ede0';
  ctx.fillRect(x - tw / 2, top, tw, th);
  ctx.fillStyle = '#d94f4f';
  ctx.fillRect(x - tw / 2, top + 34, tw, 26);
  ctx.fillRect(x - tw / 2, top + 92, tw, 26);
  ctx.shadowBlur = 0;
  // Lamp room.
  ctx.fillStyle = '#222a3a';
  ctx.fillRect(x - 26, top - 26, 52, 28);
  ctx.fillStyle = '#ffe9a8';
  ctx.shadowColor = '#ffdf7a';
  ctx.shadowBlur = 30;
  ctx.fillRect(x - 20, top - 22, 40, 20);
  ctx.shadowBlur = 0;
  // Dome.
  ctx.fillStyle = '#d94f4f';
  ctx.beginPath();
  ctx.moveTo(x - 28, top - 26);
  ctx.quadraticCurveTo(x, top - 52, x + 28, top - 26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(x, top - 52, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Rotating beam.
  const bx = x, by = top - 12;
  const beamLen = 520;
  const spread = 0.16;
  const grad = ctx.createLinearGradient(bx, by, bx + Math.cos(beamAngle) * beamLen, by + Math.sin(beamAngle) * beamLen);
  grad.addColorStop(0, 'rgba(255,240,170,0.5)');
  grad.addColorStop(1, 'rgba(255,240,170,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.arc(bx, by, beamLen, beamAngle - spread, beamAngle + spread);
  ctx.closePath();
  ctx.fill();

  // Lives hearts above the rock.
  for (let i = 0; i < maxLives; i++) {
    const hx = x - 88 + (i % 10) * 18;
    const hy = baseY + 58 + Math.floor(i / 10) * 16;
    drawHeart(ctx, hx, hy, 6, i < lives ? '#ff5c7a' : 'rgba(255,92,122,0.18)');
  }
}

function drawHeart(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.2, y - s * 0.2, x - s * 0.5, y - s, x, y - s * 0.3);
  ctx.bezierCurveTo(x + s * 0.5, y - s, x + s * 1.2, y - s * 0.2, x, y + s * 0.9);
  ctx.fill();
}

// ---- towers -------------------------------------------------------------------

export function drawTower(ctx, tower, t, selected) {
  const { x, y } = tower;
  const def = tower.def;
  const tier = tower.tier;
  const s = 1 + (tier - 1) * 0.12;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  // Stone base.
  ctx.fillStyle = '#3d4457';
  ctx.beginPath();
  ctx.arc(0, 4, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#565e73';
  ctx.beginPath();
  ctx.arc(0, 2, 20, 0, Math.PI * 2);
  ctx.fill();

  // Range ring when selected.
  if (selected) {
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, tower.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.rotate(tower.angle);
  ctx.shadowColor = def.glow;
  ctx.shadowBlur = 14;
  if (def.id === 'arrow') {
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(-4, -16, 8, 26);
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, -14, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, -14, 3.5, 0, Math.PI * 2);
    ctx.fill();
    if (tier >= 2) { ctx.fillStyle = def.color; ctx.fillRect(-12, -8, 5, 12); ctx.fillRect(7, -8, 5, 12); }
    if (tier >= 3) { ctx.strokeStyle = def.glow; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -14, 13, 0, Math.PI * 2); ctx.stroke(); }
  } else if (def.id === 'cannon') {
    ctx.fillStyle = '#2c2f3a';
    rr(ctx, -11, -22, 22, 30, 6);
    ctx.fill();
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, -20, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a1f0d';
    ctx.beginPath();
    ctx.arc(0, -20, 5, 0, Math.PI * 2);
    ctx.fill();
    if (tier >= 2) { ctx.fillStyle = def.color; ctx.fillRect(-14, 2, 6, 8); ctx.fillRect(8, 2, 6, 8); }
    if (tier >= 3) { ctx.fillStyle = '#ffd27f'; ctx.beginPath(); ctx.arc(0, -20, 13, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#3a1f0d'; ctx.beginPath(); ctx.arc(0, -20, 6, 0, Math.PI * 2); ctx.fill(); }
  } else if (def.id === 'frost') {
    ctx.fillStyle = '#bfe9ff';
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(10, 0);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, -18, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(191,233,255,0.9)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.7;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(Math.cos(a) * 22, -18 + Math.sin(a) * 22);
      ctx.stroke();
    }
    if (tier >= 3) { ctx.strokeStyle = def.glow; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -14, 16, 0, Math.PI * 2); ctx.stroke(); }
  } else if (def.id === 'arc') {
    ctx.fillStyle = '#4b3a6b';
    rr(ctx, -10, -14, 20, 24, 6);
    ctx.fill();
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, -16, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = def.glow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(6 + Math.sin(t * 9) * 4, -30);
    ctx.lineTo(-4 + Math.cos(t * 7) * 4, -38);
    ctx.stroke();
    if (tier >= 2) { ctx.fillStyle = def.color; ctx.beginPath(); ctx.arc(-12, -8, 4, 0, Math.PI * 2); ctx.arc(12, -8, 4, 0, Math.PI * 2); ctx.fill(); }
  } else if (def.id === 'sniper') {
    ctx.strokeStyle = '#5a3a28';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, -26);
    ctx.stroke();
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, -26, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, -26, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,127,158,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(0, -70);
    ctx.stroke();
    if (tier >= 3) { ctx.fillStyle = def.glow; ctx.beginPath(); ctx.arc(0, -26, 12, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -26, 4, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();

  // Tier pips.
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < tier ? '#ffd76a' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(x - 12 + i * 12, y + 28, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Reload sweep: a small arc that fills as the tower recharges.
  if (tower.cool > 0) {
    const maxCool = 1 / tower.def.rate;
    const frac = 1 - Math.min(1, tower.cool / maxCool);
    ctx.strokeStyle = 'rgba(255,215,106,0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y - 30, 8, -Math.PI / 2, -Math.PI / 2 + Math.max(0.05, frac) * Math.PI * 2);
    ctx.stroke();
  }
}

// ---- enemies ------------------------------------------------------------------

export function drawEnemy(ctx, e, t) {
  const bob = e.def.kind === 'fly' ? Math.sin(t * 6 + e.seed) * 6 : Math.sin(t * 8 + e.seed) * 1.5;
  const x = e.x, y = e.y + bob;
  ctx.save();
  ctx.translate(x, y);
  if (e.slowUntil > 0) ctx.globalAlpha = 0.9;
  ctx.shadowColor = e.def.color;
  ctx.shadowBlur = 10;
  const flash = e.flash > 0;
  const body = flash ? '#ffffff' : e.def.color;

  if (e.def.id === 'mite') {
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(0, 0, e.def.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0b1030';
    ctx.beginPath(); ctx.arc(-4, -3, 2.5, 0, Math.PI * 2); ctx.arc(4, -3, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = body; ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(i * 6, 6); ctx.lineTo(i * 9, 12); ctx.stroke();
    }
  } else if (e.def.id === 'runner') {
    ctx.rotate(Math.sin(t * 14 + e.seed) * 0.15);
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(0, 0, 13, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0b1030';
    ctx.beginPath(); ctx.arc(8, -2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = body; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-10, 4); ctx.lineTo(-16, 10); ctx.stroke();
  } else if (e.def.id === 'brute') {
    ctx.fillStyle = '#5c3a21';
    ctx.beginPath(); ctx.arc(0, 0, e.def.r + 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(0, 0, e.def.r - 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a2412';
    ctx.fillRect(-8, -4, 16, 5);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-5, -5, 2, 0, Math.PI * 2); ctx.arc(5, -5, 2, 0, Math.PI * 2); ctx.fill();
  } else if (e.def.id === 'shield') {
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(0, 0, e.def.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(180,200,255,0.95)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, e.def.r + 5, t * 2, t * 2 + Math.PI * 1.4); ctx.stroke();
    ctx.fillStyle = '#0b1030';
    ctx.beginPath(); ctx.arc(-4, -2, 2.5, 0, Math.PI * 2); ctx.arc(5, -2, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (e.def.id === 'healer') {
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(0, 0, e.def.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-4, -3, 2.5, 0, Math.PI * 2); ctx.arc(4, -3, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff9de2'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, e.def.r + 6, t * 1.5, t * 1.5 + Math.PI); ctx.stroke();
  } else if (e.def.id === 'splitter') {
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(-5, -3, 8, 0, Math.PI * 2); ctx.arc(6, 2, 8, 0, Math.PI * 2); ctx.arc(0, 6, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0b1030';
    ctx.beginPath(); ctx.arc(-5, -4, 2, 0, Math.PI * 2); ctx.arc(6, 1, 2, 0, Math.PI * 2); ctx.fill();
  } else if (e.def.id === 'flyer') {
    ctx.fillStyle = 'rgba(232,246,255,0.9)';
    const flap = Math.sin(t * 18 + e.seed) * 0.5;
    ctx.beginPath(); ctx.ellipse(-8, -6 - flap * 6, 12, 4, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8, -6 + flap * 6, 12, 4, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0b1030';
    ctx.beginPath(); ctx.arc(7, -2, 2, 0, Math.PI * 2); ctx.fill();
  } else if (e.def.id === 'wisp') {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(0, 0, e.def.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = body; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, e.def.r + 6, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-3, -2, 2.5, 0, Math.PI * 2); ctx.arc(4, -2, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (e.def.id === 'boss') {
    const pulse = 1 + Math.sin(t * 3) * 0.04;
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#3d0a1e';
    ctx.beginPath(); ctx.arc(0, 0, e.def.r + 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(0, 0, e.def.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(-14, -10, 5, 0, Math.PI * 2); ctx.arc(14, -10, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0b1030';
    ctx.beginPath(); ctx.arc(-14, -10, 2.5, 0, Math.PI * 2); ctx.arc(14, -10, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-18, 16);
    for (let i = 0; i <= 6; i++) ctx.lineTo(-18 + i * 6, 16 + (i % 2 === 0 ? 0 : 6));
    ctx.stroke();
    // Crown spikes.
    ctx.fillStyle = '#ffd76a';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 14 - 6, -e.def.r + 4);
      ctx.lineTo(i * 14, -e.def.r - 16);
      ctx.lineTo(i * 14 + 6, -e.def.r + 4);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();

  // HP bar.
  const w = e.def.id === 'boss' ? 84 : 30;
  const yOff = (e.def.id === 'boss' ? 56 : e.def.r + 10) + (e.def.kind === 'fly' ? -6 : 0);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x - w / 2, y + yOff, w, 5);
  ctx.fillStyle = e.hp / e.maxHp > 0.5 ? '#7fe07f' : e.hp / e.maxHp > 0.25 ? '#ffcf5c' : '#ff5c7a';
  ctx.fillRect(x - w / 2, y + yOff, w * Math.max(0, e.hp / e.maxHp), 5);
  // Shield bar.
  if (e.shield > 0) {
    ctx.fillStyle = '#9db8ff';
    ctx.fillRect(x - w / 2, y + yOff + 6, w * Math.max(0, e.shield / e.maxShield), 3);
  }
  // Slow tint.
  if (e.slowUntil > 0) {
    ctx.fillStyle = 'rgba(127,212,255,0.35)';
    ctx.beginPath();
    ctx.arc(x, y, e.def.r + 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
