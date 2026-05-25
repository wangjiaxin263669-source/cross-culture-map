#!/usr/bin/env node
/** @deprecated 请使用 npm run guardian；本脚本保留兼容 */
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { runCultureLinkAudit, writeGuardianReport } from './lib/cultureLinkAudit.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const result = await runCultureLinkAudit({ checkDesignerValue: false });
const { latestPath } = writeGuardianReport(result, join(__dirname, 'guardian-reports'));

console.log(`审计 ${result.stats.markets} 个市场`);
console.log(`不可访问: ${result.stats.failAccess}`);
console.log(`标题错位: ${result.stats.titleMismatch}`);
console.log(`报告: ${latestPath}`);

process.exit(result.passed && result.stats.titleMismatch === 0 ? 0 : 1);
