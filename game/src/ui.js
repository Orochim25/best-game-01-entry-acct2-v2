// LUMENFALL v2 — mouse and keyboard input: plots, towers, buttons, hotkeys.

import { TOWERS } from './config.js';

function toGameCoords(canvas, clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((clientX - r.left) / r.width) * 1280,
    y: ((clientY - r.top) / r.height) * 720,
  };
}

export function bindInput(game) {
  const canvas = game.canvas;

  canvas.addEventListener('mousemove', (ev) => {
    game.hover = toGameCoords(canvas, ev.clientX, ev.clientY);
  });

  canvas.addEventListener('click', (ev) => {
    const p = toGameCoords(canvas, ev.clientX, ev.clientY);
    game.sound.ensure();
    handleClick(game, p.x, p.y);
  });

  window.addEventListener('keydown', (ev) => {
    const k = ev.key.toLowerCase();
    if (k === ' ' ) {
      ev.preventDefault();
      if (game.state === 'playing' && !game.waveActive) game.startWave();
      return;
    }
    if (k === 'p' || k === 'escape') {
      if (game.state === 'playing') game.state = 'paused';
      else if (game.state === 'paused') game.state = 'playing';
      return;
    }
    if (k === 'r') {
      if (game.state === 'won' || game.state === 'lost') game.startGame();
      return;
    }
    if (game.state === 'boon' && ['1', '2', '3'].includes(k)) {
      game.applyBoon(game.boonOffer[Number(k) - 1].id);
      return;
    }
    if (game.state !== 'playing') return;
    const ids = Object.keys(TOWERS);
    const idx = ['1', '2', '3', '4', '5'].indexOf(k);
    if (idx >= 0 && idx < ids.length) game.selectedBuild = ids[idx];
    if (k === 'u' && game.selectedTower) game.upgradeTower(game.selectedTower);
    if (k === 'x' && game.selectedTower) game.sellTower(game.selectedTower);
  });
}

function inBox(p, x, y, w, h) {
  return p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;
}

function handleClick(game, x, y) {
  const p = { x, y };
  // Title screen: start button.
  if (game.state === 'title') {
    if (inBox(p, 490, 398, 300, 64)) game.startGame();
    return;
  }
  // End screens: play again.
  if (game.state === 'won' || game.state === 'lost') {
    if (inBox(p, 490, 480, 300, 60)) game.startGame();
    return;
  }
  if (game.state === 'boon') {
    for (let i = 0; i < 3; i++) {
      const bx = 640 - 360 + i * 250;
      if (inBox(p, bx, 260, 220, 190)) game.applyBoon(game.boonOffer[i].id);
    }
    return;
  }
  if (game.state === 'paused') return;
  if (game.state !== 'playing') return;

  // HUD: start wave button.
  if (!game.waveActive && inBox(p, 660, 10, 170, 52)) {
    game.startWave();
    return;
  }
  // Speed toggle.
  if (inBox(p, 842, 10, 74, 52)) {
    game.speed = game.speed === 1 ? 2 : 1;
    return;
  }
  // Abilities.
  const abs = ['meteor', 'freeze', 'repair'];
  for (let i = 0; i < 3; i++) {
    if (inBox(p, 928 + i * 112, 10, 104, 52)) {
      game.useAbility(abs[i]);
      return;
    }
  }
  // Build menu.
  const ids = Object.keys(TOWERS);
  for (let i = 0; i < ids.length; i++) {
    if (inBox(p, 28 + i * 168, 720 - 62, 158, 46)) {
      game.selectedBuild = ids[i];
      game.selectedTower = null;
      return;
    }
  }
  // Tower panel (upgrade / sell).
  if (game.selectedTower) {
    if (inBox(p, 1280 - 268, 720 - 196, 256, 92)) {
      const up = game.selectedTower.upgradeCost();
      if (inBox(p, 1280 - 268, 720 - 196, 140, 92) && up !== null) game.upgradeTower(game.selectedTower);
      else if (inBox(p, 1280 - 120, 720 - 196, 108, 92)) game.sellTower(game.selectedTower);
      return;
    }
  }
  // A tower on the field?
  const tw = game.towerAt(x, y);
  if (tw) {
    game.selectedTower = tw;
    game.selectedPlot = null;
    return;
  }
  // A plot?
  const plot = game.plotAt(x, y);
  if (plot) {
    if (game.towerOnPlot(plot)) {
      game.selectedTower = game.towerOnPlot(plot);
      game.selectedPlot = null;
    } else {
      game.selectedPlot = plot;
      game.buildTower(plot, game.selectedBuild);
    }
  }
}
