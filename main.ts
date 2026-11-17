// LUMENFALL v2 — the entrypoint: hands the game in.
// Copies game/ and screenshots/ into the output directory and writes
// /output/dossier.json with buildDossier from vendor/makefun-game.ts.
// Runs on Node 22, standard library only, no network, deterministic:
// the same repository always writes the same bytes.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function copyTree(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
}

function main(): void {
  const gameSrc = join(repoRoot, 'game');
  const shotsSrc = join(repoRoot, 'screenshots');
  if (!existsSync(gameSrc)) throw new Error('game/: no such directory in the repository');
  if (!existsSync(shotsSrc)) throw new Error('screenshots/: no such directory in the repository');

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  copyTree(gameSrc, join(outDir, 'game'));
  copyTree(shotsSrc, join(outDir, 'screenshots'));

  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  // A short summary on stdout: the dossier's bytes prove the hand-in is complete.
  console.log(`LUMENFALL v2: wrote ${join(outDir, 'dossier.json')} (${dossier.length} bytes)`);
}

main();
