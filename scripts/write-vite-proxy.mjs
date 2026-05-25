#!/usr/bin/env node
/** 写入 .env.local，让 Vite 代理指向实际 API 端口（3001 或 3002） */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '.env.local');

async function portOk(port) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/api/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function main() {
  let port = 3001;
  for (let i = 0; i < 30; i += 1) {
    if (await portOk(3001)) {
      port = 3001;
      break;
    }
    if (await portOk(3002)) {
      port = 3002;
      break;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  const line = `VITE_API_PROXY=http://127.0.0.1:${port}\n`;
  let existing = '';
  if (fs.existsSync(out)) {
    existing = fs
      .readFileSync(out, 'utf8')
      .split('\n')
      .filter((l) => !l.startsWith('VITE_API_PROXY='))
      .join('\n');
    if (existing && !existing.endsWith('\n')) existing += '\n';
  }
  fs.writeFileSync(out, existing + line, 'utf8');
}

main().catch(() => {
  fs.writeFileSync(out, 'VITE_API_PROXY=http://127.0.0.1:3001\n', 'utf8');
});
