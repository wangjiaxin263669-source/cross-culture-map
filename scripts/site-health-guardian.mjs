#!/usr/bin/env node
/**
 * 站点健康守护 · 全自动托管（每 3 天）
 *
 * - 自动巡检正式站：登录/钱包/AI/链接抽样
 * - 自动安全修复：仅 Netlify 重建（绝不改 src/data、不批量换链、不 git commit）
 * - 失败自动重试 + 重建后复检，无需人工查看
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DEFAULT_PROD_URL,
  REPORT_DIR,
  REPORT_FILE,
  MAX_AUTO_ROUNDS,
  REBUILD_WAIT_MS,
} from './lib/siteHealthConfig.mjs';
import { runProductionSuite } from './lib/siteHealthChecks.mjs';
import { applySafeFixes, assertNoProtectedWrites } from './lib/siteHealthSafeFix.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const args = process.argv.slice(2);
const isCi = args.includes('--ci') || process.env.CI === 'true';
const dryRun = args.includes('--dry-run');
const applyFixes = !dryRun;
const quiet = isCi || args.includes('--quiet');
const prodUrl = process.env.SITE_URL?.trim() || DEFAULT_PROD_URL;

function log(...a) {
  if (!quiet) console.log(...a);
}

function summarize(checks) {
  return {
    failed: checks.filter((c) => !c.ok && c.severity === 'critical'),
    warned: checks.filter((c) => !c.ok && c.severity === 'warn'),
    passed: checks.filter((c) => c.ok),
    total: checks.length,
  };
}

async function runRound(runAi) {
  return runProductionSuite(prodUrl, { runAi });
}

async function main() {
  log('[site-health] auto start', prodUrl);

  const fixEnv = {
    applyFixes,
    NETLIFY_BUILD_HOOK: process.env.NETLIFY_BUILD_HOOK,
    NETLIFY_AUTH_TOKEN: process.env.NETLIFY_AUTH_TOKEN,
  };

  let lastSuite = null;
  let allSafeFixes = [];
  let round = 0;

  for (round = 1; round <= MAX_AUTO_ROUNDS; round += 1) {
    log(`[site-health] round ${round}/${MAX_AUTO_ROUNDS}`);
    const runAi = round === 1 && (isCi ? Boolean(process.env.DEEPSEEK_API_KEY) : true);
    lastSuite = await runRound(runAi);

    const summary = summarize(lastSuite.checks);
    if (summary.failed.length === 0) {
      log('[site-health] all critical checks passed');
      break;
    }

    if (!applyFixes || round >= MAX_AUTO_ROUNDS) break;

    const partialReport = {
      checks: lastSuite.checks,
      suggestedFixes: lastSuite.suggestedFixes,
    };
    const fixes = await applySafeFixes(partialReport, fixEnv);
    allSafeFixes.push({ round, ...fixes });

    const rebuilt = fixes.applied?.some((a) => a.type === 'netlify_rebuild' && a.ok);
    if (rebuilt) {
      log(`[site-health] rebuild triggered, wait ${REBUILD_WAIT_MS / 1000}s`);
      await new Promise((r) => setTimeout(r, REBUILD_WAIT_MS));
    } else {
      await new Promise((r) => setTimeout(r, 15000));
    }
  }

  const report = {
    version: 2,
    mode: 'full_auto',
    at: new Date().toISOString(),
    prodUrl,
    rounds: round,
    policy: {
      autoEditSource: false,
      autoEditCultureData: false,
      autoGitCommit: false,
      allowedFixes: ['netlify_rebuild'],
    },
    checks: lastSuite.checks,
    suggestedFixes: lastSuite.suggestedFixes,
    deadLinksSample: (lastSuite.deadLinks || []).slice(0, 10),
    safeFixes: allSafeFixes,
    summary: summarize(lastSuite.checks),
  };

  if (!quiet) {
    for (const c of lastSuite.checks) {
      const icon = c.ok ? '✅' : c.severity === 'warn' ? '⚠️' : '❌';
      console.log(`${icon} ${c.name} — ${c.detail || ''}`);
    }
  }

  const reportPath = path.join(ROOT, REPORT_DIR, REPORT_FILE);
  assertNoProtectedWrites(reportPath);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  const { failed, warned } = report.summary;
  log(`[site-health] done: critical=${failed.length} warn=${warned.length} pass=${report.summary.passed.length}`);

  if (failed.length > 0) {
    if (quiet) {
      console.error(
        `[site-health] FAILED: ${failed.map((f) => f.name).join(', ')}`,
      );
    }
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('[site-health-guardian]', err.message);
  process.exit(1);
});
