#!/usr/bin/env node
/**
 * 文化链接守护 — 不定期/定时全量巡检
 *
 * 检查项（跨文化产品设计专家标准）：
 * 1. 链接可访问（含下架/404）
 * 2. 标题与页面一致
 * 3. 与地区文化故事主题相关
 * 4. 设计师必读价值（文献标注、视频仅 B 站、禁止广告片）
 *
 * 用法:
 *   npm run guardian              # 巡检，有问题则 exit 1
 *   npm run guardian -- --json    # 仅输出报告路径
 *
 * 自动替换说明：
 *   外链失效/主题错位无法由机器安全自动改 URL（需人工判断替代经典）。
 *   本脚本会生成报告；GitHub Actions 每周运行并在失败时提醒。
 *   维护者可按 reports/latest.json 更新 designerCanon.js / countryCurated.js
 */
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { runCultureLinkAudit, writeGuardianReport, projectRoot } from './lib/cultureLinkAudit.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportsDir = join(__dirname, 'guardian-reports');
const jsonOnly = process.argv.includes('--json');

console.log('🛡️  文化链接守护 — 跨文化 UX 经典库巡检\n');
console.log('标准: 主题一致 + 可访问 + 【设计师必读】价值\n');

const result = await runCultureLinkAudit({ checkDesignerValue: true });
const { latestPath } = writeGuardianReport(result, reportsDir);

const { stats, issues, passed } = result;

for (const issue of issues.filter((i) => i.severity === 'critical' || i.severity === 'high')) {
  console.log(`❌ [${issue.severity}] ${issue.market} · ${issue.type}`);
  console.log(`   ${issue.issue}: ${issue.detail || ''}`);
  console.log(`   ${issue.title}`);
  console.log(`   ${issue.url}\n`);
}

for (const issue of issues.filter((i) => i.severity === 'medium')) {
  console.log(`⚠️  [${issue.market}] ${issue.type} — ${issue.issue}`);
  console.log(`   ${issue.url}\n`);
}

if (stats.themeWeak > 0) {
  console.log(`ℹ️  ${stats.themeWeak} 条「主题关联偏弱」为提示级，不导致失败\n`);
}

console.log('--- 汇总 ---');
console.log(`市场单元: ${stats.markets}`);
console.log(`唯一 URL: ${stats.uniqueUrls}`);
console.log(`不可访问: ${stats.failAccess}`);
console.log(`标题/主题错位: ${stats.titleMismatch}`);
console.log(`设计师价值不达标: ${stats.designerValueFail}`);
console.log(`报告: ${latestPath}`);

if (jsonOnly) {
  console.log(latestPath);
  process.exit(passed ? 0 : 1);
}

if (passed) {
  console.log('\n✅ 全部通过');
  process.exit(0);
}

console.log('\n❌ 发现问题，请根据报告更换链接或文献（见 src/data/designerCanon.js）');
process.exit(1);
