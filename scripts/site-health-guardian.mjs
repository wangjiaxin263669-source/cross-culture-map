#!/usr/bin/env node
/**
 * 站点健康守护 · 每 3 天巡检正式站（只读 + 极保守安全修复）
 *
 * 绝不自动修改：src/data、业务源码、文化链接、视频 BV 等
 * 允许的安全修复：仅触发 Netlify Build Hook（无文件变更）
 *
 * 用法:
 *   node scripts/site-health-guardian.mjs              # 巡检 + 报告
 *   node scripts/site-health-guardian.mjs --ci         # CI：仅正式站
 *   node scripts/site-health-guardian.mjs --apply-safe-fixes
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_PROD_URL, REPORT_DIR, REPORT_FILE } from './lib/siteHealthConfig.mjs';
import { runProductionSuite } from './lib/siteHealthChecks.mjs';
import { applySafeFixes, assertNoProtectedWrites } from './lib/siteHealthSafeFix.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const args = process.argv.slice(2);
const isCi = args.includes('--ci');
const applyFixes = args.includes('--apply-safe-fixes');
const prodUrl = process.env.SITE_URL?.trim() || DEFAULT_PROD_URL;

function summarize(checks) {
  const failed = checks.filter((c) => !c.ok && c.severity === 'critical');
  const warned = checks.filter((c) => !c.ok && c.severity === 'warn');
  const passed = checks.filter((c) => c.ok);
  return { failed, warned, passed, total: checks.length };
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  Cross-Culture · 站点健康守护（只读巡检）');
  console.log('═'.repeat(60));
  console.log(`正式站: ${prodUrl}`);
  console.log(`模式: ${isCi ? 'CI' : 'local'} | 安全修复: ${applyFixes ? '开启' : '关闭'}`);
  console.log('受保护: 不自动改 src/data、不批量换链、不提交代码\n');

  const suite = await runProductionSuite(prodUrl, {
    runAi: isCi ? Boolean(process.env.DEEPSEEK_API_KEY) : true,
  });

  let report = {
    version: 1,
    at: new Date().toISOString(),
    prodUrl,
    ci: isCi,
    policy: {
      autoEditSource: false,
      autoEditCultureData: false,
      allowedFixes: ['netlify_rebuild'],
    },
    checks: suite.checks,
    suggestedFixes: suite.suggestedFixes,
    deadLinksSample: (suite.deadLinks || []).slice(0, 10),
    summary: null,
    safeFixes: null,
  };

  report.summary = summarize(suite.checks);

  for (const c of suite.checks) {
    const icon = c.ok ? '✅' : c.severity === 'warn' ? '⚠️' : '❌';
    console.log(`${icon} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
  }

  if (applyFixes) {
    report.safeFixes = await applySafeFixes(report, {
      applyFixes: true,
      NETLIFY_BUILD_HOOK: process.env.NETLIFY_BUILD_HOOK,
    });
    console.log('\n--- 安全修复 ---');
    for (const a of report.safeFixes.applied) {
      console.log(`  ✓ ${a.type}: ${a.note || a.status || JSON.stringify(a)}`);
    }
    for (const s of report.safeFixes.skipped) {
      console.log(`  · 跳过 ${s.type}: ${s.reason}`);
    }

    if (report.safeFixes.applied.some((a) => a.type === 'netlify_rebuild' && a.ok)) {
      console.log('\n等待 90s 后复检 health…');
      await new Promise((r) => setTimeout(r, 90000));
      const retry = await runProductionSuite(prodUrl, { runAi: false });
      const h = retry.checks.find((x) => x.id === 'health');
      console.log(h?.ok ? '✅ 复检 health 通过' : `⚠️ 复检仍异常: ${h?.detail}`);
      report.recheckHealth = h;
    }
  }

  const reportPath = path.join(ROOT, REPORT_DIR, REPORT_FILE);
  assertNoProtectedWrites(reportPath);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n报告已写入: ${REPORT_DIR}/${REPORT_FILE}`);

  const { failed, warned } = report.summary;
  console.log(`\n--- 汇总: ${failed.length} 严重失败, ${warned.length} 警告, ${report.summary.passed.length} 通过 ---`);

  if (failed.length > 0) {
    console.log('\n严重项需人工处理（本守护不会自动改数据文件）:');
    for (const f of failed) {
      console.log(`  · ${f.name}: ${f.detail}`);
    }
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('[site-health-guardian]', err);
  process.exit(1);
});
