// LUMENFALL v2 — rendering: the whole scene, HUD, panels and screens, all in canvas.

import { W, H, PLOTS, TOWERS, ABILITIES, MAX_WAVE } from './config.js';
import { drawSky, drawCliffs, drawSea, drawPath, drawLighthouse, drawTower, drawEnemy } from './sprites.js';

export function render(game) {
  const ctx = game.ctx;
  const t = game.time;
  ctx.save();
  if (game.shakeMag > 0) {
    ctx.translate((Math.random() - 0.5) * game.shakeMag, (Math.random() - 0.5) * game.shakeMag);
  }

  drawSky(ctx, t, game.stars);
  drawCliffs(ctx, t);
  drawSea(ctx, t);
  drawPath(ctx, t);
  drawLighthouse(ctx, t, game.lives, 20, t * 0.35);

  // Build plots.
  for (const p of PLOTS) {
    const occupied = game.towerOnPlot(p);
    const isSel = game.selectedPlot === p;
    const hovered = game.hover && Math.hypot(game.hover.x - p.x, game.hover.y - p.y) < 30;
    ctx.save();
    ctx.globalAlpha = occupied ? 0 : isSel || hovered ? 0.95 : 0.55;
    ctx.fillStyle = isSel ? '#ffd76a' : '#8a6f45';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isSel ? '#ffe9a8' : 'rgba(255,233,168,0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if (!occupied) {
      ctx.fillStyle = 'rgba(255,233,168,0.9)';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', p.x, p.y + 7);
    }
    ctx.restore();
  }

  // Towers.
  for (const tw of game.towers) drawTower(ctx, tw, t, game.selectedTower === tw);

  // Enemies (flyers above the rest).
  for (const e of game.enemies) if (e.def.kind !== 'fly') drawEnemy(ctx, e, t);
  for (const e of game.enemies) if (e.def.kind === 'fly') drawEnemy(ctx, e, t);

  // Projectiles.
  for (const p of game.projectiles) {
    ctx.save();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    if (p.kind === 'cannon') {
      ctx.fillStyle = '#ffb347';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'frost') {
      ctx.fillStyle = '#7fd4ff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'sniper') {
      ctx.strokeStyle = '#ff7f9e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 18, p.y);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#a5ffb0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  game.particles.draw(ctx);
  ctx.restore();

  // Flash overlay (meteor / boss death).
  if (game.flashT > 0) {
    ctx.fillStyle = `rgba(255,240,200,${game.flashT * 1.2})`;
    ctx.fillRect(0, 0, W, H);
  }

  // Vignette.
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(2,6,16,0.5)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // Wave banner.
  if (game.bannerT > 0 && game.bannerText) {
    const a = Math.min(1, game.bannerT);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = 'bold 44px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(5,10,25,0.9)';
    ctx.strokeText(game.bannerText, W / 2, 120);
    ctx.fillStyle = game.bannerColor;
    ctx.fillText(game.bannerText, W / 2, 120);
    ctx.restore();
  }

  if (game.state === 'title') drawTitle(ctx, t);
  else drawHud(game, ctx);
  if (game.state === 'boon') drawBoon(game, ctx);
  if (game.state === 'paused') drawPaused(ctx);
  if (game.state === 'won') drawEnd(game, ctx, true);
  if (game.state === 'lost') drawEnd(game, ctx, false);
}

function panel(ctx, x, y, w, h, fill = 'rgba(8,14,30,0.82)') {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,233,168,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawTitle(ctx, t) {
  ctx.fillStyle = 'rgba(4,8,20,0.45)';
  ctx.fillRect(0, 0, W, H);
  // Logo.
  ctx.save();
  ctx.shadowColor = '#ffd76a';
  ctx.shadowBlur = 34;
  ctx.font = 'bold 92px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('LUMENFALL', W / 2, 210);
  ctx.restore();
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillStyle = '#bfe9ff';
  ctx.fillText('Defend the last lighthouse. Hold the light.', W / 2, 252);

  // Feature strip: each chip is measured to fit its own label, so no text
  // ever spills past its chip, whatever the font metrics are.
  const feats = ['5 towers × 3 tiers', '9 enemy kinds', '21 waves + boss', '3 abilities', 'Boons every 3rd wave'];
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  const widths = feats.map((f) => ctx.measureText(f).width + 36);
  const total = widths.reduce((a, b) => a + b, 0) + 12 * (feats.length - 1);
  let cx = W / 2 - total / 2;
  feats.forEach((f, i) => {
    ctx.fillStyle = 'rgba(8,14,30,0.75)';
    ctx.beginPath();
    ctx.roundRect(cx, 300, widths[i], 34, 10);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText(f, cx + widths[i] / 2, 322);
    cx += widths[i] + 12;
  });

  // Start button (pulsing).
  const pulse = 1 + Math.sin(t * 3) * 0.04;
  ctx.save();
  ctx.translate(W / 2, 430);
  ctx.scale(pulse, pulse);
  ctx.shadowColor = '#ffd76a';
  ctx.shadowBlur = 26;
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.roundRect(-150, -32, 300, 64, 16);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#241a05';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText('▶  START GAME', 0, 10);
  ctx.restore();

  ctx.font = '15px sans-serif';
  ctx.fillStyle = '#cfe3ff';
  ctx.fillText('Click a glowing plot to build • Click a tower to upgrade or sell', W / 2, 505);
  ctx.fillText('Keys 1–5 pick a tower • 1/2/3 abilities • Space starts the next wave', W / 2, 531);
  ctx.fillText('Mouse + keyboard. No download, no account — just the light.', W / 2, 557);
  ctx.fillStyle = 'rgba(207,227,255,0.7)';
  ctx.font = '13px sans-serif';
  ctx.fillText('An original game — art, sound and code drawn and written for this bounty.', W / 2, 690);
}

function drawHud(game, ctx) {
  const g = game;
  // Top bar (always visible in play states).
  panel(ctx, 12, 10, 620, 52);
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#ffd76a';
  ctx.fillText(`◉ ${g.gold} gold`, 30, 43);
  ctx.fillStyle = '#ff5c7a';
  ctx.fillText(`♥ ${g.lives}`, 190, 43);
  ctx.fillStyle = '#bfe9ff';
  ctx.fillText(`WAVE ${Math.max(1, g.wave)}/${MAX_WAVE}`, 300, 43);
  ctx.fillStyle = '#e8f6ff';
  ctx.fillText(`SCORE ${g.score}`, 430, 43);

  // On the end screens only the top bar shows; the buttons and build menu hide.
  if (game.state === 'won' || game.state === 'lost') return;

  // Start wave / speed buttons.
  ctx.textAlign = 'center';
  const waveBtn = g.waveActive ? null : { x: 660, y: 10, w: 170, h: 52 };
  if (waveBtn) {
    const hov = g.hover && g.hover.x > waveBtn.x && g.hover.x < waveBtn.x + waveBtn.w && g.hover.y > waveBtn.y && g.hover.y < waveBtn.y + waveBtn.h;
    ctx.fillStyle = hov ? '#ffe9a8' : '#ffd76a';
    ctx.beginPath();
    ctx.roundRect(waveBtn.x, waveBtn.y, waveBtn.w, waveBtn.h, 12);
    ctx.fill();
    ctx.fillStyle = '#241a05';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText(g.wave === 0 ? '▶ START WAVE 1' : `▶ WAVE ${g.wave + 1}`, waveBtn.x + waveBtn.w / 2, 43);
  } else {
    panel(ctx, 660, 10, 170, 52);
    ctx.fillStyle = '#8fa8c8';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText(`Foes left: ${g.enemies.length + g.spawner.queue.length}`, 745, 43);
  }
  // Speed toggle.
  panel(ctx, 842, 10, 74, 52);
  ctx.fillStyle = g.speed === 2 ? '#ffd76a' : '#cfe3ff';
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText(g.speed === 2 ? '»» 2×' : '» 1×', 879, 43);

  // Abilities.
  const abs = [
    { id: 'meteor', label: '1 ☄ Starfall', cd: g.abilityCd.meteor, max: ABILITIES.meteor.cd },
    { id: 'freeze', label: '2 ❄ Freeze', cd: g.abilityCd.freeze, max: ABILITIES.freeze.cd },
    { id: 'repair', label: `3 ♥ Mend (${g.repairUses})`, cd: 0, max: 1 },
  ];
  abs.forEach((a, i) => {
    const x = 928 + i * 112;
    const ready = a.cd <= 0 && (a.id !== 'repair' || g.repairUses > 0);
    panel(ctx, x, 10, 104, 52, ready ? 'rgba(20,40,70,0.9)' : 'rgba(8,14,30,0.6)');
    ctx.fillStyle = ready ? '#ffe9a8' : '#5c6b85';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(a.label, x + 52, 32);
    if (a.cd > 0) {
      ctx.fillStyle = '#8fa8c8';
      ctx.font = '13px sans-serif';
      ctx.fillText(`${Math.ceil(a.cd)}s`, x + 52, 50);
    }
  });

  // Build menu (bottom).
  panel(ctx, 12, H - 96, W - 24, 84);
  ctx.textAlign = 'left';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#cfe3ff';
  ctx.fillText('BUILD — click a plot, then a tower:', 28, H - 70);
  const ids = Object.keys(TOWERS);
  ids.forEach((id, i) => {
    const def = TOWERS[id];
    const x = 28 + i * 168;
    const y = H - 62;
    const sel = g.selectedBuild === id;
    ctx.fillStyle = sel ? def.color : 'rgba(255,255,255,0.10)';
    ctx.beginPath();
    ctx.roundRect(x, y, 158, 46, 10);
    ctx.fill();
    if (sel) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.fillStyle = sel ? '#0b1030' : '#e8f6ff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`${i + 1} ${def.name}`, x + 10, y + 19);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = sel ? '#241a05' : '#ffd76a';
    ctx.fillText(`${def.cost}g  •  ${def.desc}`, x + 10, y + 37);
  });
  // Selected tower panel.
  if (g.selectedTower) {
    const tw = g.selectedTower;
    const up = tw.upgradeCost();
    panel(ctx, W - 268, H - 196, 256, 92);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`${tw.def.name} — Tier ${tw.tier}`, W - 252, H - 168);
    ctx.fillStyle = '#cfe3ff';
    ctx.font = '13px sans-serif';
    ctx.fillText(`DMG ${Math.round(tw.dmg)}  •  RNG ${Math.round(tw.range)}  •  Kills ${tw.kills}`, W - 252, H - 146);
    ctx.fillStyle = up === null ? '#5c6b85' : '#7fe07f';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(up === null ? 'MAX TIER' : `[U] Upgrade ${up}g`, W - 252, H - 122);
    ctx.fillStyle = '#ff9db1';
    ctx.fillText(`[X] Sell ${tw.sellValue()}g`, W - 120, H - 122);
  }
}

function drawBoon(game, ctx) {
  ctx.fillStyle = 'rgba(4,8,20,0.6)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.font = 'bold 40px Georgia, serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText(`WAVE ${game.wave} CLEARED — CHOOSE A BOON`, W / 2, 180);
  game.boonOffer.forEach((b, i) => {
    const x = W / 2 - 360 + i * 250;
    const y = 260;
    const hov = game.hover && game.hover.x > x && game.hover.x < x + 220 && game.hover.y > y && game.hover.y < y + 190;
    panel(ctx, x, y, 220, 190, hov ? 'rgba(40,60,110,0.95)' : 'rgba(8,14,30,0.88)');
    ctx.font = '44px sans-serif';
    ctx.fillStyle = '#ffd76a';
    ctx.fillText(b.icon, x + 110, y + 70);
    ctx.font = 'bold 19px sans-serif';
    ctx.fillStyle = '#e8f6ff';
    ctx.fillText(b.name, x + 110, y + 108);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#cfe3ff';
    ctx.fillText(b.desc, x + 110, y + 138);
    ctx.fillStyle = '#8fa8c8';
    ctx.font = '13px sans-serif';
    ctx.fillText(`Press ${i + 1}`, x + 110, y + 168);
  });
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(4,8,20,0.6)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.font = 'bold 56px Georgia, serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('PAUSED', W / 2, 340);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#cfe3ff';
  ctx.fillText('Press P or Esc to resume', W / 2, 380);
}

function drawEnd(game, ctx, won) {
  ctx.fillStyle = won ? 'rgba(10,30,10,0.55)' : 'rgba(30,6,12,0.6)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.save();
  ctx.shadowColor = won ? '#7fe07f' : '#ff5c7a';
  ctx.shadowBlur = 30;
  ctx.font = 'bold 72px Georgia, serif';
  ctx.fillStyle = won ? '#a5ffb0' : '#ff8fa8';
  ctx.fillText(won ? 'THE LIGHT HOLDS!' : 'THE LIGHT FALLS', W / 2, 210);
  ctx.restore();
  ctx.font = '20px Georgia, serif';
  ctx.fillStyle = '#e8f6ff';
  ctx.fillText(
    won ? 'The Leviathan sinks. Dawn breaks over the last lighthouse.' : 'The tide swallows the beacon… but the light will rise again.',
    W / 2,
    256,
  );
  // Stats panel.
  panel(ctx, W / 2 - 260, 300, 520, 150);
  const rows = [
    ['Final score', String(game.score)],
    ['Waves cleared', `${won ? 21 : Math.max(0, game.wave - (game.waveActive ? 1 : 0))} / 21`],
    ['Foes sunk', String(game.kills)],
    ['Gold earned', String(game.stats.earned)],
    ['Damage dealt', String(game.stats.damage)],
  ];
  rows.forEach((r, i) => {
    ctx.font = '17px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#cfe3ff';
    ctx.fillText(r[0], W / 2 - 230, 332 + i * 26);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd76a';
    ctx.fillText(r[1], W / 2 + 230, 332 + i * 26);
  });
  // Play again button.
  const pulse = 1 + Math.sin(game.time * 3) * 0.04;
  ctx.save();
  ctx.translate(W / 2, 510);
  ctx.scale(pulse, pulse);
  ctx.shadowColor = '#ffd76a';
  ctx.shadowBlur = 22;
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.roundRect(-150, -30, 300, 60, 16);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#241a05';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('↻  PLAY AGAIN', 0, 9);
  ctx.restore();
  ctx.font = '15px sans-serif';
  ctx.fillStyle = '#cfe3ff';
  ctx.fillText('Press R to restart', W / 2, 570);
}
