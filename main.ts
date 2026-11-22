// GILDED HOUR — entry program for make.fun's best-heist-game-20261122-0559 bounty
// (Node 22, standard library only).
//
// The game itself is the static site in game/ (open game/index.html in a browser
// and play). This program is the courier: it delivers a clean copy of game/ and
// screenshots/ into the output directory and writes the dossier the judge reads,
// using the kit's own dossier library so the bytes match what the gate rebuilds
// on its side.
//
// Run locally with:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Copy one directory of the entry into the output, replacing whatever an earlier run left. */
function deliver(folderName: string): void {
  const from = join(repoRoot, folderName);
  const to = join(outputDir, folderName);
  rmSync(to, { recursive: true, force: true });
  if (existsSync(from)) cpSync(from, to, { recursive: true });
}

/** Count files and bytes under a delivered directory, for the handover report. */
function measure(dir: string): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const inner = measure(path);
      files += inner.files;
      bytes += inner.bytes;
    } else {
      files += 1;
      bytes += statSync(path).size;
    }
  }
  return { files, bytes };
}

mkdirSync(outputDir, { recursive: true });
deliver('game');
deliver('screenshots');

// The caps below mirror the sealed scorer's gate (game_files / screenshots rows):
// they only shape the dossier where the gate allows shaping, and refuse nothing
// the gate would accept.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

const gameMeasure = measure(join(outputDir, 'game'));
const shotMeasure = measure(join(outputDir, 'screenshots'));
console.log(
  `GILDED HOUR handed in -> ${outputDir}: game ${gameMeasure.files} files/${gameMeasure.bytes} bytes, ` +
    `${shotMeasure.files} screenshots, dossier.json ${dossier.length} bytes`,
);
