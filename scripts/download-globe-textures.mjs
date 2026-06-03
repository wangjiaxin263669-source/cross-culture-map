/**
 * public/globe 贴图缺失时运行：npm run globe:textures
 */
import { mkdirSync, existsSync, writeFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'public', 'globe');
const base = 'https://cdn.jsdelivr.net/npm/three-globe/example/img';
const files = [
  'earth-blue-marble.jpg',
  'earth-night.jpg',
  'earth-topology.png',
  'earth-water.png',
  'night-sky.png',
];

mkdirSync(dir, { recursive: true });

for (const file of files) {
  const dest = path.join(dir, file);
  if (existsSync(dest) && statSync(dest).size > 1000) {
    console.log('skip', file);
    continue;
  }
  console.log('download', file);
  const res = await fetch(`${base}/${file}`);
  if (!res.ok) throw new Error(`Failed ${file}: ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

console.log('globe textures ready in public/globe/');
