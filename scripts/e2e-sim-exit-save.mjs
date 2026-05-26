/**
 * E2E：模拟调研各步骤填写后点 Close 应弹出保存，且历史可恢复
 * 用法：npm run dev 后 node scripts/e2e-sim-exit-save.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:5180';
const PHONE = process.env.E2E_PHONE || `199${String(Date.now()).slice(-8)}`;
const PASSWORD = process.env.E2E_PASSWORD || 'Test123456';

const MOCK_PERSONAS = [
  {
    id: 'p-e2e-1',
    name: '佐藤美咲',
    age: 24,
    occupation: '设计师',
    city: '东京',
    oneLiner: '热衷二次元周边',
    background: '每周浏览小红书式社区',
    corpusInspiration: '语料测试',
  },
];

const MOCK_INTERVIEW = {
  personaId: 'p-e2e-1',
  personaName: '佐藤美咲',
  summary: '对二手交易持谨慎乐观态度',
  transcript: [
    { role: 'interviewer', text: '您如何理解这类产品？' },
    { role: 'participant', text: '我会先看评价和实拍图。' },
  ],
  observationLog: [
    {
      transcriptIndex: 1,
      scene: '听到价格',
      expression: '微皱眉',
      emotion: '犹豫',
      gapNote: '',
      userMindInsight: '更在意信任',
    },
  ],
};

async function ensureLoggedIn(page) {
  if ((await page.locator('.app-container').count()) > 0) return;

  await page.locator('input[type="tel"]').fill(PHONE);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('button.auth-submit').click();
  try {
    await page.waitForSelector('.app-container', { timeout: 8000 });
    return;
  } catch {
    /* 注册 */
  }

  await page.locator('.auth-tabs button', { hasText: '注册' }).click();
  await page.locator('input[placeholder*="字符"]').fill('E2E测试');
  await page.locator('input[type="tel"]').fill(PHONE);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('input[type="password"]').nth(1).fill(PASSWORD);
  await page.locator('button.auth-submit').click();
  await page.waitForSelector('.app-container', { timeout: 20000 });
}

async function openJapanSetup(page) {
  await page.getByRole('button', { name: /日本/ }).click();
  await page.waitForSelector('.info-panel', { timeout: 15000 });
  const skipBtn = page.getByRole('button', { name: /跳过，仅概念调研/ });
  if ((await skipBtn.count()) > 0) await skipBtn.click();
  const topic = page.locator('.sim-step-body .sim-textarea').first();
  await topic.waitFor({ state: 'visible', timeout: 15000 });
  await topic.fill('二次元调研E2E');
  await page.locator('.sim-textarea').nth(1).fill('18-28');
}

async function expectExitModal(page) {
  const modal = page.locator('.sim-exit-dialog');
  await modal.waitFor({ state: 'visible', timeout: 5000 });
  const title = await modal.locator('h4').textContent();
  if (!title?.includes('保存')) throw new Error(`弹窗标题异常: ${title}`);
}

async function saveAndCloseModal(page) {
  await page.getByRole('button', { name: '保存到历史' }).click();
  await page.waitForTimeout(1200);
  await page.locator('.sim-exit-dialog').waitFor({ state: 'hidden', timeout: 8000 });
}

async function mockSimApis(page) {
  await page.route('**/api/corpus/search', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ snippets: [], meta: { snippetCount: 0 } }),
    });
  });
  await page.route('**/api/simulated-research/personas', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ personas: MOCK_PERSONAS }),
    });
  });
  await page.route('**/api/simulated-research/interview', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ interview: MOCK_INTERVIEW, batchId: 'batch-e2e' }),
    });
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await mockSimApis(page);
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if ((await page.locator('.auth-page').count()) > 0) await ensureLoggedIn(page);
    await page.waitForSelector('.app-container', { timeout: 20000 });

    // 1) 研究设定步
    await openJapanSetup(page);
    await page.locator('.close-btn').click();
    await expectExitModal(page);
    console.log('OK: 研究设定步 → Close 弹出保存');
    await page.getByRole('button', { name: '继续编辑' }).click();

    // 2) 人设步（mock 生成）
    await page.getByRole('button', { name: /检索语料并生成人设/ }).click();
    await page.waitForSelector('.sim-persona-card', { timeout: 15000 });
    await page.locator('.close-btn').click();
    await expectExitModal(page);
    console.log('OK: 人设步 → Close 弹出保存');
    await saveAndCloseModal(page);
    // 保存后 Close 流程会自动关闭国家面板

    await page.locator('.right-profile').click();
    await page.locator('.profile-menu button', { hasText: '历史记录' }).click();
    await page.getByRole('button', { name: /模拟调研/ }).click();
    await page.locator('.history-item', { hasText: '二次元调研E2E' }).first().click();
    await page.waitForSelector('.sim-persona-card', { timeout: 15000 });
    console.log('OK: 历史记录恢复至人设步');

    // 3) 访谈步（mock 一场）
    await page.getByRole('button', { name: /开始模拟访谈/ }).click();
    await page.waitForSelector('.sim-interview-card', { timeout: 20000 });
    await page.locator('.close-btn').click();
    await expectExitModal(page);
    console.log('OK: 访谈步 → Close 弹出保存');
    await saveAndCloseModal(page);

    // 验证历史含访谈（保存后面板已关闭，勿先打开国家面板挡住菜单）
    await page.locator('.right-profile').click();
    await page.locator('.profile-menu button', { hasText: '历史记录' }).click();
    await page.getByRole('button', { name: /模拟调研/ }).click();
    const historyText = await page.locator('.history-item small').first().textContent();
    if (!historyText?.includes('访谈')) {
      throw new Error(`历史记录未显示访谈进度: ${historyText}`);
    }
    console.log('OK: 历史记录含访谈进度标记');

    console.log('\n全部步骤退出保存验证通过');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('E2E 失败:', err.message);
  process.exit(1);
});
