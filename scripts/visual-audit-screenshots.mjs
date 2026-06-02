import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const dir = 'scripts/.visual-audit';
mkdirSync(dir, { recursive: true });
const BASE = process.env.VISUAL_BASE_URL || 'https://ephemeral-bubblegum-a79332.netlify.app';
const PHONE = process.env.VISUAL_PHONE || `199${String(Date.now()).slice(-8)}`;
const PASS = process.env.VISUAL_PASSWORD || 'Test123456';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });

if (await page.locator('.auth-page').count()) {
  await page.locator('.auth-tabs button', { hasText: '注册' }).click();
  await page.locator('input[placeholder*="字符"]').fill('视觉审计');
  await page.locator('input[type="tel"]').fill(PHONE);
  await page.locator('input[type="password"]').first().fill(PASS);
  await page.locator('input[type="password"]').nth(1).fill(PASS);
  await page.locator('button.auth-submit').click();
  await page.waitForSelector('.app-container', { timeout: 25000 });
}

await page.screenshot({ path: `${dir}/03-map-home.png` });
await page.getByRole('button', { name: /日本/ }).click();
await page.waitForSelector('.info-panel', { timeout: 20000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${dir}/04-japan-panel-top.png` });
const panel = page.locator('.info-panel');
await panel.evaluate((el) => {
  el.scrollTop = 1100;
});
await page.waitForTimeout(500);
await page.screenshot({ path: `${dir}/05-japan-panel-sim.png` });
await page.locator('.right-profile').click();
await page.locator('.profile-menu button', { hasText: '历史记录' }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${dir}/06-history-drawer.png` });
await page.getByRole('button', { name: /与 AI 对话/ }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${dir}/07-chat-modal.png` });

console.log('Screenshots saved to', dir, 'phone', PHONE);
await browser.close();
