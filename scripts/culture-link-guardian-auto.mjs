#!/usr/bin/env node
/**
 * 文化链接守护 · 全自动（每周由 GitHub Actions 执行）
 * 巡检 → 自动换链 → 再巡检，直至通过或达最大轮次
 */
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, mkdirSync } from 'fs';
import { runCultureLinkAudit, writeGuardianReport } from './lib/cultureLinkAudit.mjs';
import { buildFixPlan, applyFixPlan } from './lib/cultureLinkAutoFix.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportsDir = join(__dirname, 'guardian-reports');
const MAX_ROUNDS = 4;

console.log('🛡️ 文化链接全自动守护（跨文化 UX 专家标准）\n');

let round = 0;
let lastResult = null;
const fixLog = [];

while (round < MAX_ROUNDS) {
  round++;
  console.log(`--- 第 ${round} 轮巡检 ---\n`);

  lastResult = await runCultureLinkAudit({ checkDesignerValue: true });
  writeGuardianReport(lastResult, reportsDir);

  const fixable = lastResult.issues.filter((i) => {
    if (['critical', 'high', 'medium'].includes(i.severity)) return true;
    if (i.severity === 'low' && i.type === '视频' && /关联偏弱|不一致|不可访问/i.test(i.issue)) {
      return true;
    }
    return false;
  });

  if (lastResult.passed) {
    console.log('✅ 全部通过，无需修复\n');
    break;
  }

  if (fixable.length === 0) {
    console.log('⚠️ 仅剩提示级问题，结束自动修复\n');
    break;
  }

  const plan = await buildFixPlan(lastResult);
  if (plan.length === 0) {
    console.log('⚠️ 无可用替换方案\n');
    break;
  }

  console.log(`发现 ${fixable.length} 项问题，执行 ${plan.length} 条替换…\n`);
  const { filesChanged, fixes } = await applyFixPlan(plan);
  fixLog.push({ round, planCount: plan.length, filesChanged, fixes });

  for (const f of fixes.slice(0, 20)) {
    console.log(`  ✓ ${f.file}`);
    console.log(`    ${f.from}`);
    console.log(`    → ${f.to}`);
  }
  if (fixes.length > 20) console.log(`  … 另有 ${fixes.length - 20} 处`);

  if (filesChanged.length === 0) {
    console.log('\n⚠️ 未能写入任何文件，停止\n');
    break;
  }
  console.log(`\n已更新 ${filesChanged.length} 个数据文件\n`);
}

mkdirSync(reportsDir, { recursive: true });
writeFileSync(
  join(reportsDir, 'auto-fix-log.json'),
  JSON.stringify({ rounds: round, fixLog, final: lastResult?.stats }, null, 2),
  'utf8',
);

const ok = lastResult?.passed;
console.log('--- 最终 ---');
console.log(JSON.stringify(lastResult?.stats, null, 2));
process.exit(ok ? 0 : 1);
