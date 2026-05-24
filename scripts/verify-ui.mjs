/**
 * 启动 preview 后检查页面无运行时错误（含 authNotice / React #310）
 * 用法: node scripts/verify-ui.mjs [baseUrl]
 */
import { spawn } from 'child_process';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const baseUrl = process.argv[2] || 'http://127.0.0.1:4173';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

let previewProc = null;
if (baseUrl.includes('127.0.0.1:4173') || baseUrl.includes('localhost:4173')) {
  previewProc = spawn('npx', ['vite', 'preview', '--port', '4173', '--host', '127.0.0.1'], {
    cwd: root,
    shell: true,
    stdio: 'ignore',
  });
  await new Promise((r) => setTimeout(r, 2500));
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const pageErrors = [];
const consoleErrors = [];

page.on('pageerror', (err) => pageErrors.push(err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

try {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);

  const bodyText = await page.locator('body').innerText();
  const fatal =
    pageErrors.some((e) => /authNotice|#310|Rendered more hooks/i.test(e)) ||
    bodyText.includes('页面加载出错') ||
    bodyText.includes('authNotice is not defined');

  if (fatal) {
    console.error('VERIFY FAIL');
    console.error('pageErrors:', pageErrors);
    console.error('consoleErrors:', consoleErrors.slice(0, 5));
    console.error('body:', bodyText.slice(0, 300));
    process.exitCode = 1;
  } else {
    console.log('VERIFY OK — no crash on load');
    console.log('title:', await page.title());
    const hasAuth = bodyText.includes('登录') || bodyText.includes('CROSS-CULTURE');
    console.log('hasAuthUI:', hasAuth);
  }
} finally {
  await browser.close();
  if (previewProc) previewProc.kill('SIGTERM');
}
