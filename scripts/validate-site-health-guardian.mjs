#!/usr/bin/env node
/** 上线前自检：守护脚本不引用自动改 data 的逻辑 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PROTECTED_PATH_PREFIXES } from './lib/siteHealthConfig.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const files = [
  'site-health-guardian.mjs',
  'lib/siteHealthSafeFix.mjs',
  'lib/siteHealthChecks.mjs',
].map((f) => path.join(__dirname, f));

let ok = true;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const dangerous = [
    /writeFileSync\s*\([^)]*src\/data/,
    /git\s+add\s+src/,
    /auto-fix-log/,
    /applyVideoPatch/,
    /replaceAll\s*\(/,
  ];
  for (const re of dangerous) {
    if (re.test(text)) {
      console.error(`FAIL ${path.basename(file)}: matches ${re}`);
      ok = false;
    }
  }
}

for (const prefix of PROTECTED_PATH_PREFIXES) {
  console.log(`  protected: ${prefix}`);
}

if (!ok) process.exit(1);
console.log('validate-site-health-guardian: OK');
