/**
 * E2E：注册页应携带 deviceFingerprint；同浏览器二次注册应被拦截
 * 用法：npm run dev 后 node scripts/e2e-device-registration.mjs
 */
import { chromium } from 'playwright';

async function resolveDevBase() {
  if (process.env.E2E_BASE_URL) return process.env.E2E_BASE_URL;
  for (let port = 5173; port <= 5190; port += 1) {
    const base = `http://localhost:${port}`;
    try {
      const health = await fetch(`${base}/api/health`, {
        signal: AbortSignal.timeout(1500),
      });
      if (health.ok) return `${base}/`;
    } catch {
      /* try next */
    }
  }
  return 'http://localhost:5173/';
}
const PASSWORD = 'Test123456';

function randomPhone(prefix = '196') {
  return `${prefix}${String(Date.now()).slice(-8)}`;
}

async function fillRegister(page, { nickname, phone }) {
  await page.locator('.auth-tabs button', { hasText: '注册' }).click();
  await page.locator('input[placeholder*="字符"]').fill(nickname);
  await page.locator('input[type="tel"]').fill(phone);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('input[type="password"]').nth(1).fill(PASSWORD);
}

async function main() {
  const BASE = await resolveDevBase();
  const phone1 = randomPhone('196');
  const phone2 = randomPhone('195');
  let registerPayload = null;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('request', (req) => {
    if (req.method() === 'POST' && req.url().includes('/api/auth/register')) {
      registerPayload = req.postDataJSON();
    }
  });

  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });

    await fillRegister(page, { nickname: '设备E2E-A', phone: phone1 });
    await page.locator('button.auth-submit').click();

    await page.waitForSelector('.app-container', { timeout: 20000 });

    if (!registerPayload?.deviceFingerprint) {
      throw new Error('首次注册请求未携带 deviceFingerprint');
    }
    if (!/^[a-f0-9]{64}$/i.test(registerPayload.deviceFingerprint)) {
      throw new Error(`deviceFingerprint 格式异常: ${registerPayload.deviceFingerprint}`);
    }
    console.log('OK: 首次注册成功，已携带 64 位设备指纹');

    await page.evaluate(() => {
      localStorage.removeItem('cc_auth_token');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.auth-page', { timeout: 15000 });

    registerPayload = null;
    await fillRegister(page, { nickname: '设备E2E-B', phone: phone2 });
    await page.locator('button.auth-submit').click();

    const errBox = page.locator('.auth-error');
    await errBox.waitFor({ state: 'visible', timeout: 10000 });
    const errText = (await errBox.textContent())?.trim() || '';
    if (!errText.includes('本设备已注册')) {
      throw new Error(`同设备二次注册应提示「本设备已注册」，实际: ${errText}`);
    }
    if ((await page.locator('.app-container').count()) > 0) {
      throw new Error('同设备二次注册不应进入主界面');
    }
    console.log('OK: 同设备二次注册已拦截:', errText);

    await page.locator('.auth-tabs button', { hasText: '登录' }).click();
    await page.locator('input[type="tel"]').fill(phone1);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button.auth-submit').click();
    await page.waitForSelector('.app-container', { timeout: 15000 });
    console.log('OK: 原账号仍可登录');

    console.log('\n设备注册 E2E 全部通过');
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error('E2E 失败:', e.message);
  process.exit(1);
});
