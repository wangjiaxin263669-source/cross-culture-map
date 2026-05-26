/**
 * E2E：模拟调研填写后点 Close 应弹出「是否保存」
 * 用法：npm run dev 后另开终端 node scripts/e2e-sim-exit-save.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:5180';
const PHONE = process.env.E2E_PHONE || `199${String(Date.now()).slice(-8)}`;
const PASSWORD = process.env.E2E_PASSWORD || 'Test123456';

async function ensureLoggedIn(page) {
  if ((await page.locator('.app-container').count()) > 0) return;

  await page.locator('input[type="tel"]').fill(PHONE);
  await page.locator('input[type="password"]').first().fill(PASSWORD);

  await page.locator('button.auth-submit').click();
  try {
    await page.waitForSelector('.app-container', { timeout: 8000 });
    return;
  } catch {
    /* 尝试注册 */
  }

  await page.getByRole('button', { name: '注册' }).click();
  await page.locator('input[placeholder*="字符"]').fill('E2E测试');
  await page.locator('input[type="tel"]').fill(PHONE);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('input[type="password"]').nth(1).fill(PASSWORD);
  await page.locator('button.auth-submit').click();
  await page.waitForSelector('.app-container', { timeout: 20000 });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });

    if ((await page.locator('.auth-page').count()) > 0) {
      await ensureLoggedIn(page);
    }

    await page.waitForSelector('.app-container', { timeout: 20000 });

    await page.getByRole('button', { name: /日本/ }).click();
    await page.waitForSelector('.info-panel', { timeout: 15000 });

    const skipBtn = page.getByRole('button', { name: /跳过，仅概念调研/ });
    if ((await skipBtn.count()) > 0) {
      await skipBtn.click();
    }

    const topic = page.locator('.sim-step-body .sim-textarea').first();
    await topic.waitFor({ state: 'visible', timeout: 15000 });
    await topic.fill('18');

    const audience = page.locator('.sim-textarea').nth(1);
    await audience.fill('28');

    await page.locator('.close-btn').click();

    const modal = page.locator('.sim-exit-dialog');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    const title = await modal.locator('h4').textContent();
    if (!title?.includes('保存')) {
      throw new Error(`弹窗标题异常: ${title}`);
    }

    console.log('OK: Close 后已弹出保存确认框');

    await page.getByRole('button', { name: '保存到历史' }).click();
    await page.waitForTimeout(1500);

    await page.locator('.right-profile').click();
    await page.locator('.profile-menu button', { hasText: '历史记录' }).click();

    await page.waitForSelector('.history-drawer', { timeout: 8000 });
    await page.getByRole('button', { name: /模拟调研/ }).click();
    await page.waitForTimeout(1000);

    const item = page.locator('.history-item', { hasText: '18' }).first();
    if ((await item.count()) === 0) {
      throw new Error('「我的历史 → 模拟调研」中未找到已保存记录');
    }

    console.log('OK: 历史记录中已出现保存的调研');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('E2E 失败:', err.message);
  process.exit(1);
});
