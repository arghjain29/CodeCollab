/**
 * One still per scene, into out/stills.
 *
 *   npm run stills        light theme
 *   npm run stills:dark   dark theme, with -dark on every name
 *
 * Frames are picked at the moment each scene is fully revealed, and are relative to the
 * running order in src/Demo.tsx — re-time a scene and these want updating.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const SHOTS = [
  ['1-hook', 130],
  ['2-workspace', 290],
  ['3-co-edit', 480],
  ['4-ask-ai', 760],
  ['5-review', 970],
  ['6-accepted', 1040],
  ['7-run', 1290],
  ['8-cta', 1470],
];

const suffix = process.env.REMOTION_THEME === 'dark' ? '-dark' : '';
mkdirSync('out/stills', { recursive: true });

for (const [name, frame] of SHOTS) {
  const out = `out/stills/${name}${suffix}.png`;
  execFileSync('npx', ['remotion', 'still', 'Demo', out, `--frame=${frame}`], {
    stdio: ['ignore', 'ignore', 'inherit'],
    shell: true,
  });
  console.log(out);
}
