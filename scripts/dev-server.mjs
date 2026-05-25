#!/usr/bin/env node
/** 确保在 PORT（默认 3001）启动 API，避免静默落到 3002 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 3001;
const { PORT: _dropP, API_PORT: _dropA, ...restEnv } = process.env;

const child = spawn(process.execPath, ['server/index.js'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...restEnv, PORT: String(port), API_PORT: String(port) },
});

child.on('exit', (code) => process.exit(code ?? 1));
