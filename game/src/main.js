// LUMENFALL v2 — bootstrap: canvas, stars, the game loop, demo states for screenshots.

import { Game } from './game.js';
import { render } from './render.js';
import { bindInput } from './ui.js';
import { mulberry32 } from './rng.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Fixed logical size; CSS scales it to the window.
canvas.width = 1280;
canvas.height = 720;

const game = new Game(canvas);

// Twinkling stars, placed once with a seeded RNG.
const srng = mulberry32(42);
game.stars = [];
for (let i = 0; i < 130; i++) {
  game.stars.push({
    x: srng() * 1280,
    y: srng() * 380,
    r: 0.6 + srng() * 1.6,
    a: 0.4 + srng() * 0.6,
    tw: 0.5 + srng() * 2,
    ph: srng() * Math.PI * 2,
  });
}

bindInput(game);

// Demo states for screenshots (?demo=title|play|boss|victory) — real renders of the game.
const params = new URLSearchParams(window.location.search);
const demo = params.get('demo');
if (demo === 'play' || demo === 'boss' || demo === 'victory') {
  game.setupDemo(demo);
} else {
  game.state = 'title';
}

let last = performance.now();
function loop(now) {
  // rAF timestamps can occasionally step backwards in headless runs;
  // never let a negative dt into the simulation.
  const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
  last = now;
  game.update(dt);
  render(game);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Exposed for the playtest harness (and nothing else).
window.__game = game;
